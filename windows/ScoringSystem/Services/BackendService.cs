using System.Diagnostics;
using System.IO;

namespace ScoringSystem.Services;

/// <summary>
/// 后端服务管理器 - 用于启动/停止 Node.js 后端和 Web 前端服务
/// </summary>
public class BackendService : IDisposable
{
    private Process? _serverProcess;
    private Process? _webProcess;
    private bool _disposed;

    public event EventHandler<string>? OutputReceived;
    public event EventHandler? ServerStarted;
    public event EventHandler? ServerStopped;
    public event EventHandler? WebStarted;
    public event EventHandler? WebStopped;

    public bool IsServerRunning => _serverProcess != null && !_serverProcess.HasExited;
    public bool IsWebRunning => _webProcess != null && !_webProcess.HasExited;

    // 项目根目录 (从 bin/Debug/net8.0-windows/ 向上6级)
    private static string ProjectRoot => Path.GetFullPath(Path.Combine(
        AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", ".."));

    private static string ServerPath => Path.Combine(ProjectRoot, "server");
    private static string WebPath => Path.Combine(ProjectRoot, "web", "AnalysisPanel");

    /// <summary>
    /// 启动后端服务器 (Node.js + Express)
    /// </summary>
    public Task<bool> StartServerAsync()
    {
        if (IsServerRunning)
        {
            OutputReceived?.Invoke(this, "[Server] 后端服务已在运行中");
            return Task.FromResult(true);
        }

        try
        {
            OutputReceived?.Invoke(this, "[Server] 正在启动后端服务...");
            
            // 检查 server 目录是否存在
            if (!Directory.Exists(ServerPath))
            {
                OutputReceived?.Invoke(this, $"[Server] 错误: 找不到 server 目录: {ServerPath}");
                return Task.FromResult(false);
            }

            // 启动 Node.js 服务
            var startInfo = new ProcessStartInfo
            {
                WorkingDirectory = ServerPath,
                FileName = "npm",
                Arguments = "run dev",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = System.Text.Encoding.UTF8,
                StandardErrorEncoding = System.Text.Encoding.UTF8
            };

            _serverProcess = new Process { StartInfo = startInfo };
            _serverProcess.OutputDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                    OutputReceived?.Invoke(this, $"[Server] {e.Data}");
            };
            _serverProcess.ErrorDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                    OutputReceived?.Invoke(this, $"[Server Error] {e.Data}");
            };

            _serverProcess.EnableRaisingEvents = true;
            _serverProcess.Exited += (s, e) =>
            {
                OutputReceived?.Invoke(this, "[Server] 后端服务已停止");
                ServerStopped?.Invoke(this, EventArgs.Empty);
            };

            _serverProcess.Start();
            _serverProcess.BeginOutputReadLine();
            _serverProcess.BeginErrorReadLine();

            OutputReceived?.Invoke(this, $"[Server] 后端服务已启动 (PID: {_serverProcess.Id})");
            ServerStarted?.Invoke(this, EventArgs.Empty);

            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke(this, $"[Server] 启动失败: {ex.Message}");
            return Task.FromResult(false);
        }
    }

    /// <summary>
    /// 停止后端服务器
    /// </summary>
    public void StopServer()
    {
        if (_serverProcess == null || _serverProcess.HasExited)
        {
            OutputReceived?.Invoke(this, "[Server] 后端服务未运行");
            return;
        }

        try
        {
            OutputReceived?.Invoke(this, "[Server] 正在停止后端服务...");
            // 优雅关闭：先尝试发送 Ctrl+C（SIGTERM），等待进程自行退出
            if (!_serverProcess.HasExited)
            {
                try
                {
                    // Windows 上通过 GenerateConsoleCtrlEvent 发送 Ctrl+C
                    var killProc = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = $"/pid {_serverProcess.Id} /t",
                        WindowStyle = ProcessWindowStyle.Hidden,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    });
                    killProc?.WaitForExit(5000); // 等待5秒让进程优雅关闭

                    if (!_serverProcess.HasExited)
                    {
                        // 超时后强制终止
                        _serverProcess.Kill(entireProcessTree: true);
                        _serverProcess.WaitForExit(3000);
                    }
                }
                catch
                {
                    // 如果 taskkill 失败，直接 Kill
                    if (!_serverProcess.HasExited)
                        _serverProcess.Kill(entireProcessTree: true);
                }
            }
            _serverProcess.Dispose();
            _serverProcess = null;
            OutputReceived?.Invoke(this, "[Server] 后端服务已停止");
            ServerStopped?.Invoke(this, EventArgs.Empty);
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke(this, $"[Server] 停止失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 启动 Web 前端 (Vite dev server)
    /// </summary>
    public Task<bool> StartWebAsync()
    {
        if (IsWebRunning)
        {
            OutputReceived?.Invoke(this, "[Web] Web前端已在运行中");
            return Task.FromResult(true);
        }

        try
        {
            OutputReceived?.Invoke(this, "[Web] 正在启动Web前端...");
            
            // 检查 web 目录是否存在
            if (!Directory.Exists(WebPath))
            {
                OutputReceived?.Invoke(this, $"[Web] 错误: 找不到 Web 目录: {WebPath}");
                return Task.FromResult(false);
            }

            var startInfo = new ProcessStartInfo
            {
                WorkingDirectory = WebPath,
                FileName = "npm",
                Arguments = "run dev",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = System.Text.Encoding.UTF8,
                StandardErrorEncoding = System.Text.Encoding.UTF8
            };

            _webProcess = new Process { StartInfo = startInfo };
            _webProcess.OutputDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                    OutputReceived?.Invoke(this, $"[Web] {e.Data}");
            };
            _webProcess.ErrorDataReceived += (s, e) =>
            {
                if (!string.IsNullOrEmpty(e.Data))
                    OutputReceived?.Invoke(this, $"[Web Error] {e.Data}");
            };

            _webProcess.EnableRaisingEvents = true;
            _webProcess.Exited += (s, e) =>
            {
                OutputReceived?.Invoke(this, "[Web] Web前端已停止");
                WebStopped?.Invoke(this, EventArgs.Empty);
            };

            _webProcess.Start();
            _webProcess.BeginOutputReadLine();
            _webProcess.BeginErrorReadLine();

            OutputReceived?.Invoke(this, $"[Web] Web前端已启动 (PID: {_webProcess.Id})");
            WebStarted?.Invoke(this, EventArgs.Empty);

            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke(this, $"[Web] 启动失败: {ex.Message}");
            return Task.FromResult(false);
        }
    }

    /// <summary>
    /// 停止 Web 前端
    /// </summary>
    public void StopWeb()
    {
        if (_webProcess == null || _webProcess.HasExited)
        {
            OutputReceived?.Invoke(this, "[Web] Web前端未运行");
            return;
        }

        try
        {
            OutputReceived?.Invoke(this, "[Web] 正在停止Web前端...");
            // 优雅关闭：先尝试 taskkill 终止，超时后强制 Kill
            if (!_webProcess.HasExited)
            {
                try
                {
                    var killProc = Process.Start(new ProcessStartInfo
                    {
                        FileName = "taskkill",
                        Arguments = $"/pid {_webProcess.Id} /t",
                        WindowStyle = ProcessWindowStyle.Hidden,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    });
                    killProc?.WaitForExit(3000);

                    if (!_webProcess.HasExited)
                        _webProcess.Kill(entireProcessTree: true);
                }
                catch
                {
                    if (!_webProcess.HasExited)
                        _webProcess.Kill(entireProcessTree: true);
                }
            }
            _webProcess.Dispose();
            _webProcess = null;
            OutputReceived?.Invoke(this, "[Web] Web前端已停止");
            WebStopped?.Invoke(this, EventArgs.Empty);
        }
        catch (Exception ex)
        {
            OutputReceived?.Invoke(this, $"[Web] 停止失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 一键启动所有后台服务（后端 + Web前端）
    /// </summary>
    public async Task StartAllAsync()
    {
        await StartServerAsync();
        await Task.Delay(2000); // 等待后端启动
        await StartWebAsync();
    }

    /// <summary>
    /// 停止所有后台服务
    /// </summary>
    public void StopAll()
    {
        StopServer();
        StopWeb();
    }

    /// <summary>
    /// 获取后端服务状态信息
    /// </summary>
    public string GetStatusSummary()
    {
        var serverStatus = IsServerRunning ? $"运行中 (PID: {_serverProcess?.Id})" : "已停止";
        var webStatus = IsWebRunning ? $"运行中 (PID: {_webProcess?.Id})" : "已停止";
        return $"后端服务: {serverStatus} | Web前端: {webStatus}";
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _disposed = true;
            StopAll();
        }
        GC.SuppressFinalize(this);
    }
}
