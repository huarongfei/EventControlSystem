package com.eventcontrol.refereeapp.domain.model

import com.google.gson.annotations.SerializedName

data class MatchEvent(
    @SerializedName("id")
    val id: String,
    @SerializedName("matchId")
    val matchId: String,
    @SerializedName("type")
    val type: EventType,
    @SerializedName("teamId")
    val teamId: String,
    @SerializedName("playerId")
    val playerId: String? = null,
    @SerializedName("playerName")
    val playerName: String? = null,
    @SerializedName("points")
    val points: Int? = null,
    @SerializedName("foulType")
    val foulType: String? = null,
    @SerializedName("description")
    val description: String,
    @SerializedName("timestamp")
    val timestamp: Long = System.currentTimeMillis()
)

enum class EventType {
    @SerializedName("SCORE")
    SCORE,
    @SerializedName("FOUL")
    FOUL,
    @SerializedName("SUBSTITUTION")
    SUBSTITUTION,
    @SerializedName("TIMEOUT")
    TIMEOUT,
    @SerializedName("PERIOD_END")
    PERIOD_END,
    @SerializedName("GAME_END")
    GAME_END
}