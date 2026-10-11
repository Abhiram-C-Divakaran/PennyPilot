package com.pennypilot.app.domain.parser.util

import java.util.regex.Pattern

object MerchantParser {

    private val MERCHANT_PATTERNS = listOf(
        // "Paid [amt] to [merchant]" or "Paid [amt] using [rail] to [merchant]" or "Paid to [merchant]"
        Pattern.compile("(?:paid|sent|transfer(?:red)?|payment)\\s+(?:(?:[₹]|(?:rs\\.?)|(?:inr))?\\s*[0-9,.]+\\s+)?(?:(?:using|via|with)\\s+.*?\\s+)?\\bto\\s+([a-zA-Z0-9\\s&.\\-_]{2,50}?)(?:\\s+via|\\s+using|\\s+for|\\s+on|\\s+ref|\\.|$)", Pattern.CASE_INSENSITIVE),
        // "[amt] paid to [merchant]"
        Pattern.compile("(?:(?:[₹]|(?:rs\\.?)|(?:inr))?\\s*[0-9,.]+\\s+)?paid\\s+to\\s+([a-zA-Z0-9\\s&.\\-_]{2,50}?)(?:\\s+via|\\s+using|\\s+for|\\s+on|\\s+ref|\\.|$)", Pattern.CASE_INSENSITIVE),
        // "Received [amt] from [sender]" or "from [sender]"
        Pattern.compile("(?:received|credited)\\s+(?:(?:[₹]|(?:rs\\.?)|(?:inr))?\\s*[0-9,.]+\\s+)?from\\s+([a-zA-Z0-9\\s&.\\-_]{2,50}?)(?:\\s+via|\\s+using|\\s+for|\\s+on|\\s+ref|\\.|$)", Pattern.CASE_INSENSITIVE),
        // "at [merchant]" (e.g. Spent ₹500 at McDonald's)
        Pattern.compile("(?:at|at the)\\s+([a-zA-Z0-9\\s&.\\-_]{2,50}?)(?:\\s+via|\\s+using|\\s+on|\\s+ref|\\.|$)", Pattern.CASE_INSENSITIVE)
    )

    /**
     * Extracts merchant/counterparty name candidate from raw text.
     */
    fun parseMerchant(text: String?): String? {
        if (text.isNullOrBlank()) return null

        for (pattern in MERCHANT_PATTERNS) {
            val matcher = pattern.matcher(text)
            while (matcher.find()) {
                val candidate = matcher.group(1)?.trim()
                if (!candidate.isNullOrBlank() && isValidCandidate(candidate)) {
                    return cleanMerchant(candidate)
                }
            }
        }

        return null
    }

    private fun isValidCandidate(candidate: String): Boolean {
        val lower = candidate.lowercase().trim()
        val ignoreList = listOf(
            "bank", "account", "upi", "card", "wallet", "successful", "completed", "failed",
            "pending", "your", "the", "merchant", "recipient", "contact", "someone", "user", "self"
        )
        return lower !in ignoreList && lower.length >= 2
    }

    private fun cleanMerchant(raw: String): String {
        return raw
            .replace(Regex("[^a-zA-Z0-9\\s&.\\-_]"), "")
            .replace(Regex("\\s+"), " ")
            .trim()
    }
}
