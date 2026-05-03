package com.eventcontrol.refereeapp.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "referee_prefs")

class DataStoreManager(private val context: Context) {

    companion object {
        private val SERVER_ADDRESS = stringPreferencesKey("server_address")
        private val CURRENT_MATCH_ID = stringPreferencesKey("current_match_id")
        private val CURRENT_EVENT_ID = stringPreferencesKey("current_event_id")
        private val AUTH_TOKEN = stringPreferencesKey("auth_token")
        private val REFRESHER_TOKEN = stringPreferencesKey("refresher_token")
    }

    val serverAddress: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[SERVER_ADDRESS] ?: ""
    }

    val currentMatchId: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[CURRENT_MATCH_ID] ?: ""
    }

    val currentEventId: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[CURRENT_EVENT_ID] ?: ""
    }

    suspend fun saveServerAddress(address: String) {
        context.dataStore.edit { prefs ->
            prefs[SERVER_ADDRESS] = address
        }
    }

    suspend fun saveCurrentMatchId(matchId: String) {
        context.dataStore.edit { prefs ->
            prefs[CURRENT_MATCH_ID] = matchId
        }
    }

    suspend fun saveCurrentEventId(eventId: String) {
        context.dataStore.edit { prefs ->
            prefs[CURRENT_EVENT_ID] = eventId
        }
    }

    suspend fun saveAuthToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[AUTH_TOKEN] = token
        }
    }

    suspend fun getServerAddressSync(): String {
        return context.dataStore.data.first()[SERVER_ADDRESS] ?: ""
    }

    suspend fun getCurrentMatchIdSync(): String {
        return context.dataStore.data.first()[CURRENT_MATCH_ID] ?: ""
    }

    suspend fun clearAll() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}