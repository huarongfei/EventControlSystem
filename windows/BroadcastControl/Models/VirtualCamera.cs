using System.IO;
using CommunityToolkit.Mvvm.ComponentModel;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace BroadcastControl.Models;

public partial class VirtualCamera : ObservableObject
{
    [ObservableProperty]
    private int _cameraId;

    [ObservableProperty]
    private string _label = $"CAM";

    [ObservableProperty]
    private string _name = "未命名摄像机";

    [ObservableProperty]
    private CameraSourceType _sourceType = CameraSourceType.Color;

    [ObservableProperty]
    private bool _isLive;

    [ObservableProperty]
    private bool _isActive = true;

    [ObservableProperty]
    private Brush _previewBrush = new SolidColorBrush(Colors.DarkGreen);

    [ObservableProperty]
    private string? _mediaPath;

    [ObservableProperty]
    private BitmapImage? _previewImage;

    [ObservableProperty]
    private Color _solidColor = Colors.DarkGreen;

    [ObservableProperty]
    private string _resolution = "1920x1080";

    [ObservableProperty]
    private int _frameRate = 30;

    public string SourceTypeDisplayName => SourceType switch
    {
        CameraSourceType.Color => "纯色背景",
        CameraSourceType.Image => "图片文件",
        CameraSourceType.Video => "视频文件",
        CameraSourceType.NDI => "NDI输入",
        CameraSourceType.CaptureDevice => "采集设备",
        _ => SourceType.ToString()
    };

    public VirtualCamera(int id)
    {
        CameraId = id;
        Label = $"CAM{id}";
        Name = $"摄像机 {id}";
        UpdatePreview();
    }

    partial void OnSolidColorChanged(Color value)
    {
        PreviewBrush = new SolidColorBrush(value);
    }

    partial void OnMediaPathChanged(string? value)
    {
        if (!string.IsNullOrEmpty(value) && File.Exists(value))
        {
            try
            {
                PreviewImage = new BitmapImage(new Uri(value));
                SourceType = CameraSourceType.Image;
            }
            catch { }
        }
    }

    public void UpdatePreview()
    {
        switch (SourceType)
        {
            case CameraSourceType.Color:
                PreviewBrush = new SolidColorBrush(SolidColor);
                break;
            case CameraSourceType.Image:
                if (!string.IsNullOrEmpty(MediaPath) && File.Exists(MediaPath))
                {
                    try
                    {
                        PreviewImage = new BitmapImage(new Uri(MediaPath));
                    }
                    catch { }
                }
                break;
        }
    }
}

public enum CameraSourceType
{
    Color,
    Image,
    Video,
    NDI,
    CaptureDevice
}
