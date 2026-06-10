package com.eventcontrol.refereeapp.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private var retrofit: Retrofit? = null
    private var apiService: ApiService? = null

    fun initialize(baseUrl: String) {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                // Production: only log basic request/response metadata, not full bodies (may contain sensitive data)
                HttpLoggingInterceptor.Level.BASIC
            }
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        apiService = retrofit?.create(ApiService::class.java)
    }

    fun getApiService(): ApiService {
        return apiService ?: throw IllegalStateException("RetrofitClient not initialized. Call initialize() first.")
    }

    fun updateBaseUrl(baseUrl: String) {
        initialize(baseUrl)
    }
}
