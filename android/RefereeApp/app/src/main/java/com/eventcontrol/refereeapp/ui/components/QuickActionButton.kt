package com.eventcontrol.refereeapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.eventcontrol.refereeapp.ui.theme.*

@Composable
fun QuickActionButton(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    containerColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(72.dp),
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = Color.White
        )
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun ScoreActionButton(
    teamName: String,
    points: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "$teamName\n+$points",
        icon = getScoreIcon(points),
        onClick = onClick,
        containerColor = ScoreActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
fun FoulActionButton(
    teamName: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "犯规\n$teamName",
        icon = androidx.compose.material.icons.Icons.Filled.Warning,
        onClick = onClick,
        containerColor = FoulActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
fun SubstitutionActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "换人请求",
        icon = androidx.compose.material.icons.Icons.Filled.SwapHoriz,
        onClick = onClick,
        containerColor = SubstitutionActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
fun TimeoutActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "暂停请求",
        icon = androidx.compose.material.icons.Icons.Filled.Pause,
        onClick = onClick,
        containerColor = TimeoutActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
fun InjuryActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "伤病报告",
        icon = androidx.compose.material.icons.Icons.Filled.LocalHospital,
        onClick = onClick,
        containerColor = InjuryActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
fun CancelActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    QuickActionButton(
        text = "取消操作",
        icon = androidx.compose.material.icons.Icons.Filled.Cancel,
        onClick = onClick,
        containerColor = CancelActionColor,
        modifier = modifier,
        enabled = enabled
    )
}

@Composable
private fun getScoreIcon(points: Int): ImageVector {
    return when (points) {
        1 -> androidx.compose.material.icons.Icons.Filled.Add
        2 -> androidx.compose.material.icons.Icons.Filled.TrendingUp
        3 -> androidx.compose.material.icons.Icons.Filled.Star
        else -> androidx.compose.material.icons.Icons.Filled.Add
    }
}
