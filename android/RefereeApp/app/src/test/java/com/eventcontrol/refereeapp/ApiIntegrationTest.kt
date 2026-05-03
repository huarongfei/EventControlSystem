package com.eventcontrol.refereeapp

import com.eventcontrol.refereeapp.data.api.ApiService
import com.eventcontrol.refereeapp.data.api.RetrofitClient
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.eventcontrol.refereeapp.domain.model.Team
import com.google.common.truth.Truth.assertThat
import com.google.gson.Gson
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Before
import org.junit.Test

/**
 * 集成测试：测试与后端 API 的交互
 * 需要后端服务运行在 localhost:3001
 */
class ApiIntegrationTest {

    private lateinit var mockServer: MockWebServer
    private lateinit var apiService: ApiService
    private val gson = Gson()

    @Before
    fun setup() {
        // 启动 Mock 服务器
        mockServer = MockWebServer()
        mockServer.start()

        // 配置 Retrofit 使用 Mock 服务器
        val baseUrl = mockServer.url("/").toString()
        apiService = RetrofitClient.createApiService(baseUrl)
    }

    @After
    fun tearDown() {
        mockServer.shutdown()
    }

    @Test
    fun `test health endpoint returns success`() = runTest {
        mockServer.enqueue(
            MockResponse()
                .setBody("""{"status":"ok","timestamp":"2026-05-01T12:00:00Z"}""")
                .setResponseCode(200)
        )

        val response = apiService.healthCheck()
        assertThat(response.isSuccessful).isTrue()
        assertThat(response.body()?.get("status")?.asString).isEqualTo("ok")
    }

    @Test
    fun `test get events returns event list`() = runTest {
        val eventsJson = """
            [
                {
                    "id": "1",
                    "name": "2026年上海市大学生篮球联赛",
                    "status": "ongoing"
                }
            ]
        """.trimIndent()

        mockServer.enqueue(
            MockResponse()
                .setBody(eventsJson)
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
        )

        val response = apiService.getEvents()
        assertThat(response.isSuccessful).isTrue()
        val events = response.body()
        assertThat(events).hasSize(1)
        assertThat(events?.get(0)?.name).isEqualTo("2026年上海市大学生篮球联赛")
    }

    @Test
    fun `test get match details`() = runTest {
        val matchJson = """
            {
                "id": "match-1",
                "eventId": "event-1",
                "homeTeam": {
                    "id": "team-1",
                    "name": "华东理工大学",
                    "score": 45
                },
                "awayTeam": {
                    "id": "team-2",
                    "name": "交通大学",
                    "score": 38
                },
                "period": 2,
                "periodTime": "15:32",
                "status": "ongoing"
            }
        """.trimIndent()

        mockServer.enqueue(
            MockResponse()
                .setBody(matchJson)
                .setResponseCode(200)
        )

        val response = apiService.getMatch("match-1")
        assertThat(response.isSuccessful).isTrue()

        val match = response.body()
        assertThat(match).isNotNull()
        assertThat(match?.homeTeam?.name).isEqualTo("华东理工大学")
        assertThat(match?.awayTeam?.score).isEqualTo(38)
    }

    @Test
    fun `test update score`() = runTest {
        val responseJson = """
            {
                "id": "match-1",
                "homeTeam": {"id": "team-1", "name": "华东理工大学", "score": 46},
                "awayTeam": {"id": "team-2", "name": "交通大学", "score": 38}
            }
        """.trimIndent()

        mockServer.enqueue(
            MockResponse()
                .setBody(responseJson)
                .setResponseCode(200)
        )

        val response = apiService.updateScore("match-1", 46, 38)
        assertThat(response.isSuccessful).isTrue()

        val match = response.body()
        assertThat(match?.homeTeam?.score).isEqualTo(46)
    }

    @Test
    fun `test add match event`() = runTest {
        val eventJson = """
            {
                "id": "event-new",
                "matchId": "match-1",
                "type": "score",
                "teamId": "team-1",
                "playerId": "player-1",
                "points": 2,
                "description": "两分球命中",
                "timestamp": "2026-05-01T15:30:00Z"
            }
        """.trimIndent()

        mockServer.enqueue(
            MockResponse()
                .setBody(eventJson)
                .setResponseCode(201)
        )

        val event = MatchEvent(
            matchId = "match-1",
            type = "score",
            teamId = "team-1",
            playerId = "player-1",
            points = 2,
            description = "两分球命中"
        )

        val response = apiService.addMatchEvent("match-1", event)
        assertThat(response.isSuccessful).isTrue()
        assertThat(response.body()?.type).isEqualTo("score")
        assertThat(response.body()?.points).isEqualTo(2)
    }

    @Test
    fun `test get match statistics`() = runTest {
        val statsJson = """
            {
                "matchId": "match-1",
                "homeTeamStats": {
                    "totalScore": 45,
                    "fieldGoalMade": 18,
                    "fieldGoalAttempted": 35,
                    "threePointMade": 5,
                    "threePointAttempted": 15,
                    "freeThrowMade": 8,
                    "freeThrowAttempted": 10,
                    "rebounds": 25,
                    "assists": 12,
                    "steals": 6,
                    "blocks": 3,
                    "turnovers": 8,
                    "fouls": 10
                },
                "awayTeamStats": {
                    "totalScore": 38,
                    "fieldGoalMade": 15,
                    "fieldGoalAttempted": 32,
                    "threePointMade": 4,
                    "threePointAttempted": 12,
                    "freeThrowMade": 8,
                    "freeThrowAttempted": 12,
                    "rebounds": 20,
                    "assists": 10,
                    "steals": 4,
                    "blocks": 2,
                    "turnovers": 10,
                    "fouls": 12
                }
            }
        """.trimIndent()

        mockServer.enqueue(
            MockResponse()
                .setBody(statsJson)
                .setResponseCode(200)
        )

        val response = apiService.getMatchStatistics("match-1")
        assertThat(response.isSuccessful).isTrue()

        val stats = response.body()
        assertThat(stats?.homeTeamStats?.totalScore).isEqualTo(45)
        assertThat(stats?.awayTeamStats?.rebounds).isEqualTo(20)
    }

    @Test
    fun `test server error handling`() = runTest {
        mockServer.enqueue(
            MockResponse()
                .setBody("""{"error":"Internal Server Error"}""")
                .setResponseCode(500)
        )

        val response = apiService.getEvents()
        assertThat(response.code()).isEqualTo(500)
    }
}
