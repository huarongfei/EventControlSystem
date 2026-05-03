package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.eventcontrol.refereeapp.domain.model.Match
import kotlinx.coroutines.delay

@Composable
fun TimerScreen(
    match: Match?,
    onNavigateBack: () -> Unit,
    onPeriodChange: (Int) -> Unit,
    onTimerUpdate: (String) -> Unit,
    onMatchStatusChange: (String) -> Unit
) {
    var timerSeconds by remember { mutableStateOf(12 * 60) } // 默认12分钟
    var isRunning by remember { mutableStateOf(false) }
    var showTimeoutDialog by remember { mutableStateOf(false) }
    var showPeriodDialog by remember { mutableStateOf(false) }

    // 计时器逻辑
    LaunchedEffect(isRunning) {
        while (isRunning && timerSeconds > 0) {
            delay(1000)
            timerSeconds--
            val minutes = timerSeconds / 60
            val seconds = timerSeconds % 60
            onTimerUpdate(String.format("%02d:%02d", minutes, seconds))
        }
        if (timerSeconds == 0) {
            isRunning = false
            onMatchStatusChange("TIMEOUT")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
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
                text = "计时器",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (match == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("请先连接比赛")
            }
        } else {
            // 安全获取 match 引用
            val currentMatch = match!!

            // 比赛信息
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${currentMatch.homeTeam.name ?: "主队"} vs ${currentMatch.awayTeam.name ?: "客队"}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "第 ${currentMatch.period} 节",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // 计时器显示
            TimerDisplay(
                seconds = timerSeconds,
                isRunning = isRunning
            )

            Spacer(modifier = Modifier.height(32.dp))

            // 控制按钮
            TimerControls(
                isRunning = isRunning,
                onStart = { isRunning = true },
                onPause = { isRunning = false },
                onReset = {
                    isRunning = false
                    timerSeconds = 12 * 60
                    onTimerUpdate("12:00")
                },
                onTimeout = { showTimeoutDialog = true }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 节数控制
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "比赛节数",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        listOf(1, 2, 3, 4).forEach { period ->
                            PeriodButton(
                                period = period,
                                isSelected = currentMatch.period == period,
                                onClick = {
                                    onPeriodChange(period)
                                    showPeriodDialog = true
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 快捷时间设置
            QuickTimeButtons(
                onSetTime = { minutes ->
                    timerSeconds = minutes * 60
                    isRunning = false
                    onTimerUpdate(String.format("%02d:00", minutes))
                }
            )
        }
    }

    // 暂停对话框
    if (showTimeoutDialog) {
        TimeoutDialog(
            onDismiss = { showTimeoutDialog = false },
            onConfirm = {
                isRunning = false
                showTimeoutDialog = false
            }
        )
    }

    // 节数切换对话框
    if (showPeriodDialog) {
        PeriodConfirmDialog(
            period = match?.period ?: 1,
            onDismiss = { showPeriodDialog = false },
            onConfirm = {
                timerSeconds = 12 * 60
                onTimerUpdate("12:00")
                showPeriodDialog = false
            }
        )
    }
}

@Composable
private fun TimerDisplay(
    seconds: Int,
    isRunning: Boolean
) {
    val minutes = seconds / 60
    val secs = seconds % 60

    Box(
        modifier = Modifier
            .size(240.dp)
            .clip(CircleShape)
            .background(
                if (isRunning)
                    MaterialTheme.colorScheme.primaryContainer
                else
                    MaterialTheme.colorScheme.surfaceVariant
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = String.format("%02d:%02d", minutes, secs),
                fontSize = 64.sp,
                fontWeight = FontWeight.Bold,
                color = if (seconds <= 30)
                    MaterialTheme.colorScheme.error
                else
                    MaterialTheme.colorScheme.onSurface
            )
            if (isRunning) {
                Text(
                    text = "比赛中",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun TimerControls(
    isRunning: Boolean,
    onStart: () -> Unit,
    onPause: () -> Unit,
    onReset: () -> Unit,
    onTimeout: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        // 重置按钮
        TimerActionButton(
            text = "重置",
            icon = Icons.Default.Refresh,
            color = MaterialTheme.colorScheme.surfaceVariant,
            contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
            onClick = onReset
        )

        // 开始/暂停按钮
        Button(
            onClick = if (isRunning) onPause else onStart,
            modifier = Modifier.size(80.dp),
            shape = CircleShape,
            colors = ButtonDefaults.buttonColors(
                containerColor = if (isRunning)
                    MaterialTheme.colorScheme.error
                else
                    MaterialTheme.colorScheme.primary
            )
        ) {
            Icon(
                if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = if (isRunning) "暂停" else "开始",
                modifier = Modifier.size(40.dp)
            )
        }

        // 暂停按钮（暂停比赛）
        TimerActionButton(
            text = "暂停",
            icon = Icons.Default.Stop,
            color = MaterialTheme.colorScheme.errorContainer,
            contentColor = MaterialTheme.colorScheme.error,
            onClick = onTimeout
        )
    }
}

@Composable
private fun TimerActionButton(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    contentColor: Color,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        OutlinedButton(
            onClick = onClick,
            modifier = Modifier.size(56.dp),
            shape = CircleShape,
            contentPadding = PaddingValues(0.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = contentColor)
        ) {
            Icon(icon, contentDescription = text)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun PeriodButton(
    period: Int,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = { Text("第${period}节") },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = MaterialTheme.colorScheme.primary,
            selectedLabelColor = Color.White
        )
    )
}

@Composable
private fun QuickTimeButtons(
    onSetTime: (Int) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "快速设置",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                listOf(
                    Pair("24秒", 24),
                    Pair("14秒", 14),
                    Triple("1分钟", 1, MaterialTheme.colorScheme.primary),
                    Triple("2分钟", 2, MaterialTheme.colorScheme.secondary)
                ).forEach { item ->
                    when (item) {
                        is Pair<*, *> -> {
                            OutlinedButton(
                                onClick = {
                                    val seconds = (item.second as? Int) ?: 0
                                    onSetTime(seconds * 60)
                                },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(item.first.toString())
                            }
                        }
                        is Triple<*, *, *> -> {
                            val minutes = (item.second as? Int) ?: 0
                            val buttonColor = (item.third as? Color) ?: MaterialTheme.colorScheme.primary
                            Button(
                                onClick = { onSetTime(minutes * 60) },
                                colors = ButtonDefaults.buttonColors(containerColor = buttonColor),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text(item.first.toString())
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TimeoutDialog(
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("比赛暂停") },
        text = { Text("确定要暂停比赛吗？") },
        confirmButton = {
            Button(onClick = onConfirm) {
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

@Composable
private fun PeriodConfirmDialog(
    period: Int,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("切换到第 ${period} 节") },
        text = { Text("计时器将重置为 12:00") },
        confirmButton = {
            Button(onClick = onConfirm) {
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
