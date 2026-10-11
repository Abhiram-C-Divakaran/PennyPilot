package com.pennypilot.app

import com.pennypilot.app.domain.parser.util.ReferenceParser
import org.junit.Assert.assertEquals
import org.junit.Test

class ReferenceParserTest {

    @Test
    fun parseReference_upiRef() {
        val ref = ReferenceParser.parseReference("Paid ₹450 to Zomato UPI Ref: 10928374")
        assertEquals("10928374", ref)
    }

    @Test
    fun parseReference_utrPattern() {
        val ref = ReferenceParser.parseReference("Transferred ₹1000 UTR: 998812347102")
        assertEquals("998812347102", ref)
    }

    @Test
    fun parseReference_txnIdPattern() {
        val ref = ReferenceParser.parseReference("Payment successful Txn ID: TXN48201928")
        assertEquals("TXN48201928", ref)
    }

    @Test
    fun parseSourceAccount_maskedPattern() {
        val account = ReferenceParser.parseSourceAccount("Paid ₹500 from A/c XX4589")
        assertEquals("xx4589", account)
    }
}
