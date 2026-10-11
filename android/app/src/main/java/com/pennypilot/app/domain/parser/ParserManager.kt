package com.pennypilot.app.domain.parser

import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.ParsedTransaction

class ParserManager(
    private val parsers: List<PaymentNotificationParser> = listOf(
        GooglePayNotificationParser(),
        PhonePeNotificationParser(),
        PaytmNotificationParser(),
        BhimNotificationParser(),
        GenericPaymentNotificationParser()
    )
) {
    /**
     * Finds the first registered parser that accepts the notification.
     */
    fun findParser(notification: NotificationData): PaymentNotificationParser? {
        return parsers.firstOrNull { it.canParse(notification) }
    }

    /**
     * Checks if any parser can handle this notification.
     */
    fun canParse(notification: NotificationData): Boolean {
        return findParser(notification) != null
    }

    /**
     * Parses the notification using the first matching parser.
     */
    fun parse(notification: NotificationData): ParsedTransaction? {
        val parser = findParser(notification) ?: return null
        return parser.parse(notification)
    }
}
