package com.eventcontrol.refereeapp.domain.model

/**
 * 运动规则配置
 * 对应后端 sport-rules.ts 的 SportRule 接口
 */
data class SportRule(
    val sportType: String,
    val displayName: String,
    val emoji: String,
    val category: String,           // "team" | "race"
    val periodCount: Int,            // 节/半场/局数
    val periodDuration: Int,         // 单节时长（分钟），0=得分制
    val periodGoal: Int,             // 单局目标分，0=时间制
    val periodNames: List<String>,    // ["第1节","第2节",...]
    val periodNamesShort: List<String>, // ["Q1","Q2",...]
    val isCountdown: Boolean,         // 倒计时 vs 正计时
    val scoreButtons: List<Int>,      // 得分按钮数值
    val eventTypes: List<String>,     // 允许的事件类型
    val teamStats: List<String>,     // 球队统计指标
    val playerStats: List<String>,   // 球员/选手统计指标
    val raceConfig: RaceConfig? = null
)

data class RaceConfig(
    val lanes: Int,                  // 泳道/跑道数量
    val recordSplits: Boolean,        // 是否记录分段成绩
    val splitDistances: List<Int>     // 分段距离
)

/**
 * 运动规则配置单例
 */
object SportRules {

    val basketball = SportRule(
        sportType = "basketball",
        displayName = "篮球",
        emoji = "🏀",
        category = "team",
        periodCount = 4,
        periodDuration = 10,
        periodGoal = 0,
        periodNames = listOf("第1节", "第2节", "第3节", "第4节"),
        periodNamesShort = listOf("Q1", "Q2", "Q3", "Q4"),
        isCountdown = true,
        scoreButtons = listOf(1, 2, 3),
        eventTypes = listOf("score", "foul", "timeout", "substitution", "injury"),
        teamStats = listOf("得分", "篮板", "助攻", "抢断", "盖帽", "犯规"),
        playerStats = listOf("得分", "篮板", "助攻", "抢断", "盖帽", "二分命中", "三分命中", "罚球命中", "犯规")
    )

    val football = SportRule(
        sportType = "football",
        displayName = "足球",
        emoji = "⚽",
        category = "team",
        periodCount = 2,
        periodDuration = 45,
        periodGoal = 0,
        periodNames = listOf("上半场", "下半场"),
        periodNamesShort = listOf("H1", "H2"),
        isCountdown = false,
        scoreButtons = listOf(1),
        eventTypes = listOf("score", "yellow_card", "red_card", "substitution", "corner_kick", "offside", "injury"),
        teamStats = listOf("进球", "射门", "射正", "角球", "黄牌", "红牌", "犯规"),
        playerStats = listOf("进球", "助攻", "射门", "黄牌", "红牌", "犯规")
    )

    val volleyball = SportRule(
        sportType = "volleyball",
        displayName = "排球",
        emoji = "🏐",
        category = "team",
        periodCount = 3,
        periodDuration = 0,
        periodGoal = 25,
        periodNames = listOf("第1局", "第2局", "第3局"),
        periodNamesShort = listOf("S1", "S2", "S3"),
        isCountdown = false,
        scoreButtons = listOf(1),
        eventTypes = listOf("score", "foul", "timeout", "substitution", "injury"),
        teamStats = listOf("得分", "发球", "扣球", "拦网", "犯规"),
        playerStats = listOf("得分", "发球", "扣球", "拦网", "犯规")
    )

    val badminton = SportRule(
        sportType = "badminton",
        displayName = "羽毛球",
        emoji = "🏸",
        category = "team",
        periodCount = 3,
        periodDuration = 0,
        periodGoal = 21,
        periodNames = listOf("第1局", "第2局", "第3局"),
        periodNamesShort = listOf("G1", "G2", "G3"),
        isCountdown = false,
        scoreButtons = listOf(1),
        eventTypes = listOf("score", "foul", "substitution", "side_change", "injury"),
        teamStats = listOf("得分", "发球", "杀球", "犯规"),
        playerStats = listOf("得分", "发球", "杀球", "失误", "犯规")
    )

    val tennis = SportRule(
        sportType = "tennis",
        displayName = "网球",
        emoji = "🎾",
        category = "team",
        periodCount = 3,
        periodDuration = 0,
        periodGoal = 6,
        periodNames = listOf("第1盘", "第2盘", "第3盘"),
        periodNamesShort = listOf("T1", "T2", "T3"),
        isCountdown = false,
        scoreButtons = listOf(1),
        eventTypes = listOf("score", "foul", "substitution", "side_change", "injury"),
        teamStats = listOf("得分", "ACE球", "破发"),
        playerStats = listOf("得分", "ACE球", "破发", "犯规")
    )

    val tableTennis = SportRule(
        sportType = "table_tennis",
        displayName = "乒乓球",
        emoji = "🏓",
        category = "team",
        periodCount = 5,
        periodDuration = 0,
        periodGoal = 11,
        periodNames = listOf("第1局", "第2局", "第3局", "第4局", "第5局"),
        periodNamesShort = listOf("G1", "G2", "G3", "G4", "G5"),
        isCountdown = false,
        scoreButtons = listOf(1),
        eventTypes = listOf("score", "foul", "substitution", "side_change", "injury"),
        teamStats = listOf("得分", "发球得分", "攻球得分"),
        playerStats = listOf("得分", "发球得分", "攻球得分", "失误", "犯规")
    )

    val swimming = SportRule(
        sportType = "swimming",
        displayName = "游泳",
        emoji = "🏊",
        category = "race",
        periodCount = 1,
        periodDuration = 0,
        periodGoal = 0,
        periodNames = listOf("决赛"),
        periodNamesShort = listOf("FINAL"),
        isCountdown = false,
        scoreButtons = emptyList(),
        eventTypes = listOf("finish", "dq", "withdraw"),
        teamStats = emptyList(),
        playerStats = listOf("用时", "分段成绩"),
        raceConfig = RaceConfig(
            lanes = 8,
            recordSplits = true,
            splitDistances = listOf(50, 100)
        )
    )

    val running = SportRule(
        sportType = "running",
        displayName = "跑步",
        emoji = "🏃",
        category = "race",
        periodCount = 1,
        periodDuration = 0,
        periodGoal = 0,
        periodNames = listOf("决赛"),
        periodNamesShort = listOf("FINAL"),
        isCountdown = false,
        scoreButtons = emptyList(),
        eventTypes = listOf("finish", "dq", "withdraw"),
        teamStats = emptyList(),
        playerStats = listOf("用时", "分段成绩"),
        raceConfig = RaceConfig(
            lanes = 8,
            recordSplits = true,
            splitDistances = listOf(400, 800, 1500)
        )
    )

    /**
     * 根据运动类型获取规则，找不到时返回篮球规则
     */
    fun getRule(sportType: String): SportRule {
        return when (sportType) {
            "basketball" -> basketball
            "football" -> football
            "volleyball" -> volleyball
            "badminton" -> badminton
            "tennis" -> tennis
            "table_tennis" -> tableTennis
            "swimming" -> swimming
            "running" -> running
            else -> basketball
        }
    }

    /**
     * 获取所有支持的运动类型
     */
    fun getAllRules(): List<SportRule> = listOf(
        basketball, football, volleyball, badminton, tennis, tableTennis, swimming, running
    )

    /**
     * 获取队伍对战类运动
     */
    fun getTeamRules(): List<SportRule> = listOf(
        basketball, football, volleyball, badminton, tennis, tableTennis
    )

    /**
     * 获取竞速类运动
     */
    fun getRaceRules(): List<SportRule> = listOf(
        swimming, running
    )
}
