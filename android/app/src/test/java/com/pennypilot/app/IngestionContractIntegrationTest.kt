package com.pennypilot.app

import com.pennypilot.app.data.api.ApiClient
import com.pennypilot.app.data.model.IngestionRequest
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class IngestionContractIntegrationTest {

    private lateinit var server: MockWebServer

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun ingestTransaction_handlesCreated201() = runBlocking {
        val jsonResponse = """
            {
              "status": "created",
              "reviewStatus": "confirmed",
              "transaction": {
                "id": "tx-12345",
                "type": "expense",
                "amount": 450.0,
                "categoryId": "food",
                "merchant": "Zomato"
              }
            }
        """.trimIndent()

        server.enqueue(
            MockResponse()
                .setResponseCode(201)
                .setHeader("Content-Type", "application/json")
                .setBody(jsonResponse)
        )

        val api = ApiClient.getApi(server.url("/").toString())
        val request = IngestionRequest(
            source = "notification",
            amount = 450.0,
            type = "expense",
            merchant = "Zomato",
            timestamp = "2026-10-11T20:15:00.000Z",
            paymentMethod = "upi",
            externalReference = "UPI-REF-10928374",
            rawDescription = "Paid ₹450 to ZOMATO via Google Pay",
            sourceApp = "com.google.android.apps.nbu.paisa.user"
        )

        val response = api.ingestTransaction(request)
        assertTrue(response.isSuccessful)
        assertEquals(201, response.code())
        assertEquals("created", response.body()?.status)
        assertEquals("confirmed", response.body()?.reviewStatus)
        assertEquals("food", response.body()?.transaction?.categoryId)

        val recordedRequest = server.takeRequest()
        assertEquals("/api/ingestion/transaction", recordedRequest.path)
        assertEquals("POST", recordedRequest.method)
        assertTrue(recordedRequest.body.readUtf8().contains("\"merchant\":\"Zomato\""))
    }

    @Test
    fun ingestTransaction_handlesPendingReview200() = runBlocking {
        val jsonResponse = """
            {
              "status": "pending_review",
              "reviewStatus": "pending_review",
              "transaction": {
                "id": "tx-12346",
                "type": "expense",
                "amount": 780.0,
                "categoryId": "other",
                "merchant": "ABC Traders"
              }
            }
        """.trimIndent()

        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(jsonResponse)
        )

        val api = ApiClient.getApi(server.url("/").toString())
        val request = IngestionRequest(
            source = "notification",
            amount = 780.0,
            type = "expense",
            merchant = "ABC Traders",
            sourceApp = "com.phonepe.app"
        )

        val response = api.ingestTransaction(request)
        assertTrue(response.isSuccessful)
        assertEquals(200, response.code())
        assertEquals("pending_review", response.body()?.status)
        assertEquals("pending_review", response.body()?.reviewStatus)
    }

    @Test
    fun ingestTransaction_handlesDuplicate200() = runBlocking {
        val jsonResponse = """
            {
              "status": "duplicate",
              "existingTransactionId": "tx-12345",
              "duplicateReason": "Matched exact external reference 'UPI-REF-10928374'",
              "reviewStatus": "confirmed"
            }
        """.trimIndent()

        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(jsonResponse)
        )

        val api = ApiClient.getApi(server.url("/").toString())
        val request = IngestionRequest(
            source = "notification",
            amount = 450.0,
            externalReference = "UPI-REF-10928374",
            sourceApp = "com.google.android.apps.nbu.paisa.user"
        )

        val response = api.ingestTransaction(request)
        assertTrue(response.isSuccessful)
        assertEquals("duplicate", response.body()?.status)
        assertEquals("tx-12345", response.body()?.existingTransactionId)
        assertNotNull(response.body()?.duplicateReason)
    }

    @Test
    fun checkHealth_returnsOk() = runBlocking {
        val jsonResponse = """
            {
              "status": "ok",
              "service": "PennyPilot",
              "version": "1.0.0"
            }
        """.trimIndent()

        server.enqueue(
            MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(jsonResponse)
        )

        val api = ApiClient.getApi(server.url("/").toString())
        val response = api.checkHealth()
        assertTrue(response.isSuccessful)
        assertEquals("ok", response.body()?.status)
        assertEquals("PennyPilot", response.body()?.service)
    }
}
