using System.IO;
using BroadcastControl.Models;
using System.Text.Json;

namespace BroadcastControl.Services;

public class BroadcastService
{
    private readonly List<CameraPreview> _cameras = new();
    private readonly List<BroadcastScene> _scenes = new();
    private readonly string _presetFilePath;

    public IReadOnlyList<CameraPreview> Cameras => _cameras.AsReadOnly();
    public IReadOnlyList<BroadcastScene> Scenes => _scenes.AsReadOnly();

    public BroadcastService()
    {
        _presetFilePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BroadcastControl", "scene_presets.json");
        
        InitializeCameras();
        LoadPresets();
        if (_scenes.Count == 0)
        {
            InitializeScenes();
            SavePresets();
        }
    }

    private void InitializeCameras()
    {
        var colors = new[]
        {
            System.Windows.Media.Color.FromRgb(34, 139, 34),
            System.Windows.Media.Color.FromRgb(30, 80, 180),
            System.Windows.Media.Color.FromRgb(180, 30, 30),
            System.Windows.Media.Color.FromRgb(160, 120, 40),
            System.Windows.Media.Color.FromRgb(120, 40, 160),
            System.Windows.Media.Color.FromRgb(40, 150, 150),
        };

        for (int i = 0; i < 6; i++)
        {
            _cameras.Add(new CameraPreview
            {
                CameraId = i + 1,
                CameraName = $"摄像机 {i + 1}",
                Label = $"CAM{i + 1}",
                IsActive = i < 4,
                PreviewColor = colors[i % colors.Length]
            });
        }
    }

    private void InitializeScenes()
    {
        var sceneConfigs = new (int Id, string Name, string Desc, LayoutMode Layout, List<int> Cams)[]
        {
            (1, "四分屏全景", "四分屏全景", LayoutMode.Quad, new() { 1, 2, 3, 4 }),
            (2, "主摄像机特写", "主摄像机特写", LayoutMode.Single, new() { 1 }),
            (3, "双分屏左右", "双分屏 - 左右", LayoutMode.Double, new() { 1, 2 }),
            (4, "双分屏上下", "双分屏 - 上下", LayoutMode.Double, new() { 3, 4 }),
            (5, "主场特写", "主场特写", LayoutMode.Single, new() { 3 }),
            (6, "客场特写", "客场特写", LayoutMode.Single, new() { 4 }),
            (7, "比分画面", "比分画面", LayoutMode.Single, new() { 1 }),
            (8, "自定义", "自定义场景", LayoutMode.Quad, new() { 1, 2, 3, 4 }),
        };

        foreach (var cfg in sceneConfigs)
        {
            _scenes.Add(new BroadcastScene
            {
                SceneId = cfg.Id,
                Name = cfg.Name,
                Description = cfg.Desc,
                Layout = cfg.Layout,
                ActiveCameraIds = cfg.Cams,
                CameraOrder = new List<int>(cfg.Cams),
                TransitionMode = "CUT",
                TransitionDuration = 500,
                ShowScore = true,
                ShowTimer = true,
                ShowTeamNames = true
            });
        }
    }

    public void ActivateScene(int sceneId)
    {
        var scene = _scenes.FirstOrDefault(s => s.SceneId == sceneId);
        if (scene == null) return;

        foreach (var cam in _cameras)
        {
            cam.IsActive = scene.ActiveCameraIds.Contains(cam.CameraId);
            cam.IsLive = scene.CameraOrder.FirstOrDefault() == cam.CameraId;
        }
    }

    public void SelectCamera(int cameraId)
    {
        foreach (var cam in _cameras)
        {
            cam.IsLive = cam.CameraId == cameraId;
        }
    }

    #region Scene Preset Management
    
    public void SavePresets()
    {
        try
        {
            var dir = Path.GetDirectoryName(_presetFilePath)!;
            Directory.CreateDirectory(dir);
            
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(_scenes, options);
            File.WriteAllText(_presetFilePath, json);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[BroadcastService] SavePresets failed: {ex.Message}");
        }
    }

    public void LoadPresets()
    {
        try
        {
            if (File.Exists(_presetFilePath))
            {
                var json = File.ReadAllText(_presetFilePath);
                var presets = JsonSerializer.Deserialize<List<BroadcastScene>>(json);
                if (presets != null)
                {
                    _scenes.Clear();
                    _scenes.AddRange(presets);
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[BroadcastService] LoadPresets failed: {ex.Message}");
        }
    }

    public BroadcastScene? GetSceneById(int sceneId) => _scenes.FirstOrDefault(s => s.SceneId == sceneId);

    public void AddOrUpdateScene(BroadcastScene scene)
    {
        var existing = _scenes.FirstOrDefault(s => s.SceneId == scene.SceneId);
        if (existing != null)
        {
            existing.Name = scene.Name;
            existing.Description = scene.Description;
            existing.Layout = scene.Layout;
            existing.ActiveCameraIds = new List<int>(scene.ActiveCameraIds);
            existing.CameraOrder = new List<int>(scene.CameraOrder);
            existing.TransitionMode = scene.TransitionMode;
            existing.TransitionDuration = scene.TransitionDuration;
            existing.ShowScore = scene.ShowScore;
            existing.ShowTimer = scene.ShowTimer;
            existing.ShowTeamNames = scene.ShowTeamNames;
            existing.ModifiedTime = DateTime.Now;
        }
        else
        {
            var newId = _scenes.Count > 0 ? _scenes.Max(s => s.SceneId) + 1 : 1;
            scene.SceneId = newId;
            _scenes.Add(scene);
        }
        SavePresets();
    }

    public void DeleteScene(int sceneId)
    {
        var scene = _scenes.FirstOrDefault(s => s.SceneId == sceneId);
        if (scene != null && _scenes.Count > 1)
        {
            _scenes.Remove(scene);
            SavePresets();
        }
    }

    public BroadcastScene CreatePresetFromCurrent(string name, string description, 
        LayoutMode layout, List<int> activeCameraIds, List<int> cameraOrder,
        string transitionMode, int transitionDuration,
        bool showScore, bool showTimer, bool showTeamNames)
    {
        var newScene = new BroadcastScene
        {
            Name = name,
            Description = description,
            Layout = layout,
            ActiveCameraIds = new List<int>(activeCameraIds),
            CameraOrder = new List<int>(cameraOrder),
            TransitionMode = transitionMode,
            TransitionDuration = transitionDuration,
            ShowScore = showScore,
            ShowTimer = showTimer,
            ShowTeamNames = showTeamNames,
            ModifiedTime = DateTime.Now
        };
        return newScene;
    }

    #endregion
}
