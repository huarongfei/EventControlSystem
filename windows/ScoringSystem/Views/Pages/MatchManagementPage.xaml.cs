using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using ScoringSystem.ViewModels;

namespace ScoringSystem.Views.Pages;

public partial class MatchManagementPage : UserControl
{
    public MatchManagementPage()
    {
        InitializeComponent();
    }

    private void SportTypeItem_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is FrameworkElement element && element.DataContext is SportTypeItem item)
        {
            if (DataContext is MainViewModel vm)
            {
                vm.SelectEventSportTypeCommand.Execute(item);
            }
        }
    }

    private void MatchSportTypeItem_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is FrameworkElement element && element.DataContext is SportTypeItem item)
        {
            if (DataContext is MainViewModel vm)
            {
                vm.SelectSportTypeCommand.Execute(item);
            }
        }
    }
}