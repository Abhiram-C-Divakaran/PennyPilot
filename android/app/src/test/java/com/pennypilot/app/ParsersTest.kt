package com.pennypilot.app

import com.pennypilot.app.domain.model.NotificationData
import com.pennypilot.app.domain.model.PaymentMethod
import com.pennypilot.app.domain.model.TransactionType
import com.pennypilot.app.domain.parser.BhimNotificationParser
import com.pennypilot.app.domain.parser.GooglePayNotificationParser
import com.pennypilot.app.domain.parser.ParserManager
import com.pennypilot.app.domain.parser.PaytmNotificationParser
import com.pennypilot.app.domain.parser.PhonePeNotificationParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ParsersTest {

    private val parserManager = ParserManager()

    @Test
    fun googlePay_parsesValidExpense() {
        val notification = NotificationData(
            packageName = GooglePayNotificationParser.PACKAGE_NAME,
            title = "Payment to ZOMATO",
            text = "Paid ₹450 to ZOMATO via UPI",
            subText = null,
            timestamp = 1728659123000L
        )

        val parser = parserManager.findParser(notification)
        assertTrue(parser is GooglePayNotificationParser)

        val parsed = parser?.parse(notification)
        assertNotNull(parsed)
        assertEquals(450.0, parsed!!.amount, 0.001)
        assertEquals(TransactionType.EXPENSE, parsed.type)
        assertEquals("ZOMATO", parsed.merchant)
        assertEquals(PaymentMethod.UPI, parsed.paymentMethod)
        assertEquals(GooglePayNotificationParser.PACKAGE_NAME, parsed.sourceApp)
    }

    @Test
    fun googlePay_ignoresPromotionalScratchCardNotification() {
        val notification = NotificationData(
            packageName = GooglePayNotificationParser.PACKAGE_NAME,
            title = "You earned a reward!",
            text = "Unlock your scratch card today and win cashback",
            subText = null,
            timestamp = 1728659123000L
        )

        assertFalse(GooglePayNotificationParser().canParse(notification))
    }

    @Test
    fun phonePe_parsesValidPayment() {
        val notification = NotificationData(
            packageName = PhonePeNotificationParser.PACKAGE_NAME,
            title = "Payment Successful",
            text = "₹320 paid to Uber India",
            subText = null,
            timestamp = 1728659123000L
        )

        val parser = parserManager.findParser(notification)
        assertTrue(parser is PhonePeNotificationParser)

        val parsed = parser?.parse(notification)
        assertNotNull(parsed)
        assertEquals(320.0, parsed!!.amount, 0.001)
        assertEquals("Uber India", parsed.merchant)
    }

    @Test
    fun phonePe_ignoresInsuranceAndLoanOffers() {
        val notification = NotificationData(
            packageName = PhonePeNotificationParser.PACKAGE_NAME,
            title = "Exclusive offer",
            text = "Get instant bike insurance discount due soon",
            subText = null,
            timestamp = 1728659123000L
        )

        assertFalse(PhonePeNotificationParser().canParse(notification))
    }

    @Test
    fun paytm_detectsWalletMethod() {
        val notification = NotificationData(
            packageName = PaytmNotificationParser.PACKAGE_NAME,
            title = "Paid to merchant",
            text = "Paid ₹85 using Paytm Wallet to Chai Point",
            subText = null,
            timestamp = 1728659123000L
        )

        val parsed = parserManager.parse(notification)
        assertNotNull(parsed)
        assertEquals(85.0, parsed!!.amount, 0.001)
        assertEquals(PaymentMethod.WALLET, parsed.paymentMethod)
        assertEquals("Chai Point", parsed.merchant)
    }

    @Test
    fun bhim_parsesSuccessfully() {
        val notification = NotificationData(
            packageName = BhimNotificationParser.PACKAGE_NAME,
            title = "BHIM UPI",
            text = "Sent ₹500 to Amit",
            subText = null,
            timestamp = 1728659123000L
        )

        val parser = parserManager.findParser(notification)
        assertTrue(parser is BhimNotificationParser)

        val parsed = parser?.parse(notification)
        assertNotNull(parsed)
        assertEquals(500.0, parsed!!.amount, 0.001)
        assertEquals("Amit", parsed.merchant)
    }

    @Test
    fun unsupportedAppOrNonFinancial_returnsNull() {
        val notification = NotificationData(
            packageName = "com.whatsapp",
            title = "New Message",
            text = "Hey are you free today?",
            subText = null,
            timestamp = 1728659123000L
        )

        assertNull(parserManager.parse(notification))
    }
}
