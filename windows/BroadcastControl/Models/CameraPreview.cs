using System.Windows.Media;

namespace BroadcastControl.Models;

public class CameraPreview
{
    public int CameraId { get; set; }
    public string CameraName { get; set; } = $"CAM{(object?)1}";
    public string Label { get; set; } = "CAM1";
    public bool IsActive { get; set; }
    public bool IsLive { get; set; }

    /// <summary>
    /// Simulated camera color for placeholder display
    /// </summary>
    public Color PreviewColor { get; set; } = Colors.DarkGreen;
}

public enum LayoutMode
{
    Single,
    Double,
    Quad
}
