package com.pennypilot.app.domain.model

enum class TransactionType(val value: String) {
    EXPENSE("expense"),
    INCOME("income");

    companion object {
        fun fromValue(value: String?): TransactionType {
            return when (value?.lowercase()) {
                "income" -> INCOME
                else -> EXPENSE
            }
        }
    }
}
