using System.Text.Json.Serialization;

namespace ScoringSystem.Models;

public class Match
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("event_id")]
    public string EventId { get; set; } = string.Empty;

    [JsonPropertyName("event_name")]
    public string EventName { get; set; } = string.Empty;

    [JsonPropertyName("home_team")]
    public Team HomeTeam { get; set; } = new();

    [JsonPropertyName("away_team")]
    public Team AwayTeam { get; set; } = new();

    [JsonPropertyName("status")]
    public string Status { get; set; } = "upcoming";

    [JsonPropertyName("current_period")]
    public int CurrentPeriod { get; set; } = 1;

    [JsonPropertyName("total_periods")]
    public int TotalPeriods { get; set; } = 4;

    [JsonPropertyName("period_duration_minutes")]
    public int PeriodDurationMinutes { get; set; } = 10;

    [JsonPropertyName("start_time")]
    public DateTime? StartTime { get; set; }

    [JsonPropertyName("venue")]
    public string? Venue { get; set; }

    [JsonIgnore]
    public string DisplayName => $"{HomeTeam.Name} vs {AwayTeam.Name}";

    [JsonPropertyName("home_score")]
    public int HomeScore { get; set; }

    [JsonPropertyName("away_score")]
    public int AwayScore { get; set; }

    [JsonPropertyName("sport_type")]
    public string SportType { get; set; } = "basketball";

    [JsonPropertyName("sport_emoji")]
    public string SportEmoji { get; set; } = "🏀";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "team";

    [JsonIgnore]
    public bool CanStart => Status == "not_started" || Status == "upcoming";

    [JsonIgnore]
    public bool CanEnd => Status == "running" || Status == "live" || Status == "paused";

    [JsonIgnore]
    public string StatusLabel => Status switch
    {
        "live" => "进行中",
        "upcoming" => "未开始",
        "not_started" => "未开始",
        "finished" => "已结束",
        "paused" => "已暂停",
        _ => Status
    };
}

public class EventCount
{
    [JsonPropertyName("matches")]
    public int Matches { get; set; }
}

public class Event
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("sport_type")]
    public string? SportType { get; set; }

    [JsonPropertyName("matches")]
    public List<Match>? Matches { get; set; }

    [JsonPropertyName("_count")]
    public EventCount? Count { get; set; }

    [JsonIgnore]
    public bool IsSelected { get; set; }

    [JsonIgnore]
    public bool IsSelectedForManagement { get; set; }

    [JsonIgnore]
    public int MatchCount => Matches?.Count ?? Count?.Matches ?? 0;
}
