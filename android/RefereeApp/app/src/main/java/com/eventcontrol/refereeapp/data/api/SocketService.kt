package com.eventcontrol.refereeapp.data.api

import com.eventcontrol.refereeapp.domain.model.Match
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.net.URI

class SocketService {
    private var socket: Socket? = null
    private val gson = Gson()

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _matchUpdate = MutableStateFlow<Match?>(null)
    val matchUpdate: StateFlow<Match?> = _matchUpdate

    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }

    fun connect(serverUrl: String, matchId: String) {
        try {
            _connectionState.value = ConnectionState.CONNECTING

            val options = IO.Options().apply {
                transports = arrayOf("websocket")
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
            }

            socket = IO.socket(URI.create(serverUrl), options)

            socket?.on(Socket.EVENT_CONNECT) {
                _connectionState.value = ConnectionState.CONNECTED
                // Use backend's event name "match:join"
                socket?.emit("match:join", matchId)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                _connectionState.value = ConnectionState.DISCONNECTED
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) {
                _connectionState.value = ConnectionState.ERROR
            }

            socket?.on("match:state") { args ->
                // Handle match state from backend (sent on join)
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    data?.let {
                        val matchObj = it.optJSONObject("match")
                        matchObj?.let { matchJson ->
                            val match = parseMatch(matchJson)
                            _matchUpdate.value = match
                        }
                    }
                }
            }

            socket?.on("match:event") { args ->
                // Handle event updates from backend
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    data?.let {
                        val eventObj = it.optJSONObject("event")
                        eventObj?.let { evt ->
                            val match = parseMatchFromEvent(evt)
                            if (match != null) {
                                _matchUpdate.value = match
                            }
                        }
                    }
                }
            }

            socket?.connect()
        } catch (e: Exception) {
            _connectionState.value = ConnectionState.ERROR
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    fun emitEvent(event: com.eventcontrol.refereeapp.domain.model.MatchEvent) {
        // Use backend's event name "client:report" with correct format
        val eventJson = JSONObject().apply {
            put("matchId", event.matchId)
            put("type", event.type.name.lowercase())
            put("period", event.period)
            put("teamId", event.teamId)
            put("playerId", event.playerId)
            put("reportedBy", event.reportedBy)
            // detail should be a JSON string if present
            if (event.detail != null) {
                val detailJson = JSONObject()
                event.detail.forEach { (key, value) ->
                    detailJson.put(key, value)
                }
                put("detail", detailJson)
            }
        }
        socket?.emit("client:report", eventJson)
    }

    private fun parseMatch(json: JSONObject): Match {
        // Parse period names from scoreRules if available
        val periodNames = parsePeriodNames(json.optJSONObject("scoreRules"))
        
        return Match(
            id = json.getString("id"),
            eventName = json.optString("eventName", ""),
            homeTeam = parseTeam(json.optJSONObject("homeTeam")),
            awayTeam = parseTeam(json.optJSONObject("awayTeam")),
            homeScore = json.optInt("homeScore", 0),
            awayScore = json.optInt("awayScore", 0),
            currentPeriod = json.optInt("currentPeriod", 1),
            matchTime = json.optString("matchTime", "00:00"),
            status = json.optString("status", "pending"),
            sportType = json.optString("sportType", "basketball"),
            periodDuration = json.optInt("periodDuration", 10),
            periodGoal = json.optInt("periodGoal", 0),
            totalPeriods = json.optInt("totalPeriods", 4),
            periodNames = periodNames
        )
    }
    
    private fun parsePeriodNames(scoreRules: JSONObject?): List<String> {
        if (scoreRules == null) return listOf("第1节", "第2节", "第3节", "第4节")
        return try {
            val names = scoreRules.optJSONArray("periodNames")
            if (names != null) {
                (0 until names.length()).map { names.getString(it) }
            } else {
                listOf("第1节", "第2节", "第3节", "第4节")
            }
        } catch (e: Exception) {
            listOf("第1节", "第2节", "第3节", "第4节")
        }
    }

    private fun parseTeam(json: JSONObject?): com.eventcontrol.refereeapp.domain.model.Team {
        return json?.let {
            com.eventcontrol.refereeapp.domain.model.Team(
                id = it.optString("id", ""),
                name = it.optString("name", ""),
                shortName = it.optString("shortName", ""),
                players = parsePlayers(it.optJSONArray("players"))
            )
        } ?: com.eventcontrol.refereeapp.domain.model.Team("", "未知", "未知")
    }

    private fun parsePlayers(jsonArray: org.json.JSONArray?): List<com.eventcontrol.refereeapp.domain.model.Player> {
        val players = mutableListOf<com.eventcontrol.refereeapp.domain.model.Player>()
        jsonArray?.let { arr ->
            for (i in 0 until arr.length()) {
                val playerJson = arr.optJSONObject(i)
                playerJson?.let {
                    players.add(
                        com.eventcontrol.refereeapp.domain.model.Player(
                            id = it.optString("id", ""),
                            name = it.optString("name", ""),
                            number = it.optInt("number", 0)
                        )
                    )
                }
            }
        }
        return players
    }

    fun observeMatchUpdates(): Flow<Match> = callbackFlow {
        val listener: (Array<Any>) -> Unit = { args ->
            if (args.isNotEmpty()) {
                val data = args[0] as? JSONObject
                data?.let {
                    trySend(parseMatch(it))
                }
            }
        }
        socket?.on("match_update", listener)
        awaitClose { socket?.off("match_update", listener) }
    }

    // Parse match from event data (for match:event updates)
    private fun parseMatchFromEvent(eventJson: JSONObject): Match? {
        try {
            // Get matchId from event or existing state
            val matchId = _matchUpdate.value?.id ?: return null
            
            // Parse updated score from event detail
            val detail = eventJson.optJSONObject("detail")
            val points = detail?.optInt("points") ?: 0
            
            // Get current match and update score
            val currentMatch = _matchUpdate.value ?: return null
            val teamId = eventJson.optString("teamId", "")
            
            val newHomeScore = if (currentMatch.homeTeam.id == teamId) {
                currentMatch.homeScore + points
            } else {
                currentMatch.homeScore
            }
            val newAwayScore = if (currentMatch.awayTeam.id == teamId) {
                currentMatch.awayScore + points
            } else {
                currentMatch.awayScore
            }
            
            return Match(
                id = matchId,
                eventName = currentMatch.eventName,
                homeTeam = currentMatch.homeTeam,
                awayTeam = currentMatch.awayTeam,
                homeScore = newHomeScore,
                awayScore = newAwayScore,
                currentPeriod = eventJson.optInt("period", currentMatch.currentPeriod),
                matchTime = currentMatch.matchTime,
                status = currentMatch.status,
                sportType = currentMatch.sportType,
                periodDuration = currentMatch.periodDuration,
                periodGoal = currentMatch.periodGoal,
                totalPeriods = currentMatch.totalPeriods,
                periodNames = currentMatch.periodNames
            )
        } catch (e: Exception) {
            return null
        }
    }
}
