package com.pennypilot.app.data.model

import com.google.gson.annotations.SerializedName

data class IngestionResponse(
    @SerializedName("status")
    val status: String,
    @SerializedName("reviewStatus")
    val reviewStatus: String? = null,
    @SerializedName("existingTransactionId")
    val existingTransactionId: String? = null,
    @SerializedName("duplicateReason")
    val duplicateReason: String? = null,
    @SerializedName("transaction")
    val transaction: IngestionTransactionDto? = null
)

data class IngestionTransactionDto(
    @SerializedName("id")
    val id: String?,
    @SerializedName("type")
    val type: String?,
    @SerializedName("amount")
    val amount: Double?,
    @SerializedName("categoryId")
    val categoryId: String?,
    @SerializedName("merchant")
    val merchant: String?
)
