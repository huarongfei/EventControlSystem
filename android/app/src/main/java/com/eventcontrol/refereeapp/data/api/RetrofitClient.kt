package com.eventcontrol.refereeapp.data.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    // 真机调试使用本机局域网IP，如 http://192.168.1.x:3001/
    // 模拟器使用 http://10.0.2.2:3001/
    private const val DEFAULT_BASE_URL = "http://192.168.1.100:3001/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String = DEFAULT_BASE_URL

    /**
     * 设置 Base URL，确保以 / 结尾
     */
    fun setBaseUrl(url: String) {
        // 确保 URL 以 / 结尾，这是 Retrofit 的要求
        val normalizedUrl = if (url.endsWith("/")) url else "$url/"
        if (normalizedUrl != currentBaseUrl) {
            currentBaseUrl = normalizedUrl
            retrofit = null  // 清除缓存，强制重新创建
        }
    }

    fun getBaseUrl(): String = currentBaseUrl

    fun createApiService(): ApiService {
        // 使用单例模式缓存 retrofit 实例
        val instance = retrofit ?: Retrofit.Builder()
            .baseUrl(currentBaseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build().also { retrofit = it }
        return instance.create(ApiService::class.java)
    }

    fun getApiService(): ApiService = createApiService()
}