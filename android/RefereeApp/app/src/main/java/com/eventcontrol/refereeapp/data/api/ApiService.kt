package com.eventcontrol.refereeapp.data.api

import com.eventcontrol.refereeapp.domain.model.FoulTypeDto
import com.eventcontrol.refereeapp.domain.model.FoulTypeResponse
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET("api/matches/{id}")
    suspend fun getMatch(@Path("id") matchId: String): Response<MatchDto>

    @POST("api/matches/{id}/events")
    suspend fun reportEvent(
        @Path("id") matchId: String,
        @Body event: MatchEventDto
    ): Response<SyncResultDto>

    @POST("api/sync")
    suspend fun syncEvents(
        @Body events: List<MatchEventDto>
    ): Response<SyncResultDto>

    @GET("api/matches")
    suspend fun getMatches(): Response<List<MatchDto>>

    /**
     * 获取指定运动类型的犯规类型列表
     * GET /api/foul-types?sportType=basketball
     */
    @GET("api/foul-types")
    suspend fun getFoulTypes(@Query("sportType") sportType: String): Response<FoulTypeResponse>
}

// DTOs
data class MatchDto(
    val id: String = "",
    val eventName: String = "",
    val homeTeam: TeamDto? = null,
    val awayTeam: TeamDto? = null,
    val homeScore: Int = 0,
    val awayScore: Int = 0,
    val currentPeriod: Int = 1,
    val matchTime: String = "10:00",
    val status: String = "not_started",
    val sportType: String = "basketball",
    val periodDuration: Int = 10,
    val periodGoal: Int = 0,
    val totalPeriods: Int = 4,
    val scoreRules: ScoreRulesDto? = null
)

data class ScoreRulesDto(
    val sportType: String,
    val displayName: String,
    val emoji: String,
    val category: String,
    val periodCount: Int,
    val periodDuration: Int,
    val periodGoal: Int,
    val periodNames: List<String>,
    val periodNamesShort: List<String>,
    val isCountdown: Boolean,
    val scoreButtons: List<Int>,
    val eventTypes: List<String>,
    val teamStats: List<String>,
    val playerStats: List<String>
)

data class TeamDto(
    val id: String = "",
    val name: String = "未知队伍",
    val shortName: String = "未知",
    val players: List<PlayerDto>? = null
)

data class PlayerDto(
    val id: String,
    val name: String,
    val number: Int
)

data class MatchEventDto(
    val id: String,
    val matchId: String,
    val type: String,
    val period: Int,
    val teamId: String,
    val playerId: String?,
    val detail: Map<String, Any>?,
    val reportedBy: String,
    val timestamp: Long
)

data class SyncResultDto(
    val success: Boolean,
    val syncedIds: List<String>?,
    val message: String?
)
