package com.eventcontrol.refereeapp.domain.model

import com.google.gson.annotations.SerializedName

data class Event(
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("matches")
    val matches: List<Match> = emptyList()
)