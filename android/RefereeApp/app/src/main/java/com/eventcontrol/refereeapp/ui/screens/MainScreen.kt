package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.domain.model.*
import com.eventcontrol.refereeapp.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun MatchInfoPage(
    homeTeamName: String,
    awayTeamName: String,
    homeScore: Int,
    awayScore: Int,
    currentPeriod: Int,
    matchTime: String,
    isOfflineMode: Boolean,
    recentEvents: List<MatchEvent>,
    sportType: String = "basketball",
    periodNames: List<String> = listOf("第1节", "第2节", "第3节", "第4节"),
    modifier: Modifier = Modifier
) {
    val rule = SportRules.getRule(sportType)
    
    // Get period name based on sport type
    val periodDisplayName = when (sportType) {
        "volleyball" -> "第${currentPeriod}局"
        "football" -> if (currentPeriod == 1) "上半场" else "下半场"
        "swimming", "running" -> "决赛"
        else -> periodNames.getOrNull(currentPeriod - 1) ?: "第${currentPeriod}节"
    }
    
    // Get match time display (score for scoring sports)
    val matchTimeDisplay = if (rule.periodGoal > 0) {
        "$homeScore:$awayScore"
    } else {
        matchTime
    }
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Match status card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = rule.emoji,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = periodDisplayName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isOfflineMode) OfflineWarning.copy(alpha = 0.2f)
                               else OnlineGreen.copy(alpha = 0.2f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (isOfflineMode) Icons.Filled.CloudOff else Icons.Filled.CloudDone,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = if (isOfflineMode) OfflineWarning else OnlineGreen
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isOfflineMode) "离线" else "在线",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isOfflineMode) OfflineWarning else OnlineGreen
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Score display
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = homeTeamName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = if (rule.periodGoal > 0) homeScore.toString() else homeScore.toString(),
                            style = MaterialTheme.typography.displayMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    
                    Text(
                        text = "-",
                        style = MaterialTheme.typography.displaySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.5f)
                    )
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = awayTeamName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = if (rule.periodGoal > 0) awayScore.toString() else awayScore.toString(),
                            style = MaterialTheme.typography.displayMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
                
                // Show period goal for scoring sports
                if (rule.periodGoal > 0) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "先得 ${rule.periodGoal} 分获胜",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Recent events
        Text(
            text = "最近事件",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        if (recentEvents.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "暂无事件",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(
                    items = recentEvents.take(10),
                    key = { it.id }
                ) { event ->
                    EventItem(event = event, sportType = sportType)
                }
            }
        }
    }
}

@Composable
private fun EventItem(
    event: MatchEvent,
    sportType: String,
    modifier: Modifier = Modifier
) {
    val dateFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(
                        color = getEventColor(event.type).copy(alpha = 0.1f),
                        shape = RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = getEventIcon(event.type),
                    contentDescription = null,
                    tint = getEventColor(event.type),
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.type.getDisplayName(),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "第${event.period}节",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Text(
                text = dateFormat.format(Date(event.timestamp)),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun getEventIcon(type: EventType): ImageVector {
    return when (type) {
        EventType.SCORE -> Icons.AutoMirrored.Filled.TrendingUp
        EventType.FOUL -> Icons.Filled.Warning
        EventType.SUBSTITUTION -> Icons.Filled.SwapHoriz
        EventType.TIMEOUT -> Icons.Filled.Pause
        EventType.INJURY -> Icons.Filled.LocalHospital
        EventType.CANCEL -> Icons.Filled.Cancel
        EventType.YELLOW_CARD -> Icons.Filled.Square
        EventType.RED_CARD -> Icons.Filled.Square
        EventType.CORNER_KICK -> Icons.Filled.SportsSoccer
        EventType.OFFSIDE -> Icons.Filled.Flag
        EventType.SIDE_CHANGE -> Icons.Filled.SwapHoriz
        EventType.FINISH -> Icons.Filled.Flag
        EventType.DQ -> Icons.Filled.Block
        EventType.WITHDRAW -> Icons.Filled.ExitToApp
    }
}

private fun getEventColor(type: EventType): Color {
    return when (type) {
        EventType.SCORE -> ScoreActionColor
        EventType.FOUL, EventType.YELLOW_CARD, EventType.RED_CARD -> FoulActionColor
        EventType.SUBSTITUTION -> SubstitutionActionColor
        EventType.TIMEOUT -> TimeoutActionColor
        EventType.INJURY -> InjuryActionColor
        EventType.CANCEL -> CancelActionColor
        EventType.CORNER_KICK -> ScoreActionColor
        EventType.OFFSIDE -> FoulActionColor
        EventType.SIDE_CHANGE -> SubstitutionActionColor
        EventType.FINISH -> ScoreActionColor
        EventType.DQ, EventType.WITHDRAW -> CancelActionColor
    }
}

@Composable
fun MainScreen(
    matchEvents: List<MatchEvent>,
    foulTypes: List<FoulType>,
    isFoulTypesLoading: Boolean,
    isOfflineMode: Boolean,
    onNavigateToTab: (Int) -> Unit,
    onReportScore: (String, Int) -> Unit,
    onReportFoul: (String, FoulType) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportTimeout: (String) -> Unit,
    onReportInjury: (String, String?) -> Unit,
    onShowFoulDialog: (String) -> Unit,
    onReportYellowCard: (String) -> Unit,
    onReportRedCard: (String) -> Unit,
    onReportCornerKick: (String) -> Unit,
    onReportOffside: (String) -> Unit,
    onReportSideChange: () -> Unit,
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    homeScore: Int,
    awayScore: Int,
    currentPeriod: Int,
    matchTime: String,
    sportType: String = "basketball",
    periodNames: List<String> = listOf("第1节", "第2节", "第3节", "第4节"),
    modifier: Modifier = Modifier
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var showFoulDialog by remember { mutableStateOf(false) }
    var selectedTeamIdForFoul by remember { mutableStateOf("") }
    
    Scaffold(
        modifier = modifier,
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.Info, contentDescription = null) },
                    label = { Text("赛况") },
                    selected = selectedTabIndex == 0,
                    onClick = { selectedTabIndex = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.TouchApp, contentDescription = null) },
                    label = { Text("操作") },
                    selected = selectedTabIndex == 1,
                    onClick = { selectedTabIndex = 1 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Filled.History, contentDescription = null) },
                    label = { Text("历史") },
                    selected = selectedTabIndex == 2,
                    onClick = { selectedTabIndex = 2 }
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Offline mode banner
            if (isOfflineMode) {
                OfflineModeBanner(
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            // Tab content
            when (selectedTabIndex) {
                0 -> MatchInfoPage(
                    homeTeamName = homeTeamName,
                    awayTeamName = awayTeamName,
                    homeScore = homeScore,
                    awayScore = awayScore,
                    currentPeriod = currentPeriod,
                    matchTime = matchTime,
                    isOfflineMode = isOfflineMode,
                    recentEvents = matchEvents,
                    sportType = sportType,
                    periodNames = periodNames,
                    modifier = Modifier.weight(1f)
                )
                1 -> OperationPage(
                    sportType = sportType,
                    homeTeamId = homeTeamId,
                    awayTeamId = awayTeamId,
                    homeTeamName = homeTeamName,
                    awayTeamName = awayTeamName,
                    onReportScore = onReportScore,
                    onReportFoul = onReportFoul,
                    onShowFoulDialog = { teamId ->
                        selectedTeamIdForFoul = teamId
                        showFoulDialog = true
                    },
                    onReportSubstitution = onReportSubstitution,
                    onReportTimeout = onReportTimeout,
                    onReportInjury = onReportInjury,
                    onReportYellowCard = onReportYellowCard,
                    onReportRedCard = onReportRedCard,
                    onReportCornerKick = onReportCornerKick,
                    onReportOffside = onReportOffside,
                    onReportSideChange = onReportSideChange,
                    modifier = Modifier.weight(1f)
                )
                2 -> HistoryScreen(
                    events = matchEvents,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
    
    // 犯规类型选择对话框
    if (showFoulDialog) {
        FoulTypeSelectionDialog(
            foulTypes = foulTypes,
            isLoading = isFoulTypesLoading,
            onFoulTypeSelected = { foulType ->
                onReportFoul(selectedTeamIdForFoul, foulType)
                showFoulDialog = false
            },
            onDismiss = { showFoulDialog = false }
        )
    }
}

@Composable
fun OfflineModeBanner(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        color = OfflineWarning
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Filled.CloudOff,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "离线模式 - 操作将在网络恢复后同步",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun OperationPage(
    sportType: String,
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    onReportScore: (String, Int) -> Unit,
    onReportFoul: (String, FoulType) -> Unit,
    onShowFoulDialog: (String) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportTimeout: (String) -> Unit,
    onReportInjury: (String, String?) -> Unit,
    onReportYellowCard: (String) -> Unit,
    onReportRedCard: (String) -> Unit,
    onReportCornerKick: (String) -> Unit,
    onReportOffside: (String) -> Unit,
    onReportSideChange: () -> Unit,
    onOpenPlayerSearch: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val rule = SportRules.getRule(sportType)
    
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Header with sport info
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = rule.emoji,
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "${rule.displayName} 操作",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }
            if (rule.category == "team") {
                TextButton(onClick = onOpenPlayerSearch) {
                    Icon(
                        imageVector = Icons.Filled.Search,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("球员查找")
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Dynamic action buttons based on sport type
        when (sportType) {
            "basketball" -> BasketballActions(
                homeTeamId = homeTeamId,
                awayTeamId = awayTeamId,
                homeTeamName = homeTeamName,
                awayTeamName = awayTeamName,
                onReportScore = onReportScore,
                onShowFoulDialog = onShowFoulDialog,
                onReportFoul = onReportFoul,
                onReportSubstitution = onReportSubstitution,
                onReportTimeout = onReportTimeout,
                onReportInjury = onReportInjury
            )
            
            "football" -> FootballActions(
                homeTeamId = homeTeamId,
                awayTeamId = awayTeamId,
                homeTeamName = homeTeamName,
                awayTeamName = awayTeamName,
                onReportScore = onReportScore,
                onReportYellowCard = onReportYellowCard,
                onReportRedCard = onReportRedCard,
                onReportSubstitution = onReportSubstitution,
                onReportCornerKick = onReportCornerKick,
                onReportOffside = onReportOffside,
                onReportInjury = onReportInjury
            )
            
            "volleyball" -> VolleyballActions(
                homeTeamId = homeTeamId,
                awayTeamId = awayTeamId,
                homeTeamName = homeTeamName,
                awayTeamName = awayTeamName,
                onReportScore = onReportScore,
                onShowFoulDialog = onShowFoulDialog,
                onReportFoul = onReportFoul,
                onReportSubstitution = onReportSubstitution,
                onReportTimeout = onReportTimeout,
                onReportInjury = onReportInjury
            )
            
            "badminton", "tennis", "table_tennis" -> RacquetSportActions(
                sportType = sportType,
                homeTeamId = homeTeamId,
                awayTeamId = awayTeamId,
                homeTeamName = homeTeamName,
                awayTeamName = awayTeamName,
                onReportScore = onReportScore,
                onShowFoulDialog = onShowFoulDialog,
                onReportFoul = onReportFoul,
                onReportSubstitution = onReportSubstitution,
                onReportSideChange = onReportSideChange,
                onReportInjury = onReportInjury
            )
            
            "swimming", "running" -> RaceActions(
                sportType = sportType
            )
        }
    }
}

@Composable
private fun BasketballActions(
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    onReportScore: (String, Int) -> Unit,
    onShowFoulDialog: (String) -> Unit,
    onReportFoul: (String, FoulType) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportTimeout: (String) -> Unit,
    onReportInjury: (String, String?) -> Unit
) {
    // Score buttons
    SectionTitle("得分操作")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 1,
            onClick = { onReportScore(homeTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 2,
            onClick = { onReportScore(homeTeamId, 2) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 3,
            onClick = { onReportScore(homeTeamId, 3) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 1,
            onClick = { onReportScore(awayTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 2,
            onClick = { onReportScore(awayTeamId, 2) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 3,
            onClick = { onReportScore(awayTeamId, 3) },
            modifier = Modifier.weight(1f)
        )
    }
    
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    
    // Other actions
    SectionTitle("其他操作")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队犯规",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队犯规",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "换人请求",
            icon = Icons.Filled.SwapHoriz,
            color = SubstitutionActionColor,
            onClick = { onReportSubstitution(homeTeamId, null, null) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "暂停请求",
            icon = Icons.Filled.Pause,
            color = TimeoutActionColor,
            onClick = { onReportTimeout(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "伤病报告",
            icon = Icons.Filled.LocalHospital,
            color = InjuryActionColor,
            onClick = { onReportInjury(homeTeamId, null) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "取消操作",
            icon = Icons.Filled.Cancel,
            color = CancelActionColor,
            onClick = { /* Cancel */ },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun FootballActions(
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    onReportScore: (String, Int) -> Unit,
    onReportYellowCard: (String) -> Unit,
    onReportRedCard: (String) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportCornerKick: (String) -> Unit,
    onReportOffside: (String) -> Unit,
    onReportInjury: (String, String?) -> Unit
) {
    // Score buttons (just 1 goal)
    SectionTitle("进球")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 1,
            label = "进球",
            onClick = { onReportScore(homeTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 1,
            label = "进球",
            onClick = { onReportScore(awayTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
    }
    
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    
    // Card actions
    SectionTitle("红黄牌")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队黄牌",
            icon = Icons.Filled.Square,
            color = Color(0xFFFFEB3B),
            onClick = { onReportYellowCard(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队黄牌",
            icon = Icons.Filled.Square,
            color = Color(0xFFFFEB3B),
            onClick = { onReportYellowCard(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队红牌",
            icon = Icons.Filled.Square,
            color = Color(0xFFF44336),
            onClick = { onReportRedCard(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队红牌",
            icon = Icons.Filled.Square,
            color = Color(0xFFF44336),
            onClick = { onReportRedCard(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    
    // Other actions
    SectionTitle("其他操作")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队角球",
            icon = Icons.Filled.SportsSoccer,
            color = ScoreActionColor,
            onClick = { onReportCornerKick(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队角球",
            icon = Icons.Filled.SportsSoccer,
            color = ScoreActionColor,
            onClick = { onReportCornerKick(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队越位",
            icon = Icons.Filled.Flag,
            color = FoulActionColor,
            onClick = { onReportOffside(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队越位",
            icon = Icons.Filled.Flag,
            color = FoulActionColor,
            onClick = { onReportOffside(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "换人请求",
            icon = Icons.Filled.SwapHoriz,
            color = SubstitutionActionColor,
            onClick = { onReportSubstitution(homeTeamId, null, null) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "伤病报告",
            icon = Icons.Filled.LocalHospital,
            color = InjuryActionColor,
            onClick = { onReportInjury(homeTeamId, null) },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun VolleyballActions(
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    onReportScore: (String, Int) -> Unit,
    onShowFoulDialog: (String) -> Unit,
    onReportFoul: (String, FoulType) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportTimeout: (String) -> Unit,
    onReportInjury: (String, String?) -> Unit
) {
    // Score buttons (just 1 point)
    SectionTitle("得分")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 1,
            label = "得分",
            onClick = { onReportScore(homeTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 1,
            label = "得分",
            onClick = { onReportScore(awayTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
    }
    
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    
    // Other actions
    SectionTitle("其他操作")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队犯规",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队犯规",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "换人请求",
            icon = Icons.Filled.SwapHoriz,
            color = SubstitutionActionColor,
            onClick = { onReportSubstitution(homeTeamId, null, null) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "暂停请求",
            icon = Icons.Filled.Pause,
            color = TimeoutActionColor,
            onClick = { onReportTimeout(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "伤病报告",
            icon = Icons.Filled.LocalHospital,
            color = InjuryActionColor,
            onClick = { onReportInjury(homeTeamId, null) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "取消操作",
            icon = Icons.Filled.Cancel,
            color = CancelActionColor,
            onClick = { /* Cancel */ },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun RacquetSportActions(
    sportType: String,
    homeTeamId: String,
    awayTeamId: String,
    homeTeamName: String,
    awayTeamName: String,
    onReportScore: (String, Int) -> Unit,
    onShowFoulDialog: (String) -> Unit,
    onReportFoul: (String, FoulType) -> Unit,
    onReportSubstitution: (String, String?, String?) -> Unit,
    onReportSideChange: () -> Unit,
    onReportInjury: (String, String?) -> Unit
) {
    val sportName = when (sportType) {
        "badminton" -> "羽毛球"
        "tennis" -> "网球"
        "table_tennis" -> "乒乓球"
        else -> "球类"
    }
    
    // Score buttons
    SectionTitle("得分")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ScoreButtonItem(
            teamName = homeTeamName,
            points = 1,
            label = "得分",
            onClick = { onReportScore(homeTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
        ScoreButtonItem(
            teamName = awayTeamName,
            points = 1,
            label = "得分",
            onClick = { onReportScore(awayTeamId, 1) },
            modifier = Modifier.weight(1f)
        )
    }
    
    HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    
    // Other actions
    SectionTitle("其他操作")
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "换边",
            icon = Icons.Filled.SwapHoriz,
            color = SubstitutionActionColor,
            onClick = onReportSideChange,
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "伤病报告",
            icon = Icons.Filled.LocalHospital,
            color = InjuryActionColor,
            onClick = { onReportInjury(homeTeamId, null) },
            modifier = Modifier.weight(1f)
        )
    }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        ActionButtonItem(
            text = "主队违例",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(homeTeamId) },
            modifier = Modifier.weight(1f)
        )
        ActionButtonItem(
            text = "客队违例",
            icon = Icons.Filled.Warning,
            color = FoulActionColor,
            onClick = { onShowFoulDialog(awayTeamId) },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun RaceActions(sportType: String) {
    val rule = SportRules.getRule(sportType)
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = rule.emoji,
                style = MaterialTheme.typography.displayLarge
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "${rule.displayName}比赛",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "竞速类项目由终点计时系统自动记录成绩",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "可上报特殊情况：",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ActionButtonItem(
                    text = "取消资格",
                    icon = Icons.Filled.Block,
                    color = CancelActionColor,
                    onClick = { /* Report DQ */ },
                    modifier = Modifier.weight(1f)
                )
                ActionButtonItem(
                    text = "退赛",
                    icon = Icons.Filled.ExitToApp,
                    color = CancelActionColor,
                    onClick = { /* Report withdraw */ },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
private fun ScoreButtonItem(
    teamName: String,
    points: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String = "+$points"
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(64.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = ScoreActionColor
        )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = teamName,
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.8f)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun ActionButtonItem(
    text: String,
    icon: ImageVector,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(56.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = color
        )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = Color.White
            )
        }
    }
}

/**
 * 犯规类型选择对话框
 * 显示从后端获取的犯规类型列表，包含名称、严重程度、处罚方式和描述
 */
@Composable
fun FoulTypeSelectionDialog(
    foulTypes: List<FoulType>,
    isLoading: Boolean,
    onFoulTypeSelected: (FoulType) -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "选择犯规类型",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 400.dp)
            ) {
                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (foulTypes.isEmpty()) {
                    Text(
                        text = "暂无犯规类型数据",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(foulTypes) { foulType ->
                            FoulTypeItem(
                                foulType = foulType,
                                onClick = { onFoulTypeSelected(foulType) }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

/**
 * 单个犯规类型项目
 */
@Composable
fun FoulTypeItem(
    foulType: FoulType,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = foulType.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                // 严重程度标签
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = foulType.severity.color.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = foulType.severity.displayName,
                        style = MaterialTheme.typography.labelSmall,
                        color = foulType.severity.color,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // 处罚方式
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.Info,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "处罚: ${foulType.penalty.getDisplayText()}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // 描述
            if (foulType.description.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = foulType.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
    }
}
