package com.pennypilot.app.ui.settings

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pennypilot.app.data.preferences.UserPreferences
import com.pennypilot.app.domain.model.PaymentAppConfig
import com.pennypilot.app.repository.TransactionSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class AppToggleState(
    val config: PaymentAppConfig,
    val isEnabled: Boolean
)

data class SettingsUiState(
    val serverUrl: String = "",
    val isDetectionEnabled: Boolean = true,
    val appToggles: List<AppToggleState> = emptyList(),
    val connectionTestResult: String? = null,
    val isTestingConnection: Boolean = false
)

class SettingsViewModel(application: Application) : AndroidViewModel(application) {

    private val preferences = UserPreferences(application)
    private val repository = TransactionSyncRepository(application)

    private val _connectionTestResult = MutableStateFlow<String?>(null)
    private val _isTestingConnection = MutableStateFlow(false)
    private val _appStates = MutableStateFlow<Map<String, Boolean>>(emptyMap())

    val uiState: StateFlow<SettingsUiState> = combine(
        preferences.serverUrl,
        preferences.isDetectionEnabled,
        _appStates,
        _connectionTestResult,
        _isTestingConnection
    ) { url, detectionEnabled, appStatesMap, testResult, testing ->
        val toggles = PaymentAppConfig.SUPPORTED_APPS.map { app ->
            AppToggleState(
                config = app,
                isEnabled = appStatesMap[app.packageName] ?: true
            )
        }
        SettingsUiState(
            serverUrl = url,
            isDetectionEnabled = detectionEnabled,
            appToggles = toggles,
            connectionTestResult = testResult,
            isTestingConnection = testing
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SettingsUiState()
    )

    init {
        loadAppSettings()
    }

    private fun loadAppSettings() {
        viewModelScope.launch {
            val map = mutableMapOf<String, Boolean>()
            for (app in PaymentAppConfig.SUPPORTED_APPS) {
                map[app.packageName] = preferences.isAppEnabledSync(app.packageName)
            }
            _appStates.value = map
        }
    }

    fun updateServerUrl(url: String) {
        viewModelScope.launch {
            preferences.setServerUrl(url)
        }
    }

    fun setDetectionEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferences.setDetectionEnabled(enabled)
        }
    }

    fun setAppEnabled(packageName: String, enabled: Boolean) {
        viewModelScope.launch {
            preferences.setAppEnabled(packageName, enabled)
            _appStates.value = _appStates.value.toMutableMap().apply {
                put(packageName, enabled)
            }
        }
    }

    fun testConnection(url: String) {
        viewModelScope.launch {
            _isTestingConnection.value = true
            _connectionTestResult.value = null
            try {
                val result = repository.testConnection(url)
                result.fold(
                    onSuccess = { msg ->
                        _connectionTestResult.value = "✓ $msg"
                    },
                    onFailure = { err ->
                        _connectionTestResult.value = "✗ Could not connect: ${err.message ?: "Failed"}"
                    }
                )
            } finally {
                _isTestingConnection.value = false
            }
        }
    }
}
