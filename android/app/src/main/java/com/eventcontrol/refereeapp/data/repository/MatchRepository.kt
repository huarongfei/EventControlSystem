package com.eventcontrol.refereeapp.data.repository

import android.content.Context
import android.util.Log
import com.eventcontrol.refereeapp.data.api.ApiService
import com.eventcontrol.refereeapp.data.api.RetrofitClient
import com.eventcontrol.refereeapp.data.local.DataStoreManager
import com.eventcontrol.refereeapp.data.local.OfflineQueue
import com.eventcontrol.refereeapp.domain.model.Event
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MatchRepository(
    private val context: Context
) {
    companion object {
        private const val TAG = "MatchRepository"
    }

    // 不在初始化时创建，每次使用时动态获取
    private val dataStore = DataStoreManager(context)
    private val offlineQueue = OfflineQueue(context)
    private var currentMatchId: String = ""

    // 每次请求时获取当前URL对应的ApiService
    private fun getApiService(): ApiService = RetrofitClient.getApiService()

    suspend fun setServerAddress(address: String) {
        dataStore.saveServerAddress(address)
        RetrofitClient.setBaseUrl(address)
    }

    suspend fun getEvents(): Result<List<Event>> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Fetching events from: ${RetrofitClient.getBaseUrl()}")
            val response = getApiService().getEvents()
            if (response.isSuccessful) {
                val body = response.body()
                Log.d(TAG, "Events response: $body")
                Result.success(body ?: emptyList())
            } else {
                val errorMsg = "Failed to get events: HTTP ${response.code()}"
                Log.e(TAG, errorMsg)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception getting events", e)
            Result.failure(e)
        }
    }

    suspend fun getMatch(matchId: String): Result<Match> = withContext(Dispatchers.IO) {
        try {
            currentMatchId = matchId
            dataStore.saveCurrentMatchId(matchId)

            Log.d(TAG, "Fetching match: $matchId from: ${RetrofitClient.getBaseUrl()}")
            val response = getApiService().getMatch(matchId)
            if (response.isSuccessful) {
                val body = response.body()
                Log.d(TAG, "Match response: $body")
                if (body != null) {
                    Result.success(body)
                } else {
                    Result.failure(Exception("服务器返回空数据"))
                }
            } else {
                val errorMsg = "Failed to get match: HTTP ${response.code()}"
                Log.e(TAG, errorMsg)
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception getting match", e)
            Result.failure(e)
        }
    }

    suspend fun updateScore(matchId: String, homeScore: Int, awayScore: Int): Result<Match> =
        withContext(Dispatchers.IO) {
            try {
                val response = getApiService().updateScore(matchId, homeScore, awayScore)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        Result.success(body)
                    } else {
                        Result.failure(Exception("服务器返回空数据"))
                    }
                } else {
                    Result.failure(Exception("Failed to update score: ${response.code()}"))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    suspend fun addScoreEvent(
        matchId: String,
        teamId: String,
        playerId: String,
        playerName: String,
        points: Int
    ): Result<MatchEvent> = withContext(Dispatchers.IO) {
        try {
            val event = MatchEvent(
                id = "",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.SCORE,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                points = points,
                description = "${points}分"
            )

            val response = getApiService().addMatchEvent(matchId, event)
            if (response.isSuccessful) {
                Result.success(response.body() ?: event)
            } else {
                offlineQueue.addEvent(event)
                Result.success(event)
            }
        } catch (e: Exception) {
            offlineQueue.addEvent(MatchEvent(
                id = "",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.SCORE,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                points = points,
                description = "${points}分"
            ))
            Result.success(MatchEvent(
                id = "offline",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.SCORE,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                points = points,
                description = "${points}分 (离线)"
            ))
        }
    }

    suspend fun addFoulEvent(
        matchId: String,
        teamId: String,
        playerId: String,
        playerName: String,
        foulType: String
    ): Result<MatchEvent> = withContext(Dispatchers.IO) {
        try {
            val event = MatchEvent(
                id = "",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.FOUL,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                foulType = foulType,
                description = "犯规: $foulType"
            )

            val response = getApiService().addMatchEvent(matchId, event)
            if (response.isSuccessful) {
                Result.success(response.body() ?: event)
            } else {
                offlineQueue.addEvent(event)
                Result.success(event)
            }
        } catch (e: Exception) {
            offlineQueue.addEvent(MatchEvent(
                id = "",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.FOUL,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                foulType = foulType,
                description = "犯规: $foulType (离线)"
            ))
            Result.success(MatchEvent(
                id = "offline",
                matchId = matchId,
                type = com.eventcontrol.refereeapp.domain.model.EventType.FOUL,
                teamId = teamId,
                playerId = playerId,
                playerName = playerName,
                foulType = foulType,
                description = "犯规: $foulType (离线)"
            ))
        }
    }

    suspend fun syncOfflineEvents(): Int = withContext(Dispatchers.IO) {
        val pending = offlineQueue.getPendingEvents()
        var synced = 0

        for (event in pending) {
            try {
                val response = getApiService().addMatchEvent(event.matchId, event)
                if (response.isSuccessful) {
                    offlineQueue.removeEvent(event.id)
                    synced++
                }
            } catch (e: Exception) {
                // Keep in queue
            }
        }

        synced
    }

    suspend fun getOfflineQueueCount(): Int = withContext(Dispatchers.IO) {
        offlineQueue.getPendingEvents().size
    }
}