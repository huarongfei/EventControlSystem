/**
 * EventControlSystem - Android Referee App
 * 
 * Author: Huafeirong (https://github.com/huarongfei)
 * Project: https://github.com/huarongfei/EventControlSystem
 * Copyright © 2026 Huafeirong. All rights reserved.
 */

package com.eventcontrol.refereeapp

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.eventcontrol.refereeapp.domain.model.SportRules
import com.eventcontrol.refereeapp.ui.components.ConnectionStatusIndicator
import com.eventcontrol.refereeapp.ui.components.ScoreCard
import com.eventcontrol.refereeapp.ui.components.SwipeBackContainer
import com.eventcontrol.refereeapp.ui.screens.*
import com.eventcontrol.refereeapp.ui.theme.RefereeAppTheme
import com.eventcontrol.refereeapp.ui.theme.OfflineWarning
import com.eventcontrol.refereeapp.viewmodel.ConnectionState
import com.eventcontrol.refereeapp.viewmodel.RefereeViewModel
import com.eventcontrol.refereeapp.viewmodel.SyncState

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 根据 Android 版本决定是否启用 Edge-to-Edge
        // Android 15 (API 35) 及以上默认启用预测性返回手势
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            enableEdgeToEdge()
        }
        
        setContent {
            RefereeAppTheme(darkTheme = true) {
                RefereeApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RefereeApp(
    viewModel: RefereeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val connectionState by viewModel.connectionState.collectAsState()
    val currentMatch by viewModel.currentMatch.collectAsState()
    val matchEvents by viewModel.matchEvents.collectAsState()
    val offlineEvents by viewModel.offlineEvents.collectAsState()
    val pendingSyncCount by viewModel.pendingSyncCount.collectAsState()
    val syncState by viewModel.syncState.collectAsState()
    val matchList by viewModel.matchList.collectAsState()
    val foulTypes by viewModel.foulTypes.collectAsState()
    val foulTypesLoading by viewModel.foulTypesLoading.collectAsState()

    // 默认使用模拟器地址，真机使用时用户需要修改为实际IP
    var serverUrl by remember { mutableStateOf("http://10.0.2.2:3001") }
    var matchCode by remember { mutableStateOf("") }
    
    var showScoreDialog by remember { mutableStateOf(false) }
    var showFoulDialog by remember { mutableStateOf(false) }
    var showSubstitutionDialog by remember { mutableStateOf(false) }
    var showPlayerSearchDialog by remember { mutableStateOf(false) }
    
    var pendingTeamId by remember { mutableStateOf("") }
    var pendingPoints by remember { mutableIntStateOf(0) }
    var pendingFoulType by remember { mutableStateOf("普通犯规") }

    val isConnected = uiState.isConnected

    // 显示确认退出对话框
    var showExitConfirmDialog by remember { mutableStateOf(false) }

    // 处理返回按钮和滑动返回
    val context = LocalContext.current
    BackHandler {
        if (isConnected) {
            showExitConfirmDialog = true
        } else {
            // 未连接时直接退出 — 通过 Context 获取 Activity 并 finish()
            (context as? android.app.Activity)?.finish()
        }
    }

    // 退出确认对话框
    if (showExitConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showExitConfirmDialog = false },
            title = { Text("确认退出") },
            text = { Text(if (isConnected) "是否断开连接并返回连接页面？" else "是否退出应用？") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showExitConfirmDialog = false
                        if (isConnected) {
                            viewModel.disconnect()
                        }
                    }
                ) {
                    Text("确认")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExitConfirmDialog = false }) {
                    Text("取消")
                }
            }
        )
    }

    // 格式化 URL 确保有正确的协议前缀
    fun formatServerUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.isEmpty() -> ""
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            else -> "http://$trimmed"
        }
    }

    // 滑动返回容器
    SwipeBackContainer(
        onBackPressed = {
            if (isConnected) {
                showExitConfirmDialog = true
            }
        },
        enabled = true
    ) {
        if (isConnected && currentMatch != null) {
        MainContent(
            viewModel = viewModel,
            currentMatch = currentMatch!!,
            matchEvents = matchEvents,
            foulTypes = foulTypes,
            isFoulTypesLoading = foulTypesLoading,
            isOfflineMode = uiState.isOfflineMode,
            pendingSyncCount = pendingSyncCount,
            syncState = syncState,
            showScoreDialog = showScoreDialog,
            showFoulDialog = showFoulDialog,
            showSubstitutionDialog = showSubstitutionDialog,
            showPlayerSearchDialog = showPlayerSearchDialog,
            pendingTeamId = pendingTeamId,
            pendingPoints = pendingPoints,
            pendingFoulType = pendingFoulType,
            onDismissScoreDialog = { showScoreDialog = false },
            onDismissFoulDialog = { showFoulDialog = false },
            onDismissSubstitutionDialog = { showSubstitutionDialog = false },
            onDismissPlayerSearchDialog = { showPlayerSearchDialog = false },
            onConfirmScore = { playerId ->
                viewModel.reportScore(pendingTeamId, pendingPoints, playerId)
                showScoreDialog = false
            },
            onConfirmFoul = { playerId, foulType ->
                viewModel.reportFoul(pendingTeamId, playerId, foulType)
                showFoulDialog = false
            },
            onConfirmSubstitution = { playerIn, playerOut ->
                viewModel.reportSubstitution(pendingTeamId, playerIn, playerOut)
                showSubstitutionDialog = false
            },
            onRequestScore = { teamId, points ->
                pendingTeamId = teamId
                pendingPoints = points
                showScoreDialog = true
            },
            onRequestFoul = { teamId ->
                pendingTeamId = teamId
                showFoulDialog = true
            },
            onRequestSubstitution = { teamId ->
                pendingTeamId = teamId
                showSubstitutionDialog = true
            },
            onRequestPlayerSearch = {
                showPlayerSearchDialog = true
            },
            onPlayerSelectedForFoul = { teamId ->
                pendingTeamId = teamId
                showFoulDialog = true
            }
        )
    } else {
        // Pairing screen
        PairingScreen(
            serverUrl = serverUrl,
            matchCode = matchCode,
            connectionState = connectionState,
            isLoading = uiState.isLoading,
            error = uiState.error,
            matchList = matchList,
            onServerUrlChange = { serverUrl = formatServerUrl(it) },
            onMatchCodeChange = { matchCode = it },
            onConnect = { 
                val formattedUrl = formatServerUrl(serverUrl)
                if (formattedUrl.isNotEmpty() && matchCode.isNotBlank()) {
                    viewModel.connectToMatch(matchCode, formattedUrl)
                }
            },
            onLoadMatches = {
                val formattedUrl = formatServerUrl(serverUrl)
                if (formattedUrl.isNotEmpty()) {
                    viewModel.initialize(formattedUrl)
                    viewModel.loadMatches()
                }
            },
            onMatchSelected = { matchId ->
                matchCode = matchId
                val formattedUrl = formatServerUrl(serverUrl)
                if (formattedUrl.isNotEmpty()) {
                    viewModel.connectToMatch(matchId, formattedUrl)
                }
            }
        )
    }
    } // 结束 SwipeBackContainer
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainContent(
    viewModel: RefereeViewModel,
    currentMatch: com.eventcontrol.refereeapp.domain.model.Match,
    matchEvents: List<com.eventcontrol.refereeapp.domain.model.MatchEvent>,
    foulTypes: List<com.eventcontrol.refereeapp.domain.model.FoulType>,
    isFoulTypesLoading: Boolean,
    isOfflineMode: Boolean,
    pendingSyncCount: Int,
    syncState: SyncState,
    showScoreDialog: Boolean,
    showFoulDialog: Boolean,
    showSubstitutionDialog: Boolean,
    showPlayerSearchDialog: Boolean,
    pendingTeamId: String,
    pendingPoints: Int,
    pendingFoulType: String,
    onDismissScoreDialog: () -> Unit,
    onDismissFoulDialog: () -> Unit,
    onDismissSubstitutionDialog: () -> Unit,
    onDismissPlayerSearchDialog: () -> Unit,
    onConfirmScore: (String?) -> Unit,
    onConfirmFoul: (String?, String) -> Unit,
    onConfirmSubstitution: (String?, String?) -> Unit,
    onRequestScore: (String, Int) -> Unit,
    onRequestFoul: (String) -> Unit,
    onRequestSubstitution: (String) -> Unit,
    onRequestPlayerSearch: () -> Unit,
    onPlayerSelectedForFoul: (String) -> Unit
) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("裁判端") },
                actions = {
                    ConnectionStatusIndicator(isOnline = !isOfflineMode)
                    Spacer(modifier = Modifier.width(8.dp))
                    if (pendingSyncCount > 0) {
                        Badge(
                            containerColor = OfflineWarning
                        ) {
                            Text(pendingSyncCount.toString())
                        }
                        IconButton(onClick = { viewModel.syncOfflineEvents() }) {
                            Icon(
                                imageVector = Icons.Filled.CloudUpload,
                                contentDescription = "同步"
                            )
                        }
                    }
                }
            )
        },
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
            // Offline banner
            if (isOfflineMode) {
                OfflineModeBanner()
            }
            
            // Sync status banner
            when (syncState) {
                SyncState.SYNCING -> {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }
                SyncState.SUCCESS -> {
                    Surface(
                        color = Color(0xFF4CAF50),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "同步完成",
                            modifier = Modifier.padding(8.dp),
                            color = Color.White
                        )
                    }
                }
                SyncState.FAILED -> {
                    Surface(
                        color = Color(0xFFF44336),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "同步失败，请重试",
                            modifier = Modifier.padding(8.dp),
                            color = Color.White
                        )
                    }
                }
                else -> {}
            }

            when (selectedTabIndex) {
                0 -> MatchStatusPage(currentMatch = currentMatch)
                1 -> OperationPage(
                    sportType = currentMatch.sportType,
                    onReportScore = { teamId, points -> onRequestScore(teamId, points) },
                    onReportFoul = { teamId, foulType ->
                        viewModel.reportFoul(teamId, "", foulType.code)
                    },
                    onShowFoulDialog = { teamId -> onRequestFoul(teamId) },
                    onReportSubstitution = { teamId, _, _ -> onRequestSubstitution(teamId) },
                    onReportTimeout = { viewModel.reportTimeout(it) },
                    onReportInjury = { teamId, playerId -> viewModel.reportInjury(teamId, playerId) },
                    onReportYellowCard = { teamId -> viewModel.reportCard(teamId, "yellow_card") },
                    onReportRedCard = { teamId -> viewModel.reportCard(teamId, "red_card") },
                    onReportCornerKick = { teamId -> viewModel.reportCornerKick(teamId) },
                    onReportOffside = { teamId -> viewModel.reportOffside(teamId) },
                    onReportSideChange = { viewModel.reportSideChange() },
                    homeTeamId = currentMatch.homeTeam.id,
                    awayTeamId = currentMatch.awayTeam.id,
                    homeTeamName = currentMatch.homeTeam.shortName,
                    awayTeamName = currentMatch.awayTeam.shortName,
                    onOpenPlayerSearch = onRequestPlayerSearch
                )
                2 -> HistoryScreen(events = matchEvents)
            }
        }
    }

    // Dialogs
    if (showScoreDialog) {
        val team = if (pendingTeamId == currentMatch.homeTeam.id) currentMatch.homeTeam else currentMatch.awayTeam
        ScoreConfirmDialog(
            teamName = team.shortName,
            points = pendingPoints,
            players = team.players,
            onDismiss = onDismissScoreDialog,
            onConfirm = onConfirmScore
        )
    }
    
    if (showFoulDialog) {
        FoulTypeSelectionDialog(
            foulTypes = foulTypes,
            isLoading = isFoulTypesLoading,
            onFoulTypeSelected = { foulType ->
                viewModel.reportFoul(pendingTeamId, null, foulType.code)
                onDismissFoulDialog()
            },
            onDismiss = onDismissFoulDialog
        )
    }
    
    if (showSubstitutionDialog) {
        val team = if (pendingTeamId == currentMatch.homeTeam.id) currentMatch.homeTeam else currentMatch.awayTeam
        SubstitutionConfirmDialog(
            teamName = team.shortName,
            players = team.players,
            onDismiss = onDismissSubstitutionDialog,
            onConfirm = onConfirmSubstitution
        )
    }

    if (showPlayerSearchDialog) {
        PlayerSearchDialog(
            homeTeam = currentMatch.homeTeam,
            awayTeam = currentMatch.awayTeam,
            onDismiss = onDismissPlayerSearchDialog,
            onPlayerSelected = { player ->
                // Find the player's team and trigger foul dialog via callback
                val team = if (currentMatch.homeTeam.players.any { it.id == player.id })
                    currentMatch.homeTeam else currentMatch.awayTeam
                onDismissPlayerSearchDialog()
                onPlayerSelectedForFoul(team.id)
            }
        )
    }
}

@Composable
private fun MatchStatusPage(
    currentMatch: com.eventcontrol.refereeapp.domain.model.Match
) {
    val rule = currentMatch.getSportRule()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        ScoreCard(
            match = currentMatch,
            lastUpdated = System.currentTimeMillis(),
            isOnline = true
        )

        // 节次 & 倒计时信息卡片
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 根据运动类型显示节次
                val periodDisplay = when (rule.category) {
                    "race" -> rule.periodNames.getOrNull(0) ?: "决赛"
                    else -> currentMatch.getCurrentPeriodName()
                }
                MatchInfoItem(label = "当前节", value = periodDisplay)
                VerticalDivider(modifier = Modifier.height(40.dp))
                // 根据运动类型显示时间或比分
                val timeDisplay = if (rule.periodGoal > 0) {
                    "${currentMatch.homeScore}:${currentMatch.awayScore}"
                } else {
                    currentMatch.matchTime
                }
                MatchInfoItem(
                    label = if (rule.periodGoal > 0) "比分" else "比赛时间",
                    value = timeDisplay
                )
                VerticalDivider(modifier = Modifier.height(40.dp))
                MatchInfoItem(
                    label = "状态",
                    value = when (currentMatch.status) {
                        "not_started" -> "未开始"
                        "running" -> "进行中"
                        "paused" -> "暂停"
                        "finished" -> "已结束"
                        else -> currentMatch.status
                    }
                )
            }
        }

        // 比赛信息卡片
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "赛事信息",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${rule.emoji} ${rule.displayName}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("主队", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(currentMatch.homeTeam.name, style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium)
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("客队", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(currentMatch.awayTeam.name, style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium)
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("赛事", style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(currentMatch.eventName, style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium)
                }
                // 显示得分制目标（如果有）
                if (rule.periodGoal > 0) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("目标分", style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("${rule.periodGoal} 分", style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}

@Composable
private fun MatchInfoItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
