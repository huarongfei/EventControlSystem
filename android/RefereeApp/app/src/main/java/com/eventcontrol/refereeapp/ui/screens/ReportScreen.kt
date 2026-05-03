package com.eventcontrol.refereeapp.ui.screens

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
import androidx.compose.ui.window.Dialog
import com.eventcontrol.refereeapp.domain.model.Player
import com.eventcontrol.refereeapp.domain.model.Team
import com.eventcontrol.refereeapp.ui.theme.*

@Composable
fun ScoreConfirmDialog(
    teamName: String,
    points: Int,
    players: List<Player>,
    onDismiss: () -> Unit,
    onConfirm: (String?) -> Unit
) {
    var selectedPlayer by remember { mutableStateOf<Player?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Text(
                    text = "确认得分",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "$teamName +$points 分",
                    style = MaterialTheme.typography.headlineMedium,
                    color = ScoreActionColor,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(20.dp))

                if (players.isNotEmpty()) {
                    Text(
                        text = "选择球员（可选）",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    players.forEach { player ->
                        PlayerSelectionItem(
                            player = player,
                            isSelected = selectedPlayer?.id == player.id,
                            onClick = {
                                selectedPlayer = if (selectedPlayer?.id == player.id) null else player
                            }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("取消")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(selectedPlayer?.id) },
                        colors = ButtonDefaults.buttonColors(containerColor = ScoreActionColor)
                    ) {
                        Text("确认")
                    }
                }
            }
        }
    }
}

@Composable
fun FoulConfirmDialog(
    teamName: String,
    players: List<Player>,
    onDismiss: () -> Unit,
    onConfirm: (String?, String) -> Unit
) {
    var selectedPlayer by remember { mutableStateOf<Player?>(null) }
    var selectedFoulType by remember { mutableStateOf("普通犯规") }
    
    val foulTypes = listOf("普通犯规", "技术犯规", "违反体育道德犯规", "夺权犯规")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Text(
                    text = "确认犯规",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = teamName,
                    style = MaterialTheme.typography.titleMedium,
                    color = FoulActionColor
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "犯规类型",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                foulTypes.forEach { type ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedFoulType == type,
                            onClick = { selectedFoulType = type }
                        )
                        Text(
                            text = type,
                            style = MaterialTheme.typography.bodyMedium,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))

                if (players.isNotEmpty()) {
                    Text(
                        text = "犯规球员（可选）",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    players.forEach { player ->
                        PlayerSelectionItem(
                            player = player,
                            isSelected = selectedPlayer?.id == player.id,
                            onClick = {
                                selectedPlayer = if (selectedPlayer?.id == player.id) null else player
                            }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("取消")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(selectedPlayer?.id, selectedFoulType) },
                        colors = ButtonDefaults.buttonColors(containerColor = FoulActionColor)
                    ) {
                        Text("确认")
                    }
                }
            }
        }
    }
}

@Composable
fun SubstitutionConfirmDialog(
    teamName: String,
    players: List<Player>,
    onDismiss: () -> Unit,
    onConfirm: (String?, String?) -> Unit
) {
    var playerIn by remember { mutableStateOf<Player?>(null) }
    var playerOut by remember { mutableStateOf<Player?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Text(
                    text = "换人请求",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = teamName,
                    style = MaterialTheme.typography.titleMedium,
                    color = SubstitutionActionColor
                )
                
                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "换上球员",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                players.forEach { player ->
                    PlayerSelectionItem(
                        player = player,
                        isSelected = playerIn?.id == player.id,
                        onClick = {
                            playerIn = if (playerIn?.id == player.id) null else player
                        }
                    )
                }
                
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "换下球员",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                players.forEach { player ->
                    PlayerSelectionItem(
                        player = player,
                        isSelected = playerOut?.id == player.id,
                        onClick = {
                            playerOut = if (playerOut?.id == player.id) null else player
                        }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("取消")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(playerIn?.id, playerOut?.id) },
                        colors = ButtonDefaults.buttonColors(containerColor = SubstitutionActionColor)
                    ) {
                        Text("确认")
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerSelectionItem(
    player: Player,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = isSelected,
            onClick = onClick
        )
        Text(
            text = "#${player.number} ${player.name}",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}
