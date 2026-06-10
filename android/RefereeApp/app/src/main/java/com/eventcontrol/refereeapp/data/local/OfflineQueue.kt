package com.eventcontrol.refereeapp.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.eventcontrol.refereeapp.domain.model.EventType
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.offlineQueueStore: DataStore<Preferences> by preferencesDataStore(name = "offline_queue")

class OfflineQueue(private val context: Context) {
    private val gson = Gson()

    companion object {
        private val QUEUE_KEY = stringPreferencesKey("event_queue")

        /** Maximum number of events queued locally to prevent DataStore bloat.
         *  When the limit is reached, oldest events are discarded. */
        const val MAX_QUEUE_SIZE = 500
    }

    val pendingEventsFlow: Flow<List<MatchEvent>> = context.offlineQueueStore.data.map { preferences ->
        val json = preferences[QUEUE_KEY] ?: "[]"
        parseEvents(json)
    }

    suspend fun addEvent(event: MatchEvent) {
        context.offlineQueueStore.edit { preferences ->
            val currentJson = preferences[QUEUE_KEY] ?: "[]"
            val events = parseEvents(currentJson).toMutableList()
            // Enforce queue size limit — discard oldest events when at capacity
            if (events.size >= MAX_QUEUE_SIZE) {
                val excess = events.size - MAX_QUEUE_SIZE + 1
                repeat(excess) { if (events.isNotEmpty()) events.removeAt(0) }
            }
            events.add(event)
            preferences[QUEUE_KEY] = gson.toJson(events.map { it.toDto() })
        }
    }

    suspend fun removeEvents(ids: List<String>) {
        context.offlineQueueStore.edit { preferences ->
            val currentJson = preferences[QUEUE_KEY] ?: "[]"
            val events = parseEvents(currentJson).toMutableList()
            events.removeAll { it.id in ids }
            preferences[QUEUE_KEY] = gson.toJson(events.map { it.toDto() })
        }
    }

    suspend fun getAllPendingEvents(): List<MatchEvent> {
        val json = context.offlineQueueStore.data.first()[QUEUE_KEY] ?: "[]"
        return parseEvents(json)
    }

    suspend fun clearAll() {
        context.offlineQueueStore.edit { preferences ->
            preferences[QUEUE_KEY] = "[]"
        }
    }

    suspend fun getPendingCount(): Int {
        return getAllPendingEvents().size
    }

    private fun parseEvents(json: String): List<MatchEvent> {
        return try {
            val type = object : TypeToken<List<MatchEventDto>>() {}.type
            val dtos: List<MatchEventDto> = gson.fromJson(json, type)
            dtos.map { it.toMatchEvent() }
        } catch (e: Exception) {
            emptyList()
        }
    }
}

data class MatchEventDto(
    val id: String,
    val matchId: String,
    val type: String,
    val period: Int,
    val teamId: String,
    val playerId: String?,
    val detail: Map<String, Any>?,
    val reportedBy: String,
    val timestamp: Long,
    val isSynced: Boolean = false
)

fun MatchEvent.toDto() = MatchEventDto(
    id = id,
    matchId = matchId,
    type = type.name.lowercase(),
    period = period,
    teamId = teamId,
    playerId = playerId,
    detail = detail,
    reportedBy = reportedBy,
    timestamp = timestamp,
    isSynced = isSynced
)

fun MatchEventDto.toMatchEvent() = MatchEvent(
    id = id,
    matchId = matchId,
    type = EventType.fromString(type),
    period = period,
    teamId = teamId,
    playerId = playerId,
    detail = detail,
    reportedBy = reportedBy,
    timestamp = timestamp,
    isSynced = isSynced
)
