package com.pennypilot.app.data.api

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Interceptor for optional Bearer token authentication.
 * Ready for future backend authentication requirements.
 */
class AuthInterceptor(
    private val tokenProvider: () -> String? = { null }
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = tokenProvider()

        val request = if (!token.isNullOrBlank()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .build()
        } else {
            originalRequest.newBuilder()
                .header("Content-Type", "application/json")
                .build()
        }

        return chain.proceed(request)
    }
}
