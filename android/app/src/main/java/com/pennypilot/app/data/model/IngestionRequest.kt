package com.pennypilot.app.data.model

import com.google.gson.annotations.SerializedName

data class IngestionRequest(
    @SerializedName("source")
    val source: String = "notification",
    @SerializedName("amount")
    val amount: Double,
    @SerializedName("type")
    val type: String? = null,
    @SerializedName("merchant")
    val merchant: String? = null,
    @SerializedName("timestamp")
    val timestamp: String? = null,
    @SerializedName("paymentMethod")
    val paymentMethod: String? = null,
    @SerializedName("externalReference")
    val externalReference: String? = null,
    @SerializedName("rawDescription")
    val rawDescription: String? = null,
    @SerializedName("sourceApp")
    val sourceApp: String? = null,
    @SerializedName("sourceAccount")
    val sourceAccount: String? = null
)
