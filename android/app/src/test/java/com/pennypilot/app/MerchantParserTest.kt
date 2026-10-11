package com.pennypilot.app

import com.pennypilot.app.domain.parser.util.MerchantParser
import org.junit.Assert.assertEquals
import org.junit.Test

class MerchantParserTest {

    @Test
    fun parseMerchant_paidToPattern() {
        val merchant = MerchantParser.parseMerchant("Paid ₹450 to ZOMATO")
        assertEquals("ZOMATO", merchant)
    }

    @Test
    fun parseMerchant_paidToWithDetails() {
        val merchant = MerchantParser.parseMerchant("₹320 paid to Uber India via UPI")
        assertEquals("Uber India", merchant)
    }

    @Test
    fun parseMerchant_receivedFromPattern() {
        val merchant = MerchantParser.parseMerchant("Received ₹5,000 from Rahul")
        assertEquals("Rahul", merchant)
    }

    @Test
    fun parseMerchant_transferredToPattern() {
        val merchant = MerchantParser.parseMerchant("Transferred ₹1,200 to Swiggy on 11 Oct")
        assertEquals("Swiggy", merchant)
    }
}
