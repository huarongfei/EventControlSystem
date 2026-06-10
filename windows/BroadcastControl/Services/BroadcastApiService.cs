using System.Diagnostics;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using BroadcastControl.Models;

namespace BroadcastControl.Services;

public class BroadcastApiService
{
    private readonly HttpClient _httpClient;
    private string _baseUrl = "http://localhost:3001";

    public string BaseUrl
    {
        get => _baseUrl;
        set => _baseUrl = value.TrimEnd('/');
    }

    /// <summary>
    /// Last error message from any API call — UI can display this to users.
    /// </summary>
    public string? LastError { get; private set; }

    public BroadcastApiService(HttpClient? httpClient = null)
    {
        _httpClient = httpClient ?? new HttpClient();
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Log an exception and store its message in LastError for UI display.
    /// </summary>
    private void LogError(string operation, Exception ex)
    {
        LastError = $"{operation}: {ex.Message}";
        Debug.WriteLine($"[BroadcastApi] {LastError}", "ApiError");
    }

    /// <summary>
    /// GET /api/broadcast/:matchId - Fetch broadcast scene for a match
    /// </summary>
    public async Task<BroadcastSceneResponse?> GetBroadcastSceneAsync(string matchId)
    {
        try
        {
            var url = $"{_baseUrl}/api/broadcast/{matchId}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<BroadcastSceneResponse>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            LogError($"GetBroadcastScene({matchId})", ex);
            return null;
        }
    }

    /// <summary>
    /// PUT /api/broadcast/:matchId - Update broadcast scene for a match
    /// </summary>
    public async Task<BroadcastSceneResponse?> UpdateBroadcastSceneAsync(string matchId, BroadcastSceneUpdate update)
    {
        try
        {
            var url = $"{_baseUrl}/api/broadcast/{matchId}";
            var json = JsonSerializer.Serialize(update, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(url, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<BroadcastSceneResponse>(responseJson, JsonOptions);
        }
        catch (Exception ex)
        {
            LogError($"UpdateBroadcastScene({matchId})", ex);
            return null;
        }
    }
}

public class BroadcastSceneResponse
{
    public string? Id { get; set; }
    public string? MatchId { get; set; }
    public string? Name { get; set; }
    public string? Layout { get; set; }
    public string? PrimaryCamera { get; set; }
    public string? Transition { get; set; }
    public string? Overlay { get; set; }
    public DateTime? CreatedAt { get; set; }
}

public class BroadcastSceneUpdate
{
    public string? Name { get; set; }
    public string? Layout { get; set; }
    public string? PrimaryCamera { get; set; }
    public object? Overlay { get; set; }
    public string? Transition { get; set; }
}
