package com.pennypilot.app.domain.parser.util

import com.pennypilot.app.domain.model.TransactionType

object DirectionParser {

    private val INCOME_KEYWORDS = listOf(
        "received",
        "credited",
        "refund",
        "cashback",
        "added to wallet",
        "deposited",
        "salary"
    )

    private val EXPENSE_KEYWORDS = listOf(
        "paid",
        "sent",
        "debited",
        "spent",
        "payment to",
        "transferred to",
        "purchase",
        "charged"
    )

    /**
     * Determines whether the transaction is an expense or income.
     * Defaults to EXPENSE if ambiguous.
     */
    fun parseDirection(text: String?): TransactionType {
        if (text.isNullOrBlank()) return TransactionType.EXPENSE

        val lower = text.lowercase()

        // Check income keywords
        for (keyword in INCOME_KEYWORDS) {
            if (lower.contains(keyword)) {
                return TransactionType.INCOME
            }
        }

        // Check expense keywords
        for (keyword in EXPENSE_KEYWORDS) {
            if (lower.contains(keyword)) {
                return TransactionType.EXPENSE
            }
        }

        return TransactionType.EXPENSE
    }
}
