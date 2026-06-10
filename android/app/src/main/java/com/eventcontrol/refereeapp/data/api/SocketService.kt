package com.eventcontrol.refereeapp.data.api

import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONObject
import java.net.URI

class SocketService {

    private var socket: Socket? = null
    private val gson = Gson()

    fun connect(serverUrl: String): Flow<SocketEvent> = callbackFlow {
        try {
            val uri = URI(serverUrl.replace("http://", "").replace("https://", ""))
            val options = IO.Options().apply {
                forceNew = true
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
            }

            socket = IO.socket(uri, options)

            socket?.on(Socket.EVENT_CONNECT) {
                trySend(SocketEvent.Connected)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                trySend(SocketEvent.Disconnected)
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = args.firstOrNull()?.toString() ?: "Unknown error"
                trySend(SocketEvent.Error(error))
            }

            socket?.on("match:score_update") { args ->
                val data = args.firstOrNull() as? JSONObject
                data?.let {
                    val match = gson.fromJson(it.toString(), Match::class.java)
                    trySend(SocketEvent.ScoreUpdate(match))
                }
            }

            socket?.on("match:event") { args ->
                val data = args.firstOrNull() as? JSONObject
                data?.let {
                    val event = gson.fromJson(it.toString(), MatchEvent::class.java)
                    trySend(SocketEvent.MatchEventReceived(event))
                }
            }

            socket?.on("match:status_change") { args ->
                val data = args.firstOrNull() as? JSONObject
                data?.let {
                    trySend(SocketEvent.StatusChange(it.toString()))
                }
            }

            socket?.connect()

        } catch (e: Exception) {
            trySend(SocketEvent.Error(e.message ?: "Connection failed"))
        }

        awaitClose {
            disconnect()
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }

    fun isConnected(): Boolean = socket?.connected() == true

    fun emit(event: String, data: Any) {
        if (!isConnected()) {
            android.util.Log.w("SocketService", "emit 失败：Socket 未连接 (event=$event)")
            return
        }
        try {
            socket?.emit(event, JSONObject(gson.toJson(data)))
        } catch (e: Exception) {
            android.util.Log.e("SocketService", "emit 异常: ${e.message}")
        }
    }
}

sealed class SocketEvent {
    object Connected : SocketEvent()
    object Disconnected : SocketEvent()
    data class Error(val message: String) : SocketEvent()
    data class ScoreUpdate(val match: Match) : SocketEvent()
    data class MatchEventReceived(val event: MatchEvent) : SocketEvent()
    data class StatusChange(val data: String) : SocketEvent()
}