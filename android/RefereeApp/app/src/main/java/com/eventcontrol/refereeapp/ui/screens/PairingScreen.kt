package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.domain.model.Match
import com.eventcontrol.refereeapp.viewmodel.ConnectionState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PairingScreen(
    serverUrl: String,
    matchCode: String,
    connectionState: ConnectionState,
    isLoading: Boolean,
    error: String?,
    matchList: List<Match>,
    onServerUrlChange: (String) -> Unit,
    onMatchCodeChange: (String) -> Unit,
    onConnect: () -> Unit,
    onLoadMatches: () -> Unit,
    onMatchSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val focusManager = LocalFocusManager.current
    var showMatchList by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Title
        Icon(
            imageVector = Icons.Filled.Link,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "裁判端连接",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "输入赛事码连接比赛",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Server URL input
        OutlinedTextField(
            value = serverUrl,
            onValueChange = onServerUrlChange,
            label = { Text("服务器地址") },
            placeholder = { Text("http://192.168.1.100:3001") },
            leadingIcon = {
                Icon(
                    imageVector = if (connectionState == ConnectionState.CONNECTED) 
                        Icons.Filled.Cloud else Icons.Filled.CloudOff,
                    contentDescription = null
                )
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Uri,
                imeAction = ImeAction.Next
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Match code input
        OutlinedTextField(
            value = matchCode,
            onValueChange = onMatchCodeChange,
            label = { Text("赛事码/比赛ID") },
            placeholder = { Text("请输入赛事码或比赛ID") },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Filled.QrCodeScanner,
                    contentDescription = null
                )
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = {
                    focusManager.clearFocus()
                    onConnect()
                }
            )
        )

        Spacer(modifier = Modifier.height(16.dp))
        
        // Load matches button
        Button(
            onClick = {
                focusManager.clearFocus()
                showMatchList = true
                onLoadMatches()
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
            )
        ) {
            Icon(Icons.Filled.List, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("加载比赛列表")
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Connection state indicator
        if (connectionState != ConnectionState.DISCONNECTED || error != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (error != null)
                        MaterialTheme.colorScheme.errorContainer
                    else if (connectionState == ConnectionState.CONNECTED)
                        MaterialTheme.colorScheme.primaryContainer
                    else
                        MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "连接中...",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    } else if (error != null) {
                        Text(
                            text = error,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error,
                            textAlign = TextAlign.Center
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Filled.Cloud,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "已连接",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Connect button
        Button(
            onClick = {
                focusManager.clearFocus()
                onConnect()
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = matchCode.isNotBlank() && !isLoading,
            shape = RoundedCornerShape(12.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "连接",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Help text
        Text(
            text = "请确保手机与服务器在同一网络下",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            textAlign = TextAlign.Center
        )
        
        // Match list dialog
        if (showMatchList && matchList.isNotEmpty()) {
            AlertDialog(
                onDismissRequest = { showMatchList = false },
                title = { Text("选择比赛") },
                text = {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(matchList) { match ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                onClick = {
                                    onMatchSelected(match.id)
                                    showMatchList = false
                                }
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        text = match.eventName,
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "${match.homeTeam.name} vs ${match.awayTeam.name}",
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Text(
                                        text = "比分: ${match.homeScore} : ${match.awayScore}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showMatchList = false }) {
                        Text("关闭")
                    }
                }
            )
        }
    }
}
