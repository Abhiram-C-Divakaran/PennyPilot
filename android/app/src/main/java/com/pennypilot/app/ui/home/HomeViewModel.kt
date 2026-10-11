package com.pennypilot.app.ui.home

import android.app.Application
import android.content.Context
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pennypilot.app.data.preferences.UserPreferences
import com.pennypilot.app.repository.TransactionSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class HomeUiState(
    val isNotificationAccessGranted: Boolean = false,
    val isServerConnected: Boolean = false,
    val serverStatusMessage: String = "Checking connection...",
    val serverUrl: String = "",
    val todayDetectedCount: Int = 0,
    val todaySyncedCount: Int = 0,
    val pendingRetryCount: Int = 0,
    val isRetrying: Boolean = false
)

class HomeViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = TransactionSyncRepository(application)
    private val preferences = UserPreferences(application)

    private val _notificationAccess = MutableStateFlow(false)
    private val _serverStatus = MutableStateFlow(Pair(false, "Checking connection..."))
    private val _isRetrying = MutableStateFlow(false)

    private val countsFlow = combine(
        repository.getTodayDetectionsCountFlow(),
        repository.getTodaySyncedCountFlow(),
        repository.pendingCountFlow
    ) { detected, synced, pending -> Triple(detected, synced, pending) }

    val uiState: StateFlow<HomeUiState> = combine(
        _notificationAccess,
        _serverStatus,
        preferences.serverUrl,
        countsFlow,
        _isRetrying
    ) { access, server, url, counts, retrying ->
        HomeUiState(
            isNotificationAccessGranted = access,
            isServerConnected = server.first,
            serverStatusMessage = server.second,
            serverUrl = url,
            todayDetectedCount = counts.first,
            todaySyncedCount = counts.second,
            pendingRetryCount = counts.third,
            isRetrying = retrying
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = HomeUiState()
    )

    init {
        refreshStatus()
    }

    fun refreshStatus() {
        checkNotificationAccess()
        checkServerConnection()
    }

    fun checkNotificationAccess() {
        val context: Context = getApplication()
        val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(context)
        _notificationAccess.value = enabledPackages.contains(context.packageName)
    }

    fun checkServerConnection() {
        viewModelScope.launch {
            val url = preferences.getServerUrlSync()
            val result = repository.testConnection(url)
            result.fold(
                onSuccess = { msg ->
                    _serverStatus.value = Pair(true, msg)
                },
                onFailure = { err ->
                    _serverStatus.value = Pair(false, "Could not connect: ${err.message ?: "Unreachable"}")
                }
            )
        }
    }

    fun retryPendingTransactions() {
        viewModelScope.launch {
            _isRetrying.value = true
            try {
                repository.processPendingQueue()
            } finally {
                _isRetrying.value = false
            }
        }
    }
}
