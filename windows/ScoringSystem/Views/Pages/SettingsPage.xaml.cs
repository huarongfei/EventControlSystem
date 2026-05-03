using System.Diagnostics;
using System.Windows.Controls;

namespace ScoringSystem.Views.Pages;

public partial class SettingsPage : UserControl
{
    public SettingsPage()
    {
        InitializeComponent();
    }

    private void OpenWebPanel_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:5173",
                UseShellExecute = true
            });
        }
        catch (System.Exception ex)
        {
            System.Windows.MessageBox.Show($"无法打开浏览器: {ex.Message}", "错误",
                System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Warning);
        }
    }

    private void OpenApiTest_Click(object sender, System.Windows.RoutedEventArgs e)
    {
        try
        {
            var vm = DataContext as ScoringSystem.ViewModels.MainViewModel;
            var baseUrl = vm?.ServerUrl?.Replace("ws://", "http://")?.Replace("wss://", "https://") ?? "http://localhost:3001";
            Process.Start(new ProcessStartInfo
            {
                FileName = $"{baseUrl}/api/health",
                UseShellExecute = true
            });
        }
        catch (System.Exception ex)
        {
            System.Windows.MessageBox.Show($"无法打开浏览器: {ex.Message}", "错误",
                System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Warning);
        }
    }
}
