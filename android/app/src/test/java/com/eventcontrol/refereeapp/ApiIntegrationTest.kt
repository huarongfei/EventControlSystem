package com.eventcontrol.refereeapp

import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * 集成测试：测试与后端 API 的交互
 */
class ApiIntegrationTest {

    private lateinit var mockServer: MockWebServer

    @Before
    fun setup() {
        mockServer = MockWebServer()
        mockServer.start()
    }

    @After
    fun tearDown() {
        mockServer.shutdown()
    }

    @Test
    fun `test mock server health endpoint`() = runTest {
        mockServer.enqueue(
            MockResponse()
                .setBody("""{"status":"ok"}""")
                .setResponseCode(200)
        )

        val response = mockServer.takeRequest()
        assertThat(response.path).isEqualTo("/")
    }
}
