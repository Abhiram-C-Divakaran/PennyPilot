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

class GenericPaymentNotificationParser : PaymentNotificationParser {

    companion object {
        private val IGNORE_KEYWORDS = listOf(
            "otp", "verification code", "discount", "offer", "sale",
            "cashback", "points earned", "promo", "voucher", "click here",
            "explore", "congratulations", "win", "spin"
        )

        private val TRANSACTION_KEYWORDS = listOf(
            "paid", "debited", "credited", "received", "spent",
            "payment of", "transferred", "sent to"
        )
    }

    override fun canParse(notification: NotificationData): Boolean {
        val combined = notification.combinedText().lowercase()

        // Exclude spam/promos/OTPs
        if (IGNORE_KEYWORDS.any { combined.contains(it) }) {
            return false
        }

        val hasTransactionKeyword = TRANSACTION_KEYWORDS.any { combined.contains(it) }
        val hasCurrencySymbol = combined.contains("₹") || combined.contains("rs.") || combined.contains("inr")

        return hasTransactionKeyword && hasCurrencySymbol
    }

    override fun parse(notification: NotificationData): ParsedTransaction? {
        val combined = notification.combinedText()
        val amount = AmountParser.parseAmount(combined) ?: return null

        val type = DirectionParser.parseDirection(combined)
        val merchant = MerchantParser.parseMerchant(combined)
        val reference = ReferenceParser.parseReference(combined)
        val account = ReferenceParser.parseSourceAccount(combined)

        val paymentMethod = when {
            combined.contains("upi", ignoreCase = true) -> PaymentMethod.UPI
            combined.contains("card", ignoreCase = true) -> PaymentMethod.DEBIT_CARD
            combined.contains("wallet", ignoreCase = true) -> PaymentMethod.WALLET
            combined.contains("netbanking", ignoreCase = true) -> PaymentMethod.BANK_TRANSFER
            else -> PaymentMethod.OTHER
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
            sourceApp = notification.packageName,
            sourceAccount = account,
            parserConfidence = if (merchant != null) 0.85f else 0.70f
        )
    }

    private fun formatIsoTimestamp(timestampMs: Long): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date(timestampMs))
    }
}
