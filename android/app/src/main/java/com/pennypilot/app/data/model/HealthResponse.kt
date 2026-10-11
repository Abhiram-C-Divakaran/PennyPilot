package com.pennypilot.app.data.model

import com.google.gson.annotations.SerializedName

data class HealthResponse(
    @SerializedName("status")
    val status: String,
    @SerializedName("service")
    val service: String? = null,
    @SerializedName("version")
    val version: String? = null
)
