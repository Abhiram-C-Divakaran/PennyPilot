package com.pennypilot.app.domain.parser.util

import java.util.regex.Pattern

object ReferenceParser {

    private val REFERENCE_PATTERNS = listOf(
        // UPI Ref: 123456789 or Ref no: 123456
        Pattern.compile("(?:upi\\s+ref(?:\\s+no)?|ref(?:erence)?\\s*(?:no|id)?|utr|txn\\s*id|transaction\\s*id)\\s*[:\\-]?\\s*([a-zA-Z0-9]{4,35})", Pattern.CASE_INSENSITIVE),
        // UPI/123456789/
        Pattern.compile("upi/([a-zA-Z0-9]{6,35})", Pattern.CASE_INSENSITIVE),
        // Standalone UPI reference e.g. "UPI-123456"
        Pattern.compile("(upi-[a-zA-Z0-9]{6,25})", Pattern.CASE_INSENSITIVE)
    )

    /**
     * Extracts reference ID or UTR for duplicate prevention.
     */
    fun parseReference(text: String?): String? {
        if (text.isNullOrBlank()) return null

        for (pattern in REFERENCE_PATTERNS) {
            val matcher = pattern.matcher(text)
            if (matcher.find()) {
                val ref = matcher.group(1)?.trim()
                if (!ref.isNullOrBlank() && ref.length >= 4) {
                    return ref
                }
            }
        }

        return null
    }

    /**
     * Extracts masked source account e.g. "A/c ending 1234" or "HDFC xx4589"
     */
    fun parseSourceAccount(text: String?): String? {
        if (text.isNullOrBlank()) return null

        val pattern = Pattern.compile("(?:a/c|acct|account|card)\\s*(?:ending|no|#)?\\s*([xX*]*[0-9]{3,4})", Pattern.CASE_INSENSITIVE)
        val matcher = pattern.matcher(text)
        if (matcher.find()) {
            return matcher.group(1)?.trim()?.lowercase()
        }

        return null
    }
}
