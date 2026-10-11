package com.pennypilot.app

import com.pennypilot.app.domain.parser.util.AmountParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AmountParserTest {

    @Test
    fun parseAmount_standardRupeeSymbol() {
        val amount = AmountParser.parseAmount("Paid ₹450 to ZOMATO")
        assertEquals(450.0, amount ?: 0.0, 0.001)
    }

    @Test
    fun parseAmount_rupeeSymbolWithSpace() {
        val amount = AmountParser.parseAmount("Payment of ₹ 1,250.50 successful")
        assertEquals(1250.50, amount ?: 0.0, 0.001)
    }

    @Test
    fun parseAmount_rsPrefix() {
        val amount = AmountParser.parseAmount("Debited Rs. 320 for Uber trip")
        assertEquals(320.0, amount ?: 0.0, 0.001)
    }

    @Test
    fun parseAmount_inrPrefix() {
        val amount = AmountParser.parseAmount("Credited INR 5000 to your account")
        assertEquals(5000.0, amount ?: 0.0, 0.001)
    }

    @Test
    fun parseAmount_indianCommaNumbering() {
        val amount = AmountParser.parseAmount("Sent ₹1,00,000 to John Doe")
        assertEquals(100000.0, amount ?: 0.0, 0.001)
    }

    @Test
    fun parseAmount_doesNotParseAccountNumbersOrDatesAsAmount() {
        // If there's an account number XX4589 but no currency, should return null
        val noCurrency = AmountParser.parseAmount("Statement ready for account XX4589 on 12/10/2026")
        assertNull(noCurrency)
    }

    @Test
    fun parseAmount_handlesNegativeOrZeroAmountsCorrectly() {
        val zero = AmountParser.parseAmount("Paid ₹0 to Test")
        assertNull(zero) // Amounts must be positive
    }
}
