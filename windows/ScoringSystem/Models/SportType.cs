using System.Text.Json.Serialization;

namespace ScoringSystem.Models;

public class SportType
{
    [JsonPropertyName("sportType")]
    public string SportTypeKey { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("emoji")]
    public string Emoji { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = "team";

    [JsonPropertyName("periodCount")]
    public int PeriodCount { get; set; } = 4;

    [JsonPropertyName("periodDuration")]
    public int PeriodDuration { get; set; } = 10;

    [JsonPropertyName("periodGoal")]
    public int PeriodGoal { get; set; } = 0;

    // 显示用的简称
    public string ShortName => $"{Emoji} {DisplayName}";
}
