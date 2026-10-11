package com.pennypilot.app.domain.parser

import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.ParsedTransaction

interface PaymentNotificationParser {
    /**
     * Determines whether this parser can handle the given notification.
     */
    fun canParse(notification: NotificationData): Boolean

    /**
     * Parses the notification into a structured ParsedTransaction.
     * Returns null if the notification is not a valid transaction or amount cannot be found.
     */
    fun parse(notification: NotificationData): ParsedTransaction?
}
