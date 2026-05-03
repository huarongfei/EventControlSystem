package com.eventcontrol.refereeapp.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.offlineDataStore: DataStore<Preferences> by preferencesDataStore(name = "offline_queue")

class OfflineQueue(private val context: Context) {

    companion object {
        private val PENDING_EVENTS = stringPreferencesKey("pending_events")
    }

    private val gson = Gson()

    val pendingEvents: Flow<List<MatchEvent>> = context.offlineDataStore.data.map { prefs ->
        val json = prefs[PENDING_EVENTS] ?: "[]"
        val type = object : TypeToken<List<MatchEvent>>() {}.type
        gson.fromJson(json, type)
    }

    suspend fun addEvent(event: MatchEvent) {
        context.offlineDataStore.edit { prefs ->
            val current = readEventsFromPrefs(prefs).toMutableList()
            current.add(event)
            prefs[PENDING_EVENTS] = gson.toJson(current)
        }
    }

    suspend fun removeEvent(eventId: String) {
        context.offlineDataStore.edit { prefs ->
            val current = readEventsFromPrefs(prefs).toMutableList()
            current.removeAll { it.id == eventId }
            prefs[PENDING_EVENTS] = gson.toJson(current)
        }
    }

    suspend fun clearAll() {
        context.offlineDataStore.edit { prefs ->
            prefs[PENDING_EVENTS] = "[]"
        }
    }

    suspend fun getPendingEvents(): List<MatchEvent> {
        return context.offlineDataStore.data.map { prefs ->
            readEventsFromPrefs(prefs)
        }.let { flow ->
            var result: List<MatchEvent> = emptyList()
            flow.collect { result = it }
            result
        }
    }

    private fun readEventsFromPrefs(prefs: Preferences): List<MatchEvent> {
        return try {
            val json = prefs[PENDING_EVENTS] ?: "[]"
            val type = object : TypeToken<List<MatchEvent>>() {}.type
            gson.fromJson(json, type)
        } catch (e: Exception) {
            emptyList()
        }
    }
}