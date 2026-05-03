package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.eventcontrol.refereeapp.domain.model.EventType

@Composable
fun FoulScreen(
    match: Match?,
    matchEvents: List<MatchEvent>,
    isLoading: Boolean,
    onRecordFoul: (teamId: String, teamName: String, playerName: String, foulType: String) -> Unit,
    onNavigateBack: () -> Unit
) {
    var showFoulDialog by remember { mutableStateOf(false) }
    var selectedTeam by remember { mutableStateOf<Pair<String, String>?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // 标题栏
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onNavigateBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "返回")
            }
            Text(
                text = "犯规记录",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (match == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("请先连接比赛")
            }
        } else {
            // 安全获取 match 引用
            val currentMatch = match

            // 犯规按钮区
            Text(
                text = "记录犯规",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                FoulTeamCard(
                    teamName = currentMatch.homeTeam.name,
                    teamId = currentMatch.homeTeam.id,
                    onClick = {
                        selectedTeam = Pair(currentMatch.homeTeam.id, currentMatch.homeTeam.name)
                        showFoulDialog = true
                    },
                    modifier = Modifier.weight(1f)
                )
                FoulTeamCard(
                    teamName = currentMatch.awayTeam.name,
                    teamId = currentMatch.awayTeam.id,
                    onClick = {
                        selectedTeam = Pair(currentMatch.awayTeam.id, currentMatch.awayTeam.name)
                        showFoulDialog = true
                    },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 犯规统计
            FoulStatistics(
                match = currentMatch,
                foulEvents = matchEvents.filter { it.type == EventType.FOUL }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 犯规记录列表
            Text(
                text = "犯规记录",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))

            val foulEvents = matchEvents.filter { it.type == EventType.FOUL }
            if (foulEvents.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = Color(0xFF4CAF50).copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "暂无犯规记录",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(foulEvents) { event ->
                        FoulEventItem(event, currentMatch)
                    }
                }
            }
        }
    }

    // 犯规对话框
    if (showFoulDialog) {
        selectedTeam?.let { team ->
            FoulRecordDialog(
                teamName = team.second,
                onDismiss = { showFoulDialog = false },
                onConfirm = { playerName, foulType ->
                    onRecordFoul(team.first, team.second, playerName, foulType)
                    showFoulDialog = false
                }
            )
        }
    }
}

@Composable
private fun FoulTeamCard(
    teamName: String,
    teamId: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = teamName,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "点击记录犯规",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun FoulStatistics(
    match: Match,
    foulEvents: List<MatchEvent>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "犯规统计",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                FoulStatItem(
                    teamName = match.homeTeam.name,
                    foulCount = foulEvents.count { it.teamId == match.homeTeam.id }
                )
                FoulStatItem(
                    teamName = match.awayTeam.name,
                    foulCount = foulEvents.count { it.teamId == match.awayTeam.id }
                )
            }
        }
    }
}

@Composable
private fun FoulStatItem(teamName: String, foulCount: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = teamName,
            style = MaterialTheme.typography.bodyMedium
        )
        Text(
            text = foulCount.toString(),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = if (foulCount >= 5) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
        )
        Text(
            text = "次犯规",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun FoulEventItem(event: MatchEvent, match: Match) {
    val teamName = if (event.teamId == match.homeTeam.id) {
        match.homeTeam.name ?: "主队"
    } else {
        match.awayTeam.name ?: "客队"
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Warning,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "$teamName - ${event.foulType ?: "犯规"}",
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Medium
                    )
                    event.playerName?.let {
                        Text(
                            text = "球员: $it",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            Text(
                text = formatTime(event.timestamp),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun FoulRecordDialog(
    teamName: String,
    onDismiss: () -> Unit,
    onConfirm: (playerName: String, foulType: String) -> Unit
) {
    var playerName by remember { mutableStateOf("") }
    var selectedFoulType by remember { mutableStateOf("个人犯规") }
    val foulTypes = listOf("个人犯规", "技术犯规", "违体犯规", "双方犯规", "夺权犯规")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("$teamName 犯规记录") },
        text = {
            Column {
                OutlinedTextField(
                    value = playerName,
                    onValueChange = { playerName = it },
                    label = { Text("球员姓名") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "犯规类型",
                    style = MaterialTheme.typography.labelLarge
                )
                Spacer(modifier = Modifier.height(8.dp))
                foulTypes.forEach { foul ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedFoulType == foul,
                            onClick = { selectedFoulType = foul }
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(foul)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val name = playerName.ifBlank { "未知球员" }
                    onConfirm(name, selectedFoulType)
                }
            ) {
                Text("确认")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

private fun formatTime(timestamp: Long): String {
    val sdf = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
    return sdf.format(java.util.Date(timestamp))
}
