package com.eventcontrol.refereeapp.domain.model

data class MatchEvent(
    val id: String,
    val matchId: String,
    val type: EventType,
    val period: Int,
    val teamId: String,
    val playerId: String?,
    val detail: Map<String, Any>? = null,
    val reportedBy: String,
    val timestamp: Long,
    val isSynced: Boolean = false
)

/**
 * 事件类型枚举 - 支持多种运动类型
 */
enum class EventType {
    // 通用事件
    SCORE,
    FOUL,
    SUBSTITUTION,
    TIMEOUT,
    INJURY,
    CANCEL,

    // 足球专用
    YELLOW_CARD,
    RED_CARD,
    CORNER_KICK,
    OFFSIDE,

    // 羽毛球/网球/乒乓球专用
    SIDE_CHANGE,

    // 竞速类专用
    FINISH,
    DQ,          // Disqualified 取消资格
    WITHDRAW;    // 退赛

    /**
     * 从字符串转换为 EventType
     */
    companion object {
        fun fromString(value: String): EventType {
            return when (value.lowercase()) {
                // 通用
                "score" -> SCORE
                "foul" -> FOUL
                "substitution" -> SUBSTITUTION
                "timeout" -> TIMEOUT
                "injury" -> INJURY
                "cancel" -> CANCEL
                // 足球
                "yellow_card" -> YELLOW_CARD
                "red_card" -> RED_CARD
                "corner_kick" -> CORNER_KICK
                "offside" -> OFFSIDE
                // 羽毛球/网球/乒乓球
                "side_change" -> SIDE_CHANGE
                // 竞速
                "finish" -> FINISH
                "dq" -> DQ
                "withdraw" -> WITHDRAW
                else -> SCORE
            }
        }
    }

    /**
     * 转换为后端 API 字符串
     */
    fun toApiString(): String {
        return when (this) {
            YELLOW_CARD -> "yellow_card"
            RED_CARD -> "red_card"
            CORNER_KICK -> "corner_kick"
            OFFSIDE -> "offside"
            SIDE_CHANGE -> "side_change"
            DQ -> "dq"
            WITHDRAW -> "withdraw"
            else -> this.name.lowercase()
        }
    }

    /**
     * 获取事件显示名称
     */
    fun getDisplayName(): String {
        return when (this) {
            SCORE -> "得分"
            FOUL -> "犯规"
            SUBSTITUTION -> "换人"
            TIMEOUT -> "暂停"
            INJURY -> "伤病"
            CANCEL -> "取消"
            YELLOW_CARD -> "黄牌"
            RED_CARD -> "红牌"
            CORNER_KICK -> "角球"
            OFFSIDE -> "越位"
            SIDE_CHANGE -> "换边"
            FINISH -> "完赛"
            DQ -> "取消资格"
            WITHDRAW -> "退赛"
        }
    }
}
