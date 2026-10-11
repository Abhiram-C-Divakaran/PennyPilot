package com.pennypilot.app.domain.parser

import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.ParsedTransaction
import com.pennypilot.app.domain.model.PaymentMethod
import com.pennypilot.app.domain.parser.util.AmountParser
import com.pennypilot.app.domain.parser.util.DirectionParser
import com.pennypilot.app.domain.parser.util.MerchantParser
import com.pennypilot.app.domain.parser.util.ReferenceParser
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class GooglePayNotificationParser : PaymentNotificationParser {

    companion object {
        const val PACKAGE_NAME = "com.google.android.apps.nbu.paisa.user"

        // Ignore promotional keywords
        private val IGNORE_KEYWORDS = listOf(
            "scratch card", "cashback offer", "refer a friend", "reward unlocked",
            "bill reminder", "offer", "discount", "check your balance", "invite"
        )
    }

    override fun canParse(notification: NotificationData): Boolean {
        if (notification.packageName != PACKAGE_NAME) return false

        val combined = notification.combinedText().lowercase()

        // Check if promotional
        if (IGNORE_KEYWORDS.any { combined.contains(it) }) {
            return false
        }

        // Must have financial keywords
        val hasFinancialKeywords = combined.contains("paid") ||
                combined.contains("sent") ||
                combined.contains("debited") ||
                combined.contains("received") ||
                combined.contains("credited") ||
                combined.contains("₹") ||
                combined.contains("rs")

        return hasFinancialKeywords
    }

    override fun parse(notification: NotificationData): ParsedTransaction? {
        val combined = notification.combinedText()
        val amount = AmountParser.parseAmount(combined) ?: return null

        val type = DirectionParser.parseDirection(combined)
        val merchant = MerchantParser.parseMerchant(combined)
        val reference = ReferenceParser.parseReference(combined)
        val account = ReferenceParser.parseSourceAccount(combined)

        val isoTimestamp = formatIsoTimestamp(notification.timestamp)

        return ParsedTransaction(
            amount = amount,
            type = type,
            merchant = merchant,
            timestamp = isoTimestamp,
            paymentMethod = PaymentMethod.UPI,
            externalReference = reference,
            rawDescription = combined.take(500),
            sourceApp = PACKAGE_NAME,
            sourceAccount = account,
            parserConfidence = if (merchant != null) 0.95f else 0.85f
        )
    }

    private fun formatIsoTimestamp(timestampMs: Long): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date(timestampMs))
    }
}
