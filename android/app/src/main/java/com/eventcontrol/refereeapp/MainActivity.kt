package com.eventcontrol.refereeapp

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.activity.compose.BackHandler
import com.eventcontrol.refereeapp.ui.screens.HistoryScreen
import com.eventcontrol.refereeapp.ui.screens.MainScreen
import com.eventcontrol.refereeapp.ui.screens.PairingScreen
import com.eventcontrol.refereeapp.ui.screens.ScoreScreen
import com.eventcontrol.refereeapp.ui.screens.FoulScreen
import com.eventcontrol.refereeapp.ui.screens.TimerScreen
import com.eventcontrol.refereeapp.ui.theme.RefereeAppTheme
import com.eventcontrol.refereeapp.viewmodel.RefereeViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 根据 Android 版本决定是否启用 Edge-to-Edge
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            enableEdgeToEdge()
        }
        
        setContent {
            RefereeAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RefereeApp(viewModel = viewModel())
                }
            }
        }
    }
}

enum class Screen {
    MAIN,
    PAIRING,
    HISTORY,
    SCORE,
    FOUL,
    TIMER
}

@Composable
fun RefereeApp(viewModel: RefereeViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val events by viewModel.events.collectAsState()
    val matchEvents by viewModel.matchEvents.collectAsState()
    val connectionStatus by viewModel.connectionStatus.collectAsState()
    val connectionError by viewModel.connectionError.collectAsState()

    // 屏幕返回栈，支持手势导航和返回键
    var currentScreen by remember { mutableStateOf(Screen.MAIN) }
    var screenStack by remember { mutableStateOf(listOf(Screen.MAIN)) }

    // 服务器地址状态
    var serverAddress by remember { mutableStateOf("http://10.0.2.2:3001") }

    // 格式化 URL 确保有正确的协议前缀
    fun formatServerUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.isEmpty() -> ""
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            else -> "http://$trimmed"
        }
    }

    // 导航到指定屏幕
    fun navigateTo(screen: Screen) {
        if (screen != currentScreen) {
            // 保存当前屏幕到栈
            if (screenStack.lastOrNull() != currentScreen) {
                screenStack = screenStack + currentScreen
            }
            currentScreen = screen
        }
    }

    // 返回上一页
    fun navigateBack() {
        if (screenStack.isNotEmpty()) {
            currentScreen = screenStack.last()
            screenStack = screenStack.dropLast(1)
        }
    }

    // 处理系统返回键
    BackHandler(enabled = currentScreen != Screen.MAIN) {
        navigateBack()
    }

    when (currentScreen) {
        Screen.MAIN -> {
            MainScreen(
                match = uiState.currentMatch,
                connectionStatus = connectionStatus,
                isLoading = uiState.isLoading,
                error = uiState.error,
                onNavigateToScore = { navigateTo(Screen.SCORE) },
                onNavigateToFoul = { navigateTo(Screen.FOUL) },
                onNavigateToTimer = { navigateTo(Screen.TIMER) },
                onNavigateToPairing = { navigateTo(Screen.PAIRING) },
                onNavigateToHistory = { navigateTo(Screen.HISTORY) }
            )
        }

        Screen.SCORE -> {
            ScoreScreen(
                match = uiState.currentMatch,
                matchEvents = matchEvents,
                isLoading = uiState.isLoading,
                error = uiState.error,
                onHomeScore = { points -> viewModel.addHomeScore(points) },
                onAwayScore = { points -> viewModel.addAwayScore(points) },
                onNavigateToFoul = { navigateTo(Screen.FOUL) },
                onNavigateToTimer = { navigateTo(Screen.TIMER) }
            )
        }

        Screen.FOUL -> {
            FoulScreen(
                match = uiState.currentMatch,
                matchEvents = matchEvents,
                isLoading = uiState.isLoading,
                onRecordFoul = { teamId, teamName, playerName, foulType ->
                    viewModel.recordFoul(teamId, teamName, playerName, foulType)
                },
                onNavigateBack = { navigateBack() }
            )
        }

        Screen.TIMER -> {
            TimerScreen(
                match = uiState.currentMatch,
                onNavigateBack = { navigateBack() },
                onPeriodChange = { period -> viewModel.setPeriod(period) },
                onTimerUpdate = { time -> viewModel.updateTimer(time) },
                onMatchStatusChange = { /* 状态变更处理 */ }
            )
        }

        Screen.PAIRING -> {
            PairingScreen(
                serverAddress = serverAddress,
                events = events,
                selectedEvent = uiState.selectedEvent,
                isLoading = uiState.isLoading,
                error = uiState.error,
                connectionStatus = connectionStatus,
                connectionError = connectionError,
                onServerAddressChange = { serverAddress = formatServerUrl(it) },
                onConnect = {
                    val formattedUrl = formatServerUrl(serverAddress)
                    if (formattedUrl.isNotEmpty()) {
                        viewModel.connectToServer(formattedUrl)
                    }
                },
                onLoadEvents = { viewModel.loadEvents() },
                onSelectEvent = { event ->
                    viewModel.selectEvent(event)
                    event.matches.firstOrNull()?.let { match ->
                        viewModel.loadMatch(match.id)
                        navigateTo(Screen.MAIN)
                    }
                },
                onSelectMatch = { match ->
                    viewModel.loadMatch(match.id)
                    navigateTo(Screen.MAIN)
                },
                onNavigateBack = { navigateBack() }
            )
        }

        Screen.HISTORY -> {
            HistoryScreen(
                matchEvents = matchEvents,
                offlineCount = 0,
                onSync = { viewModel.syncOfflineData() },
                onNavigateBack = { navigateBack() }
            )
        }
    }
}