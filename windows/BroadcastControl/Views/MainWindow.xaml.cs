using System.Windows;
using System.Windows.Input;
using BroadcastControl.ViewModels;

namespace BroadcastControl.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    private void CameraPreview_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is FrameworkElement fe && fe.Tag is string tagStr && int.TryParse(tagStr, out var camId))
        {
            if (DataContext is MainViewModel vm)
            {
                var camera = vm.Cameras.FirstOrDefault(c => c.CameraId == camId);
                if (camera != null)
                {
                    vm.CutToCameraCommand.Execute(camera);
                }
            }
        }
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (DataContext is MainViewModel vm)
        {
            vm.HandleKeyDown(e);
        }
    }

    private void ShortcutHelp_Click(object sender, MouseButtonEventArgs e)
    {
        if (DataContext is MainViewModel vm)
        {
            vm.ShowShortcutHelp = false;
        }
    }
}
