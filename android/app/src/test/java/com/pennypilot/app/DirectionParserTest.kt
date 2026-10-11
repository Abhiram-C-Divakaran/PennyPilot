package com.pennypilot.app

import com.pennypilot.app.domain.model.TransactionType
import com.pennypilot.app.domain.parser.util.DirectionParser
import org.junit.Assert.assertEquals
import org.junit.Test

class DirectionParserTest {

    @Test
    fun parseDirection_expenseKeywords() {
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Paid ₹450 to Zomato"))
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Sent ₹1000 to Friend"))
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Debited Rs. 350 for cab"))
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Payment made for electricity bill"))
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Transferred to Rohan ₹500"))
    }

    @Test
    fun parseDirection_incomeKeywords() {
        assertEquals(TransactionType.INCOME, DirectionParser.parseDirection("Received ₹5,000 from Rahul"))
        assertEquals(TransactionType.INCOME, DirectionParser.parseDirection("Credited ₹12,000 to your account"))
        assertEquals(TransactionType.INCOME, DirectionParser.parseDirection("Refund received of ₹350 from Amazon"))
        assertEquals(TransactionType.INCOME, DirectionParser.parseDirection("Money received from Priya"))
    }

    @Test
    fun parseDirection_fallbackDefaultIsExpense() {
        assertEquals(TransactionType.EXPENSE, DirectionParser.parseDirection("Transaction of ₹200 on Google Pay"))
    }
}
