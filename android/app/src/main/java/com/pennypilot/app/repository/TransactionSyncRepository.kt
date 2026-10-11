package com.pennypilot.app.repository

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.google.gson.Gson
import com.pennypilot.app.data.api.ApiClient
import com.pennypilot.app.data.local.AppDatabase
import com.pennypilot.app.data.local.PendingIngestionEntity
import com.pennypilot.app.data.local.RecentDetectionEntity
import com.pennypilot.app.data.model.IngestionRequest
import com.pennypilot.app.data.model.IngestionResponse
import com.pennypilot.app.data.preferences.UserPreferences
import com.pennypilot.app.domain.model.ParsedTransaction
import com.pennypilot.app.worker.IngestionSyncWorker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.Calendar
import java.util.concurrent.TimeUnit

sealed class SyncResult {
    data class Created(val response: IngestionResponse) : SyncResult()
    data class PendingReview(val response: IngestionResponse) : SyncResult()
    data class Duplicate(val response: IngestionResponse) : SyncResult()
    data class QueuedForRetry(val message: String) : SyncResult()
    data class Rejected(val reason: String) : SyncResult()
}

class TransactionSyncRepository(private val context: Context) {

    private val db = AppDatabase.getInstance(context)
    private val pendingDao = db.pendingIngestionDao()
    private val recentDao = db.recentDetectionDao()
    private val preferences = UserPreferences(context)
    private val gson = Gson()

    val recentDetectionsFlow: Flow<List<RecentDetectionEntity>> = recentDao.getRecentFlow()
    val pendingCountFlow: Flow<Int> = pendingDao.getPendingCountFlow()

    fun getTodayDetectionsCountFlow(): Flow<Int> {
        val startOfDay = getStartOfDayTimestamp()
        return recentDao.getCountTodayFlow(startOfDay)
    }

    fun getTodaySyncedCountFlow(): Flow<Int> {
        val startOfDay = getStartOfDayTimestamp()
        return recentDao.getProcessedCountTodayFlow(startOfDay)
    }

    private fun getStartOfDayTimestamp(): Long {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return cal.timeInMillis
    }

    /**
     * Ingests a parsed transaction directly to PennyPilot backend.
     * Queues locally in Room and schedules WorkManager retry if offline.
     */
    suspend fun syncTransaction(parsed: ParsedTransaction): SyncResult = withContext(Dispatchers.IO) {
        val request = IngestionRequest(
            source = "notification",
            amount = parsed.amount,
            type = parsed.type.name.lowercase(),
            merchant = parsed.merchant,
            timestamp = parsed.timestamp,
            paymentMethod = parsed.paymentMethod?.name?.lowercase(),
            externalReference = parsed.externalReference,
            rawDescription = parsed.rawDescription,
            sourceApp = parsed.sourceApp,
            sourceAccount = parsed.sourceAccount
        )

        val baseUrl = preferences.getServerUrlSync()
        val token = preferences.authToken.let { "" } // optional future token
        val api = ApiClient.getApi(baseUrl) { token }

        try {
            val response = api.ingestTransaction(request)

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                val status = when (body.status) {
                    "created" -> "synced"
                    "pending_review" -> "pending_review"
                    "duplicate" -> "duplicate"
                    else -> "synced"
                }

                // Log into recent detections
                recentDao.insert(
                    RecentDetectionEntity(
                        amount = parsed.amount,
                        merchant = parsed.merchant,
                        type = parsed.type.name.lowercase(),
                        sourceApp = parsed.sourceApp,
                        status = status,
                        externalReference = parsed.externalReference,
                        timestamp = System.currentTimeMillis(),
                        details = body.duplicateReason
                    )
                )
                recentDao.pruneOldRecords(200)

                return@withContext when (body.status) {
                    "created" -> SyncResult.Created(body)
                    "pending_review" -> SyncResult.PendingReview(body)
                    "duplicate" -> SyncResult.Duplicate(body)
                    else -> SyncResult.Created(body)
                }
            } else if (response.code() == 400) {
                val errorMsg = "Validation failure from server: ${response.code()}"
                recentDao.insert(
                    RecentDetectionEntity(
                        amount = parsed.amount,
                        merchant = parsed.merchant,
                        type = parsed.type.name.lowercase(),
                        sourceApp = parsed.sourceApp,
                        status = "failed",
                        externalReference = parsed.externalReference,
                        timestamp = System.currentTimeMillis(),
                        details = errorMsg
                    )
                )
                return@withContext SyncResult.Rejected(errorMsg)
            } else {
                // 5xx or other transient server errors
                throw IOException("Server returned HTTP ${response.code()}")
            }
        } catch (e: Exception) {
            // Network failure or transient error: Queue locally
            val payloadJson = gson.toJson(request)
            val pendingId = pendingDao.insert(
                PendingIngestionEntity(
                    payloadJson = payloadJson,
                    createdAt = System.currentTimeMillis(),
                    attemptCount = 1,
                    lastAttemptAt = System.currentTimeMillis(),
                    lastError = e.message ?: "Network unavailable",
                    status = "retrying"
                )
            )

            recentDao.insert(
                RecentDetectionEntity(
                    amount = parsed.amount,
                    merchant = parsed.merchant,
                    type = parsed.type.name.lowercase(),
                    sourceApp = parsed.sourceApp,
                    status = "retrying",
                    externalReference = parsed.externalReference,
                    timestamp = System.currentTimeMillis(),
                    details = "Queued for retry: ${e.message}"
                )
            )

            // Trigger WorkManager retry
            triggerSyncWork()

            return@withContext SyncResult.QueuedForRetry("Stored in local queue (ID $pendingId)")
        }
    }

    /**
     * Retries all pending queued transactions. Used by WorkManager.
     */
    suspend fun processPendingQueue(): Int = withContext(Dispatchers.IO) {
        val queue = pendingDao.getPendingQueue()
        if (queue.isEmpty()) return@withContext 0

        val baseUrl = preferences.getServerUrlSync()
        val api = ApiClient.getApi(baseUrl)
        var successCount = 0

        for (item in queue) {
            try {
                val request = gson.fromJson(item.payloadJson, IngestionRequest::class.java)
                val response = api.ingestTransaction(request)

                if (response.isSuccessful) {
                    val body = response.body()
                    val newStatus = when (body?.status) {
                        "duplicate" -> "duplicate"
                        "pending_review" -> "pending_review"
                        else -> "synced"
                    }

                    pendingDao.delete(item)
                    successCount++

                    // Update recent detection log
                    recentDao.insert(
                        RecentDetectionEntity(
                            amount = request.amount,
                            merchant = request.merchant,
                            type = request.type ?: "expense",
                            sourceApp = request.sourceApp ?: "unknown",
                            status = newStatus,
                            externalReference = request.externalReference,
                            timestamp = System.currentTimeMillis(),
                            details = "Synced via retry worker"
                        )
                    )
                } else if (response.code() == 400) {
                    // Do not retry 400 permanently
                    pendingDao.update(
                        item.copy(
                            status = "failed",
                            lastError = "Rejected with 400 Bad Request",
                            attemptCount = item.attemptCount + 1,
                            lastAttemptAt = System.currentTimeMillis()
                        )
                    )
                } else {
                    // 5xx error
                    pendingDao.update(
                        item.copy(
                            attemptCount = item.attemptCount + 1,
                            lastAttemptAt = System.currentTimeMillis(),
                            lastError = "Server HTTP ${response.code()}"
                        )
                    )
                }
            } catch (e: Exception) {
                // Still unreachable
                pendingDao.update(
                    item.copy(
                        attemptCount = item.attemptCount + 1,
                        lastAttemptAt = System.currentTimeMillis(),
                        lastError = e.message ?: "Network error"
                    )
                )
            }
        }

        return@withContext successCount
    }

    /**
     * Enqueues a WorkManager background sync task with network constraints.
     */
    fun triggerSyncWork() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncWorkRequest = OneTimeWorkRequestBuilder<IngestionSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "pennypilot_ingestion_sync",
            ExistingWorkPolicy.REPLACE,
            syncWorkRequest
        )
    }

    /**
     * Tests server connectivity via GET /api/health.
     */
    suspend fun testConnection(url: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val api = ApiClient.getApi(url)
            val response = api.checkHealth()
            if (response.isSuccessful && response.body()?.status == "ok") {
                val service = response.body()?.service ?: "PennyPilot"
                val version = response.body()?.version ?: "1.0.0"
                Result.success("Connected to $service (v$version)")
            } else {
                Result.failure(IOException("Server returned HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
