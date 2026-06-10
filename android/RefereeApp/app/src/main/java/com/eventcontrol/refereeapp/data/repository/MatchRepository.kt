package com.eventcontrol.refereeapp.data.repository

import com.eventcontrol.refereeapp.data.api.ApiService
import com.eventcontrol.refereeapp.data.api.MatchDto
import com.eventcontrol.refereeapp.data.api.MatchEventDto
import com.eventcontrol.refereeapp.data.api.RetrofitClient
import com.eventcontrol.refereeapp.data.local.DataStoreManager
import com.eventcontrol.refereeapp.data.local.OfflineQueue
import com.eventcontrol.refereeapp.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.UUID

class MatchRepository(
    private val apiService: ApiService,
    private val dataStoreManager: DataStoreManager,
    private val offlineQueue: OfflineQueue
) {
    suspend fun getMatch(matchId: String): Result<Match?> {
        return try {
            val response = apiService.getMatch(matchId)
            if (response.isSuccessful) {
                response.body()?.let { dto ->
                    val match = dto.toMatch()
                    if (match == null) {
                        Result.failure(Exception("比赛数据不完整"))
                    } else {
                        Result.success(match)
                    }
                } ?: Result.failure(Exception("Empty response"))
            } else {
                Result.failure(Exception("API error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMatches(eventId: String? = null): Result<List<Match>> {
        return try {
            val response = apiService.getMatches()
            if (response.isSuccessful) {
                val matches = response.body()?.mapNotNull { it.toMatch() } ?: emptyList()
                val filtered = if (eventId != null) {
                    matches.filter { it.eventName.contains(eventId, ignoreCase = true) }
                } else {
                    matches
                }
                Result.success(filtered)
            } else {
                Result.failure(Exception("API error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun reportEvent(event: MatchEvent): Result<MatchEvent> {
        return try {
            val dto = event.toDto()
            val response = apiService.reportEvent(event.matchId, dto)
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(event.copy(isSynced = true))
            } else {
                // Server rejected the event (e.g. validation error) — save to offline queue
                offlineQueue.addEvent(event)
                // Use a distinguishable exception so callers can detect offline fallback
                Result.failure(OfflineFallbackException("Event saved to offline queue (server error)"))
            }
        } catch (e: Exception) {
            // Network error — save to offline queue
            offlineQueue.addEvent(event)
            Result.failure(OfflineFallbackException("Event saved to offline queue (network: ${e.message})"))
        }
    }

    suspend fun syncOfflineEvents(): Result<List<String>> {
        return try {
            val pendingEvents = offlineQueue.getAllPendingEvents()
            if (pendingEvents.isEmpty()) {
                return Result.success(emptyList())
            }

            val dtos = pendingEvents.map { it.toDto() }
            val response = apiService.syncEvents(dtos)

            if (response.isSuccessful && response.body()?.success == true) {
                val syncedIds = response.body()?.syncedIds ?: pendingEvents.map { it.id }
                offlineQueue.removeEvents(syncedIds)
                dataStoreManager.saveLastSyncTime(System.currentTimeMillis())
                Result.success(syncedIds)
            } else {
                Result.failure(Exception("Sync failed: ${response.body()?.message}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getOfflineEvents(): Flow<List<MatchEvent>> = offlineQueue.pendingEventsFlow

    suspend fun isOnline(): Boolean {
        return try {
            val response = apiService.getMatches()
            response.code() != 0
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 获取指定运动类型的犯规类型列表
     */
    suspend fun getFoulTypes(sportType: String): Result<List<FoulType>> {
        return try {
            val response = apiService.getFoulTypes(sportType)
            if (response.isSuccessful && response.body()?.success == true) {
                val foulTypes = response.body()?.data?.map { it.toDomain() } ?: emptyList()
                Result.success(foulTypes)
            } else {
                Result.failure(Exception("API error: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Extension functions
fun MatchDto.toMatch(): Match? {
    // Validate required data
    if (id.isBlank()) return null
    if (homeTeam == null || awayTeam == null) return null
    if (homeTeam.name.isBlank() || awayTeam.name.isBlank()) return null
    
    // Parse period names from scoreRules if available
    val periodNames = scoreRules?.periodNames 
        ?: listOf("第1节", "第2节", "第3节", "第4节")
    
    return Match(
        id = id,
        eventName = eventName,
        homeTeam = homeTeam.toTeam(),
        awayTeam = awayTeam.toTeam(),
        homeScore = homeScore,
        awayScore = awayScore,
        currentPeriod = currentPeriod,
        matchTime = matchTime,
        status = status,
        sportType = sportType,
        periodDuration = periodDuration,
        periodGoal = periodGoal,
        totalPeriods = totalPeriods,
        periodNames = periodNames
    )
}

fun com.eventcontrol.refereeapp.data.api.TeamDto.toTeam(): Team = Team(
    id = id,
    name = name,
    shortName = shortName,
    players = players?.mapNotNull { it?.toPlayer() } ?: emptyList()
)

fun com.eventcontrol.refereeapp.data.api.PlayerDto.toPlayer(): Player? {
    // Skip if essential data is missing
    if (id.isBlank() && name.isBlank()) return null
    return Player(
        id = id,
        name = name,
        number = number
    )
}

fun MatchEvent.toDto() = MatchEventDto(
    id = id,
    matchId = matchId,
    type = type.toApiString(),
    period = period,
    teamId = teamId,
    playerId = playerId,
    detail = detail,
    reportedBy = reportedBy,
    timestamp = timestamp
)

fun createMatchEvent(
    matchId: String,
    type: EventType,
    period: Int,
    teamId: String,
    playerId: String?,
    detail: Map<String, Any>?,
    reportedBy: String
) = MatchEvent(
    id = UUID.randomUUID().toString(),
    matchId = matchId,
    type = type,
    period = period,
    teamId = teamId,
    playerId = playerId,
    detail = detail,
    reportedBy = reportedBy,
    timestamp = System.currentTimeMillis()
)

/**
 * Distinguishable exception thrown when an event could only be saved to the offline queue.
 * Callers can use `is OfflineFallbackException` to detect this vs. genuine failures.
 */
class OfflineFallbackException(message: String) : Exception(message)
