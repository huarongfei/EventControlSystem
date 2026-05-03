package com.eventcontrol.refereeapp.data.api

import com.eventcontrol.refereeapp.domain.model.Event
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.google.gson.JsonObject
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET("api/health")
    suspend fun healthCheck(): Response<JsonObject>

    @GET("api/events")
    suspend fun getEvents(): Response<List<Event>>

    @GET("api/matches/{id}")
    suspend fun getMatch(@Path("id") matchId: String): Response<Match>

    @PUT("api/matches/{id}/score")
    suspend fun updateScore(
        @Path("id") matchId: String,
        @Query("homeScore") homeScore: Int,
        @Query("awayScore") awayScore: Int
    ): Response<Match>

    @POST("api/matches/{id}/events")
    suspend fun addMatchEvent(
        @Path("id") matchId: String,
        @Body event: MatchEvent
    ): Response<MatchEvent>

    @GET("api/matches/{id}/statistics")
    suspend fun getMatchStatistics(@Path("id") matchId: String): Response<JsonObject>
}