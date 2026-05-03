package com.eventcontrol.refereeapp

import com.eventcontrol.refereeapp.data.api.ApiService
import com.eventcontrol.refereeapp.data.api.RetrofitClient
import com.eventcontrol.refereeapp.data.repository.MatchRepository
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.eventcontrol.refereeapp.domain.model.Team
import com.google.common.truth.Truth.assertThat
import com.google.gson.Gson
import com.google.gson.JsonObject
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import org.junit.After
import org.junit.Before
import org.junit.Test
import retrofit2.Response

/**
 * 单元测试：测试 MatchRepository 业务逻辑
 */
@OptIn(ExperimentalCoroutinesApi::class)
class MatchRepositoryTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var apiService: ApiService
    private lateinit var repository: MatchRepository

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)

        // 使用真实的 API 服务连接本地测试服务器
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .build()

        // 为了测试，使用 mock
        apiService = mockk()
        repository = MatchRepository(apiService, Gson())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `test getCurrentMatch returns match data`() = runTest {
        // 准备 Mock 数据
        val mockMatch = createMockMatch()
        val response: Response<Match> = Response.success(mockMatch)

        coEvery { apiService.getMatch(any()) } returns response

        // 执行
        val result = repository.getCurrentMatch("match-1")

        // 验证
        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()?.homeTeam?.name).isEqualTo("华东理工大学")
    }

    @Test
    fun `test updateScore updates match score`() = runTest {
        val updatedMatch = createMockMatch().copy(
            homeTeam = Team("team-1", "华东理工大学", 50),
            awayTeam = Team("team-2", "交通大学", 45)
        )
        val response: Response<Match> = Response.success(updatedMatch)

        coEvery { apiService.updateScore(any(), any(), any()) } returns response

        val result = repository.updateScore("match-1", 50, 45)

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()?.homeTeam?.score).isEqualTo(50)
    }

    @Test
    fun `test addScoreEvent creates scoring event`() = runTest {
        val newEvent = MatchEvent(
            matchId = "match-1",
            type = "score",
            teamId = "team-1",
            playerId = "player-1",
            points = 2,
            description = "两分球命中"
        )

        val eventResponse = createMockEvent()
        val response: Response<MatchEvent> = Response.success(eventResponse)

        coEvery { apiService.addMatchEvent(any(), any()) } returns response

        val result = repository.addScoreEvent(
            matchId = "match-1",
            teamId = "team-1",
            playerId = "player-1",
            points = 2,
            description = "两分球命中"
        )

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()?.type).isEqualTo("score")
    }

    @Test
    fun `test addFoulEvent creates foul event`() = runTest {
        val eventResponse = createMockEvent().copy(type = "foul", description = "防守犯规")
        val response: Response<MatchEvent> = Response.success(eventResponse)

        coEvery { apiService.addMatchEvent(any(), any()) } returns response

        val result = repository.addFoulEvent(
            matchId = "match-1",
            teamId = "team-2",
            playerId = "player-5",
            foulType = "defensive",
            description = "防守犯规"
        )

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrNull()?.type).isEqualTo("foul")
    }

    @Test
    fun `test handleApiError returns appropriate message`() = runTest {
        val errorResponse: Response<Match> = Response.error(404, okhttp3.ResponseBody.create(
            okhttp3.MediaType.parse("application/json"),
            """{"error":"Match not found"}"""
        ))

        coEvery { apiService.getMatch(any()) } returns errorResponse

        val result = repository.getCurrentMatch("non-existent")

        assertThat(result.isFailure).isTrue()
    }

    private fun createMockMatch() = Match(
        id = "match-1",
        eventId = "event-1",
        homeTeam = Team("team-1", "华东理工大学", 45),
        awayTeam = Team("team-2", "交通大学", 38),
        period = 2,
        periodTime = "15:32",
        status = "ongoing"
    )

    private fun createMockEvent() = MatchEvent(
        id = "event-new",
        matchId = "match-1",
        type = "score",
        teamId = "team-1",
        playerId = "player-1",
        points = 2,
        description = "两分球命中"
    )
}
