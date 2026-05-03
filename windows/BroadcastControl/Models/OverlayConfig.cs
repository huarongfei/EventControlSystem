using System.Text.Json.Serialization;

namespace BroadcastControl.Models;

public class OverlayConfig
{
    [JsonPropertyName("show_home_team_name")]
    public bool ShowHomeTeamName { get; set; } = true;

    [JsonPropertyName("show_away_team_name")]
    public bool ShowAwayTeamName { get; set; } = true;

    [JsonPropertyName("show_score")]
    public bool ShowScore { get; set; } = true;

    [JsonPropertyName("show_sponsor")]
    public bool ShowSponsor { get; set; } = false;

    [JsonPropertyName("show_timer")]
    public bool ShowTimer { get; set; } = true;

    [JsonPropertyName("show_period")]
    public bool ShowPeriod { get; set; } = true;

    [JsonPropertyName("home_team_name")]
    public string HomeTeamName { get; set; } = "主队";

    [JsonPropertyName("away_team_name")]
    public string AwayTeamName { get; set; } = "客队";

    [JsonPropertyName("home_score")]
    public int HomeScore { get; set; }

    [JsonPropertyName("away_score")]
    public int AwayScore { get; set; }

    [JsonPropertyName("sponsor_text")]
    public string SponsorText { get; set; } = string.Empty;

    [JsonPropertyName("current_period")]
    public int CurrentPeriod { get; set; } = 1;

    [JsonPropertyName("timer_display")]
    public string TimerDisplay { get; set; } = "00:00";
}

public class MatchScoreState
{
    [JsonPropertyName("match_id")]
    public string MatchId { get; set; } = string.Empty;

    [JsonPropertyName("home_score")]
    public int HomeScore { get; set; }

    [JsonPropertyName("away_score")]
    public int AwayScore { get; set; }

    [JsonPropertyName("home_team_name")]
    public string HomeTeamName { get; set; } = string.Empty;

    [JsonPropertyName("away_team_name")]
    public string AwayTeamName { get; set; } = string.Empty;

    [JsonPropertyName("current_period")]
    public int CurrentPeriod { get; set; }

    [JsonPropertyName("time_elapsed_seconds")]
    public int TimeElapsedSeconds { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}
