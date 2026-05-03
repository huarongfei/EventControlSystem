package com.eventcontrol.refereeapp.domain.model

import androidx.compose.ui.graphics.Color

/**
 * 犯规类型数据模型 - 从后端 API /api/foul-types 获取
 */
data class FoulType(
    val id: String,
    val sportType: String,
    val code: String,
    val name: String,
    val nameEn: String,
    val severity: FoulSeverity,
    val penalty: FoulPenalty,
    val description: String
)

/**
 * 犯规严重程度
 */
enum class FoulSeverity(val displayName: String, val color: androidx.compose.ui.graphics.Color) {
    MINOR("轻微", androidx.compose.ui.graphics.Color(0xFF4CAF50)),      // Green
    COMMON("普通", androidx.compose.ui.graphics.Color(0xFFFF9800)),     // Orange
    SERIOUS("严重", androidx.compose.ui.graphics.Color(0xFFFF5722)),    // Deep Orange
    TECHNICAL("技术犯规", androidx.compose.ui.graphics.Color(0xFF9C27B0)), // Purple
    FLAGRANT("恶意犯规", androidx.compose.ui.graphics.Color(0xFFF44336)); // Red

    companion object {
        fun fromString(value: String): FoulSeverity {
            return when (value.lowercase()) {
                "minor" -> MINOR
                "common" -> COMMON
                "serious" -> SERIOUS
                "technical" -> TECHNICAL
                "flagrant" -> FLAGRANT
                else -> COMMON
            }
        }
    }
}

/**
 * 犯规处罚方式
 */
data class FoulPenalty(
    val type: String,           // possession, free_throw, penalty_shot, card, etc.
    val duration: Int?,         // 处罚时长（秒），如罚下场时间
    val points: Int?,           // 罚分
    val description: String     // 处罚描述
) {
    fun getDisplayText(): String {
        return when (type) {
            "possession" -> "对方球权"
            "free_throw" -> "罚球${points ?: ""}次"
            "penalty_shot" -> "点球"
            "card" -> "出示${description}"
            "timeout" -> "暂停"
            "ejection" -> "驱逐出场"
            else -> description.ifEmpty { "无处罚" }
        }
    }
}

/**
 * 犯规类型 API 响应
 */
data class FoulTypeResponse(
    val success: Boolean,
    val data: List<FoulTypeDto>,
    val total: Int,
    val sportTypes: List<String>
)

/**
 * 犯规类型 DTO（用于 API 解析）
 */
data class FoulTypeDto(
    val id: String,
    val sportType: String,
    val code: String,
    val name: String,
    val nameEn: String,
    val severity: String,
    val penalty: PenaltyDto,
    val description: String
)

data class PenaltyDto(
    val type: String,
    val duration: Int?,
    val points: Int?,
    val description: String
)

/**
 * 扩展函数：将 DTO 转换为领域模型
 */
fun FoulTypeDto.toDomain(): FoulType {
    return FoulType(
        id = id,
        sportType = sportType,
        code = code,
        name = name,
        nameEn = nameEn,
        severity = FoulSeverity.fromString(severity),
        penalty = FoulPenalty(
            type = penalty.type,
            duration = penalty.duration,
            points = penalty.points,
            description = penalty.description
        ),
        description = description
    )
}
