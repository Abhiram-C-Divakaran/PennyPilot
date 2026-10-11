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

class PhonePeNotificationParser : PaymentNotificationParser {

    companion object {
        const val PACKAGE_NAME = "com.phonepe.app"

        private val IGNORE_KEYWORDS = listOf(
            "recharge now", "insurance", "loan", "cashback offer", "upgrade",
            "due soon", "reminder", "spin and win", "save more", "credit card approved"
        )
    }

    override fun canParse(notification: NotificationData): Boolean {
        if (notification.packageName != PACKAGE_NAME) return false

        val combined = notification.combinedText().lowercase()

        if (IGNORE_KEYWORDS.any { combined.contains(it) }) {
            return false
        }

        return combined.contains("paid") ||
                combined.contains("transferred") ||
                combined.contains("payment") ||
                combined.contains("received") ||
                combined.contains("₹") ||
                combined.contains("rs")
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
