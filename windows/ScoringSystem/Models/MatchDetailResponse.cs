using System.Text.Json.Serialization;

namespace ScoringSystem.Models;

/// <summary>
/// Match detail API response from GET /api/matches/:id/detail
/// </summary>
public class MatchDetailResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("sportType")]
    public string SportType { get; set; } = string.Empty;

    [JsonPropertyName("homeStats")]
    public TeamStats? HomeStats { get; set; }

    [JsonPropertyName("awayStats")]
    public TeamStats? AwayStats { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("currentPeriod")]
    public int CurrentPeriod { get; set; }

    [JsonPropertyName("gameClock")]
    public string GameClock { get; set; } = string.Empty;
}

/// <summary>
/// Dynamic team stats (field names depend on sport rule config)
/// </summary>
public class TeamStats
{
    [JsonPropertyName("teamId")]
    public string TeamId { get; set; } = string.Empty;

    [JsonPropertyName("score")]
    public int Score { get; set; }

    // Dynamic fields (e.g. "犯规", "篮板", "助攻") are captured via JsonExtensionData
    [JsonExtensionData]
    public Dictionary<string, System.Text.Json.JsonElement>? ExtraFields { get; set; }

    /// <summary>Get a stat value by Chinese field name (e.g. "犯规")</summary>
    public int GetStat(string fieldName, int defaultValue = 0)
    {
        if (ExtraFields != null &&
            ExtraFields.TryGetValue(fieldName, out var element) &&
            element.ValueKind == System.Text.Json.JsonValueKind.Number)
        {
            return element.GetInt32();
        }
        return defaultValue;
    }
}
