package com.pennypilot.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "recent_detections")
data class RecentDetectionEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val amount: Double,
    val merchant: String?,
    val type: String, // "expense", "income"
    val sourceApp: String,
    val status: String, // "synced", "pending_review", "duplicate", "retrying", "failed", "parse_failed"
    val externalReference: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val details: String? = null
)
