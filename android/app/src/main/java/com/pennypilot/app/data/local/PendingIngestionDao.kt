package com.pennypilot.app.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface PendingIngestionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entity: PendingIngestionEntity): Long

    @Query("SELECT * FROM pending_ingestions WHERE status != 'failed' ORDER BY createdAt ASC")
    suspend fun getPendingQueue(): List<PendingIngestionEntity>

    @Query("SELECT * FROM pending_ingestions ORDER BY createdAt DESC")
    fun getAllFlow(): Flow<List<PendingIngestionEntity>>

    @Query("SELECT COUNT(*) FROM pending_ingestions WHERE status != 'failed'")
    fun getPendingCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM pending_ingestions WHERE status != 'failed'")
    suspend fun getPendingCount(): Int

    @Update
    suspend fun update(entity: PendingIngestionEntity)

    @Delete
    suspend fun delete(entity: PendingIngestionEntity)

    @Query("DELETE FROM pending_ingestions WHERE localId = :localId")
    suspend fun deleteById(localId: Long)
}
