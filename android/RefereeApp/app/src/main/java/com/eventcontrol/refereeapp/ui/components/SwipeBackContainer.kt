package com.eventcontrol.refereeapp.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

/**
 * 边缘滑动返回组件
 * 从屏幕左边缘向右滑动可触发返回
 * 
 * @param onBackPressed 返回回调
 * @param enabled 是否启用滑动返回
 * @param content 页面内容
 */
@Composable
fun SwipeBackContainer(
    onBackPressed: () -> Unit,
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    val density = LocalDensity.current
    val dragThreshold = with(density) { 100.dp.toPx() }
    val maxDragDistance = with(density) { 150.dp.toPx() }
    
    val animatable = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    
    var dragOffset by remember { mutableFloatStateOf(0f) }
    var shouldTriggerBack by remember { mutableStateOf(false) }
    var isAnimating by remember { mutableStateOf(false) }
    
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // 页面内容
        Box(
            modifier = Modifier
                .fillMaxSize()
                .offset(x = dragOffset.dp)
                .graphicsLayer {
                    // 添加轻微缩放效果增强视觉反馈
                    val scale = 1f - (dragOffset / maxDragDistance) * 0.05f
                    scaleX = scale.coerceIn(0.95f, 1f)
                    scaleY = scale.coerceIn(0.95f, 1f)
                }
                .then(
                    if (enabled && !isAnimating) {
                        Modifier.pointerInput(Unit) {
                            detectHorizontalDragGestures(
                                onDragStart = { offset ->
                                    // 只在左边缘触发
                                    shouldTriggerBack = offset.x < 50f
                                },
                                onHorizontalDrag = { _, dragAmount ->
                                    if (enabled && shouldTriggerBack) {
                                        dragOffset = (dragOffset + dragAmount).coerceIn(0f, maxDragDistance)
                                    }
                                },
                                onDragEnd = {
                                    if (enabled && shouldTriggerBack) {
                                        isAnimating = true
                                        if (dragOffset > dragThreshold) {
                                            // 触发返回 - 先完成动画，再返回
                                            scope.launch {
                                                animatable.animateTo(
                                                    targetValue = maxDragDistance,
                                                    animationSpec = tween(150)
                                                )
                                                // 动画完成后再触发返回
                                                onBackPressed()
                                                // 重置状态
                                                dragOffset = 0f
                                                isAnimating = false
                                            }
                                        } else {
                                            // 返回原位
                                            scope.launch {
                                                animatable.animateTo(0f, animationSpec = tween(200))
                                                dragOffset = 0f
                                                isAnimating = false
                                            }
                                        }
                                    }
                                    shouldTriggerBack = false
                                },
                                onDragCancel = {
                                    scope.launch {
                                        animatable.animateTo(0f, animationSpec = tween(200))
                                        dragOffset = 0f
                                    }
                                    shouldTriggerBack = false
                                    isAnimating = false
                                }
                            )
                        }
                    } else Modifier
                )
        ) {
            content()
        }
        
        // 滑动指示器 - 只在有拖动时显示
        val progress = (dragOffset / maxDragDistance).coerceIn(0f, 1f)
        if (progress > 0.01f && enabled && !isAnimating) {
            // 背景遮罩 - 提供视觉反馈
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = progress * 0.3f))
            )
            
            // 滑动指示条
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width((progress * 20).dp)
                    .background(
                        MaterialTheme.colorScheme.primary.copy(alpha = progress * 0.5f),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(
                            topEnd = 4.dp,
                            bottomEnd = 4.dp
                        )
                    )
                    .align(Alignment.CenterStart)
            )
        }
    }
}

/**
 * 简化版的 SwipeBack，适用于单页面应用
 * 添加边缘滑动提示区域
 */
@Composable
fun EdgeSwipeHint(
    enabled: Boolean = true,
    content: @Composable () -> Unit
) {
    var showHint by remember { mutableStateOf(false) }
    
    Box(modifier = Modifier.fillMaxSize()) {
        content()
        
        // 边缘提示
        if (enabled && showHint) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(3.dp)
                    .background(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)
                    )
                    .align(Alignment.CenterStart)
            )
        }
    }
}
