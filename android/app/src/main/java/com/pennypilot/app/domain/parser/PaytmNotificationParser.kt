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

class PaytmNotificationParser : PaymentNotificationParser {

    companion object {
        const val PACKAGE_NAME = "net.one97.paytm"

        private val IGNORE_KEYWORDS = listOf(
            "movie tickets", "flight booking", "cashback points", "gold offer",
            "instant loan", "credit score", "play and win", "recharge now"
        )
    }

    override fun canParse(notification: NotificationData): Boolean {
        if (notification.packageName != PACKAGE_NAME) return false

        val combined = notification.combinedText().lowercase()

        if (IGNORE_KEYWORDS.any { combined.contains(it) }) {
            return false
        }

        return combined.contains("paid") ||
                combined.contains("sent") ||
                combined.contains("payment") ||
                combined.contains("received") ||
                combined.contains("debited") ||
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

        val paymentMethod = if (combined.contains("wallet", ignoreCase = true)) {
            PaymentMethod.WALLET
        } else {
            PaymentMethod.UPI
        }

        val isoTimestamp = formatIsoTimestamp(notification.timestamp)

        return ParsedTransaction(
            amount = amount,
            type = type,
            merchant = merchant,
            timestamp = isoTimestamp,
            paymentMethod = paymentMethod,
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
