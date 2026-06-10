using SocketIOClient;
using System.Text.Json;
using ScoringSystem.Models;
using SioSocket = SocketIOClient.SocketIO;
using SioOptions = SocketIOClient.SocketIOOptions;

namespace ScoringSystem.Services;

public class SocketService : IDisposable
{
    private SioSocket? _socket;
    private bool _disposed;

    public bool IsConnected => _socket?.Connected ?? false;

    public event Action? OnConnected;
    public event Action? OnDisconnected;
    public event Action<MatchState>? OnScoreUpdate;
    public event Action<MatchEvent>? OnMatchEvent;
    public event Action<string>? OnError;

    public async Task ConnectAsync(string serverUrl)
    {
        try
        {
            if (_socket != null)
            {
                await DisconnectAsync();
            }

            // Convert ws:// to http:// for Socket.IO
            var normalizedUrl = serverUrl
                .Replace("ws://", "http://")
                .Replace("wss://", "https://");

            _socket = new SioSocket(normalizedUrl, new SioOptions
            {
                Reconnection = true,
                ReconnectionAttempts = 5,
                ReconnectionDelay = 3000
            });

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

            _socket.On("score:update", response =>
            {
                try
                {
                    var json = response.ToString();
                    var state = JsonSerializer.Deserialize<MatchState>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (state != null)
                    {
                        OnScoreUpdate?.Invoke(state);
                    }
                }
                catch (Exception)
                {
                    // Ignore parse errors
                }
            });

            _socket.On("match:event", response =>
            {
                try
                {
                    var json = response.ToString();
                    // Server wraps: { event: { ... } }
                    using var doc = JsonDocument.Parse(json);
                    var eventJson = doc.RootElement.TryGetProperty("event", out var evProp)
                        ? evProp.GetRawText()
                        : json;

                    var matchEvent = JsonSerializer.Deserialize<MatchEvent>(eventJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (matchEvent != null)
                    {
                        OnMatchEvent?.Invoke(matchEvent);
                    }
                }
                catch (Exception)
                {
                    // Ignore parse errors
                }
            });

            await _socket.ConnectAsync();
        }
        catch (Exception ex)
        {
            OnError?.Invoke($"连接失败: {ex.Message}");
        }
    }

    public async Task DisconnectAsync()
    {
        if (_socket != null)
        {
            try
            {
                await _socket.DisconnectAsync();
            }
            catch
            {
                // Ignore disconnect errors
            }
            _socket.Dispose();
            _socket = null;
        }
    }

    public async Task EmitScoreUpdateAsync(ScoreUpdate scoreUpdate)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var json = JsonSerializer.Serialize(scoreUpdate, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("score:update", json);
        }
        catch (Exception)
        {
            // Ignore emit errors
        }
    }

    public async Task EmitMatchEventAsync(MatchEvent matchEvent)
    {
        if (_socket?.Connected != true) return;

        try
        {
            var json = JsonSerializer.Serialize(matchEvent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
            await _socket.EmitAsync("match:event", json);
        }
        catch (Exception)
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
        }
        GC.SuppressFinalize(this);
    }
}
