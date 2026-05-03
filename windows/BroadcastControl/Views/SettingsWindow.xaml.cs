using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Data;
using BroadcastControl.ViewModels;

namespace BroadcastControl.Views;

public partial class SettingsWindow : Window
{
    public SettingsWindow(MainViewModel mainViewModel)
    {
        InitializeComponent();
        DataContext = new SettingsViewModel(mainViewModel);
    }

    private void TabGeneral_Click(object sender, RoutedEventArgs e)
    {
        ShowTab(PanelGeneral, TabGeneral);
    }

    private void TabCameras_Click(object sender, RoutedEventArgs e)
    {
        ShowTab(PanelCameras, TabCameras);
    }

    private void TabRecording_Click(object sender, RoutedEventArgs e)
    {
        ShowTab(PanelRecording, TabRecording);
    }

    private void ShowTab(UIElement panel, Button activeTab)
    {
        // Hide all panels
        PanelGeneral.Visibility = Visibility.Collapsed;
        PanelCameras.Visibility = Visibility.Collapsed;
        PanelRecording.Visibility = Visibility.Collapsed;

        // Reset all tabs
        TabGeneral.Foreground = FindResource("TextSecondary") as Brush;
        TabGeneral.BorderBrush = Brushes.Transparent;
        TabCameras.Foreground = FindResource("TextSecondary") as Brush;
        TabCameras.BorderBrush = Brushes.Transparent;
        TabRecording.Foreground = FindResource("TextSecondary") as Brush;
        TabRecording.BorderBrush = Brushes.Transparent;

        // Show selected panel and highlight tab
        panel.Visibility = Visibility.Visible;
        activeTab.Foreground = FindResource("AccentCyan") as Brush;
        activeTab.BorderBrush = FindResource("AccentBlue") as Brush;
    }

    private void ColorButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is Button button && button.Tag is string colorHex)
        {
            if (DataContext is SettingsViewModel vm)
            {
                vm.SetCameraColorCommand.Execute(colorHex);
            }
        }
    }

    private void SaveButton_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e)
    {
        Close();
    }
}

public class NullToBoolConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
    {
        return value != null;
    }

    public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class NullToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
    {
        return value != null ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, System.Globalization.CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
