package com.pennypilot.app.domain.parser.util

import java.util.regex.Pattern

object AmountParser {

    // Regex for matching currency symbols/codes followed by number, handling commas and decimals
    // Supports: ₹450, ₹ 450, ₹1,250, ₹ 1,250.50, ₹1,00,000, Rs. 450, Rs 450.50, INR 450, INR 5000
    private val AMOUNT_PATTERNS = listOf(
        // Currency symbol/code followed by numeric amount (supports standard and Indian numbering commas)
        Pattern.compile("(?:[₹]|\\brs\\.?|\\binr)\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE),
        // Numeric amount followed by currency symbol/code
        Pattern.compile("([0-9][0-9,]*(?:\\.[0-9]{1,2})?)\\s*(?:[₹]|\\brs\\.?|\\binr)", Pattern.CASE_INSENSITIVE),
        // Action verb followed by amount
        Pattern.compile("(?:debited|credited|paid|transferred|sent|received|spent)\\s+(?:for|by|with|of)?\\s*(?:[₹]|\\brs\\.?|\\binr)?\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE)
    )

    /**
     * Extracts monetary amount from text safely.
     * Returns null if no valid positive monetary amount is found.
     */
    fun parseAmount(text: String?): Double? {
        if (text.isNullOrBlank()) return null

        for (pattern in AMOUNT_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val group = matcher.group(1) ?: continue
                val clean = group.replace(",", "").trim()
                val parsed = clean.toDoubleOrNull()
                if (parsed != null && parsed > 0.0 && parsed <= 100_000_000.0) {
                    return parsed
                }
            }
        }

        return null
    }
}
