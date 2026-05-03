// EntryAbility.ts - HarmonyOS 应用入口
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';
import AbilityConstant from '@ohos.app.ability.AbilityConstant';
import Want from '@ohos.app.ability.Want';

export default class EntryAbility extends UIAbility {
  onConnect(want: Want, callback: (connection: Object) => void): void {
    // Service extension connection
  }

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    console.log('EntryAbility onCreate');
  }

  onDestroy(): void {
    console.log('EntryAbility onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // Set the main page
    windowStage.loadContent('pages/Index', (err, data) => {
      if (err) {
        console.error('Failed to load page, code: ${err.code}, message: ${err.message}');
        return;
      }
      console.log('Succeeded in loading page.');
    });

    // Set window properties
    windowStage.getMainWindow().then((windowClass) => {
      windowClass.setWindowBackgroundColor('#000000');
    });
  }

  onWindowStageDestroy(): void {
    console.log('EntryAbility onWindowStageDestroy');
  }

  onForeground(): void {
    console.log('EntryAbility onForeground');
  }

  onBackground(): void {
    console.log('EntryAbility onBackground');
  }
}
