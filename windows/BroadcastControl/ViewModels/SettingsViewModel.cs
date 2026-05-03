using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BroadcastControl.Models;
using System.Collections.ObjectModel;
using System.IO;
using Microsoft.Win32;
using System.Windows.Media;

namespace BroadcastControl.ViewModels;

public partial class SettingsViewModel : ObservableObject
{
    private readonly MainViewModel _mainViewModel;

    [ObservableProperty]
    private ObservableCollection<VirtualCamera> _cameras = new();

    [ObservableProperty]
    private VirtualCamera? _selectedCamera;

    [ObservableProperty]
    private string _serverUrl = "ws://localhost:3001";

    [ObservableProperty]
    private bool _autoConnect;

    [ObservableProperty]
    private bool _enableOverlay = true;

    [ObservableProperty]
    private bool _enableSlowMotion = true;

    [ObservableProperty]
    private string _defaultTransition = "CUT";

    [ObservableProperty]
    private int _autoTransitionDuration = 500;

    [ObservableProperty]
    private string _recordPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyVideos), "Broadcast");

    [ObservableProperty]
    private bool _enableRecording;

    public SettingsViewModel(MainViewModel mainViewModel)
    {
        _mainViewModel = mainViewModel;
        LoadSettings();
    }

    private void LoadSettings()
    {
        ServerUrl = _mainViewModel.ServerUrl;
        
        // Initialize cameras from main view model
        Cameras.Clear();
        foreach (var cam in _mainViewModel.Cameras)
        {
            Cameras.Add(new VirtualCamera(cam.CameraId)
            {
                Label = cam.Label,
                Name = cam.CameraName,
                IsActive = cam.IsActive,
                IsLive = cam.IsLive
            });
        }

        if (Cameras.Count > 0)
            SelectedCamera = Cameras[0];

        // Load saved settings
        var configPath = GetConfigPath();
        if (File.Exists(configPath))
        {
            try
            {
                var json = File.ReadAllText(configPath);
                var config = System.Text.Json.JsonSerializer.Deserialize<BroadcastConfig>(json);
                if (config != null)
                {
                    AutoConnect = config.AutoConnect;
                    EnableOverlay = config.EnableOverlay;
                    EnableSlowMotion = config.EnableSlowMotion;
                    DefaultTransition = config.DefaultTransition;
                    AutoTransitionDuration = config.AutoTransitionDuration;
                    RecordPath = config.RecordPath;
                    EnableRecording = config.EnableRecording;
                }
            }
            catch { }
        }
    }

    [RelayCommand]
    private void SaveSettings()
    {
        _mainViewModel.ServerUrl = ServerUrl;

        var config = new BroadcastConfig
        {
            ServerUrl = ServerUrl,
            AutoConnect = AutoConnect,
            EnableOverlay = EnableOverlay,
            EnableSlowMotion = EnableSlowMotion,
            DefaultTransition = DefaultTransition,
            AutoTransitionDuration = AutoTransitionDuration,
            RecordPath = RecordPath,
            EnableRecording = EnableRecording
        };

        var configPath = GetConfigPath();
        Directory.CreateDirectory(Path.GetDirectoryName(configPath)!);
        var json = System.Text.Json.JsonSerializer.Serialize(config, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(configPath, json);

        // Sync camera settings back to main view model
        foreach (var camera in Cameras)
        {
            var mainCam = _mainViewModel.Cameras.FirstOrDefault(c => c.CameraId == camera.CameraId);
            if (mainCam != null)
            {
                mainCam.CameraName = camera.Name;
                mainCam.IsActive = camera.IsActive;
            }
            else
            {
                // New camera added in settings
                _mainViewModel.Cameras.Add(new CameraPreview
                {
                    CameraId = camera.CameraId,
                    CameraName = camera.Name,
                    Label = camera.Label,
                    IsActive = camera.IsActive,
                    PreviewColor = camera.SolidColor
                });
            }
        }

        // Remove cameras that were deleted in settings
        var mainCamIds = Cameras.Select(c => c.CameraId).ToHashSet();
        var toRemove = _mainViewModel.Cameras.Where(c => !mainCamIds.Contains(c.CameraId)).ToList();
        foreach (var cam in toRemove)
        {
            _mainViewModel.Cameras.Remove(cam);
        }
    }

    [RelayCommand]
    private void AddCamera()
    {
        var newId = Cameras.Count > 0 ? Cameras.Max(c => c.CameraId) + 1 : 1;
        var camera = new VirtualCamera(newId)
        {
            Name = $"摄像机 {newId}"
        };
        Cameras.Add(camera);
        SelectedCamera = camera;

        // Sync to main view model
        _mainViewModel.Cameras.Add(new CameraPreview
        {
            CameraId = newId,
            CameraName = camera.Name,
            Label = camera.Label,
            IsActive = true,
            PreviewColor = camera.SolidColor
        });
    }

    [RelayCommand]
    private void RemoveCamera(VirtualCamera? camera)
    {
        if (camera == null || Cameras.Count <= 1) return;
        Cameras.Remove(camera);
        if (SelectedCamera == camera)
            SelectedCamera = Cameras.FirstOrDefault();

        // Sync removal to main view model
        var mainCam = _mainViewModel.Cameras.FirstOrDefault(c => c.CameraId == camera.CameraId);
        if (mainCam != null)
        {
            _mainViewModel.Cameras.Remove(mainCam);
        }
    }

    [RelayCommand]
    private void BrowseMediaFile()
    {
        if (SelectedCamera == null) return;

        var dialog = new OpenFileDialog
        {
            Title = "选择媒体文件",
            Filter = "图片文件|*.jpg;*.jpeg;*.png;*.bmp;*.gif|视频文件|*.mp4;*.avi;*.mov;*.mkv|所有文件|*.*",
            InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyPictures)
        };

        if (dialog.ShowDialog() == true)
        {
            SelectedCamera.MediaPath = dialog.FileName;
            SelectedCamera.SourceType = CameraSourceType.Image;
            SelectedCamera.UpdatePreview();
        }
    }

    [RelayCommand]
    private void UpdateCameraPreview()
    {
        SelectedCamera?.UpdatePreview();
    }

    [RelayCommand]
    private void BrowseRecordPath()
    {
        var dialog = new Microsoft.Win32.OpenFolderDialog
        {
            Title = "选择录制文件保存位置",
            InitialDirectory = RecordPath
        };

        if (dialog.ShowDialog() == true)
        {
            RecordPath = dialog.FolderName;
        }
    }

    [RelayCommand]
    private void SetCameraColor(string colorHex)
    {
        if (SelectedCamera == null) return;
        
        try
        {
            var color = (Color)ColorConverter.ConvertFromString(colorHex);
            SelectedCamera.SolidColor = color;
            SelectedCamera.SourceType = CameraSourceType.Color;
        }
        catch { }
    }

    private string GetConfigPath()
    {
        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BroadcastControl",
            "settings.json");
    }
}

public class BroadcastConfig
{
    public string ServerUrl { get; set; } = "ws://localhost:3001";
    public bool AutoConnect { get; set; }
    public bool EnableOverlay { get; set; } = true;
    public bool EnableSlowMotion { get; set; } = true;
    public string DefaultTransition { get; set; } = "CUT";
    public int AutoTransitionDuration { get; set; } = 500;
    public string RecordPath { get; set; } = "";
    public bool EnableRecording { get; set; }
}
