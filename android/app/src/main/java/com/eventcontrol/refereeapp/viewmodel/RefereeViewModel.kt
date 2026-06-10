package com.eventcontrol.refereeapp.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eventcontrol.refereeapp.data.api.SocketEvent
import com.eventcontrol.refereeapp.data.api.SocketService
import com.eventcontrol.refereeapp.data.repository.MatchRepository
import com.eventcontrol.refereeapp.domain.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class RefereeViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = MatchRepository(application)
    private val socketService = SocketService()

    private val _uiState = MutableStateFlow(RefereeUiState())
    val uiState: StateFlow<RefereeUiState> = _uiState.asStateFlow()

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    private val _matchEvents = MutableStateFlow<List<MatchEvent>>(emptyList())
    val matchEvents: StateFlow<List<MatchEvent>> = _matchEvents.asStateFlow()

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    private val _timerState = MutableStateFlow(TimerState())
    val timerState: StateFlow<TimerState> = _timerState.asStateFlow()

    // 保存详细的错误信息用于诊断
    private val _connectionError = MutableStateFlow<ConnectionError?>(null)
    val connectionError: StateFlow<ConnectionError?> = _connectionError.asStateFlow()

    /**
     * 连接到服务器
     * 先验证服务器地址格式，然后测试连接
     */
    fun connectToServer(address: String) {
        viewModelScope.launch {
            _connectionStatus.value = ConnectionStatus.CONNECTING
            _connectionError.value = null
            _uiState.update { it.copy(error = null) }

            // 1. 先验证地址格式
            val validationError = validateServerAddress(address)
            if (validationError != null) {
                _connectionStatus.value = ConnectionStatus.ERROR
                _connectionError.value = validationError
                _uiState.update { it.copy(error = validationError.userMessage) }
                return@launch
            }

            // 2. 设置服务器地址
            repository.setServerAddress(address)
            _uiState.update { it.copy(serverAddress = address) }

            // 3. 测试连接（调用一个简单的API验证服务器可达）
            testConnection()

            // 4. 连接 Socket.IO（连接成功后自动建立实时通道）
            if (_connectionStatus.value == ConnectionStatus.CONNECTED) {
                connectSocket(address)
            }
        }
    }

    private suspend fun testConnection() {
        try {
            val response = getApiService().getEvents()
            if (response.isSuccessful) {
                _connectionStatus.value = ConnectionStatus.CONNECTED
                _connectionError.value = null
                // 连接成功后加载事件列表
                loadEvents()
            } else {
                val error = ConnectionError(
                    type = ErrorType.SERVER_ERROR,
                    serverMessage = "HTTP ${response.code()}: ${response.message()}",
                    userMessage = "服务器错误 (${response.code()})，请检查服务器状态"
                )
                _connectionStatus.value = ConnectionStatus.ERROR
                _connectionError.value = error
                _uiState.update { it.copy(error = error.userMessage) }
            }
        } catch (e: Exception) {
            val error = parseNetworkError(e)
            _connectionStatus.value = ConnectionStatus.ERROR
            _connectionError.value = error
            _uiState.update { it.copy(error = error.userMessage) }
        }
    }

    private fun validateServerAddress(address: String): ConnectionError? {
        if (address.isBlank()) {
            return ConnectionError(
                type = ErrorType.EMPTY_ADDRESS,
                userMessage = "服务器地址不能为空"
            )
        }

        // 检查是否包含协议前缀
        if (!address.startsWith("http://") && !address.startsWith("https://")) {
            return ConnectionError(
                type = ErrorType.MISSING_PROTOCOL,
                userMessage = "地址缺少协议前缀，已自动添加 http://"
            )
        }

        // 尝试解析主机名
        val url = try {
            java.net.URL(address)
        } catch (e: Exception) {
            return ConnectionError(
                type = ErrorType.INVALID_URL,
                userMessage = "服务器地址格式无效: ${e.message}"
            )
        }

        if (url.host.isNullOrBlank()) {
            return ConnectionError(
                type = ErrorType.INVALID_URL,
                userMessage = "服务器地址格式无效，缺少主机名"
            )
        }

        return null
    }

    private fun parseNetworkError(e: Exception): ConnectionError {
        val errorType: ErrorType
        val userMessage: String
        val serverMessage = e.message ?: "Unknown error"

        when {
            // 无法解析域名
            serverMessage.contains("Unable to resolve host", ignoreCase = true) ||
            serverMessage.contains("hostname", ignoreCase = true) -> {
                errorType = ErrorType.DNS_ERROR
                userMessage = "无法解析服务器地址，请检查IP地址是否正确"
            }
            // 连接被拒绝
            serverMessage.contains("Connection refused", ignoreCase = true) ||
            serverMessage.contains("ECONNREFUSED", ignoreCase = true) -> {
                errorType = ErrorType.CONNECTION_REFUSED
                userMessage = "服务器连接被拒绝，请确认服务器已启动且端口正确"
            }
            // 连接超时
            serverMessage.contains("timeout", ignoreCase = true) ||
            serverMessage.contains("TIMEOUT", ignoreCase = true) ||
            serverMessage.contains("timed out", ignoreCase = true) -> {
                errorType = ErrorType.TIMEOUT
                userMessage = "连接超时，请检查网络或服务器是否可达"
            }
            // 网络不可达
            serverMessage.contains("Network is unreachable", ignoreCase = true) ||
            serverMessage.contains("ENETUNREACH", ignoreCase = true) -> {
                errorType = ErrorType.NETWORK_UNREACHABLE
                userMessage = "网络不可达，请检查网络连接"
            }
            // SSL错误
            serverMessage.contains("SSL", ignoreCase = true) ||
            serverMessage.contains("certificate", ignoreCase = true) -> {
                errorType = ErrorType.SSL_ERROR
                userMessage = "SSL证书错误，请确认使用 http:// 而非 https://"
            }
            // 未知网络错误
            else -> {
                errorType = ErrorType.UNKNOWN
                userMessage = "连接失败: $serverMessage"
            }
        }

        return ConnectionError(
            type = errorType,
            serverMessage = serverMessage,
            userMessage = userMessage
        )
    }

    private fun getApiService() = com.eventcontrol.refereeapp.data.api.RetrofitClient.getApiService()

    fun loadEvents() {
        // 如果正在连接中，不重复加载
        if (_connectionStatus.value == ConnectionStatus.CONNECTING) {
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.getEvents()
                .onSuccess { eventList ->
                    _events.value = eventList
                    _uiState.update { it.copy(isLoading = false, error = null) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun selectEvent(event: Event) {
        viewModelScope.launch {
            _uiState.update { it.copy(selectedEvent = event) }
        }
    }

    fun loadMatch(matchId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            repository.getMatch(matchId)
                .onSuccess { match ->
                    // 安全检查：确保必要字段不为空
                    if (match.homeTeam.name.isBlank() || match.awayTeam.name.isBlank()) {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                error = "比赛数据不完整"
                            )
                        }
                        return@launch
                    }
                    _uiState.update {
                        it.copy(
                            currentMatch = match,
                            isLoading = false,
                            error = null
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "加载比赛失败: ${e.message}"
                        )
                    }
                }
        }
    }

    fun addHomeScore(points: Int, playerName: String = "主队") {
        val match = _uiState.value.currentMatch ?: return
        viewModelScope.launch {
            val newScore = match.homeTeam.score + points
            repository.updateScore(match.id, newScore, match.awayTeam.score)
                .onSuccess { updatedMatch ->
                    _uiState.update { it.copy(currentMatch = updatedMatch) }
                    addEvent(MatchEvent(
                        id = "",
                        matchId = match.id,
                        type = EventType.SCORE,
                        teamId = match.homeTeam.id,
                        playerName = playerName,
                        points = points,
                        description = "${match.homeTeam.name} +$points"
                    ))
                }
                .onFailure { e ->
                    _uiState.update { it.copy(error = e.message) }
                }
        }
    }

    fun addAwayScore(points: Int, playerName: String = "客队") {
        val match = _uiState.value.currentMatch ?: return
        viewModelScope.launch {
            val newScore = match.awayTeam.score + points
            repository.updateScore(match.id, match.homeTeam.score, newScore)
                .onSuccess { updatedMatch ->
                    _uiState.update { it.copy(currentMatch = updatedMatch) }
                    addEvent(MatchEvent(
                        id = "",
                        matchId = match.id,
                        type = EventType.SCORE,
                        teamId = match.awayTeam.id,
                        playerName = playerName,
                        points = points,
                        description = "${match.awayTeam.name} +$points"
                    ))
                }
                .onFailure { e ->
                    _uiState.update { it.copy(error = e.message) }
                }
        }
    }

    fun recordFoul(teamId: String, playerName: String, foulType: String) {
        val match = _uiState.value.currentMatch ?: return
        viewModelScope.launch {
            repository.addFoulEvent(match.id, teamId, "player-1", playerName, foulType)
                .onSuccess { event ->
                    addEvent(event)
                }
        }
    }

    private fun addEvent(event: MatchEvent) {
        _matchEvents.value = listOf(event) + _matchEvents.value.take(99)
    }

    fun syncOfflineData() {
        viewModelScope.launch {
            val synced = repository.syncOfflineEvents()
            if (synced > 0) {
                _uiState.update { it.copy(message = "已同步 $synced 条离线记录") }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    // 计时器相关
    fun updateTimer(time: String) {
        _timerState.update { it.copy(currentTime = time) }
    }

    fun setPeriod(period: Int) {
        val match = _uiState.value.currentMatch ?: return
        _uiState.update {
            it.copy(currentMatch = match.copy(period = period, periodTime = "12:00"))
        }
        _timerState.update { it.copy(currentTime = "12:00") }
    }

    // 空事件处理函数 #2：updateMatchStatus（被 MainActivity 调用，此前不存在）
    fun updateMatchStatus(status: String) {
        viewModelScope.launch {
            val match = _uiState.value.currentMatch ?: return@launch
            // 通过 Socket.IO 通知服务端状态变更
            if (socketService.isConnected()) {
                socketService.emit("match:status_change", mapOf("matchId" to match.id, "status" to status))
            }
            // 同时更新本地 UI 状态
            _uiState.update { it.copy(currentMatch = it.currentMatch?.copy(status = status)) }
        }
    }

    // 空事件处理函数 #3：connectSocket（连接 Socket.IO，此前从未调用）
    private fun connectSocket(serverUrl: String) {
        viewModelScope.launch {
            socketService.connect(serverUrl)
                .catch { e ->
                    _uiState.update { it.copy(error = "Socket 连接失败: ${e.message}") }
                }
                .onEach { event -> handleSocketEvent(event) }
                .launchIn(this@launch)
        }
    }

    // 空事件处理函数 #4：handleSocketEvent（处理 6 类 Socket 事件，此前完全未实现）
    private fun handleSocketEvent(event: SocketEvent) {
        when (event) {
            is SocketEvent.Connected -> {
                _connectionStatus.value = ConnectionStatus.CONNECTED
            }
            is SocketEvent.Disconnected -> {
                _connectionStatus.value = ConnectionStatus.DISCONNECTED
            }
            is SocketEvent.Error -> {
                _uiState.update { it.copy(error = event.message) }
            }
            is SocketEvent.ScoreUpdate -> {
                _uiState.update { it.copy(currentMatch = event.match) }
            }
            is SocketEvent.MatchEventReceived -> {
                addEvent(event.event)
            }
            is SocketEvent.StatusChange -> {
                // 解析服务端下发的状态变更（data 为 JSON 字符串）
                try {
                    val json = org.json.JSONObject(event.data)
                    val newStatus = json.optString("status", "")
                    val matchId = json.optString("matchId", "")
                    if (matchId == _uiState.value.currentMatch?.id) {
                        _uiState.update { it.copy(currentMatch = it.currentMatch?.copy(status = newStatus)) }
                    }
                } catch (e: Exception) {
                    android.util.Log.w("RefereeViewModel", "StatusChange parse failed: ${e.message}")
                }
            }
        }
    }

    // 空事件处理函数 #5 配套：在 connectToServer 成功后自动连接 Socket
    fun recordFoul(teamId: String, teamName: String, playerName: String, foulType: String) {
        val match = _uiState.value.currentMatch ?: return
        viewModelScope.launch {
            repository.addFoulEvent(match.id, teamId, "player-1", playerName, foulType)
                .onSuccess { event ->
                    addEvent(event)
                }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketService.disconnect()
    }
}

data class RefereeUiState(
    val serverAddress: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val selectedEvent: Event? = null,
    val currentMatch: Match? = null
)

enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
}

data class TimerState(
    val currentTime: String = "12:00",
    val isRunning: Boolean = false,
    val period: Int = 1
)

// 连接错误类型枚举
enum class ErrorType {
    EMPTY_ADDRESS,          // 地址为空
    MISSING_PROTOCOL,       // 缺少协议前缀
    INVALID_URL,            // URL格式无效
    DNS_ERROR,              // DNS解析失败
    CONNECTION_REFUSED,     // 连接被拒绝
    TIMEOUT,                // 连接超时
    NETWORK_UNREACHABLE,    // 网络不可达
    SSL_ERROR,              // SSL证书错误
    SERVER_ERROR,           // 服务器错误响应
    UNKNOWN                 // 未知错误
}

// 连接错误数据类
data class ConnectionError(
    val type: ErrorType,
    val serverMessage: String = "",
    val userMessage: String
)