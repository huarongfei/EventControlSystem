package com.eventcontrol.refereeapp.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.eventcontrol.refereeapp.data.api.RetrofitClient
import com.eventcontrol.refereeapp.data.api.SocketService
import com.eventcontrol.refereeapp.data.local.DataStoreManager
import com.eventcontrol.refereeapp.data.local.OfflineQueue
import com.eventcontrol.refereeapp.data.repository.MatchRepository
import com.eventcontrol.refereeapp.data.repository.createMatchEvent
import com.eventcontrol.refereeapp.domain.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class RefereeViewModel(application: Application) : AndroidViewModel(application) {

    private val dataStoreManager = DataStoreManager(application)
    private val offlineQueue = OfflineQueue(application)
    private val socketService = SocketService()

    private var repository: MatchRepository? = null

    // UI State
    private val _uiState = MutableStateFlow(RefereeUiState())
    val uiState: StateFlow<RefereeUiState> = _uiState.asStateFlow()
    
    private val _matchList = MutableStateFlow<List<Match>>(emptyList())
    val matchList: StateFlow<List<Match>> = _matchList.asStateFlow()

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    private val _currentMatch = MutableStateFlow<Match?>(null)
    val currentMatch: StateFlow<Match?> = _currentMatch.asStateFlow()

    private val _matchEvents = MutableStateFlow<List<MatchEvent>>(emptyList())
    val matchEvents: StateFlow<List<MatchEvent>> = _matchEvents.asStateFlow()

    private val _foulTypes = MutableStateFlow<List<FoulType>>(emptyList())
    val foulTypes: StateFlow<List<FoulType>> = _foulTypes.asStateFlow()

    private val _sportTypes = MutableStateFlow<List<String>>(emptyList())
    val sportTypes: StateFlow<List<String>> = _sportTypes.asStateFlow()

    private val _foulTypesLoading = MutableStateFlow(false)
    val foulTypesLoading: StateFlow<Boolean> = _foulTypesLoading.asStateFlow()

    private val _offlineEvents = MutableStateFlow<List<MatchEvent>>(emptyList())
    val offlineEvents: StateFlow<List<MatchEvent>> = _offlineEvents.asStateFlow()

    private val _pendingSyncCount = MutableStateFlow(0)
    val pendingSyncCount: StateFlow<Int> = _pendingSyncCount.asStateFlow()

    private val _syncState = MutableStateFlow(SyncState.IDLE)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    init {
        viewModelScope.launch {
            offlineQueue.pendingEventsFlow.collect { events ->
                _offlineEvents.value = events
                _pendingSyncCount.value = events.size
            }
        }

        viewModelScope.launch {
            socketService.connectionState.collect { state ->
                _connectionState.value = when (state) {
                    SocketService.ConnectionState.CONNECTED -> ConnectionState.CONNECTED
                    SocketService.ConnectionState.CONNECTING -> ConnectionState.CONNECTING
                    else -> ConnectionState.DISCONNECTED
                }
            }
        }

        viewModelScope.launch {
            socketService.matchUpdate.collect { match ->
                match?.let { _currentMatch.value = it }
            }
        }
    }

    fun initialize(serverUrl: String) {
        RetrofitClient.initialize(serverUrl)
        repository = MatchRepository(
            RetrofitClient.getApiService(),
            dataStoreManager,
            offlineQueue
        )
    }

    fun connectToMatch(matchId: String, serverUrl: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                // Use the serverUrl passed from UI instead of stored one
                initialize(serverUrl)
                dataStoreManager.saveServerUrl(serverUrl)
                
                // Get match details
                val result = repository?.getMatch(matchId)
                result?.onSuccess { match ->
                    if (match == null) {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                error = "比赛数据不完整，无法连接"
                            )
                        }
                        return@onSuccess
                    }
                    
                    _currentMatch.value = match
                    dataStoreManager.saveMatchId(matchId)
                    
                    // Connect to WebSocket
                    socketService.connect(serverUrl, matchId)
                    
                    // Load foul types for this sport
                    loadFoulTypes(match.sportType)
                    
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isConnected = true,
                            matchId = matchId
                        )
                    }
                }?.onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "连接失败"
                        )
                    }
                }
                
                if (result == null) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Repository 未初始化"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "连接失败"
                    )
                }
            }
        }
    }

    fun disconnect() {
        socketService.disconnect()
        viewModelScope.launch {
            dataStoreManager.clearMatchData()
        }
        _uiState.update {
            it.copy(
                isConnected = false,
                matchId = null
            )
        }
        _currentMatch.value = null
        _matchList.value = emptyList()
        _foulTypes.value = emptyList()
    }

    /**
     * 加载指定运动类型的犯规类型列表
     */
    fun loadFoulTypes(sportType: String) {
        viewModelScope.launch {
            _foulTypesLoading.value = true
            _uiState.update { it.copy(error = null) }
            
            try {
                val result = repository?.getFoulTypes(sportType)
                result?.onSuccess { foulTypesList ->
                    _foulTypes.value = foulTypesList
                }?.onFailure { error ->
                    _uiState.update {
                        it.copy(error = "加载犯规类型失败: ${error.message}")
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(error = "加载犯规类型失败: ${e.message}")
                }
            } finally {
                _foulTypesLoading.value = false
            }
        }
    }

    fun reportScore(teamId: String, points: Int, playerId: String? = null) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.SCORE,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = playerId,
                detail = mapOf("points" to points),
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    fun reportFoul(teamId: String, playerId: String?, foulTypeCode: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.FOUL,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = playerId,
                detail = mapOf("foulType" to foulTypeCode),
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    fun reportSubstitution(teamId: String, playerIn: String?, playerOut: String?) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.SUBSTITUTION,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = playerIn,
                detail = mapOf(
                    "playerIn" to (playerIn ?: ""),
                    "playerOut" to (playerOut ?: "")
                ),
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    fun reportTimeout(teamId: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.TIMEOUT,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    fun reportInjury(teamId: String, playerId: String?) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.INJURY,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = playerId,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告红黄牌（足球）
     */
    fun reportCard(teamId: String, cardType: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val eventType = when (cardType) {
                "yellow_card" -> EventType.YELLOW_CARD
                "red_card" -> EventType.RED_CARD
                else -> EventType.FOUL
            }
            val event = createMatchEvent(
                matchId = match.id,
                type = eventType,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = mapOf("cardType" to cardType),
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告角球（足球）
     */
    fun reportCornerKick(teamId: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.CORNER_KICK,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告越位（足球）
     */
    fun reportOffside(teamId: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.OFFSIDE,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告换边（羽毛球/网球/乒乓球）
     */
    fun reportSideChange() {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.SIDE_CHANGE,
                period = match.currentPeriod,
                teamId = "",
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告取消资格（竞速类）
     */
    fun reportDisqualified(teamId: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.DQ,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    /**
     * 报告退赛（竞速类）
     */
    fun reportWithdraw(teamId: String) {
        val match = _currentMatch.value ?: return
        viewModelScope.launch {
            val event = createMatchEvent(
                matchId = match.id,
                type = EventType.WITHDRAW,
                period = match.currentPeriod,
                teamId = teamId,
                playerId = null,
                detail = null,
                reportedBy = dataStoreManager.getDeviceId()
            )
            processEvent(event)
        }
    }

    private suspend fun processEvent(event: MatchEvent) {
        // Emit via socket for real-time update
        socketService.emitEvent(event)

        // Save to local list
        _matchEvents.update { list -> list + event }

        // Try to sync
        repository?.reportEvent(event)?.onSuccess { syncedEvent ->
            if (!syncedEvent.isSynced) {
                _uiState.update { it.copy(isOfflineMode = true) }
            }
        }
    }

    fun syncOfflineEvents() {
        viewModelScope.launch {
            _syncState.value = SyncState.SYNCING
            repository?.syncOfflineEvents()
                ?.onSuccess { syncedIds ->
                    _syncState.value = SyncState.SUCCESS
                    if (_offlineEvents.value.isEmpty()) {
                        _uiState.update { it.copy(isOfflineMode = false) }
                    }
                    // Reset state after delay
                    kotlinx.coroutines.delay(2000)
                    _syncState.value = SyncState.IDLE
                }
                ?.onFailure {
                    _syncState.value = SyncState.FAILED
                    kotlinx.coroutines.delay(2000)
                    _syncState.value = SyncState.IDLE
                }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    fun loadMatches(eventId: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                val result = repository?.getMatches(eventId)
                result?.onSuccess { matches ->
                    _matchList.value = matches
                    _uiState.update { it.copy(isLoading = false) }
                }?.onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "加载比赛列表失败: ${error.message}"
                        )
                    }
                }
                
                if (result == null) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Repository 未初始化，请先输入服务器地址"
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "加载失败"
                    )
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketService.disconnect()
    }
}

// UI State
data class RefereeUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val isOfflineMode: Boolean = false,
    val matchId: String? = null,
    val error: String? = null
)

enum class ConnectionState {
    CONNECTED,
    CONNECTING,
    DISCONNECTED
}

enum class SyncState {
    IDLE,
    SYNCING,
    SUCCESS,
    FAILED
}
