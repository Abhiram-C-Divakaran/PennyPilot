package com.pennypilot.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "pennypilot_prefs")

class UserPreferences(private val context: Context) {

    companion object {
        const val DEFAULT_SERVER_URL = "http://10.0.2.2:3000"

        private val KEY_SERVER_URL = stringPreferencesKey("server_base_url")
        private val KEY_AUTH_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_DETECTION_ENABLED = booleanPreferencesKey("is_detection_enabled")

        fun appKey(packageName: String) = booleanPreferencesKey("app_enabled_${packageName.replace('.', '_')}")
    }

    val serverUrl: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SERVER_URL] ?: DEFAULT_SERVER_URL
    }

    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[KEY_AUTH_TOKEN]
    }

    val isDetectionEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_DETECTION_ENABLED] ?: true
    }

    fun isAppEnabled(packageName: String): Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[appKey(packageName)] ?: true
    }

    suspend fun getServerUrlSync(): String {
        return serverUrl.first()
    }

    suspend fun isDetectionEnabledSync(): Boolean {
        return isDetectionEnabled.first()
    }

    suspend fun isAppEnabledSync(packageName: String): Boolean {
        return isAppEnabled(packageName).first()
    }

    suspend fun setServerUrl(url: String) {
        val sanitized = if (url.endsWith("/")) url.dropLast(1) else url
        context.dataStore.edit { preferences ->
            preferences[KEY_SERVER_URL] = sanitized
        }
    }

    suspend fun setAuthToken(token: String?) {
        context.dataStore.edit { preferences ->
            if (token.isNullOrBlank()) {
                preferences.remove(KEY_AUTH_TOKEN)
            } else {
                preferences[KEY_AUTH_TOKEN] = token
            }
        }
    }

    suspend fun setDetectionEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_DETECTION_ENABLED] = enabled
        }
    }

    suspend fun setAppEnabled(packageName: String, enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[appKey(packageName)] = enabled
        }
    }
}
