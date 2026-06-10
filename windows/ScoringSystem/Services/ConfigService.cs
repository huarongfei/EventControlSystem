using System.IO;
using System.Text.Json;

namespace ScoringSystem.Services;

public class ConfigService
{
    private static readonly string ConfigPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ScoringSystem",
        "config.json"
    );

    public AppConfig Config { get; private set; } = new();

    public ConfigService()
    {
        LoadConfig();
    }

    public void LoadConfig()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath);
                Config = JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[ConfigService] LoadConfig failed: {ex.Message}");
            Config = new AppConfig();
        }
    }

    public void SaveConfig()
    {
        try
        {
            var dir = Path.GetDirectoryName(ConfigPath)!;
            if (!Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var json = JsonSerializer.Serialize(Config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(ConfigPath, json);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[ConfigService] SaveConfig failed: {ex.Message}");
        }
    }
}

public class AppConfig
{
    public string ServerUrl { get; set; } = "ws://localhost:3001";
    public string? LastMatchId { get; set; }
    public string? LastEventId { get; set; }
    public List<int> ScoreButtons { get; set; } = new() { 1, 2, 3 };
    public int PeriodDurationMinutes { get; set; } = 10;
    public int TotalPeriods { get; set; } = 4;
    public bool IsFirstRun { get; set; } = true;
    public List<string> ServerHistory { get; set; } = new();
}
