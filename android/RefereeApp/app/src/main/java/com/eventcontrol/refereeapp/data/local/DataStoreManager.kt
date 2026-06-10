package com.eventcontrol.refereeapp.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "referee_settings")

class DataStoreManager(private val context: Context) {

    companion object {
        private val SERVER_URL = stringPreferencesKey("server_url")
        private val MATCH_ID = stringPreferencesKey("match_id")
        private val DEVICE_ID = stringPreferencesKey("device_id")
        private val LAST_SYNC_TIME = longPreferencesKey("last_sync_time")
        private val IS_DARK_MODE = booleanPreferencesKey("is_dark_mode")

        const val DEFAULT_SERVER_URL = ""
    }

    val serverUrlFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[SERVER_URL] ?: DEFAULT_SERVER_URL
    }

    val matchIdFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[MATCH_ID]
    }

    val lastSyncTimeFlow: Flow<Long> = context.dataStore.data.map { preferences ->
        preferences[LAST_SYNC_TIME] ?: 0L
    }

    suspend fun getServerUrl(): String {
        return context.dataStore.data.first()[SERVER_URL] ?: DEFAULT_SERVER_URL
    }

    suspend fun getMatchId(): String? {
        return context.dataStore.data.first()[MATCH_ID]
    }

    suspend fun saveServerUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[SERVER_URL] = url
        }
    }

    suspend fun saveMatchId(id: String?) {
        context.dataStore.edit { preferences ->
            if (id != null) {
                preferences[MATCH_ID] = id
            } else {
                preferences.remove(MATCH_ID)
            }
        }
    }

    suspend fun saveLastSyncTime(timestamp: Long) {
        context.dataStore.edit { preferences ->
            preferences[LAST_SYNC_TIME] = timestamp
        }
    }

    suspend fun getDeviceId(): String {
        val existing = context.dataStore.data.first()[DEVICE_ID]
        if (existing != null) return existing

        val newId = java.util.UUID.randomUUID().toString()
        context.dataStore.edit { preferences ->
            preferences[DEVICE_ID] = newId
        }
        return newId
    }

    suspend fun clearMatchData() {
        context.dataStore.edit { preferences ->
            preferences.remove(MATCH_ID)
            preferences[LAST_SYNC_TIME] = 0L
        }
    }
}
