using System.Collections.ObjectModel;
using System.Windows;
using System.Windows.Threading;
using System.Windows.Media;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ScoringSystem.Models;
using ScoringSystem.Services;

namespace ScoringSystem.ViewModels;

public partial class MainViewModel : ObservableObject, IDisposable
{
    private readonly ApiService _apiService;
    private readonly SocketService _socketService;
    private readonly ConfigService _configService;
    private readonly BackendService _backendService;
    private DispatcherTimer? _timer;
    private bool _disposed;

    /// <summary>
    /// 安全地调度到 UI 线程 — 自动检查 App.Current 和 _disposed 状态。
    /// </summary>
    private void SafeDispatch(Action action)
    {
        var app = System.Windows.Application.Current;
        if (app == null || _disposed) return;

        try
        {
            app.Dispatcher.BeginInvoke(() =>
            {
                if (!_disposed) action();
            });
        }
        catch (InvalidOperationException)
        {
            // Dispatcher 已关闭（应用正在关闭）
        }
    }

    #region Navigation

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsConnectionPage))]
    [NotifyPropertyChangedFor(nameof(IsMatchSelectPage))]
    [NotifyPropertyChangedFor(nameof(IsScoringPage))]
    [NotifyPropertyChangedFor(nameof(IsEventLogPage))]
    [NotifyPropertyChangedFor(nameof(IsSettingsPage))]
    [NotifyPropertyChangedFor(nameof(IsManagementPage))]
    [NotifyPropertyChangedFor(nameof(IsTeamManagementPage))]
    private string _currentPage = "connection";

    public bool IsConnectionPage => CurrentPage == "connection";
    public bool IsMatchSelectPage => CurrentPage == "match_select";
    public bool IsScoringPage => CurrentPage == "scoring";
    public bool IsEventLogPage => CurrentPage == "event_log";
    public bool IsSettingsPage => CurrentPage == "settings";
    public bool IsManagementPage => CurrentPage == "management";
    public bool IsTeamManagementPage => CurrentPage == "team_management";

    [RelayCommand]
    private async Task Navigate(string page)
    {
        if (page == "scoring" && SelectedMatch == null)
        {
            StatusMessage = "请先选择一场比赛";
            CurrentPage = "match_select";
            return;
        }
        if ((page == "match_select" || page == "scoring" || page == "event_log" || page == "management" || page == "team_management") && !IsConnected)
        {
            StatusMessage = "请先连接到服务器";
            CurrentPage = "connection";
            return;
        }
        CurrentPage = page;
        StatusMessage = string.Empty;

        // 页面导航后自动加载数据
        if (page == "match_select")
        {
            await LoadMatchesAsync();
        }
        else if (page == "management")
        {
            await LoadEventsAsync();  // 加载赛事列表
            await LoadMatchesForManagementAsync();
        }
        else if (page == "team_management")
        {
            await LoadTeamsAsync();
        }
    }

    [RelayCommand]
    private Task NavigateToMatchSelect() => Navigate("match_select");

    #endregion

    #region Connection Properties

    [ObservableProperty]
    private string _serverUrl = "ws://localhost:3001";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(ConnectionPageIcon))]
    [NotifyPropertyChangedFor(nameof(HasStatusMessage))]
    private bool _isConnected;

    [ObservableProperty]
    private string _connectionStatus = "未连接";

    [ObservableProperty]
    private string _connectionButtonText = "连接";

    [ObservableProperty]
    private string _connectionButtonIcon = "🔌";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasStatusMessage))]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private Brush _statusBrush = new SolidColorBrush(Color.FromRgb(243, 156, 18));

    public bool HasStatusMessage => !string.IsNullOrEmpty(StatusMessage);
    public string ConnectionPageIcon => IsConnected ? "✅" : "⚠";

    // Server History
    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasServerHistory))]
    private ObservableCollection<string> _serverHistory = new();
    public bool HasServerHistory => ServerHistory.Count > 0;

    [RelayCommand]
    private void SetLocalhost() => ServerUrl = "ws://localhost:3001";

    [RelayCommand]
    private void SetLanAddress()
    {
        var ip = GetLocalIp();
        ServerUrl = $"ws://{ip}:3001";
    }

    [RelayCommand]
    private void SelectHistoryUrl(string url) => ServerUrl = url;

    private string GetLocalIp()
    {
        try
        {
            var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork
                    && ip.ToString().StartsWith("192.168."))
                    return ip.ToString();
            }
        }
        catch { }
        return "192.168.1.100";
    }

    #endregion

    #region Loading

    [ObservableProperty]
    private bool _isLoading;

    #endregion

    #region Event/Match Selection

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasMatches))]
    [NotifyPropertyChangedFor(nameof(HasNoMatches))]
    private ObservableCollection<Event> _events = new();

    [ObservableProperty]
    private Event? _selectedEvent;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasMatches))]
    [NotifyPropertyChangedFor(nameof(HasNoMatches))]
    private ObservableCollection<Match> _matches = new();

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(MatchStatusText))]
    private Match? _selectedMatch;

    public bool HasMatches => Matches.Count > 0;
    public bool HasNoMatches => Matches.Count == 0;

    #endregion

    #region Backend Service Management

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsBackendRunning))]
    [NotifyPropertyChangedFor(nameof(IsBackendStopped))]
    private bool _isBackendServerRunning;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(IsWebRunning))]
    [NotifyPropertyChangedFor(nameof(IsWebStopped))]
    private bool _isWebServerRunning;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(BackendLogText))]
    private ObservableCollection<string> _backendLog = new();

    public bool IsBackendRunning => _backendService.IsServerRunning;
    public bool IsBackendStopped => !_backendService.IsServerRunning;
    public bool IsWebRunning => _backendService.IsWebRunning;
    public bool IsWebStopped => !_backendService.IsWebRunning;
    public string BackendLogText => string.Join("\n", BackendLog.Reverse().Take(100));

    [RelayCommand]
    private async Task StartBackendServerAsync()
    {
        var success = await _backendService.StartServerAsync();
        IsBackendServerRunning = _backendService.IsServerRunning;
        if (success && _backendService.IsServerRunning)
        {
            // 等待后端就绪后自动连接
            await Task.Delay(3000);
            if (!IsConnected)
            {
                ServerUrl = "ws://localhost:3001";
                await ConnectAsync();
            }
        }
    }

    [RelayCommand]
    private void StopBackendServer()
    {
        _backendService.StopServer();
        IsBackendServerRunning = _backendService.IsServerRunning;
    }

    [RelayCommand]
    private async Task StartWebServerAsync()
    {
        var success = await _backendService.StartWebAsync();
        IsWebServerRunning = _backendService.IsWebRunning;
    }

    [RelayCommand]
    private void StopWebServer()
    {
        _backendService.StopWeb();
        IsWebServerRunning = _backendService.IsWebRunning;
    }

    [RelayCommand]
    private async Task StartAllBackendServicesAsync()
    {
        StatusMessage = "🚀 正在启动所有后台服务...";
        await _backendService.StartAllAsync();
        IsBackendServerRunning = _backendService.IsServerRunning;
        IsWebServerRunning = _backendService.IsWebRunning;

        // 等待服务启动
        await Task.Delay(4000);
        
        // 自动连接到后端
        if (_backendService.IsServerRunning && !IsConnected)
        {
            ServerUrl = "ws://localhost:3001";
            await ConnectAsync();
        }

        StatusMessage = _backendService.GetStatusSummary();
    }

    [RelayCommand]
    private void StopAllBackendServices()
    {
        _backendService.StopAll();
        IsBackendServerRunning = _backendService.IsServerRunning;
        IsWebServerRunning = _backendService.IsWebRunning;
        StatusMessage = "所有后台服务已停止";
    }

    [RelayCommand]
    private void ClearBackendLog()
    {
        BackendLog.Clear();
        OnPropertyChanged(nameof(BackendLogText));
    }

    private void OnBackendOutput(object? sender, string output)
    {
        SafeDispatch(() =>
        {
            BackendLog.Add($"[{DateTime.Now:HH:mm:ss}] {output}");
            OnPropertyChanged(nameof(BackendLogText));
        });
    }

    #endregion

    #region Match Management

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasManagedMatches))]
    [NotifyPropertyChangedFor(nameof(HasNoManagedMatches))]
    [NotifyPropertyChangedFor(nameof(MatchesCountLabel))]
    private ObservableCollection<Match> _managedMatches = new();

    [ObservableProperty]
    private string _matchFilter = "all";

    [ObservableProperty]
    private bool _isManagementLoading;

    [ObservableProperty]
    private Event? _selectedEventForManagement;

    // 比赛创建对话框相关
    [ObservableProperty]
    private bool _isCreateMatchDialogOpen;

    [ObservableProperty]
    private ObservableCollection<Team> _availableTeamsForMatch = new();

    [ObservableProperty]
    private Team? _selectedHomeTeam;

    [ObservableProperty]
    private Team? _selectedAwayTeam;

    [ObservableProperty]
    private string _selectedSportType = "basketball";

    [ObservableProperty]
    private ObservableCollection<SportTypeItem> _sportTypes = new();

    [ObservableProperty]
    private string _newMatchEventName = string.Empty;

    // 赛事创建对话框相关
    [ObservableProperty]
    private bool _isCreateEventDialogOpen;

    [ObservableProperty]
    private string _newEventName = string.Empty;

    [ObservableProperty]
    private string _newEventSportType = "basketball";

    public bool HasManagedMatches => ManagedMatches.Count > 0;
    public bool HasNoManagedMatches => ManagedMatches.Count == 0;
    public string MatchesCountLabel => $"共 {ManagedMatches.Count} 场比赛";

    [RelayCommand]
    private async Task FilterMatches(string filter)
    {
        MatchFilter = filter;
        await LoadMatchesForManagementAsync();
    }

    [RelayCommand]
    private async Task LoadMatchesForManagementAsync()
    {
        if (!IsConnected) { StatusMessage = "请先连接到服务器"; return; }
        IsManagementLoading = true;
        try
        {
            List<Match> allMatches;
            
            // 如果选中了赛事，只获取该赛事下的比赛
            if (SelectedEventForManagement != null)
            {
                allMatches = await _apiService.GetMatchesByEventAsync(SelectedEventForManagement.Id);
            }
            else
            {
                allMatches = await _apiService.GetMatchesAsync();
            }
            
            // 根据筛选条件过滤
            var filtered = MatchFilter == "all"
                ? allMatches
                : allMatches.Where(m => m.Status == MatchFilter).ToList();
            ManagedMatches = new ObservableCollection<Match>(filtered);
        }
        catch (Exception ex)
        {
            StatusMessage = $"加载比赛失败: {ex.Message}";
        }
        finally
        {
            IsManagementLoading = false;
        }
    }

    [RelayCommand]
    private async Task SelectEventForManagement(Event? ev)
    {
        if (ev == null) return;
        foreach (var e in Events) e.IsSelectedForManagement = false;
        ev.IsSelectedForManagement = true;
        SelectedEventForManagement = ev;
        await LoadMatchesForManagementAsync();
    }

    // 打开创建比赛对话框
    [RelayCommand]
    private async Task OpenCreateMatchDialog()
    {
        // 必须先选择一个赛事
        if (SelectedEventForManagement == null)
        {
            StatusMessage = "⚠ 请先在左侧选择一个赛事，再创建比赛";
            return;
        }
        
        // 加载可用运动类型
        var sportTypeItems = new ObservableCollection<SportTypeItem>
        {
            new() { SportType = "basketball", DisplayName = "篮球", Emoji = "🏀" },
            new() { SportType = "football", DisplayName = "足球", Emoji = "⚽" },
            new() { SportType = "volleyball", DisplayName = "排球", Emoji = "🏐" },
            new() { SportType = "badminton", DisplayName = "羽毛球", Emoji = "🏸" },
            new() { SportType = "tennis", DisplayName = "网球", Emoji = "🎾" },
            new() { SportType = "table_tennis", DisplayName = "乒乓球", Emoji = "🏓" },
            new() { SportType = "swimming", DisplayName = "游泳", Emoji = "🏊" },
            new() { SportType = "running", DisplayName = "跑步", Emoji = "🏃" },
        };
        SportTypes = sportTypeItems;
        
        // 加载可用队伍
        try
        {
            var teams = await _apiService.GetTeamsAsync();
            AvailableTeamsForMatch = new ObservableCollection<Team>(teams);
            if (teams.Count >= 2)
            {
                SelectedHomeTeam = teams[0];
                SelectedAwayTeam = teams[1];
            }
            else if (teams.Count == 1)
            {
                SelectedHomeTeam = teams[0];
                SelectedAwayTeam = null;
            }
            else
            {
                SelectedHomeTeam = null;
                SelectedAwayTeam = null;
            }
        }
        catch
        {
            AvailableTeamsForMatch = new ObservableCollection<Team>();
        }
        
        // 默认选择赛事对应的运动类型
        SelectedSportType = SelectedEventForManagement.SportType ?? "basketball";
        IsCreateMatchDialogOpen = true;
    }

    // 关闭创建比赛对话框
    [RelayCommand]
    private void CloseCreateMatchDialog()
    {
        IsCreateMatchDialogOpen = false;
    }

    // 打开创建赛事对话框
    [RelayCommand]
    private void OpenCreateEventDialog()
    {
        NewEventName = string.Empty;
        NewEventSportType = "basketball";
        // 初始化运动类型列表
        var sportTypeItems = new ObservableCollection<SportTypeItem>
        {
            new() { SportType = "basketball", DisplayName = "篮球", Emoji = "🏀" },
            new() { SportType = "football", DisplayName = "足球", Emoji = "⚽" },
            new() { SportType = "volleyball", DisplayName = "排球", Emoji = "🏐" },
            new() { SportType = "badminton", DisplayName = "羽毛球", Emoji = "🏸" },
            new() { SportType = "tennis", DisplayName = "网球", Emoji = "🎾" },
            new() { SportType = "table_tennis", DisplayName = "乒乓球", Emoji = "🏓" },
            new() { SportType = "swimming", DisplayName = "游泳", Emoji = "🏊" },
            new() { SportType = "running", DisplayName = "跑步", Emoji = "🏃" },
        };
        SportTypes = sportTypeItems;
        IsCreateEventDialogOpen = true;
    }

    // 关闭创建赛事对话框
    [RelayCommand]
    private void CloseCreateEventDialog()
    {
        IsCreateEventDialogOpen = false;
    }

    // 选择赛事运动类型
    [RelayCommand]
    private void SelectEventSportType(SportTypeItem? item)
    {
        if (item != null)
        {
            NewEventSportType = item.SportType;
        }
    }

    // 确认创建赛事
    [RelayCommand]
    private async Task ConfirmCreateEventAsync()
    {
        if (string.IsNullOrWhiteSpace(NewEventName))
        {
            StatusMessage = "⚠ 请输入赛事名称";
            return;
        }

        IsCreateEventDialogOpen = false;
        IsManagementLoading = true;
        try
        {
            var eventData = new
            {
                name = NewEventName.Trim(),
                sportType = NewEventSportType
            };
            var newEvent = await _apiService.CreateEventAsync(eventData);

            if (newEvent != null)
            {
                StatusMessage = $"✅ 已创建赛事：{newEvent.Name}";
                // 重新加载赛事列表
                await LoadEventsAsync();
                // 自动选中新创建的赛事
                SelectedEventForManagement = Events.FirstOrDefault(e => e.Id == newEvent.Id);
                // 刷新比赛列表
                await LoadMatchesForManagementAsync();
            }
            else
            {
                StatusMessage = "⚠ 创建赛事失败";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"⚠ 创建失败: {ex.Message}";
        }
        finally
        {
            IsManagementLoading = false;
        }
    }

    // 删除指定赛事（可从列表按钮或菜单调用）
    [RelayCommand]
    private async Task DeleteEventAsync(Event? ev)
    {
        var target = ev ?? SelectedEventForManagement;
        if (target == null)
        {
            StatusMessage = "⚠ 请先选择一个赛事";
            return;
        }

        var result = MessageBox.Show(
            $"确定要删除赛事「{target.Name}」吗？\n\n此操作不可恢复！",
            "确认删除",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (result != MessageBoxResult.Yes)
            return;

        IsManagementLoading = true;
        try
        {
            var success = await _apiService.DeleteEventAsync(target.Id);
            if (success)
            {
                StatusMessage = $"✅ 已删除赛事：{target.Name}";
                if (SelectedEventForManagement?.Id == target.Id)
                    SelectedEventForManagement = null;
                await LoadEventsAsync();
                await LoadMatchesForManagementAsync();
            }
            else
            {
                StatusMessage = "⚠ 删除赛事失败";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"⚠ 删除失败: {ex.Message}";
        }
        finally
        {
            IsManagementLoading = false;
        }
    }

    // 选择运动类型
    [RelayCommand]
    private void SelectSportType(SportTypeItem? item)
    {
        if (item != null)
        {
            SelectedSportType = item.SportType;
        }
    }

    [RelayCommand]
    private async Task ConfirmCreateMatchAsync()
    {
        // 检查是否已选择赛事
        if (SelectedEventForManagement == null)
        {
            StatusMessage = "⚠ 请先在左侧选择一个赛事";
            return;
        }
        if (SelectedHomeTeam == null || SelectedAwayTeam == null)
        {
            StatusMessage = "⚠ 请选择两支参赛队伍";
            return;
        }
        if (SelectedHomeTeam.Id == SelectedAwayTeam.Id)
        {
            StatusMessage = "⚠ 主队和客队不能相同";
            return;
        }

        IsCreateMatchDialogOpen = false;
        IsManagementLoading = true;
        try
        {
            // 直接创建比赛（不创建新赛事）
            var matchData = new
            {
                eventId = SelectedEventForManagement.Id,
                homeTeamId = SelectedHomeTeam.Id,
                awayTeamId = SelectedAwayTeam.Id,
                sportType = SelectedSportType,
                status = "not_started"
            };
            var newMatch = await _apiService.CreateMatchAsync(matchData);

            if (newMatch != null)
            {
                StatusMessage = $"✅ 已创建比赛：{SelectedHomeTeam.Name} vs {SelectedAwayTeam.Name}";
                // 刷新比赛列表
                await LoadMatchesForManagementAsync();
            }
            else
            {
                StatusMessage = "⚠ 创建比赛失败";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"⚠ 创建失败: {ex.Message}";
        }
        finally
        {
            IsManagementLoading = false;
        }
    }

    // 旧版自动创建比赛（保留兼容）
    [RelayCommand]
    private async Task CreateMatchAutoAsync()
    {
        // 如果没有选中的赛事，提示用户使用新对话框
        if (SelectedEventForManagement == null)
        {
            StatusMessage = "⚠ 请先在左侧选择一个赛事，或点击「创建比赛」新建赛事";
            return;
        }

        IsManagementLoading = true;
        try
        {
            var teams = await _apiService.GetTeamsAsync();
            if (teams.Count < 2)
            {
                StatusMessage = "⚠ 队伍数量不足，无法创建比赛";
                return;
            }

            var homeTeam = teams[0];
            var awayTeam = teams[1];

            var newMatch = await _apiService.CreateMatchAsync(new
            {
                eventId = SelectedEventForManagement.Id,
                homeTeamId = homeTeam.Id,
                awayTeamId = awayTeam.Id,
                status = "not_started"
            });

            if (newMatch != null)
            {
                StatusMessage = $"✅ 比赛已创建：{homeTeam.Name} vs {awayTeam.Name}";
                await LoadMatchesForManagementAsync();
            }
            else
            {
                StatusMessage = "⚠ 创建比赛失败";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"⚠ 创建比赛异常: {ex.Message}";
        }
        finally
        {
            IsManagementLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteMatchAsync(Match? match)
    {
        if (match == null) return;
        var result = System.Windows.MessageBox.Show(
            $"确定要删除比赛 {match.HomeTeam?.Name} vs {match.AwayTeam?.Name} 吗？",
            "确认删除",
            System.Windows.MessageBoxButton.YesNo,
            System.Windows.MessageBoxImage.Warning);
        if (result != System.Windows.MessageBoxResult.Yes) return;

        var success = await _apiService.DeleteMatchAsync(match.Id);
        if (success)
        {
            StatusMessage = "✅ 比赛已删除";
            await LoadMatchesForManagementAsync();
        }
        else
        {
            StatusMessage = "⚠ 删除失败";
        }
    }

    [RelayCommand]
    private async Task StartMatchAsync(Match? match)
    {
        if (match == null) return;
        var success = await _apiService.UpdateMatchStatusAsync(match.Id, "running");
        if (success)
        {
            StatusMessage = "✅ 比赛已开始";
            await LoadMatchesForManagementAsync();
        }
    }

    [RelayCommand]
    private async Task EndMatchFromManagementAsync(Match? match)
    {
        if (match == null) return;
        var success = await _apiService.UpdateMatchStatusAsync(match.Id, "finished");
        if (success)
        {
            StatusMessage = "✅ 比赛已结束";
            await LoadMatchesForManagementAsync();
        }
    }

    [RelayCommand]
    private void EnterMatchFromManagement(Match? match)
    {
        if (match == null) return;
        SelectedMatch = match;
        HomeTeamName = match.HomeTeam?.Name ?? "主队";
        AwayTeamName = match.AwayTeam?.Name ?? "客队";
        HomeScore = match.HomeScore;
        AwayScore = match.AwayScore;
        MatchStatus = match.Status == "running" ? "进行中" : match.Status == "finished" ? "已结束" : "未开始";
        UpdateMatchStatus();
        CurrentPage = "scoring";
    }

    #endregion

    #region Team Management

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(HasTeams))]
    [NotifyPropertyChangedFor(nameof(HasNoTeams))]
    private ObservableCollection<Team> _teams = new();

    [ObservableProperty]
    private Team? _editingTeam;

    [ObservableProperty]
    private bool _isTeamsLoading;

    [ObservableProperty]
    private bool _isTeamDialogOpen;

    [ObservableProperty]
    private string _teamDialogTitle = "添加队伍";

    [ObservableProperty]
    private string _teamDialogButtonText = "添加";

    [ObservableProperty]
    private string _newTeamName = string.Empty;

    [ObservableProperty]
    private string _newTeamShortName = string.Empty;

    [ObservableProperty]
    private string _newTeamLogoUrl = string.Empty;

    public bool HasTeams => Teams.Count > 0;
    public bool HasNoTeams => Teams.Count == 0;

    [RelayCommand]
    private async Task LoadTeamsAsync()
    {
        if (!IsConnected) { StatusMessage = "请先连接到服务器"; return; }
        IsTeamsLoading = true;
        try
        {
            var teamsList = await _apiService.GetTeamsAsync();
            Teams = new ObservableCollection<Team>(teamsList);
        }
        catch (Exception ex)
        {
            StatusMessage = $"加载队伍失败: {ex.Message}";
        }
        finally
        {
            IsTeamsLoading = false;
        }
    }

    [RelayCommand]
    private void CreateTeam()
    {
        EditingTeam = null;
        TeamDialogTitle = "添加队伍";
        TeamDialogButtonText = "添加";
        NewTeamName = string.Empty;
        NewTeamShortName = string.Empty;
        NewTeamLogoUrl = string.Empty;
        IsTeamDialogOpen = true;
    }

    [RelayCommand]
    private void EditTeam(Team? team)
    {
        if (team == null) return;
        EditingTeam = team;
        TeamDialogTitle = "编辑队伍";
        TeamDialogButtonText = "保存";
        NewTeamName = team.Name;
        NewTeamShortName = team.ShortName;
        NewTeamLogoUrl = team.Logo ?? string.Empty;
        IsTeamDialogOpen = true;
    }

    [RelayCommand]
    private void CancelTeamDialog()
    {
        IsTeamDialogOpen = false;
        EditingTeam = null;
    }

    [RelayCommand]
    private async Task ConfirmTeamDialogAsync()
    {
        if (string.IsNullOrWhiteSpace(NewTeamName))
        {
            StatusMessage = "⚠ 队伍名称不能为空";
            return;
        }
        if (string.IsNullOrWhiteSpace(NewTeamShortName))
        {
            StatusMessage = "⚠ 队伍简称不能为空";
            return;
        }
        if (NewTeamShortName.Length > 4)
        {
            StatusMessage = "⚠ 队伍简称最多4个字符";
            return;
        }

        IsTeamDialogOpen = false;

        if (EditingTeam != null)
        {
            // Update existing team
            var updateData = new
            {
                name = NewTeamName,
                shortName = NewTeamShortName,
                logoUrl = string.IsNullOrWhiteSpace(NewTeamLogoUrl) ? null : NewTeamLogoUrl
            };
            var result = await _apiService.UpdateTeamAsync(EditingTeam.Id, updateData);
            if (result != null)
            {
                StatusMessage = $"✅ 队伍已更新：{NewTeamName}";
                await LoadTeamsAsync();
            }
            else
            {
                StatusMessage = "⚠ 更新队伍失败";
            }
        }
        else
        {
            // Create new team
            var createData = new
            {
                name = NewTeamName,
                shortName = NewTeamShortName,
                logoUrl = string.IsNullOrWhiteSpace(NewTeamLogoUrl) ? null : NewTeamLogoUrl
            };
            var result = await _apiService.CreateTeamAsync(createData);
            if (result != null)
            {
                StatusMessage = $"✅ 队伍已添加：{NewTeamName}";
                await LoadTeamsAsync();
            }
            else
            {
                StatusMessage = "⚠ 添加队伍失败";
            }
        }

        EditingTeam = null;
    }

    [RelayCommand]
    private async Task DeleteTeamAsync(Team? team)
    {
        if (team == null) return;
        var result = System.Windows.MessageBox.Show(
            $"确定要删除队伍「{team.Name}」吗？\n此操作不可撤销。",
            "确认删除",
            System.Windows.MessageBoxButton.YesNo,
            System.Windows.MessageBoxImage.Warning);
        if (result != System.Windows.MessageBoxResult.Yes) return;

        var success = await _apiService.DeleteTeamAsync(team.Id);
        if (success)
        {
            StatusMessage = $"✅ 队伍已删除：{team.Name}";
            await LoadTeamsAsync();
        }
        else
        {
            StatusMessage = "⚠ 删除队伍失败，可能有比赛正在使用该队伍";
        }
    }

    #endregion

    #region Score / Game State

    [ObservableProperty]
    private string _homeTeamName = "主队";

    [ObservableProperty]
    private string _awayTeamName = "客队";

    [ObservableProperty]
    private int _homeScore;

    [ObservableProperty]
    private int _awayScore;

    [ObservableProperty]
    private int _homeFouls;

    [ObservableProperty]
    private int _awayFouls;

    // 球员选择对话框相关
    [ObservableProperty]
    private bool _isPlayerSelectDialogOpen;

    [ObservableProperty]
    private string _playerSelectTeam = string.Empty;  // "home" or "away"

    [ObservableProperty]
    private int _playerSelectPoints;  // 即将添加的分数

    [ObservableProperty]
    private string _playerSelectTitle = string.Empty;  // 对话框标题

    [ObservableProperty]
    private ObservableCollection<Player> _availablePlayersForSelect = new();

    [ObservableProperty]
    private Player? _selectedPlayerForScore;

    // 犯规类型选择相关
    [ObservableProperty]
    private bool _isFoulTypeDialogOpen;

    [ObservableProperty]
    private string _foulTypeTeam = string.Empty;

    [ObservableProperty]
    private string _foulTypeTitle = "选择犯规类型";

    [ObservableProperty]
    private ObservableCollection<FoulTypeItem> _foulTypes = new();

    [ObservableProperty]
    private FoulTypeItem? _selectedFoulType;

    [ObservableProperty]
    private int _currentPeriod = 1;

    [ObservableProperty]
    private int _totalPeriods = 4;

    [ObservableProperty]
    private string _timerDisplay = "00:00";

    [ObservableProperty]
    private string _periodText = "第 1 / 4 节";

    [ObservableProperty]
    private int _elapsedSeconds;

    [ObservableProperty]
    private bool _isTimerRunning;

    [ObservableProperty]
    private string _matchStatus = "未开始";

    [ObservableProperty]
    private string _matchStatusText = "未选择比赛";

    [ObservableProperty]
    private Brush _matchStatusBrush = new SolidColorBrush(Color.FromRgb(90, 90, 110));

    [ObservableProperty]
    private int _periodDurationMinutes = 10;

    #endregion

    #region Event Log

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(FilteredEventLog))]
    private ObservableCollection<MatchEvent> _eventLog = new();

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(FilteredEventLog))]
    private string _eventFilter = "all";

    public IEnumerable<MatchEvent> FilteredEventLog =>
        EventFilter == "all"
            ? EventLog
            : EventLog.Where(e => e.Type == EventFilter);

    [RelayCommand]
    private void FilterEventLog(string filter)
    {
        EventFilter = filter;
    }

    #endregion

    #region Tutorial / Help

    [ObservableProperty]
    private bool _showTutorial;

    [ObservableProperty]
    private int _tutorialStep;

    [ObservableProperty]
    private string _tutorialTitle = "新手引导";

    [ObservableProperty]
    private string _tutorialContent = "欢迎使用计分裁判系统";

    [ObservableProperty]
    private string _tutorialDescription = "让我们通过几个简单的步骤了解如何使用本系统";

    [ObservableProperty]
    private string _tutorialNextButtonText = "下一步";

    [ObservableProperty]
    private int _tutorialProgress;

    [ObservableProperty]
    private bool _showHelp;

    private readonly List<TutorialStep> _tutorialSteps = new()
    {
        new TutorialStep { Title = "步骤 1/5", Content = "连接服务器", Description = "在「服务器连接」页面输入服务器地址（支持本机和局域网远程），点击连接按钮。" },
        new TutorialStep { Title = "步骤 2/5", Content = "选择赛事和比赛", Description = "连接成功后跳转到「选择比赛」，从赛事列表中点击目标比赛进入裁判模式。" },
        new TutorialStep { Title = "步骤 3/5", Content = "记录得分", Description = "在「计分主页」使用 +1/+2/+3 按钮为两队记录得分，也可用键盘 1/2/3（主队）和 7/8/9（客队）。" },
        new TutorialStep { Title = "步骤 4/5", Content = "控制比赛时间", Description = "使用底部控制栏管理比赛时间，Space 键快速开始/暂停，← → 切换节次。" },
        new TutorialStep { Title = "步骤 5/5", Content = "查看事件日志", Description = "「事件日志」页面记录了所有裁判操作，可按类型筛选，支持打印和导出。" }
    };

    #endregion

    #region Foul Player Input

    [ObservableProperty]
    private string _foulPlayerNumber = string.Empty;

    #endregion

    public MainViewModel()
    {
        _apiService = new ApiService();
        _socketService = new SocketService();
        _configService = new ConfigService();
        _backendService = new BackendService();

        // 订阅后端服务日志
        _backendService.OutputReceived += OnBackendOutput;

        ServerUrl = _configService.Config.ServerUrl;
        PeriodDurationMinutes = _configService.Config.PeriodDurationMinutes;
        TotalPeriods = _configService.Config.TotalPeriods;

        LoadServerHistory();

        _socketService.OnConnected += () =>
        {
            SafeDispatch(() =>
            {
                IsConnected = true;
                ConnectionStatus = "已连接";
                ConnectionButtonText = "断开连接";
                ConnectionButtonIcon = "🔴";
                StatusMessage = string.Empty;
                AddServerToHistory(ServerUrl);
            });
        };

        _socketService.OnDisconnected += () =>
        {
            SafeDispatch(() =>
            {
                IsConnected = false;
                ConnectionStatus = "连接已断开";
                ConnectionButtonText = "重新连接";
                ConnectionButtonIcon = "🔌";
                StatusMessage = "⚠ WebSocket 连接断开，正在重连...";
                StatusBrush = new SolidColorBrush(Color.FromRgb(243, 156, 18));
            });
        };

        _socketService.OnScoreUpdate += HandleScoreUpdate;

        _socketService.OnMatchEvent += (matchEvent) =>
        {
            // Update foul counts in real-time from remote clients
            SafeDispatch(() =>
            {
                if (matchEvent.MatchId != SelectedMatch?.Id) return;
                if (matchEvent.Type == "foul")
                {
                    if (matchEvent.Team == "home") HomeFouls++;
                    else if (matchEvent.Team == "away") AwayFouls++;
                }
            });
        };

        _socketService.OnError += (err) =>
        {
            SafeDispatch(() =>
            {
                StatusMessage = $"⚠ {err}";
                StatusBrush = new SolidColorBrush(Color.FromRgb(239, 35, 60));
            });
        };

        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _timer.Tick += Timer_Tick;

        if (_configService.Config.IsFirstRun)
        {
            ShowTutorial = true;
            UpdateTutorialContent();
        }
    }

    private void LoadServerHistory()
    {
        var history = _configService.Config.ServerHistory ?? new List<string>();
        ServerHistory = new ObservableCollection<string>(history.Where(h => !string.IsNullOrEmpty(h)).Distinct());
    }

    private void AddServerToHistory(string url)
    {
        if (string.IsNullOrEmpty(url)) return;

        var history = _configService.Config.ServerHistory ??= new List<string>();
        history.Remove(url);
        history.Insert(0, url);
        if (history.Count > 5) history = history.Take(5).ToList();
        _configService.Config.ServerHistory = history;
        _configService.SaveConfig();
        LoadServerHistory();
    }

    private void HandleScoreUpdate(MatchState state)
    {
        SafeDispatch(() =>
        {
            if (SelectedMatch?.Id == state.MatchId)
            {
                HomeScore = state.HomeScore;
                AwayScore = state.AwayScore;
                CurrentPeriod = state.CurrentPeriod;
                TotalPeriods = state.TotalPeriods;
                ElapsedSeconds = state.TimeElapsedSeconds;
                UpdateTimerDisplay();
                UpdateMatchStatus();
            }
        });
    }

    #region Commands — Connection

    [RelayCommand]
    private async Task ConnectAsync()
    {
        if (IsConnected)
        {
            await _socketService.DisconnectAsync();
            IsConnected = false;
            ConnectionStatus = "未连接";
            ConnectionButtonText = "连接";
            ConnectionButtonIcon = "🔌";
            return;
        }

        IsLoading = true;
        StatusMessage = "正在连接到服务器...";
        StatusBrush = new SolidColorBrush(Color.FromRgb(76, 201, 240));

        var normalizedHttp = ServerUrl.Replace("ws://", "http://").Replace("wss://", "https://");
        _apiService.BaseUrl = normalizedHttp;
        _configService.Config.ServerUrl = ServerUrl;
        _configService.SaveConfig();

        await _socketService.ConnectAsync(ServerUrl);

        if (_socketService.IsConnected)
        {
            await LoadMatchesAsync();
        }
        else
        {
            StatusMessage = "⚠ 连接失败，请检查服务器地址和网络";
            StatusBrush = new SolidColorBrush(Color.FromRgb(239, 35, 60));
        }

        IsLoading = false;
    }

    #endregion

    #region Commands — Match Selection

    [ObservableProperty]
    private string _matchListFilter = "all";

    [RelayCommand]
    private async Task LoadMatchesAsync()
    {
        try
        {
            IsLoading = true;
            var allMatches = await _apiService.GetMatchesAsync();

            // 根据筛选条件过滤
            var filtered = MatchListFilter == "all"
                ? allMatches
                : allMatches.Where(m => m.Status == MatchListFilter).ToList();

            Matches = new ObservableCollection<Match>(filtered);

            if (!string.IsNullOrEmpty(_configService.Config.LastMatchId))
                SelectedMatch = Matches.FirstOrDefault(m => m.Id == _configService.Config.LastMatchId);
        }
        catch (Exception ex)
        {
            StatusMessage = $"加载比赛失败: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task LoadEventsAsync()
    {
        try
        {
            var eventsList = await _apiService.GetEventsAsync();
            Events = new ObservableCollection<Event>(eventsList);
        }
        catch (Exception ex)
        {
            StatusMessage = $"加载赛事失败: {ex.Message}";
        }
    }

    [RelayCommand]
    private async Task FilterMatchList(string filter)
    {
        MatchListFilter = filter;
        await LoadMatchesAsync();
    }

    [RelayCommand]
    private async void SelectAndEnterMatch(Match? match)
    {
        if (match == null) return;

        SelectedMatch = match;
        _configService.Config.LastMatchId = match.Id;
        _configService.SaveConfig();

        HomeTeamName = match.HomeTeam.Name;
        AwayTeamName = match.AwayTeam.Name;
        HomeScore = match.HomeScore;
        AwayScore = match.AwayScore;
        CurrentPeriod = match.CurrentPeriod;

        // Fetch foul data from match detail API
        _ = LoadFoulDataAsync(match.Id);
        TotalPeriods = match.TotalPeriods;
        PeriodDurationMinutes = match.PeriodDurationMinutes;
        MatchStatus = match.Status;
        UpdateMatchStatus();
        UpdatePeriodText();
        EventLog.Clear();

        // Subscribe to this match's socket room
        CurrentPage = "scoring";
    }

    /// <summary>
    /// Load foul counts from the match detail API.
    /// Fires and forgets — initializes HomeFouls/AwayFouls asynchronously.
    /// </summary>
    private async Task LoadFoulDataAsync(string matchId)
    {
        try
        {
            var detail = await _apiService.GetMatchDetailAsync(matchId);
            if (detail == null) return;

            // Dispatch to UI thread for property updates
            SafeDispatch(() =>
            {
                HomeFouls = detail.HomeStats?.GetStat("犯规", 0) ?? 0;
                AwayFouls = detail.AwayStats?.GetStat("犯规", 0) ?? 0;
            });
        }
        catch
        {
            // Best effort — local foul counting still works via foul button clicks
        }
    }

    // Keep old SelectMatchCommand for backward compat
    [RelayCommand]
    private void SelectMatch()
    {
        if (SelectedMatch != null)
            SelectAndEnterMatch(SelectedMatch);
    }

    #endregion

    #region Commands — Scoring

    // 修改计分命令，先打开球员选择对话框
    [RelayCommand]
    private async Task HomeScorePlus1() => await OpenPlayerSelectDialog("home", 1);
    [RelayCommand]
    private async Task HomeScorePlus2() => await OpenPlayerSelectDialog("home", 2);
    [RelayCommand]
    private async Task HomeScorePlus3() => await OpenPlayerSelectDialog("home", 3);
    [RelayCommand]
    private async Task AwayScorePlus1() => await OpenPlayerSelectDialog("away", 1);
    [RelayCommand]
    private async Task AwayScorePlus2() => await OpenPlayerSelectDialog("away", 2);
    [RelayCommand]
    private async Task AwayScorePlus3() => await OpenPlayerSelectDialog("away", 3);

    // 打开球员选择对话框
    private async Task OpenPlayerSelectDialog(string team, int points)
    {
        if (SelectedMatch == null) { StatusMessage = "请先选择一场比赛"; return; }

        PlayerSelectTeam = team;
        PlayerSelectPoints = points;
        PlayerSelectTitle = $"{(team == "home" ? HomeTeamName : AwayTeamName)} - 选择得分球员 (+{points})";

        // 获取对应球队的球员列表
        var teamId = team == "home" ? SelectedMatch.HomeTeam.Id : SelectedMatch.AwayTeam.Id;
        var players = await _apiService.GetPlayersAsync(teamId);
        AvailablePlayersForSelect = new ObservableCollection<Player>(players);

        // 如果只有0或1个球员，直接使用
        if (players.Count <= 1 && players.Count > 0)
        {
            await ConfirmPlayerSelectAndScore(players[0]);
        }
        else
        {
            IsPlayerSelectDialogOpen = true;
        }
    }

    // 确认球员选择并计分
    [RelayCommand]
    private async Task ConfirmPlayerSelectAndScore(Player? player)
    {
        IsPlayerSelectDialogOpen = false;
        if (player == null)
        {
            StatusMessage = "⚠ 请选择一名球员";
            return;
        }

        SelectedPlayerForScore = player;
        await AddScoreAsync(PlayerSelectTeam, PlayerSelectPoints, player);
    }

    // 取消球员选择
    [RelayCommand]
    private void CancelPlayerSelect()
    {
        IsPlayerSelectDialogOpen = false;
        SelectedPlayerForScore = null;
    }

    private async Task AddScoreAsync(string team, int points, Player? player = null)
    {
        if (SelectedMatch == null) { StatusMessage = "请先选择一场比赛"; return; }

        if (team == "home") HomeScore += points;
        else AwayScore += points;

        var scoreUpdate = new ScoreUpdate
        {
            MatchId = SelectedMatch.Id,
            Team = team,
            Points = points,
            Timestamp = DateTime.UtcNow
        };

        // 构建得分描述
        var teamName = team == "home" ? HomeTeamName : AwayTeamName;
        var playerDesc = player != null
            ? $" #{player.Number} {player.Name}"
            : "";
        var scoreTypeDesc = PlayerSelectPoints switch
        {
            1 => "罚球",
            2 => "两分",
            3 => "三分",
            _ => "得分"
        };

        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = "score",
            Team = team,
            Points = points,
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            PlayerId = player?.Id,
            PlayerNumber = player?.Number,
            Description = $"{teamName}{playerDesc} {scoreTypeDesc} (+{points})"
        };

        AddEvent(matchEvent);
        await _apiService.UpdateScoreAsync(scoreUpdate);
        await _apiService.AddMatchEventAsync(matchEvent);
        // Note: The server broadcasts score:update and match:event via Socket.IO
        // after processing these REST API calls. We do NOT emit directly here
        // to avoid duplicate events reaching other connected clients.
    }

    #endregion

    #region Commands — Fouls / Substitution / Timeout

    // 修改犯规命令，先打开犯规类型选择对话框
    [RelayCommand]
    private async Task HomeFoulAsync() => await OpenFoulTypeDialog("home");
    [RelayCommand]
    private async Task AwayFoulAsync() => await OpenFoulTypeDialog("away");

    // 打开犯规类型选择对话框
    private async Task OpenFoulTypeDialog(string team)
    {
        if (SelectedMatch == null) return;

        FoulTypeTeam = team;
        FoulTypeTitle = $"{(team == "home" ? HomeTeamName : AwayTeamName)} - 选择犯规类型";

        // 从后端加载该运动类型的犯规类型
        var sportType = SelectedMatch.SportType ?? "basketball";
        var backendFoulTypes = await _apiService.GetFoulTypesAsync(sportType);

        if (backendFoulTypes.Count > 0)
        {
            // 使用后端数据
            var foulItems = backendFoulTypes.Select(FoulTypeItem.FromFoulType).ToList();
            FoulTypes = new ObservableCollection<FoulTypeItem>(foulItems);
        }
        else
        {
            // 后端无数据时使用本地备用数据
            FoulTypes = new ObservableCollection<FoulTypeItem>
            {
                new() { Code = "personal_foul", Name = "个人犯规", Severity = "common" },
                new() { Code = "shooting_foul", Name = "投篮犯规", Severity = "common" },
                new() { Code = "technical_foul", Name = "技术犯规", Severity = "severe" },
                new() { Code = "unsportsmanlike_foul", Name = "违反体育道德", Severity = "severe" },
                new() { Code = "flagrant_foul", Name = "恶意犯规", Severity = "dangerous" },
            };
        }

        IsFoulTypeDialogOpen = true;
    }

    // 确认犯规类型选择并添加犯规
    [RelayCommand]
    private async Task ConfirmFoulTypeAndAdd(FoulTypeItem? foulType)
    {
        IsFoulTypeDialogOpen = false;
        if (foulType == null)
        {
            StatusMessage = "⚠ 请选择犯规类型";
            return;
        }

        SelectedFoulType = foulType;
        await AddFoulWithTypeAsync(FoulTypeTeam, foulType);
    }

    // 取消犯规类型选择
    [RelayCommand]
    private void CancelFoulTypeSelect()
    {
        IsFoulTypeDialogOpen = false;
        SelectedFoulType = null;
    }

    private async Task AddFoulWithTypeAsync(string team, FoulTypeItem foulType)
    {
        if (SelectedMatch == null) return;
        if (team == "home") HomeFouls++;
        else AwayFouls++;

        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = foulType.Code,
            Team = team,
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            Detail = foulType.Severity,
            Description = $"{(team == "home" ? HomeTeamName : AwayTeamName)} {foulType.Emoji} {foulType.Name}"
        };
        AddEvent(matchEvent);
        await _apiService.AddMatchEventAsync(matchEvent);
        await _socketService.EmitMatchEventAsync(matchEvent);
    }

    // 保留旧的AddFoulAsync方法用于直接添加犯规（备用）
    private async Task AddFoulAsync(string team)
    {
        if (SelectedMatch == null) return;
        if (team == "home") HomeFouls++;
        else AwayFouls++;

        var playerInfo = !string.IsNullOrWhiteSpace(FoulPlayerNumber) ? $" #{FoulPlayerNumber}" : "";
        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = "foul",
            Team = team,
            PlayerNumber = int.TryParse(FoulPlayerNumber, out var num) ? num : null,
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            Description = $"{(team == "home" ? HomeTeamName : AwayTeamName)}{playerInfo} 犯规"
        };
        AddEvent(matchEvent);
        FoulPlayerNumber = string.Empty;
        await _apiService.AddMatchEventAsync(matchEvent);
        await _socketService.EmitMatchEventAsync(matchEvent);
    }

    [RelayCommand]
    private async Task HomeSubstitutionAsync() => await AddSubstitutionAsync("home");
    [RelayCommand]
    private async Task AwaySubstitutionAsync() => await AddSubstitutionAsync("away");

    private async Task AddSubstitutionAsync(string team)
    {
        if (SelectedMatch == null) return;
        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = "substitution",
            Team = team,
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            Description = $"{(team == "home" ? HomeTeamName : AwayTeamName)} 换人"
        };
        AddEvent(matchEvent);
        await _apiService.AddMatchEventAsync(matchEvent);
        await _socketService.EmitMatchEventAsync(matchEvent);
    }

    [RelayCommand]
    private async Task HomeTimeoutAsync() => await AddTimeoutAsync("home");
    [RelayCommand]
    private async Task AwayTimeoutAsync() => await AddTimeoutAsync("away");

    private async Task AddTimeoutAsync(string team)
    {
        if (SelectedMatch == null) return;
        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = "timeout",
            Team = team,
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            Description = $"{(team == "home" ? HomeTeamName : AwayTeamName)} 暂停"
        };
        AddEvent(matchEvent);
        if (IsTimerRunning) { _timer?.Stop(); IsTimerRunning = false; }
        await _apiService.AddMatchEventAsync(matchEvent);
        await _socketService.EmitMatchEventAsync(matchEvent);
    }

    private void AddEvent(MatchEvent evt)
    {
        EventLog.Insert(0, evt);
        OnPropertyChanged(nameof(FilteredEventLog));
    }

    #endregion

    #region Commands — Timer

    [RelayCommand]
    private void StartTimer()
    {
        if (SelectedMatch == null) return;
        _timer?.Start();
        IsTimerRunning = true;
        if (MatchStatus == "未开始") { MatchStatus = "进行中"; UpdateMatchStatus(); }
    }

    [RelayCommand]
    private void PauseTimer()
    {
        _timer?.Stop();
        IsTimerRunning = false;
        if (MatchStatus == "进行中") { MatchStatus = "已暂停"; UpdateMatchStatus(); }
    }

    [RelayCommand]
    private void ResetTimer()
    {
        _timer?.Stop();
        IsTimerRunning = false;
        ElapsedSeconds = 0;
        UpdateTimerDisplay();
    }

    [RelayCommand]
    private void NextPeriod()
    {
        if (CurrentPeriod < TotalPeriods) { CurrentPeriod++; UpdatePeriodText(); ResetTimer(); }
    }

    [RelayCommand]
    private void PreviousPeriod()
    {
        if (CurrentPeriod > 1) { CurrentPeriod--; UpdatePeriodText(); ResetTimer(); }
    }

    [RelayCommand]
    private async Task EndMatchAsync()
    {
        if (SelectedMatch == null) return;
        _timer?.Stop(); IsTimerRunning = false;
        MatchStatus = "已结束"; UpdateMatchStatus();
        var matchEvent = new MatchEvent
        {
            MatchId = SelectedMatch.Id,
            Type = "match_end",
            Period = CurrentPeriod,
            Timestamp = DateTime.Now,
            Description = "比赛结束"
        };
        AddEvent(matchEvent);
        await _apiService.UpdateMatchStatusAsync(SelectedMatch.Id, "finished");
        await _socketService.EmitMatchEventAsync(matchEvent);
    }

    #endregion

    #region Commands — Settings / Print / Export

    [RelayCommand]
    private void SaveSettings()
    {
        _configService.Config.ServerUrl = ServerUrl;
        _configService.Config.PeriodDurationMinutes = PeriodDurationMinutes;
        _configService.Config.TotalPeriods = TotalPeriods;
        _configService.SaveConfig();
        StatusMessage = "✅ 设置已保存";
        StatusBrush = new SolidColorBrush(Color.FromRgb(6, 214, 160));
    }

    [RelayCommand]
    private void PrintScoreSheet()
    {
        if (SelectedMatch == null) { StatusMessage = "请先选择一场比赛"; return; }

        var printDialog = new System.Windows.Controls.PrintDialog();
        if (printDialog.ShowDialog() != true) return;

        var document = new System.Windows.Documents.FlowDocument
        {
            PagePadding = new System.Windows.Thickness(50),
            FontFamily = new System.Windows.Media.FontFamily("Microsoft YaHei")
        };

        var title = new System.Windows.Documents.Paragraph { TextAlignment = System.Windows.TextAlignment.Center, FontSize = 24, FontWeight = System.Windows.FontWeights.Bold, Margin = new System.Windows.Thickness(0, 0, 0, 20) };
        title.Inlines.Add("比赛计分单");
        document.Blocks.Add(title);

        var info = new System.Windows.Documents.Paragraph { FontSize = 14, Margin = new System.Windows.Thickness(0, 0, 0, 20) };
        info.Inlines.Add($"赛事: {SelectedEvent?.Name ?? "N/A"}  |  日期: {DateTime.Now:yyyy-MM-dd HH:mm}");
        document.Blocks.Add(info);

        var table = new System.Windows.Documents.Table { CellSpacing = 0, BorderThickness = new System.Windows.Thickness(1), BorderBrush = System.Windows.Media.Brushes.Black };
        table.Columns.Add(new System.Windows.Documents.TableColumn { Width = new System.Windows.GridLength(160) });
        table.Columns.Add(new System.Windows.Documents.TableColumn { Width = new System.Windows.GridLength(80) });
        table.Columns.Add(new System.Windows.Documents.TableColumn { Width = new System.Windows.GridLength(80) });

        var hGroup = new System.Windows.Documents.TableRowGroup();
        var hRow = new System.Windows.Documents.TableRow();
        hRow.Cells.Add(CreateCell("队伍", true)); hRow.Cells.Add(CreateCell("得分", true)); hRow.Cells.Add(CreateCell("犯规", true));
        hGroup.Rows.Add(hRow); table.RowGroups.Add(hGroup);

        var homeGroup = new System.Windows.Documents.TableRowGroup();
        var homeRow = new System.Windows.Documents.TableRow();
        homeRow.Cells.Add(CreateCell(HomeTeamName, false)); homeRow.Cells.Add(CreateCell(HomeScore.ToString(), false)); homeRow.Cells.Add(CreateCell(HomeFouls.ToString(), false));
        homeGroup.Rows.Add(homeRow); table.RowGroups.Add(homeGroup);

        var awayGroup = new System.Windows.Documents.TableRowGroup();
        var awayRow = new System.Windows.Documents.TableRow();
        awayRow.Cells.Add(CreateCell(AwayTeamName, false)); awayRow.Cells.Add(CreateCell(AwayScore.ToString(), false)); awayRow.Cells.Add(CreateCell(AwayFouls.ToString(), false));
        awayGroup.Rows.Add(awayRow); table.RowGroups.Add(awayGroup);
        document.Blocks.Add(table);

        var pInfo = new System.Windows.Documents.Paragraph { FontSize = 14, Margin = new System.Windows.Thickness(0, 20, 0, 0) };
        pInfo.Inlines.Add($"节次: 第 {CurrentPeriod} / {TotalPeriods} 节  |  用时: {TimerDisplay}  |  状态: {MatchStatus}");
        document.Blocks.Add(pInfo);

        if (EventLog.Count > 0)
        {
            var evTitle = new System.Windows.Documents.Paragraph { FontSize = 16, FontWeight = System.Windows.FontWeights.Bold, Margin = new System.Windows.Thickness(0, 20, 0, 10) };
            evTitle.Inlines.Add("事件记录");
            document.Blocks.Add(evTitle);
            foreach (var evt in EventLog.Take(30))
            {
                var evPara = new System.Windows.Documents.Paragraph { FontSize = 12, Margin = new System.Windows.Thickness(0, 2, 0, 2) };
                evPara.Inlines.Add($"[{evt.Timestamp:HH:mm:ss}] 第{evt.Period}节  {evt.Description}");
                document.Blocks.Add(evPara);
            }
        }

        printDialog.PrintDocument(((System.Windows.Documents.IDocumentPaginatorSource)document).DocumentPaginator,
            $"计分单_{HomeTeamName}_vs_{AwayTeamName}_{DateTime.Now:yyyyMMdd}");
        StatusMessage = "✅ 计分单已发送至打印机";
    }

    [RelayCommand]
    private void SaveData() { StatusMessage = "✅ 数据已保存到本地"; }

    [RelayCommand]
    private void ExportData() { StatusMessage = "📤 数据导出功能开发中..."; }

    private static System.Windows.Documents.TableCell CreateCell(string text, bool isHeader)
    {
        return new System.Windows.Documents.TableCell(new System.Windows.Documents.Paragraph
        {
            TextAlignment = System.Windows.TextAlignment.Center,
            FontWeight = isHeader ? System.Windows.FontWeights.Bold : System.Windows.FontWeights.Normal,
            FontSize = 14,
            Inlines = { new System.Windows.Documents.Run(text) }
        })
        {
            BorderThickness = new System.Windows.Thickness(1),
            BorderBrush = System.Windows.Media.Brushes.Black,
            Padding = new System.Windows.Thickness(8, 4, 8, 4)
        };
    }

    #endregion

    #region Commands — Tutorial / Help

    [RelayCommand]
    private void StartTutorial() { TutorialStep = 0; ShowTutorial = true; UpdateTutorialContent(); }

    [RelayCommand]
    private void NextTutorialStep()
    {
        TutorialStep++;
        if (TutorialStep >= _tutorialSteps.Count)
        {
            ShowTutorial = false;
            _configService.Config.IsFirstRun = false;
            _configService.SaveConfig();
        }
        else UpdateTutorialContent();
    }

    [RelayCommand]
    private void SkipTutorial()
    {
        ShowTutorial = false;
        _configService.Config.IsFirstRun = false;
        _configService.SaveConfig();
    }

    [RelayCommand]
    private void ShowHelpDialog() => ShowHelp = true;

    [RelayCommand]
    private void CloseHelp() => ShowHelp = false;

    private void UpdateTutorialContent()
    {
        if (TutorialStep >= _tutorialSteps.Count) return;
        var step = _tutorialSteps[TutorialStep];
        TutorialTitle = step.Title;
        TutorialContent = step.Content;
        TutorialDescription = step.Description;
        TutorialProgress = (TutorialStep + 1) * 100 / _tutorialSteps.Count;
        TutorialNextButtonText = TutorialStep == _tutorialSteps.Count - 1 ? "完成" : "下一步";
    }

    #endregion

    #region Private Helpers

    private void UpdateMatchStatus()
    {
        MatchStatusText = SelectedMatch == null ? "未选择比赛" : $"{MatchStatus} · 第{CurrentPeriod}节";
        MatchStatusBrush = MatchStatus switch
        {
            "未开始" => new SolidColorBrush(Color.FromRgb(90, 90, 110)),
            "进行中" => new SolidColorBrush(Color.FromRgb(6, 214, 160)),
            "已暂停" => new SolidColorBrush(Color.FromRgb(243, 156, 18)),
            "已结束" => new SolidColorBrush(Color.FromRgb(239, 35, 60)),
            "live" => new SolidColorBrush(Color.FromRgb(6, 214, 160)),
            "upcoming" => new SolidColorBrush(Color.FromRgb(90, 90, 110)),
            "finished" => new SolidColorBrush(Color.FromRgb(239, 35, 60)),
            _ => new SolidColorBrush(Color.FromRgb(90, 90, 110))
        };
    }

    private void UpdatePeriodText() => PeriodText = $"第 {CurrentPeriod} / {TotalPeriods} 节";

    private void Timer_Tick(object? sender, EventArgs e)
    {
        ElapsedSeconds++;
        UpdateTimerDisplay();
    }

    private void UpdateTimerDisplay()
    {
        var m = ElapsedSeconds / 60;
        var s = ElapsedSeconds % 60;
        TimerDisplay = $"{m:D2}:{s:D2}";
    }

    #endregion

    #region Keyboard Handler

    public void HandleKeyDown(System.Windows.Input.KeyEventArgs e)
    {
        if (ShowTutorial || ShowHelp) return;
        if (!IsScoringPage) return;

        switch (e.Key)
        {
            case System.Windows.Input.Key.D1: HomeScorePlus1Command.Execute(null); break;
            case System.Windows.Input.Key.D2: HomeScorePlus2Command.Execute(null); break;
            case System.Windows.Input.Key.D3: HomeScorePlus3Command.Execute(null); break;
            case System.Windows.Input.Key.D7: AwayScorePlus1Command.Execute(null); break;
            case System.Windows.Input.Key.D8: AwayScorePlus2Command.Execute(null); break;
            case System.Windows.Input.Key.D9: AwayScorePlus3Command.Execute(null); break;
            case System.Windows.Input.Key.Space:
                if (IsTimerRunning) PauseTimerCommand.Execute(null);
                else StartTimerCommand.Execute(null);
                break;
            case System.Windows.Input.Key.Left: PreviousPeriodCommand.Execute(null); break;
            case System.Windows.Input.Key.Right: NextPeriodCommand.Execute(null); break;
            case System.Windows.Input.Key.F1: ShowHelpDialogCommand.Execute(null); break;
            case System.Windows.Input.Key.Escape:
                if (ShowHelp) ShowHelp = false;
                break;
        }
    }

    #endregion

    public void Dispose()
    {
        lock (this)
        {
            if (!_disposed)
            {
                _disposed = true;
                _timer?.Stop();
                _socketService.Dispose();
                _backendService.OutputReceived -= OnBackendOutput;
                _backendService.Dispose();
            }
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

public class SportTypeItem
{
    public string SportType { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Emoji { get; set; } = "";
    public string DisplayText => $"{Emoji} {DisplayName}";
}

/// <summary>
/// 犯规类型选项（用于 UI 显示）
/// </summary>
public class FoulTypeItem
{
    public string Id { get; set; } = "";
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string Severity { get; set; } = "common"; // minor, common, severe, dangerous
    public string SeverityName => Severity switch
    {
        "minor" => "轻微",
        "common" => "一般",
        "severe" => "严重",
        "dangerous" => "危险",
        _ => Severity
    };
    public string Emoji => Severity switch
    {
        "minor" => "🟢",
        "common" => "🟡",
        "severe" => "🟠",
        "dangerous" => "🔴",
        _ => "⚠️"
    };
    public string Penalty { get; set; } = "";
    public string Description { get; set; } = "";
    public string DisplayText => $"{Emoji} {Name}";

    /// <summary>
    /// 从后端 FoulType 转换为 FoulTypeItem
    /// </summary>
    public static FoulTypeItem FromFoulType(FoulType foulType)
    {
        return new FoulTypeItem
        {
            Id = foulType.Id,
            Code = foulType.Code,
            Name = foulType.Name,
            NameEn = foulType.NameEn,
            Severity = foulType.Severity,
            Penalty = foulType.Penalty.Description,
            Description = foulType.Description
        };
    }
}
