package com.pennypilot.app.data.api

import com.pennypilot.app.data.model.HealthResponse
import com.pennypilot.app.data.model.IngestionRequest
import com.pennypilot.app.data.model.IngestionResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface PennyPilotApi {

    @POST("/api/ingestion/transaction")
    suspend fun ingestTransaction(
        @Body request: IngestionRequest
    ): Response<IngestionResponse>

    @GET("/api/health")
    suspend fun checkHealth(): Response<HealthResponse>
}
