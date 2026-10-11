package com.pennypilot.app.ui.simulator

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.ParsedTransaction
import com.pennypilot.app.domain.parser.ParserManager
import com.pennypilot.app.repository.SyncResult
import com.pennypilot.app.repository.TransactionSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SimulatorUiState(
    val selectedPackage: String = "com.google.android.apps.nbu.paisa.user",
    val titleInput: String = "Payment successful",
    val textInput: String = "Paid ₹450 to ZOMATO via UPI ref 10928374",
    val parsedResult: ParsedTransaction? = null,
    val parserUsed: String? = null,
    val sendStatus: String? = null,
    val isSending: Boolean = false
)

class NotificationSimulatorViewModel(application: Application) : AndroidViewModel(application) {

    private val parserManager = ParserManager()
    private val repository = TransactionSyncRepository(application)

    private val _uiState = MutableStateFlow(SimulatorUiState())
    val uiState: StateFlow<SimulatorUiState> = _uiState

    init {
        testParse()
    }

    fun updatePackage(pkg: String) {
        _uiState.value = _uiState.value.copy(selectedPackage = pkg)
        testParse()
    }

    fun updateTitle(title: String) {
        _uiState.value = _uiState.value.copy(titleInput = title)
        testParse()
    }

    fun updateText(text: String) {
        _uiState.value = _uiState.value.copy(textInput = text)
        testParse()
    }

    fun setSample(pkg: String, title: String, text: String) {
        _uiState.value = _uiState.value.copy(
            selectedPackage = pkg,
            titleInput = title,
            textInput = text
        )
        testParse()
    }

    fun testParse() {
        val current = _uiState.value
        val notificationData = NotificationData(
            packageName = current.selectedPackage,
            title = current.titleInput,
            text = current.textInput,
            subText = null,
            timestamp = System.currentTimeMillis()
        )

        val parser = parserManager.findParser(notificationData)
        val parsed = parser?.parse(notificationData)

        _uiState.value = current.copy(
            parsedResult = parsed,
            parserUsed = parser?.javaClass?.simpleName,
            sendStatus = null
        )
    }

    fun sendToBackend() {
        val parsed = _uiState.value.parsedResult ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSending = true, sendStatus = null)
            try {
                val result = repository.syncTransaction(parsed)
                val statusText = when (result) {
                    is SyncResult.Created -> "✓ Server: 201 Created & auto-confirmed"
                    is SyncResult.PendingReview -> "✓ Server: 200 Queued for Review"
                    is SyncResult.Duplicate -> "✓ Server: 200 Duplicate detected"
                    is SyncResult.QueuedForRetry -> "⚠️ Offline: Queued locally in Room"
                    is SyncResult.Rejected -> "✗ Server: Rejected (${result.reason})"
                }
                _uiState.value = _uiState.value.copy(sendStatus = statusText)
            } finally {
                _uiState.value = _uiState.value.copy(isSending = false)
            }
        }
    }
}
