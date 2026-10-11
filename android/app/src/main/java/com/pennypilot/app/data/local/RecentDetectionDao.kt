package com.pennypilot.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface RecentDetectionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: RecentDetectionEntity): Long

    @Query("SELECT * FROM recent_detections ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentFlow(limit: Int = 100): Flow<List<RecentDetectionEntity>>

    @Query("SELECT COUNT(*) FROM recent_detections WHERE timestamp >= :startOfDayMs")
    fun getCountTodayFlow(startOfDayMs: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM recent_detections WHERE timestamp >= :startOfDayMs AND status IN ('synced', 'pending_review', 'duplicate')")
    fun getProcessedCountTodayFlow(startOfDayMs: Long): Flow<Int>

    @Query("UPDATE recent_detections SET status = :newStatus WHERE id = :id")
    suspend fun updateStatus(id: Long, newStatus: String)

    @Query("DELETE FROM recent_detections WHERE id NOT IN (SELECT id FROM recent_detections ORDER BY timestamp DESC LIMIT :keepCount)")
    suspend fun pruneOldRecords(keepCount: Int = 200)

    @Query("DELETE FROM recent_detections")
    suspend fun clearAll()
}
