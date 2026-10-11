package com.pennypilot.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_ingestions")
data class PendingIngestionEntity(
    @PrimaryKey(autoGenerate = true)
    val localId: Long = 0,
    val payloadJson: String,
    val createdAt: Long = System.currentTimeMillis(),
    val attemptCount: Int = 0,
    val lastAttemptAt: Long? = null,
    val lastError: String? = null,
    val status: String = "pending" // "pending", "retrying", "failed"
)
