package com.pennypilot.app.notification

import com.pennypilot.app.domain.model.NotificationData
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

/**
 * Short-term in-memory duplicate guard to prevent repeated processing
 * of identical Android notification callbacks.
 * Authoritative deduplication remains on the PennyPilot backend.
 */
class LocalDuplicateGuard(
    private val windowMs: Long = 30_000L // 30-second deduplication window
) {
    private val seenHashes = ConcurrentHashMap<String, Long>()

    /**
     * Checks whether this notification was already seen within the time window.
     * If not seen, records it and returns false.
     */
    @Synchronized
    fun isDuplicate(notification: NotificationData): Boolean {
        pruneExpired()

        val hash = computeHash(notification)
        val now = System.currentTimeMillis()
        val lastSeen = seenHashes[hash]

        if (lastSeen != null && (now - lastSeen) < windowMs) {
            return true
        }

        seenHashes[hash] = now
        return false
    }

    /**
     * Clears all recorded entries. Useful for testing.
     */
    fun clear() {
        seenHashes.clear()
    }

    private fun pruneExpired() {
        val now = System.currentTimeMillis()
        val iterator = seenHashes.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (now - entry.value > windowMs) {
                iterator.remove()
            }
        }
    }

    private fun computeHash(notification: NotificationData): String {
        // Bucket timestamp to 15 seconds to group near-simultaneous notifications
        val timeBucket = notification.timestamp / 15_000L
        val raw = "${notification.packageName}|${notification.title ?: ""}|${notification.text ?: ""}|$timeBucket"

        return try {
            val md = MessageDigest.getInstance("SHA-256")
            val bytes = md.digest(raw.toByteArray(Charsets.UTF_8))
            bytes.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            raw.hashCode().toString()
        }
    }
}
