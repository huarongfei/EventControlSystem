// EventControlSystem - Windows Scoring System
// Author: Huafeirong (https://github.com/huarongfei)
// Project: https://github.com/huarongfei/EventControlSystem
// Copyright © 2026 Huafeirong. All rights reserved.

using System.Windows;
using System.Windows.Input;
using ScoringSystem.ViewModels;

namespace ScoringSystem.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (DataContext is MainViewModel vm)
        {
            vm.HandleKeyDown(e);
        }
    }

    private void FoulTypeItem_Click(object sender, MouseButtonEventArgs e)
    {
        if (sender is FrameworkElement element && element.DataContext is FoulTypeItem item)
        {
            if (DataContext is MainViewModel vm)
            {
                vm.ConfirmFoulTypeAndAddCommand.Execute(item);
            }
        }
    }
}
