using System.Text.Json.Serialization;

namespace ScoringSystem.Models;

public class ScoreUpdate
{
    [JsonPropertyName("match_id")]
    public string MatchId { get; set; } = string.Empty;

    [JsonPropertyName("team")]
    public string Team { get; set; } = string.Empty; // "home" or "away"

    [JsonPropertyName("points")]
    public int Points { get; set; }

    [JsonPropertyName("player_number")]
    public int? PlayerNumber { get; set; }

    [JsonPropertyName("player_name")]
    public string? PlayerName { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
