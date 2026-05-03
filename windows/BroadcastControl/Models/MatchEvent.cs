namespace BroadcastControl.Models;

public class MatchEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string Type { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;

    public string DisplayTime => Timestamp.ToString("HH:mm:ss");

    public string TypeLabel => Type switch
    {
        "score" => "得分",
        "foul" => "犯规",
        "substitution" => "换人",
        "timeout" => "暂停",
        "camera" => "摄像机",
        "scene" => "场景",
        "match_end" => "结束",
        _ => Type
    };

    public System.Windows.Media.Brush TypeBrush => Type switch
    {
        "score" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(67, 97, 238)),
        "foul" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 35, 60)),
        "camera" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(6, 214, 160)),
        "scene" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(155, 89, 182)),
        "match_end" => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 35, 60)),
        _ => new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(90, 90, 110))
    };
}
