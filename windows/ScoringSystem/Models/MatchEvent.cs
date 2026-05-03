using System.Text.Json.Serialization;

namespace ScoringSystem.Models;

public enum MatchEventType
{
    Score,
    Foul,
    Substitution,
    Timeout,
    PeriodChange,
    MatchStart,
    MatchEnd
}

public class MatchEvent
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

    [JsonPropertyName("match_id")]
    public string MatchId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("team")]
    public string? Team { get; set; }

    [JsonPropertyName("player_id")]
    public string? PlayerId { get; set; }

    [JsonPropertyName("player_number")]
    public int? PlayerNumber { get; set; }

    [JsonPropertyName("player_name")]
    public string? PlayerName { get; set; }

    [JsonPropertyName("detail")]
    public string? Detail { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("points")]
    public int? Points { get; set; }

    [JsonPropertyName("period")]
    public int Period { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public string DisplayTime => Timestamp.ToString("HH:mm:ss");

    [JsonIgnore]
    public string TeamLabel => Team switch
    {
        "home" => "主队",
        "away" => "客队",
        _ => ""
    };

    [JsonIgnore]
    public string TypeIcon => Type switch
    {
        "score" => "🏀",
        "foul" => "🚫",
        "substitution" => "🔄",
        "timeout" => "⏸",
        "match_end" => "🏁",
        "match_start" => "▶",
        _ => "📌"
    };

    [JsonIgnore]
    public string TypeLabel => Type switch
    {
        "score" => "得分",
        "foul" => "犯规",
        "substitution" => "换人",
        "timeout" => "暂停",
        "match_end" => "结束",
        _ => Type
    };

    [JsonIgnore]
    public System.Windows.Media.Brush TypeBrush => Type switch
    {
        "score" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(67, 97, 238)),
        "foul" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 35, 60)),
        "substitution" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(155, 89, 182)),
        "timeout" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(243, 156, 18)),
        "match_end" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 35, 60)),
        _ => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(90, 90, 110))
    };
}

public class MatchState
{
    [JsonPropertyName("match_id")]
    public string MatchId { get; set; } = string.Empty;

    [JsonPropertyName("home_score")]
    public int HomeScore { get; set; }

    [JsonPropertyName("away_score")]
    public int AwayScore { get; set; }

    [JsonPropertyName("current_period")]
    public int CurrentPeriod { get; set; }

    [JsonPropertyName("total_periods")]
    public int TotalPeriods { get; set; }

    [JsonPropertyName("time_elapsed_seconds")]
    public int TimeElapsedSeconds { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}
