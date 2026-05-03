package com.eventcontrol.refereeapp.domain.model

import com.google.gson.annotations.SerializedName

data class Match(
    @SerializedName("id")
    val id: String,
    @SerializedName("eventId")
    val eventId: String,
    @SerializedName("homeTeam")
    val homeTeam: Team,
    @SerializedName("awayTeam")
    val awayTeam: Team,
    @SerializedName("period")
    val period: Int = 1,
    @SerializedName("periodTime")
    val periodTime: String = "12:00",
    @SerializedName("status")
    val status: MatchStatus? = MatchStatus.NOT_STARTED
)

enum class MatchStatus {
    @SerializedName("NOT_STARTED")
    NOT_STARTED,
    @SerializedName("ONGOING")
    ONGOING,
    @SerializedName("PAUSED")
    PAUSED,
    @SerializedName("FINISHED")
    FINISHED
}