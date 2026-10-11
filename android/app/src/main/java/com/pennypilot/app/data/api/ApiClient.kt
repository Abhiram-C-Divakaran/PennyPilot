package com.pennypilot.app.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private var currentBaseUrl: String? = null
    private var cachedApi: PennyPilotApi? = null

    private fun buildOkHttpClient(tokenProvider: () -> String?): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }

        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenProvider))
            .addInterceptor(logging)
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(10, TimeUnit.SECONDS)
            .build()
    }

    @Synchronized
    fun getApi(baseUrl: String, tokenProvider: () -> String? = { null }): PennyPilotApi {
        val normalizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        if (cachedApi != null && currentBaseUrl == normalizedUrl) {
            return cachedApi!!
        }

        val retrofit = Retrofit.Builder()
            .baseUrl(normalizedUrl)
            .client(buildOkHttpClient(tokenProvider))
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        currentBaseUrl = normalizedUrl
        cachedApi = retrofit.create(PennyPilotApi::class.java)
        return cachedApi!!
    }
}
