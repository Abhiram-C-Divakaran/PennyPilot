package com.pennypilot.app.domain.model

data class NotificationData(
    val packageName: String,
    val title: String?,
    val text: String?,
    val subText: String? = null,
    val timestamp: Long = System.currentTimeMillis()
) {
    /**
     * Combined text of title, body, and subtext used for searching transaction patterns
     */
    fun combinedText(): String {
        return buildString {
            if (!title.isNullOrBlank()) append(title).append(" ")
            if (!text.isNullOrBlank()) append(text).append(" ")
            if (!subText.isNullOrBlank()) append(subText)
        }.trim()
    }
}
