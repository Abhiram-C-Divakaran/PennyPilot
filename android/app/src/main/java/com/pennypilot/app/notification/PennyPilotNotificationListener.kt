package com.pennypilot.app.notification

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.pennypilot.app.data.local.AppDatabase
import com.pennypilot.app.data.local.RecentDetectionEntity
import com.pennypilot.app.data.preferences.UserPreferences
import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.PaymentAppConfig
import com.pennypilot.app.domain.parser.ParserManager
import com.pennypilot.app.repository.TransactionSyncRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class PennyPilotNotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "PennyPilotListener"
        // Shared duplicate guard across listener invocations
        private val duplicateGuard = LocalDuplicateGuard()
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val parserManager = ParserManager()
    private lateinit var repository: TransactionSyncRepository
    private lateinit var preferences: UserPreferences
    private lateinit var db: AppDatabase

    override fun onCreate() {
        super.onCreate()
        repository = TransactionSyncRepository(applicationContext)
        preferences = UserPreferences(applicationContext)
        db = AppDatabase.getInstance(applicationContext)
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return
        val extras = sbn.notification?.extras ?: return

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()
        val timestamp = sbn.postTime

        val notificationData = NotificationData(
            packageName = packageName,
            title = title,
            text = text,
            subText = subText,
            timestamp = timestamp
        )

        serviceScope.launch {
            handleNotification(notificationData)
        }
    }

    private suspend fun handleNotification(notificationData: NotificationData) {
        try {
            // 1. Check if global automatic detection is enabled
            if (!preferences.isDetectionEnabledSync()) {
                return
            }

            // 2. Check if this specific app is enabled
            if (!preferences.isAppEnabledSync(notificationData.packageName)) {
                return
            }

            // 3. Check local duplicate guard to avoid double-processing
            if (duplicateGuard.isDuplicate(notificationData)) {
                return
            }

            // 4. Try parsing transaction
            val parsed = parserManager.parse(notificationData)

            if (parsed != null) {
                // Safely log masked diagnostic message (never print raw text or PII)
                Log.i(TAG, "Financial notification detected from ${parsed.sourceApp}: amount ${parsed.amount}")
                repository.syncTransaction(parsed)
            } else {
                // Check if this was from a known payment app with keywords, but amount parsing failed
                val isKnownApp = PaymentAppConfig.findByPackage(notificationData.packageName) != null
                val combined = notificationData.combinedText().lowercase()
                val hasFinancialKeywords = combined.contains("paid") || combined.contains("debited") ||
                        combined.contains("credited") || combined.contains("received")

                if (isKnownApp && hasFinancialKeywords) {
                    // Record parse_failed diagnostic entry
                    db.recentDetectionDao().insert(
                        RecentDetectionEntity(
                            amount = 0.0,
                            merchant = null,
                            type = "unknown",
                            sourceApp = notificationData.packageName,
                            status = "parse_failed",
                            timestamp = notificationData.timestamp,
                            details = "Financial keywords detected but amount could not be extracted"
                        )
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification: ${e.message}")
        }
    }
}
