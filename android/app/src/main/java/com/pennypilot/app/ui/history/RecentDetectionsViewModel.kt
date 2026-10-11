package com.pennypilot.app.ui.history

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pennypilot.app.data.local.AppDatabase
import com.pennypilot.app.data.local.RecentDetectionEntity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class RecentDetectionsViewModel(application: Application) : AndroidViewModel(application) {

    private val db = AppDatabase.getInstance(application)
    private val recentDao = db.recentDetectionDao()

    val detections: StateFlow<List<RecentDetectionEntity>> = recentDao.getRecentFlow(150)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun clearHistory() {
        viewModelScope.launch {
            recentDao.clearAll()
        }
    }
}
