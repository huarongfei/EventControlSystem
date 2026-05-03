package com.eventcontrol.refereeapp.domain.model

data class Match(
    val id: String,
    val eventName: String,
    val homeTeam: Team,
    val awayTeam: Team,
    val homeScore: Int,
    val awayScore: Int,
    val currentPeriod: Int,
    val matchTime: String,
    val status: String,
    val sportType: String = "basketball",  // 运动类型: basketball, volleyball, football, etc.
    val periodDuration: Int = 10,          // 每节时长（分钟）
    val periodGoal: Int = 0,               // 排球每局目标分
    val totalPeriods: Int = 4,             // 总节数
    val periodNames: List<String> = listOf("第1节", "第2节", "第3节", "第4节")  // 节次名称
) {
    /**
     * 获取当前运动的规则配置
     */
    fun getSportRule(): SportRule = SportRules.getRule(sportType)

    /**
     * 获取当前节次的显示名称
     */
    fun getCurrentPeriodName(): String {
        val rule = getSportRule()
        return rule.periodNames.getOrNull(currentPeriod - 1) ?: rule.periodNames.getOrElse(0) { "第${currentPeriod}节" }
    }

    /**
     * 判断是否为竞速类运动
     */
    fun isRaceSport(): Boolean = getSportRule().category == "race"

    /**
     * 获取比赛时长显示
     */
    fun getMatchTimeDisplay(): String {
        val rule = getSportRule()
        return if (rule.periodGoal > 0) {
            // 得分制
            "${homeScore}:${awayScore}"
        } else {
            matchTime
        }
    }
}

data class Team(
    val id: String,
    val name: String,
    val shortName: String,
    val players: List<Player> = emptyList()
)

data class Player(
    val id: String,
    val name: String,
    val number: Int
)
