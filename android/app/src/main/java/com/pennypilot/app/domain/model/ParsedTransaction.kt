package com.pennypilot.app.domain.model

data class ParsedTransaction(
    val amount: Double,
    val type: TransactionType = TransactionType.EXPENSE,
    val merchant: String?,
    val timestamp: String,
    val paymentMethod: PaymentMethod? = PaymentMethod.UPI,
    val externalReference: String? = null,
    val rawDescription: String,
    val sourceApp: String,
    val sourceAccount: String? = null,
    val parserConfidence: Float = 1.0f
)
