using SocketIOClient;
using System.Text.Json;
using BroadcastControl.Models;
using SioSocket = SocketIOClient.SocketIO;
using SioOptions = SocketIOClient.SocketIOOptions;

namespace BroadcastControl.Services;

public class SocketService : IDisposable
{
    private SioSocket? _socket;
    private bool _disposed;
    private readonly SemaphoreSlim _connectLock = new(1, 1);

    public bool IsConnected => _socket?.Connected ?? false;

    // Connection events
    public event Action? OnConnected;
    public event Action? OnDisconnected;
    public event Action<string>? OnError;
    
    // Data events
    public event Action<MatchScoreState>? OnScoreUpdate;
    public event Action<BroadcastScene>? OnScenePresetUpdate;
    public event Action<BroadcastScene>? OnSwitchScene;
    public event Action<string, bool>? OnVirtualCameraStatus;
    public event Action<string>? OnTransitionEffect;
    public event Action<SlowMotionState>? OnSlowMotionUpdate;

    public async Task ConnectAsync(string serverUrl)
    {
        await _connectLock.WaitAsync();
        try
        {
            if (_socket != null)
            {
                await DisconnectAsync();
            }

            var normalizedUrl = serverUrl
                .Replace("ws://", "http://")
                .Replace("wss://", "https://");

            _socket = new SioSocket(normalizedUrl, new SioOptions
            {
                Reconnection = true,
                ReconnectionAttempts = 10,
                ReconnectionDelay = 3000,
                ReconnectionDelayMax = 10000,
                RandomizationFactor = 0.5
            });

            // Register event handlers
            _socket.OnConnected += (_, _) =>
            {
                OnConnected?.Invoke();
            };

            _socket.OnDisconnected += (_, _) =>
            {
                OnDisconnected?.Invoke();
            };

            _socket.OnError += (_, err) =>
            {
                OnError?.Invoke(err.ToString());
            };

            // Score updates
            _socket.On("score:update", response =>
            {
                try
                {
                    var json = response.ToString();
                    var state = JsonSerializer.Deserialize<MatchScoreState>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (state != null)
                    {
                        OnScoreUpdate?.Invoke(state);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] score:update parse error: {ex.Message}");
                }
            });

            // Scene preset updates from server
            _socket.On("scene:preset_update", response =>
            {
                try
                {
                    var json = response.ToString();
                    var scene = JsonSerializer.Deserialize<BroadcastScene>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (scene != null)
                    {
                        OnScenePresetUpdate?.Invoke(scene);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] scene:preset_update parse error: {ex.Message}");
                }
            });

            // Scene switch from server (broadcast:switchScene)
            _socket.On("broadcast:switchScene", response =>
            {
                try
                {
                    var json = response.ToString();
                    var scene = JsonSerializer.Deserialize<BroadcastScene>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (scene != null)
                    {
                        OnSwitchScene?.Invoke(scene);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] broadcast:switchScene parse error: {ex.Message}");
                }
            });

            // Virtual camera status
            _socket.On("virtual_camera:status", response =>
            {
                try
                {
                    var json = response.ToString();
                    var data = JsonDocument.Parse(json);
                    var status = data.RootElement.GetProperty("status").GetString();
                    var isRunning = data.RootElement.GetProperty("is_running").GetBoolean();
                    OnVirtualCameraStatus?.Invoke(status ?? "unknown", isRunning);
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] virtual_camera:status parse error: {ex.Message}");
                }
            });

            // Transition effects
            _socket.On("transition:effect", response =>
            {
                try
                {
                    var json = response.ToString();
                    var data = JsonDocument.Parse(json);
                    var effect = data.RootElement.GetProperty("effect").GetString();
                    if (effect != null)
                    {
                        OnTransitionEffect?.Invoke(effect);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] transition:effect parse error: {ex.Message}");
                }
            });

            // Slow motion updates
            _socket.On("slowmotion:update", response =>
            {
                try
                {
                    var json = response.ToString();
                    var state = JsonSerializer.Deserialize<SlowMotionState>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (state != null)
                    {
                        OnSlowMotionUpdate?.Invoke(state);
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"[Socket] slowmotion:update parse error: {ex.Message}");
                }
            });

            await _socket.ConnectAsync();
        }
        catch (Exception ex)
        {
            OnError?.Invoke($"连接失败: {ex.Message}");
        }
        finally
        {
            _connectLock.Release();
        }
    }

    public async Task DisconnectAsync()
    {
        if (_socket != null)
        {
            try { await _socket.DisconnectAsync(); } catch { }
            _socket.Dispose();
            _socket = null;
        }
    }

    public async Task EmitSceneChangeAsync(int sceneId, string sceneName, string? matchId = null)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var sceneChange = new
            {
                sceneId = sceneId.ToString(),
                sceneName,
                matchId,
                timestamp = DateTime.UtcNow
            };
            var json = JsonSerializer.Serialize(sceneChange, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("broadcast:switchScene", json);
        }
        catch (Exception)
        {
            // Ignore emit errors
        }
    }

    public async Task EmitVirtualCameraStatusAsync(string status, bool isRunning)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var data = new { status, is_running = isRunning, timestamp = DateTime.UtcNow };
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("virtual_camera:status", json);
        }
        catch
        {
            // Ignore emit errors
        }
    }

    public async Task EmitTransitionAsync(string effect, int duration)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var data = new { effect, duration, timestamp = DateTime.UtcNow };
            var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("transition:effect", json);
        }
        catch
        {
            // Ignore emit errors
        }
    }

    public async Task EmitSlowMotionStateAsync(SlowMotionState state)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var json = JsonSerializer.Serialize(state, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("slowmotion:update", json);
        }
        catch
        {
            // Ignore emit errors
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _disposed = true;
            _socket?.Dispose();
            _connectLock.Dispose();
        }
        GC.SuppressFinalize(this);
    }
}

public class SlowMotionState
{
    public bool MarkedIn { get; set; }
    public bool MarkedOut { get; set; }
    public string? PlaybackSpeed { get; set; } = "0.5x";
    public bool IsPlaying { get; set; }
    public string Status { get; set; } = "idle"; // idle, marked_in, marked_both, playing

    public static readonly string[] AvailableSpeeds = { "0.25x", "0.5x", "0.75x", "1.0x" };
}
