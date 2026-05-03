using CommunityToolkit.Mvvm.ComponentModel;
using System.Text.Json.Serialization;

namespace BroadcastControl.Models;

public partial class BroadcastScene : ObservableObject
{
    public int SceneId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Which cameras are active in this scene
    /// </summary>
    public List<int> ActiveCameraIds { get; set; } = new();

    /// <summary>
    /// Layout mode for this scene
    /// </summary>
    public LayoutMode Layout { get; set; } = LayoutMode.Quad;

    /// <summary>
    /// Camera ordering (left to right, top to bottom)
    /// </summary>
    public List<int> CameraOrder { get; set; } = new();

    /// <summary>
    /// Transition settings for this scene
    /// </summary>
    public string TransitionMode { get; set; } = "CUT";
    public int TransitionDuration { get; set; } = 500;

    /// <summary>
    /// Overlay settings
    /// </summary>
    public bool ShowScore { get; set; } = true;
    public bool ShowTimer { get; set; } = true;
    public bool ShowTeamNames { get; set; } = true;

    /// <summary>
    /// Whether this scene is currently active
    /// </summary>
    [ObservableProperty]
    private bool _isActive;

    /// <summary>
    /// When this preset was created/modified
    /// </summary>
    public DateTime ModifiedTime { get; set; } = DateTime.Now;

    public override string ToString() => $"{Name} (ID: {SceneId})";
}
