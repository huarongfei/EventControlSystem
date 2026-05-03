package com.eventcontrol.refereeapp.domain.model

import com.google.gson.annotations.SerializedName

data class Team(
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("score")
    val score: Int = 0,
    @SerializedName("players")
    val players: List<Player> = emptyList()
)

data class Player(
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("number")
    val number: Int,
    @SerializedName("teamId")
    val teamId: String
)