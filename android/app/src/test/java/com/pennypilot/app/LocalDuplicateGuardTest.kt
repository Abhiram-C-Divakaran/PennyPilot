package com.pennypilot.app

import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.notification.LocalDuplicateGuard
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LocalDuplicateGuardTest {

    @Test
    fun isDuplicate_detectsImmediateRepeatNotification() {
        val guard = LocalDuplicateGuard(windowMs = 30_000L)

        val notification = NotificationData(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Payment successful",
            text = "Paid ₹450 to Zomato",
            subText = null,
            timestamp = 1728659123000L
        )

        // First occurrence: not a duplicate
        val firstResult = guard.isDuplicate(notification)
        assertFalse(firstResult)

        // Second occurrence with identical content immediately: is duplicate
        val secondResult = guard.isDuplicate(notification)
        assertTrue(secondResult)
    }

    @Test
    fun isDuplicate_allowsDifferentNotifications() {
        val guard = LocalDuplicateGuard(windowMs = 30_000L)

        val notification1 = NotificationData(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Payment 1",
            text = "Paid ₹100",
            subText = null,
            timestamp = 1728659123000L
        )
        val notification2 = NotificationData(
            packageName = "com.google.android.apps.nbu.paisa.user",
            title = "Payment 2",
            text = "Paid ₹200",
            subText = null,
            timestamp = 1728659123000L
        )

        assertFalse(guard.isDuplicate(notification1))
        assertFalse(guard.isDuplicate(notification2))
    }
}
