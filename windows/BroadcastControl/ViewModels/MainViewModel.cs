using System.Collections.ObjectModel;
using System.IO;
using System.Text.Json;
using System.Windows.Media;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using BroadcastControl.Models;
using BroadcastControl.Services;

namespace BroadcastControl.ViewModels;

public partial class MainViewModel : ObservableObject, IDisposable
{
    private readonly BroadcastService _broadcastService;
    private readonly SocketService _socketService;
    private readonly BroadcastApiService _apiService;
    private bool _disposed;

    #region Observable Properties

    [ObservableProperty]
    private string _serverUrl = "ws://localhost:3001";

    [ObservableProperty]
    private string _matchId = string.Empty;

    [ObservableProperty]
    private bool _isConnected;

    [ObservableProperty]
    private string _connectionStatus = "未连接";

    [ObservableProperty]
    private string _connectionButtonText = "连接";

    [ObservableProperty]
    private ObservableCollection<CameraPreview> _cameras = new();

    [ObservableProperty]
    private ObservableCollection<BroadcastScene> _scenes = new();

    [ObservableProperty]
    private BroadcastScene? _activeScene;

    [ObservableProperty]
    private CameraPreview? _programCamera;

    [ObservableProperty]
    private int _selectedCameraId;

    [ObservableProperty]
    private LayoutMode _currentLayout = LayoutMode.Quad;

    [ObservableProperty]
    private string _transitionMode = "CUT";

    [ObservableProperty]
    private int _transitionDuration = 500;

    [ObservableProperty]
    private bool _showScore = true;

    [ObservableProperty]
    private bool _showTimer = true;

    [ObservableProperty]
    private bool _showTeamNames = true;

    [ObservableProperty]
    private string _homeTeamName = "主队";

    [ObservableProperty]
    private string _awayTeamName = "客队";

    [ObservableProperty]
    private int _homeScore;

    [ObservableProperty]
    private int _awayScore;

    [ObservableProperty]
    private int _currentPeriod = 1;

    [ObservableProperty]
    private string _timerDisplay = "00:00";

    [ObservableProperty]
    private bool _slowMotionMarkedIn;

    [ObservableProperty]
    private bool _slowMotionMarkedOut;

    [ObservableProperty]
    private string _slowMotionSpeed = "0.5x";

    [ObservableProperty]
    private bool _slowMotionIsPlaying;

    [ObservableProperty]
    private string _slowMotionStatus = "就绪";

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private ObservableCollection<MatchEvent> _eventLog = new();

    // Scene Preset Management Properties
    [ObservableProperty]
    private string _newPresetName = string.Empty;

    [ObservableProperty]
    private string _newPresetDescription = string.Empty;

    [ObservableProperty]
    private BroadcastScene? _selectedPresetForEdit;

    // Virtual Camera Properties
    [ObservableProperty]
    private bool _isVirtualCameraRunning;

    [ObservableProperty]
    private string _virtualCameraStatus = "未启动";

    // Tutorial Properties
    [ObservableProperty]
    private bool _showTutorial;

    [ObservableProperty]
    private int _tutorialStep;

    [ObservableProperty]
    private string _tutorialTitle = "新手引导";

    [ObservableProperty]
    private string _tutorialContent = "欢迎使用导播控制台";

    [ObservableProperty]
    private string _tutorialDescription = "让我们通过几个简单的步骤了解如何使用本系统";

    [ObservableProperty]
    private string _tutorialNextButtonText = "下一步";

    [ObservableProperty]
    private int _tutorialProgress;

    // Help Properties
    [ObservableProperty]
    private bool _showHelp;

    // Keyboard Shortcut Help
    [ObservableProperty]
    private bool _showShortcutHelp;

    #endregion

    private readonly List<TutorialStep> _tutorialSteps = new()
    {
        new TutorialStep
        {
            Title = "步骤 1/5",
            Content = "连接服务器",
            Description = "首先在顶部输入服务器地址（如 ws://localhost:3001），然后点击连接按钮。连接成功后状态指示灯会变为蓝色。"
        },
        new TutorialStep
        {
            Title = "步骤 2/5",
            Content = "使用场景预设",
            Description = "点击顶部的场景按钮（全屏、双画面、四分屏等）快速切换不同的画面布局。当前激活的场景会高亮显示。右键点击场景按钮可管理预设（保存、删除）。"
        },
        new TutorialStep
        {
            Title = "步骤 3/5",
            Content = "切换摄像机",
            Description = "使用左侧预览区的 CAM 按钮或直接按数字键 1-6 切换摄像机。当前直播的摄像机会显示红色。"
        },
        new TutorialStep
        {
            Title = "步骤 4/5",
            Content = "控制转场与慢动作",
            Description = "使用 CUT 按钮进行即时切换，或使用 AUTO 按钮进行淡入淡出转场。慢动作控制可以帮助你标记精彩瞬间，按 [ 标记入点，按 ] 标记出点。"
        },
        new TutorialStep
        {
            Title = "步骤 5/5",
            Content = "虚拟摄像机",
            Description = "点击设置按钮进入设置界面，可以配置虚拟摄像机（选择源类型、分辨率、帧率等）。虚拟摄像机会输出到系统供其他软件使用。"
        }
    };

    public MainViewModel()
    {
        _broadcastService = new BroadcastService();
        _socketService = new SocketService();
        _apiService = new BroadcastApiService();

        LoadCameras();
        LoadScenes();

        _socketService.OnConnected += () =>
        {
            App.Current.Dispatcher.Invoke(() =>
            {
                IsConnected = true;
                ConnectionStatus = "已连接";
                ConnectionButtonText = "断开";
                StatusMessage = string.Empty;
            });
        };

        _socketService.OnDisconnected += () =>
        {
            App.Current.Dispatcher.Invoke(() =>
            {
                IsConnected = false;
                ConnectionStatus = "连接断开";
                ConnectionButtonText = "连接";
                StatusMessage = "⚠ WebSocket 连接已断开";
            });
        };

        _socketService.OnScoreUpdate += HandleScoreUpdate;

        _socketService.OnSwitchScene += HandleSwitchScene;

        _socketService.OnVirtualCameraStatus += (status, isRunning) =>
        {
            App.Current.Dispatcher.Invoke(() =>
            {
                IsVirtualCameraRunning = isRunning;
                VirtualCameraStatus = isRunning ? "运行中" : "已停止";
            });
        };

        _socketService.OnSlowMotionUpdate += HandleSlowMotionUpdate;

        _socketService.OnError += (err) =>
        {
            App.Current.Dispatcher.Invoke(() =>
            {
                StatusMessage = $"⚠ {err}";
            });
        };

        // Check first run
        if (!LoadConfig())
        {
            ShowTutorial = true;
            UpdateTutorialContent();
        }
    }

    private bool LoadConfig()
    {
        var configPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BroadcastControl", "config.json");
        
        if (File.Exists(configPath))
        {
            try
            {
                var json = File.ReadAllText(configPath);
                var config = System.Text.Json.JsonSerializer.Deserialize<AppConfig>(json);
                return config?.HasCompletedTutorial ?? false;
            }
            catch { }
        }
        return false;
    }

    private void SaveConfig()
    {
        var configPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "BroadcastControl");
        Directory.CreateDirectory(configPath);
        
        var config = new AppConfig { HasCompletedTutorial = true };
        var json = System.Text.Json.JsonSerializer.Serialize(config);
        File.WriteAllText(Path.Combine(configPath, "config.json"), json);
    }

    private void HandleScoreUpdate(MatchScoreState state)
    {
        App.Current.Dispatcher.Invoke(() =>
        {
            HomeScore = state.HomeScore;
            AwayScore = state.AwayScore;
            CurrentPeriod = state.CurrentPeriod;

            var min = state.TimeElapsedSeconds / 60;
            var sec = state.TimeElapsedSeconds % 60;
            TimerDisplay = $"{min:D2}:{sec:D2}";

            // Add to event log
            var evt = new MatchEvent
            {
                Type = "score",
                Description = $"比分更新: {state.HomeScore} - {state.AwayScore}",
                Timestamp = DateTime.Now
            };
            EventLog.Insert(0, evt);
        });
    }

    private void HandleSwitchScene(BroadcastScene scene)
    {
        _ = App.Current.Dispatcher.InvokeAsync(async () =>
        {
            var localScene = Scenes.FirstOrDefault(s => s.SceneId == scene.SceneId);
            if (localScene != null)
            {
                await SelectSceneCommand.ExecuteAsync(localScene);
            }
            else
            {
                // Scene from server not found locally, add it
                _broadcastService.AddOrUpdateScene(scene);
                LoadScenes();
                localScene = Scenes.FirstOrDefault(s => s.SceneId == scene.SceneId);
                if (localScene != null)
                {
                    await SelectSceneCommand.ExecuteAsync(localScene);
                }
            }

            var evt = new MatchEvent
            {
                Type = "scene",
                Description = $"服务器切换场景: {scene.Name}",
                Timestamp = DateTime.Now
            };
            EventLog.Insert(0, evt);
        });
    }

    private void HandleSlowMotionUpdate(SlowMotionState state)
    {
        App.Current.Dispatcher.Invoke(() =>
        {
            SlowMotionMarkedIn = state.MarkedIn;
            SlowMotionMarkedOut = state.MarkedOut;
            SlowMotionIsPlaying = state.IsPlaying;
            if (!string.IsNullOrEmpty(state.PlaybackSpeed))
                SlowMotionSpeed = state.PlaybackSpeed;
            SlowMotionStatus = state.IsPlaying ? $"播放中 ({state.PlaybackSpeed})" : "就绪";
        });
    }

    #region Commands

    [RelayCommand]
    private async Task ConnectAsync()
    {
        if (IsConnected)
        {
            await DisconnectAsync();
            return;
        }

        await _socketService.ConnectAsync(ServerUrl);

        if (!_socketService.IsConnected)
        {
            StatusMessage = "⚠ 连接失败，请检查服务器地址";
        }
    }

    [RelayCommand]
    private async Task DisconnectAsync()
    {
        await _socketService.DisconnectAsync();
    }

    [RelayCommand]
    private void OpenSettings()
    {
        var settingsWindow = new Views.SettingsWindow(this);
        settingsWindow.ShowDialog();
    }

    [RelayCommand]
    private async Task SelectSceneAsync(BroadcastScene? scene)
    {
        if (scene == null) return;

        foreach (var s in Scenes)
        {
            s.IsActive = (s.SceneId == scene.SceneId);
        }

        ActiveScene = scene;
        _broadcastService.ActivateScene(scene.SceneId);
        CurrentLayout = scene.Layout;
        TransitionMode = scene.TransitionMode;
        TransitionDuration = scene.TransitionDuration;
        ShowScore = scene.ShowScore;
        ShowTimer = scene.ShowTimer;
        ShowTeamNames = scene.ShowTeamNames;

        foreach (var cam in Cameras)
        {
            var svc = _broadcastService.Cameras.First(c => c.CameraId == cam.CameraId);
            cam.IsActive = svc.IsActive;
            cam.IsLive = svc.IsLive;
        }

        ProgramCamera = Cameras.FirstOrDefault(c => c.IsLive);

        await _socketService.EmitSceneChangeAsync(scene.SceneId, scene.Name,
            string.IsNullOrEmpty(MatchId) ? null : MatchId);

        var evt = new MatchEvent
        {
            Type = "scene",
            Description = $"切换场景: {scene.Name}",
            Timestamp = DateTime.Now
        };
        EventLog.Insert(0, evt);
    }

    [RelayCommand]
    private void SetTransitionMode(string mode)
    {
        TransitionMode = mode;
        StatusMessage = $"转场模式: {mode}";
        
        // Update current active scene's transition mode
        if (ActiveScene != null)
        {
            ActiveScene.TransitionMode = mode;
            _broadcastService.AddOrUpdateScene(ActiveScene);
        }
    }

    [RelayCommand]
    private void CutToCamera(CameraPreview? camera)
    {
        if (camera == null) return;

        _broadcastService.SelectCamera(camera.CameraId);

        foreach (var cam in Cameras) cam.IsLive = false;
        camera.IsLive = true;
        ProgramCamera = camera;

        var evt = new MatchEvent
        {
            Type = "camera",
            Description = $"切换到 {camera.Label}",
            Timestamp = DateTime.Now
        };
        EventLog.Insert(0, evt);
    }

    #region Scene Preset Management Commands

    [RelayCommand]
    private void SaveCurrentAsPreset()
    {
        if (string.IsNullOrWhiteSpace(NewPresetName))
        {
            StatusMessage = "⚠ 请输入预设名称";
            return;
        }

        var activeCameras = Cameras.Where(c => c.IsActive).Select(c => c.CameraId).ToList();
        var cameraOrder = Cameras.Where(c => c.IsLive).Select(c => c.CameraId).ToList();
        if (ProgramCamera != null && !cameraOrder.Contains(ProgramCamera.CameraId))
        {
            cameraOrder.Insert(0, ProgramCamera.CameraId);
        }

        var newScene = _broadcastService.CreatePresetFromCurrent(
            NewPresetName,
            NewPresetDescription,
            CurrentLayout,
            activeCameras,
            cameraOrder,
            TransitionMode,
            TransitionDuration,
            ShowScore,
            ShowTimer,
            ShowTeamNames);

        _broadcastService.AddOrUpdateScene(newScene);
        LoadScenes();
        
        NewPresetName = string.Empty;
        NewPresetDescription = string.Empty;
        StatusMessage = $"✔ 预设 '{newScene.Name}' 已保存";
    }

    [RelayCommand]
    private void UpdatePreset(BroadcastScene? scene)
    {
        if (scene == null) return;

        _broadcastService.AddOrUpdateScene(scene);
        LoadScenes();
        StatusMessage = $"✔ 预设 '{scene.Name}' 已更新";
    }

    [RelayCommand]
    private void DeletePreset(BroadcastScene? scene)
    {
        if (scene == null) return;

        if (scene == ActiveScene)
        {
            StatusMessage = "⚠ 不能删除当前激活的场景";
            return;
        }

        _broadcastService.DeleteScene(scene.SceneId);
        LoadScenes();
        StatusMessage = $"✔ 预设 '{scene.Name}' 已删除";
    }

    [RelayCommand]
    private void SelectPresetForEdit(BroadcastScene? scene)
    {
        SelectedPresetForEdit = scene;
        if (scene != null)
        {
            NewPresetName = scene.Name;
            NewPresetDescription = scene.Description;
        }
    }

    #endregion

    #region Slow Motion Commands

    [RelayCommand]
    private void MarkSlowMotionIn()
    {
        SlowMotionMarkedIn = true;
        SlowMotionMarkedOut = false;
        SlowMotionIsPlaying = false;
        SlowMotionStatus = "入点已标记";
        StatusMessage = "✦ 慢动作入点已标记";
    }

    [RelayCommand]
    private void MarkSlowMotionOut()
    {
        if (!SlowMotionMarkedIn)
        {
            StatusMessage = "⚠ 请先标记入点";
            return;
        }
        SlowMotionMarkedOut = true;
        SlowMotionIsPlaying = false;
        SlowMotionStatus = "就绪播放";
        StatusMessage = "✦ 慢动作出点已标记 - 按播放开始回放";
    }

    [RelayCommand]
    private async Task PlaySlowMotionAsync()
    {
        if (!SlowMotionMarkedIn || !SlowMotionMarkedOut)
        {
            StatusMessage = "⚠ 请先标记入点和出点";
            return;
        }

        SlowMotionIsPlaying = true;
        SlowMotionStatus = $"播放中 ({SlowMotionSpeed})";
        StatusMessage = $"▶ 播放慢动作 ({SlowMotionSpeed})";

        var state = new SlowMotionState
        {
            MarkedIn = SlowMotionMarkedIn,
            MarkedOut = SlowMotionMarkedOut,
            PlaybackSpeed = SlowMotionSpeed,
            IsPlaying = true,
            Status = "playing"
        };
        await _socketService.EmitSlowMotionStateAsync(state);
    }

    [RelayCommand]
    private async Task StopSlowMotionAsync()
    {
        SlowMotionIsPlaying = false;
        SlowMotionStatus = "已停止";
        StatusMessage = "■ 慢动作已停止";

        var state = new SlowMotionState
        {
            MarkedIn = SlowMotionMarkedIn,
            MarkedOut = SlowMotionMarkedOut,
            PlaybackSpeed = SlowMotionSpeed,
            IsPlaying = false,
            Status = "stopped"
        };
        await _socketService.EmitSlowMotionStateAsync(state);
    }

    [RelayCommand]
    private void ClearSlowMotionMarks()
    {
        SlowMotionMarkedIn = false;
        SlowMotionMarkedOut = false;
        SlowMotionIsPlaying = false;
        SlowMotionStatus = "就绪";
        StatusMessage = string.Empty;
    }

    [RelayCommand]
    private void SetSlowMotionSpeed(string speed)
    {
        SlowMotionSpeed = speed;
        StatusMessage = $"慢动作速度: {speed}";
    }

    #endregion

    #region Virtual Camera Commands

    [RelayCommand]
    private async Task ToggleVirtualCameraAsync()
    {
        if (IsVirtualCameraRunning)
        {
            // Stop virtual camera
            IsVirtualCameraRunning = false;
            VirtualCameraStatus = "已停止";
            StatusMessage = "✔ 虚拟摄像机已停止";
        }
        else
        {
            // Start virtual camera
            IsVirtualCameraRunning = true;
            VirtualCameraStatus = "运行中";
            StatusMessage = "✔ 虚拟摄像机已启动";
        }

        await _socketService.EmitVirtualCameraStatusAsync(
            IsVirtualCameraRunning ? "running" : "stopped", IsVirtualCameraRunning);
    }

    #endregion

    #region Broadcast API Commands

    [RelayCommand]
    private async Task FetchBroadcastSceneAsync()
    {
        if (string.IsNullOrWhiteSpace(MatchId))
        {
            StatusMessage = "⚠ 请输入比赛 ID";
            return;
        }

        StatusMessage = "正在获取导播场景...";
        var response = await _apiService.GetBroadcastSceneAsync(MatchId);

        if (response != null)
        {
            // Map server response to local scene
            var layout = response.Layout?.ToLowerInvariant() switch
            {
                "single" or "scoreboard" => LayoutMode.Single,
                "dual" => LayoutMode.Double,
                "quad" => LayoutMode.Quad,
                _ => LayoutMode.Quad
            };

            var transition = response.Transition?.ToUpperInvariant() ?? "CUT";

            // Find or create a matching scene
            var matchingScene = Scenes.FirstOrDefault(s =>
                s.Layout == layout && s.TransitionMode == transition);

            if (matchingScene != null)
            {
                await SelectSceneCommand.ExecuteAsync(matchingScene);
            }

            // Update overlay settings from server
            if (!string.IsNullOrEmpty(response.Overlay))
            {
                try
                {
                    var overlay = JsonSerializer.Deserialize<OverlayConfig>(response.Overlay,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (overlay != null)
                    {
                        ShowScore = overlay.ShowScore;
                        ShowTimer = overlay.ShowTimer;
                        HomeTeamName = overlay.HomeTeamName;
                        AwayTeamName = overlay.AwayTeamName;
                        HomeScore = overlay.HomeScore;
                        AwayScore = overlay.AwayScore;
                        CurrentPeriod = overlay.CurrentPeriod;
                        TimerDisplay = overlay.TimerDisplay;
                    }
                }
                catch { }
            }

            StatusMessage = $"✔ 已获取导播场景: {response.Name ?? "未命名"}";
        }
        else
        {
            StatusMessage = "⚠ 获取导播场景失败，请检查比赛 ID 和服务器连接";
        }
    }

    [RelayCommand]
    private async Task PushBroadcastSceneAsync()
    {
        if (string.IsNullOrWhiteSpace(MatchId))
        {
            StatusMessage = "⚠ 请输入比赛 ID";
            return;
        }

        if (ActiveScene == null)
        {
            StatusMessage = "⚠ 没有激活的场景";
            return;
        }

        var layout = ActiveScene.Layout switch
        {
            LayoutMode.Single => "single",
            LayoutMode.Double => "dual",
            LayoutMode.Quad => "quad",
            _ => "quad"
        };

        var primaryCamera = ProgramCamera?.Label ?? "CAM1";
        var overlay = new OverlayConfig
        {
            ShowScore = ShowScore,
            ShowTimer = ShowTimer,
            ShowHomeTeamName = ShowTeamNames,
            ShowAwayTeamName = ShowTeamNames,
            HomeTeamName = HomeTeamName,
            AwayTeamName = AwayTeamName,
            HomeScore = HomeScore,
            AwayScore = AwayScore,
            CurrentPeriod = CurrentPeriod,
            TimerDisplay = TimerDisplay
        };

        var update = new BroadcastSceneUpdate
        {
            Name = ActiveScene.Name,
            Layout = layout,
            PrimaryCamera = primaryCamera,
            Transition = ActiveScene.TransitionMode.ToLowerInvariant(),
            Overlay = overlay
        };

        StatusMessage = "正在推送导播场景...";
        var response = await _apiService.UpdateBroadcastSceneAsync(MatchId, update);

        if (response != null)
        {
            StatusMessage = "✔ 导播场景已推送到服务器";
        }
        else
        {
            StatusMessage = "⚠ 推送失败，请检查服务器连接";
        }
    }

    #endregion

    #region Tutorial Commands

    [RelayCommand]
    private void StartTutorial()
    {
        TutorialStep = 0;
        ShowTutorial = true;
        UpdateTutorialContent();
    }

    [RelayCommand]
    private void NextTutorialStep()
    {
        TutorialStep++;
        if (TutorialStep >= _tutorialSteps.Count)
        {
            ShowTutorial = false;
            SaveConfig();
        }
        else
        {
            UpdateTutorialContent();
        }
    }

    [RelayCommand]
    private void SkipTutorial()
    {
        ShowTutorial = false;
        SaveConfig();
    }

    private void UpdateTutorialContent()
    {
        if (TutorialStep < _tutorialSteps.Count)
        {
            var step = _tutorialSteps[TutorialStep];
            TutorialTitle = step.Title;
            TutorialContent = step.Content;
            TutorialDescription = step.Description;
            TutorialProgress = (TutorialStep + 1) * 100 / _tutorialSteps.Count;
            TutorialNextButtonText = TutorialStep == _tutorialSteps.Count - 1 ? "完成" : "下一步";
        }
    }

    #endregion

    #region Help Commands

    [RelayCommand]
    private void OpenHelp()
    {
        ShowHelp = true;
    }

    [RelayCommand]
    private void CloseHelp()
    {
        ShowHelp = false;
    }

    [RelayCommand]
    private void ToggleShortcutHelp()
    {
        ShowShortcutHelp = !ShowShortcutHelp;
    }

    #endregion

    #endregion

    private void LoadCameras()
    {
        Cameras = new ObservableCollection<CameraPreview>(_broadcastService.Cameras);
    }

    private void LoadScenes()
    {
        Scenes = new ObservableCollection<BroadcastScene>(_broadcastService.Scenes);
        if (ActiveScene != null)
        {
            ActiveScene = Scenes.FirstOrDefault(s => s.SceneId == ActiveScene.SceneId);
        }
        else if (Scenes.Count > 0)
        {
            Scenes[0].IsActive = true;
            ActiveScene = Scenes[0];
        }
    }

    public async void HandleKeyDown(System.Windows.Input.KeyEventArgs e)
    {
        if (ShowTutorial || ShowHelp || ShowShortcutHelp) return;

        switch (e.Key)
        {
            // Camera switching
            case System.Windows.Input.Key.D1:
            case System.Windows.Input.Key.NumPad1:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 1));
                break;
            case System.Windows.Input.Key.D2:
            case System.Windows.Input.Key.NumPad2:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 2));
                break;
            case System.Windows.Input.Key.D3:
            case System.Windows.Input.Key.NumPad3:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 3));
                break;
            case System.Windows.Input.Key.D4:
            case System.Windows.Input.Key.NumPad4:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 4));
                break;
            case System.Windows.Input.Key.D5:
            case System.Windows.Input.Key.NumPad5:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 5));
                break;
            case System.Windows.Input.Key.D6:
            case System.Windows.Input.Key.NumPad6:
                CutToCameraCommand.Execute(Cameras.FirstOrDefault(c => c.CameraId == 6));
                break;
            
            // Transition modes
            case System.Windows.Input.Key.C:
                SetTransitionModeCommand.Execute("CUT");
                break;
            case System.Windows.Input.Key.A:
                SetTransitionModeCommand.Execute("AUTO");
                break;
            
            // Slow motion
            case System.Windows.Input.Key.OemOpenBrackets:
                MarkSlowMotionInCommand.Execute(null);
                break;
            case System.Windows.Input.Key.OemCloseBrackets:
                MarkSlowMotionOutCommand.Execute(null);
                break;
            case System.Windows.Input.Key.S:
                if (e.KeyboardDevice.Modifiers == System.Windows.Input.ModifierKeys.Control)
                    PlaySlowMotionCommand.Execute(null);
                break;
            
            // Virtual camera
            case System.Windows.Input.Key.V:
                if (e.KeyboardDevice.Modifiers == System.Windows.Input.ModifierKeys.Control)
                    ToggleVirtualCameraCommand.Execute(null);
                break;
            
            // Help
            case System.Windows.Input.Key.F1:
                OpenHelpCommand.Execute(null);
                break;
            case System.Windows.Input.Key.F2:
                ToggleShortcutHelpCommand.Execute(null);
                break;
            
            // Escape
            case System.Windows.Input.Key.Escape:
                if (ShowHelp) ShowHelp = false;
                else if (ShowShortcutHelp) ShowShortcutHelp = false;
                break;
            
            // Scene switching with F keys
            case System.Windows.Input.Key.F5:
                if (Scenes.Count > 0) await SelectSceneCommand.ExecuteAsync(Scenes[0]);
                break;
            case System.Windows.Input.Key.F6:
                if (Scenes.Count > 1) await SelectSceneCommand.ExecuteAsync(Scenes[1]);
                break;
            case System.Windows.Input.Key.F7:
                if (Scenes.Count > 2) await SelectSceneCommand.ExecuteAsync(Scenes[2]);
                break;
            case System.Windows.Input.Key.F8:
                if (Scenes.Count > 3) await SelectSceneCommand.ExecuteAsync(Scenes[3]);
                break;
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _disposed = true;
            _socketService.Dispose();
        }
        GC.SuppressFinalize(this);
    }
}

public class TutorialStep
{
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Description { get; set; } = "";
}

public class AppConfig
{
    public bool HasCompletedTutorial { get; set; }
}
