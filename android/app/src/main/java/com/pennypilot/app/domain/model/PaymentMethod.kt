package com.pennypilot.app.domain.model

enum class PaymentMethod(val value: String) {
    UPI("upi"),
    CREDIT_CARD("credit_card"),
    DEBIT_CARD("debit_card"),
    BANK_TRANSFER("bank_transfer"),
    WALLET("wallet"),
    CASH("cash"),
    OTHER("other");

    companion object {
        fun fromValue(value: String?): PaymentMethod? {
            if (value == null) return null
            return entries.find { it.value.equals(value, ignoreCase = true) }
        }
    }
}
