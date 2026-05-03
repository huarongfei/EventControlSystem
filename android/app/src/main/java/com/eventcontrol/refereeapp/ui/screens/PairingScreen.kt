package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.clickable
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
import com.eventcontrol.refereeapp.domain.model.Event
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.viewmodel.ConnectionError
import com.eventcontrol.refereeapp.viewmodel.ConnectionStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PairingScreen(
    serverAddress: String,
    events: List<Event>,
    selectedEvent: Event?,
    isLoading: Boolean,
    error: String?,
    connectionStatus: ConnectionStatus,
    connectionError: ConnectionError?,
    onServerAddressChange: (String) -> Unit,
    onConnect: () -> Unit,
    onLoadEvents: () -> Unit,
    onSelectEvent: (Event) -> Unit,
    onSelectMatch: (Match) -> Unit,
    onNavigateBack: () -> Unit
) {
    var showServerDialog by remember { mutableStateOf(serverAddress.isEmpty()) }

    // 连接状态描述
    val connectionStatusText = when (connectionStatus) {
        ConnectionStatus.DISCONNECTED -> "未连接"
        ConnectionStatus.CONNECTING -> "连接中..."
        ConnectionStatus.CONNECTED -> "已连接"
        ConnectionStatus.ERROR -> "连接失败"
    }

    val connectionStatusColor = when (connectionStatus) {
        ConnectionStatus.DISCONNECTED -> MaterialTheme.colorScheme.onSurfaceVariant
        ConnectionStatus.CONNECTING -> MaterialTheme.colorScheme.primary
        ConnectionStatus.CONNECTED -> MaterialTheme.colorScheme.primary
        ConnectionStatus.ERROR -> MaterialTheme.colorScheme.error
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("连接服务器") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // 服务器地址卡片
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = { showServerDialog = true }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "服务器地址",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = serverAddress.ifEmpty { "点击配置服务器" },
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium,
                            color = if (serverAddress.isEmpty())
                                MaterialTheme.colorScheme.onSurfaceVariant
                            else
                                MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Icon(
                        Icons.Default.Edit,
                        contentDescription = "修改",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 连接按钮
            Button(
                onClick = {
                    onConnect()
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = serverAddress.isNotEmpty() && connectionStatus != ConnectionStatus.CONNECTING
            ) {
                if (connectionStatus == ConnectionStatus.CONNECTING) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Icon(Icons.Default.Link, contentDescription = null)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    when {
                        connectionStatus == ConnectionStatus.CONNECTING -> "连接中..."
                        connectionStatus == ConnectionStatus.CONNECTED -> "已连接，点击重新连接"
                        else -> "连接服务器"
                    }
                )
            }

            // 连接状态显示
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = connectionStatusColor.copy(alpha = 0.1f)
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
                            imageVector = when (connectionStatus) {
                                ConnectionStatus.CONNECTED -> Icons.Default.CheckCircle
                                ConnectionStatus.ERROR -> Icons.Default.Error
                                ConnectionStatus.CONNECTING -> Icons.Default.Sync
                                ConnectionStatus.DISCONNECTED -> Icons.Default.CloudOff
                            },
                            contentDescription = null,
                            tint = connectionStatusColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "连接状态: $connectionStatusText",
                            style = MaterialTheme.typography.bodyMedium,
                            color = connectionStatusColor
                        )
                    }
                    Text(
                        text = serverAddress,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // 详细错误信息卡片
            connectionError?.let { err ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "诊断信息",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = err.userMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                        err.serverMessage.takeIf { it.isNotEmpty() }?.let { serverMsg ->
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "系统信息: $serverMsg",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.7f)
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = getTroubleshootingTip(err.type.name),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 赛事列表
            Text(
                text = "选择赛事",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (events.isEmpty() && !isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Event,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "暂无赛事",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(events) { event ->
                        EventCard(
                            event = event,
                            isSelected = selectedEvent?.id == event.id,
                            onClick = { onSelectEvent(event) }
                        )
                    }
                }
            }
        }
    }

    // 服务器地址对话框
    if (showServerDialog) {
        ServerAddressDialog(
            currentAddress = serverAddress,
            onDismiss = { showServerDialog = false },
            onConfirm = { address ->
                onServerAddressChange(address)
                showServerDialog = false
            }
        )
    }
}

@Composable
fun EventCard(
    event: Event,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                MaterialTheme.colorScheme.primaryContainer
            else
                MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.name ?: "未知赛事",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "状态: ${event.status ?: "未知"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(
                if (isSelected) Icons.Default.CheckCircle else Icons.Default.ChevronRight,
                contentDescription = null,
                tint = if (isSelected)
                    MaterialTheme.colorScheme.primary
                else
                    MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ServerAddressDialog(
    currentAddress: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var address by remember { mutableStateOf(currentAddress) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("配置服务器") },
        text = {
            Column {
                Text(
                    text = "输入后端服务器地址",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("服务器地址") },
                    placeholder = { Text("http://10.0.2.2:3001") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "提示：模拟器使用 10.0.2.2，真机使用电脑局域网IP",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(address) },
                enabled = address.isNotEmpty()
            ) {
                Text("保存")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

/**
 * 根据错误类型返回故障排除提示
 */
private fun getTroubleshootingTip(errorType: String): String {
    return when (errorType) {
        "DNS_ERROR" -> "提示: 请检查服务器IP地址是否正确，确保没有输入域名或主机名"
        "CONNECTION_REFUSED" -> "提示: 请确认后端服务器已启动，并检查端口号是否正确（默认3001）"
        "TIMEOUT" -> "提示: 请检查网络连接，或服务器是否过载。可尝试ping服务器IP测试连通性"
        "NETWORK_UNREACHABLE" -> "提示: 请检查设备的WiFi/移动网络是否已连接"
        "SSL_ERROR" -> "提示: 如果使用本地开发，请确保使用 http:// 而非 https://"
        "SERVER_ERROR" -> "提示: 服务器内部错误，请检查后端服务日志"
        "MISSING_PROTOCOL" -> "提示: 地址已自动添加 http:// 前缀，如需HTTPS请手动修改"
        "EMPTY_ADDRESS" -> "提示: 请先点击上方卡片配置服务器地址"
        "INVALID_URL" -> "提示: 请检查服务器地址格式，例如: http://192.168.1.100:3001"
        else -> "提示: 请检查服务器地址、网络连接和后端服务状态"
    }
}