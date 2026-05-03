package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.eventcontrol.refereeapp.domain.model.EventType
import com.eventcontrol.refereeapp.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    events: List<MatchEvent>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "事件历史",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            if (events.isNotEmpty()) {
                Text(
                    text = "共 ${events.size} 条",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))

        if (events.isEmpty()) {
            EmptyHistoryView(modifier = Modifier.weight(1f))
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(
                    items = events.sortedByDescending { it.timestamp },
                    key = { it.id }
                ) { event ->
                    EventHistoryItem(event = event)
                }
            }
        }
    }
}

@Composable
private fun EmptyHistoryView(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Filled.History,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "暂无事件记录",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "您的操作将显示在这里",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
            )
        }
    }
}

@Composable
private fun EventHistoryItem(
    event: MatchEvent,
    modifier: Modifier = Modifier
) {
    val dateFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }
    
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (event.isSynced)
                MaterialTheme.colorScheme.surfaceVariant
            else
                OfflineWarning.copy(alpha = 0.15f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Event type icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .padding(4.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = getEventIcon(event.type),
                    contentDescription = null,
                    tint = getEventColor(event.type),
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Event details
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = getEventTitle(event),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = getEventDetail(event),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Timestamp and sync status
            Column(
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = dateFormat.format(Date(event.timestamp)),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                SyncStatusBadge(isSynced = event.isSynced)
            }
        }
    }
}

@Composable
private fun SyncStatusBadge(isSynced: Boolean) {
    Surface(
        shape = RoundedCornerShape(4.dp),
        color = if (isSynced) 
            OnlineGreen.copy(alpha = 0.2f)
        else
            OfflineWarning.copy(alpha = 0.2f)
    ) {
        Text(
            text = if (isSynced) "已同步" else "待同步",
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
            style = MaterialTheme.typography.labelSmall,
            color = if (isSynced) OnlineGreen else OfflineWarning
        )
    }
}

private fun getEventIcon(type: EventType): androidx.compose.ui.graphics.vector.ImageVector {
    return when (type) {
        EventType.SCORE -> Icons.Filled.TrendingUp
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
        EventType.FOUL -> FoulActionColor
        EventType.SUBSTITUTION -> SubstitutionActionColor
        EventType.TIMEOUT -> TimeoutActionColor
        EventType.INJURY -> InjuryActionColor
        EventType.CANCEL -> CancelActionColor
        EventType.YELLOW_CARD -> Color(0xFFFFEB3B)
        EventType.RED_CARD -> Color(0xFFF44336)
        EventType.CORNER_KICK -> ScoreActionColor
        EventType.OFFSIDE -> FoulActionColor
        EventType.SIDE_CHANGE -> SubstitutionActionColor
        EventType.FINISH -> ScoreActionColor
        EventType.DQ, EventType.WITHDRAW -> CancelActionColor
    }
}

private fun getEventTitle(event: MatchEvent): String {
    return when (event.type) {
        EventType.SCORE -> {
            val points = event.detail?.get("points")?.toString()?.toIntOrNull() ?: 0
            "得分 +$points"
        }
        EventType.FOUL -> "犯规"
        EventType.SUBSTITUTION -> "换人"
        EventType.TIMEOUT -> "暂停"
        EventType.INJURY -> "伤病"
        EventType.CANCEL -> "取消"
        EventType.YELLOW_CARD -> "黄牌"
        EventType.RED_CARD -> "红牌"
        EventType.CORNER_KICK -> "角球"
        EventType.OFFSIDE -> "越位"
        EventType.SIDE_CHANGE -> "换边"
        EventType.FINISH -> "完赛"
        EventType.DQ -> "取消资格"
        EventType.WITHDRAW -> "退赛"
    }
}

private fun getEventDetail(event: MatchEvent): String {
    return when (event.type) {
        EventType.SCORE -> "第${event.period}节"
        EventType.FOUL -> {
            val foulType = event.detail?.get("foulType")?.toString() ?: "普通犯规"
            "第${event.period}节 · $foulType"
        }
        EventType.SUBSTITUTION -> "第${event.period}节"
        EventType.TIMEOUT -> "第${event.period}节"
        EventType.INJURY -> "第${event.period}节"
        EventType.CANCEL -> "第${event.period}节"
        EventType.YELLOW_CARD -> "第${event.period}节"
        EventType.RED_CARD -> "第${event.period}节"
        EventType.CORNER_KICK -> "第${event.period}节"
        EventType.OFFSIDE -> "第${event.period}节"
        EventType.SIDE_CHANGE -> "第${event.period}节"
        EventType.FINISH -> "决赛"
        EventType.DQ -> "取消资格"
        EventType.WITHDRAW -> "退赛"
    }
}
