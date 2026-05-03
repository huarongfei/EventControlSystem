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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.domain.model.MatchEvent
import com.eventcontrol.refereeapp.domain.model.EventType
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HistoryScreen(
    matchEvents: List<MatchEvent>,
    offlineCount: Int,
    onSync: () -> Unit,
    onNavigateBack: () -> Unit
) {
    var selectedFilter by remember { mutableStateOf<EventType?>(null) }

    val filteredEvents = if (selectedFilter != null) {
        matchEvents.filter { it.type == selectedFilter }
    } else {
        matchEvents
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("历史记录") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                actions = {
                    if (offlineCount > 0) {
                        Badge(
                            containerColor = MaterialTheme.colorScheme.error
                        ) {
                            Text(offlineCount.toString())
                        }
                        IconButton(onClick = onSync) {
                            Icon(
                                Icons.Default.CloudUpload,
                                contentDescription = "同步离线记录",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // 筛选器
            ScrollableTabRow(
                selectedTabIndex = when (selectedFilter) {
                    null -> 0
                    EventType.SCORE -> 1
                    EventType.FOUL -> 2
                    else -> 0
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedFilter == null,
                    onClick = { selectedFilter = null }
                ) {
                    Text("全部", modifier = Modifier.padding(16.dp))
                }
                Tab(
                    selected = selectedFilter == EventType.SCORE,
                    onClick = { selectedFilter = EventType.SCORE }
                ) {
                    Text("得分", modifier = Modifier.padding(16.dp))
                }
                Tab(
                    selected = selectedFilter == EventType.FOUL,
                    onClick = { selectedFilter = EventType.FOUL }
                ) {
                    Text("犯规", modifier = Modifier.padding(16.dp))
                }
            }

            if (filteredEvents.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.History,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "暂无记录",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredEvents) { event ->
                        HistoryItem(event)
                    }
                }
            }
        }
    }
}

@Composable
fun HistoryItem(event: MatchEvent) {
    val dateFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when (event.type) {
                EventType.SCORE -> MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                EventType.FOUL -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Icon(
                    when (event.type) {
                        EventType.SCORE -> Icons.Default.SportsBasketball
                        EventType.FOUL -> Icons.Default.Warning
                        EventType.SUBSTITUTION -> Icons.Default.SwapHoriz
                        EventType.TIMEOUT -> Icons.Default.Pause
                        else -> Icons.Default.Info
                    },
                    contentDescription = null,
                    tint = when (event.type) {
                        EventType.SCORE -> MaterialTheme.colorScheme.primary
                        EventType.FOUL -> MaterialTheme.colorScheme.error
                        else -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = event.description,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Medium
                    )
                    event.playerName?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                event.points?.let {
                    Text(
                        text = "+$it",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Text(
                    text = dateFormat.format(Date(event.timestamp)),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}