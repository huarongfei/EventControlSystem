using System.Net.Http;
using System.Text.Json;
using ScoringSystem.Models;

namespace ScoringSystem.Services;

public class ApiService
{
    private static readonly HttpClient _httpClient = new()
    {
        Timeout = TimeSpan.FromSeconds(10)
    };

    private string _baseUrl = "http://localhost:3001";

    public string BaseUrl
    {
        get => _baseUrl;
        set => _baseUrl = value.TrimEnd('/');
    }

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<List<Event>> GetEventsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/events");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Event>>(json, _jsonOptions) ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    public async Task<Event?> CreateEventAsync(object eventData)
    {
        try
        {
            var json = JsonSerializer.Serialize(eventData, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/events", content);
            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Event>(responseJson, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<List<Match>> GetMatchesAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/matches");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Match>>(json, _jsonOptions) ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    public async Task<List<Match>> GetMatchesByEventAsync(string eventId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/events/{eventId}/matches");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Match>>(json, _jsonOptions) ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    public async Task<Match?> GetMatchAsync(string matchId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/matches/{matchId}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Match>(json, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<bool> UpdateScoreAsync(ScoreUpdate scoreUpdate)
    {
        try
        {
            var json = JsonSerializer.Serialize(scoreUpdate, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/matches/{scoreUpdate.MatchId}/score", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<bool> AddMatchEventAsync(MatchEvent matchEvent)
    {
        try
        {
            var json = JsonSerializer.Serialize(matchEvent, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/matches/{matchEvent.MatchId}/events", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<bool> UpdateMatchStatusAsync(string matchId, string status)
    {
        try
        {
            var body = new { status };
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PatchAsync($"{_baseUrl}/api/matches/{matchId}", content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    // ═══ 比赛管理 CRUD ═════════════════════════

    public async Task<Match?> CreateMatchAsync(object createDto)
    {
        try
        {
            var json = JsonSerializer.Serialize(createDto, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/matches", content);
            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Match>(responseJson, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<Match?> UpdateMatchAsync(string matchId, object updateDto)
    {
        try
        {
            var json = JsonSerializer.Serialize(updateDto, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"{_baseUrl}/api/matches/{matchId}", content);
            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Match>(responseJson, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<bool> DeleteMatchAsync(string matchId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"{_baseUrl}/api/matches/{matchId}");
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    // ═══ 队伍管理 ═════════════════════════════════
    public async Task<List<Team>> GetTeamsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/teams");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Team>>(json, _jsonOptions) ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    public async Task<Team?> CreateTeamAsync(object createDto)
    {
        try
        {
            var json = JsonSerializer.Serialize(createDto, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/api/teams", content);
            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Team>(responseJson, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<Team?> UpdateTeamAsync(string teamId, object updateDto)
    {
        try
        {
            var json = JsonSerializer.Serialize(updateDto, _jsonOptions);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync($"{_baseUrl}/api/teams/{teamId}", content);
            if (!response.IsSuccessStatusCode) return null;

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Team>(responseJson, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<bool> DeleteTeamAsync(string teamId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"{_baseUrl}/api/teams/{teamId}");
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<List<Player>> GetPlayersAsync(string teamId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/teams/{teamId}/players");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Player>>(json, _jsonOptions) ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    public async Task<Event?> GetEventAsync(string eventId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/events/{eventId}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<Event>(json, _jsonOptions);
        }
        catch (Exception)
        {
            return null;
        }
    }

    // ═══ 赛事删除 ════════════════════════════════════

    public async Task<bool> DeleteEventAsync(string eventId)
    {
        try
        {
            var response = await _httpClient.DeleteAsync($"{_baseUrl}/api/events/{eventId}");
            return response.IsSuccessStatusCode;
        }
        catch (Exception)
        {
            return false;
        }
    }

    // ═══ 犯规类型 ════════════════════════════════════

    /// <summary>
    /// 获取指定运动类型的所有犯规类型
    /// </summary>
    public async Task<List<FoulType>> GetFoulTypesAsync(string sportType)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/foul-types?sportType={sportType}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<FoulTypeResponse>(json, _jsonOptions);
            return result?.Data ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }

    /// <summary>
    /// 获取比赛详情（含队伍统计：得分、犯规等）
    /// GET /api/matches/:id/detail
    /// </summary>
    public async Task<MatchDetailResponse?> GetMatchDetailAsync(string matchId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/matches/{matchId}/detail");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MatchDetailResponse>(json, _jsonOptions);
            return result;
        }
        catch (Exception)
        {
            return null;
        }
    }

    /// <summary>
    /// 获取所有支持的运动类型及其犯规数量
    /// </summary>
    public async Task<Dictionary<string, SportFoulInfo>> GetSportFoulInfoAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/foul-types/sports");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<SportInfoResponse>(json, _jsonOptions);
            return result?.Data ?? new();
        }
        catch (Exception)
        {
            return new();
        }
    }
}
