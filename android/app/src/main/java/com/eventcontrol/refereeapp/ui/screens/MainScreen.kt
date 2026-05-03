package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.viewmodel.ConnectionStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    match: Match?,
    connectionStatus: ConnectionStatus,
    isLoading: Boolean,
    error: String?,
    onNavigateToScore: () -> Unit,
    onNavigateToFoul: () -> Unit,
    onNavigateToTimer: () -> Unit,
    onNavigateToPairing: () -> Unit,
    onNavigateToHistory: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("裁判端") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                ),
                actions = {
                    ConnectionIndicator(connectionStatus)
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Score, contentDescription = null) },
                    label = { Text("计分") },
                    selected = false,
                    onClick = onNavigateToScore
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Warning, contentDescription = null) },
                    label = { Text("犯规") },
                    selected = false,
                    onClick = onNavigateToFoul
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Timer, contentDescription = null) },
                    label = { Text("计时") },
                    selected = false,
                    onClick = onNavigateToTimer
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Link, contentDescription = null) },
                    label = { Text("配对") },
                    selected = false,
                    onClick = onNavigateToPairing
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.History, contentDescription = null) },
                    label = { Text("历史") },
                    selected = false,
                    onClick = onNavigateToHistory
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (match == null) {
                NoMatchPlaceholder(onNavigateToPairing)
            } else {
                // 比赛信息卡片
                MatchInfoCard(
                    match = match,
                    modifier = Modifier.padding(16.dp)
                )

                // 快捷功能入口
                QuickActionsGrid(
                    onNavigateToScore = onNavigateToScore,
                    onNavigateToFoul = onNavigateToFoul,
                    onNavigateToTimer = onNavigateToTimer,
                    modifier = Modifier.padding(16.dp)
                )
            }

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            error?.let {
                Snackbar(modifier = Modifier.padding(16.dp)) {
                    Text(it)
                }
            }
        }
    }
}

@Composable
private fun MatchInfoCard(match: Match, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = match.homeTeam.name ?: "主队",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "第 ${match.period} 节 · ${match.periodTime ?: "12:00"}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun QuickActionsGrid(
    onNavigateToScore: () -> Unit,
    onNavigateToFoul: () -> Unit,
    onNavigateToTimer: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "快捷操作",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionCard(
                title = "计分",
                subtitle = "记录得分",
                icon = Icons.Default.Score,
                color = MaterialTheme.colorScheme.primary,
                onClick = onNavigateToScore,
                modifier = Modifier.weight(1f)
            )
            QuickActionCard(
                title = "犯规",
                subtitle = "记录犯规",
                icon = Icons.Default.Warning,
                color = MaterialTheme.colorScheme.error,
                onClick = onNavigateToFoul,
                modifier = Modifier.weight(1f)
            )
            QuickActionCard(
                title = "计时",
                subtitle = "比赛计时",
                icon = Icons.Default.Timer,
                color = MaterialTheme.colorScheme.secondary,
                onClick = onNavigateToTimer,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun QuickActionCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = color.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun NoMatchPlaceholder(onNavigateToPairing: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.SportsBasketball,
            contentDescription = null,
            modifier = Modifier.size(96.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "未连接比赛",
            style = MaterialTheme.typography.headlineSmall,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "请先连接服务器并选择比赛",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onNavigateToPairing) {
            Icon(Icons.Default.Link, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("去连接")
        }
    }
}

@Composable
fun ConnectionIndicator(status: ConnectionStatus) {
    val (color, icon) = when (status) {
        ConnectionStatus.CONNECTED -> androidx.compose.ui.graphics.Color(0xFF4CAF50) to Icons.Default.Wifi
        ConnectionStatus.CONNECTING -> androidx.compose.ui.graphics.Color(0xFFFF9800) to Icons.Default.Sync
        ConnectionStatus.DISCONNECTED -> androidx.compose.ui.graphics.Color(0xFF9E9E9E) to Icons.Default.WifiOff
        ConnectionStatus.ERROR -> androidx.compose.ui.graphics.Color(0xFFF44336) to Icons.Default.Error
    }

    Icon(
        icon,
        contentDescription = "连接状态",
        tint = color,
        modifier = Modifier.padding(8.dp)
    )
}
