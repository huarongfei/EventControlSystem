package com.eventcontrol.refereeapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.eventcontrol.refereeapp.domain.model.Player
import com.eventcontrol.refereeapp.domain.model.Team

@Composable
fun PlayerSearchDialog(
    homeTeam: Team,
    awayTeam: Team,
    onDismiss: () -> Unit,
    onPlayerSelected: (Player) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTeam by remember { mutableStateOf<Team?>(null) }

    val allPlayers = remember(homeTeam, awayTeam) {
        homeTeam.players + awayTeam.players
    }

    val filteredPlayers = remember(searchQuery, allPlayers) {
        if (searchQuery.isBlank()) {
            allPlayers
        } else {
            allPlayers.filter {
                it.name.contains(searchQuery, ignoreCase = true) ||
                it.number.toString().contains(searchQuery)
            }
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "球员查找",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Filled.Close, contentDescription = "关闭")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Search bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("输入球员姓名或号码") },
                    leadingIcon = {
                        Icon(Icons.Filled.Search, contentDescription = null)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Team filter chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                FilterChip(
                    selected = selectedTeam == null,
                    onClick = { selectedTeam = null },
                    label = { Text("全部") }
                )
                FilterChip(
                    selected = selectedTeam == homeTeam,
                    onClick = { selectedTeam = if (selectedTeam == homeTeam) null else homeTeam },
                    label = { Text(homeTeam.shortName) }
                )
                FilterChip(
                    selected = selectedTeam == awayTeam,
                    onClick = { selectedTeam = if (selectedTeam == awayTeam) null else awayTeam },
                    label = { Text(awayTeam.shortName) }
                )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Player list
                val displayPlayers = remember(selectedTeam, filteredPlayers) {
                    val team = selectedTeam
                    if (team == null) filteredPlayers
                    else filteredPlayers.filter { player ->
                        team.players.any { it.id == player.id }
                    }
                }

                if (displayPlayers.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "未找到球员",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(displayPlayers, key = { it.id }) { player ->
                            val team = if (homeTeam.players.any { it.id == player.id }) homeTeam else awayTeam
                            PlayerListItem(
                                player = player,
                                teamName = team.shortName,
                                onClick = { onPlayerSelected(player) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerListItem(
    player: Player,
    teamName: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Person,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = player.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "#${player.number} · $teamName",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
