// SettingsPage.ets - 设置页面
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { storageService } from '../service/StorageService';

@Entry
@Component
struct SettingsPage {
  @State serverUrl: string = '';
  @State userName: string = '';
  @State historyUrls: string[] = [];
  @State isLoading: boolean = true;

  aboutToAppear(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.isLoading = true;
    try {
      this.serverUrl = await storageService.getServerUrl();
      // 从历史记录加载
      const history = await storageService.getHistoryUrls();
      this.historyUrls = history;
    } catch (err) {
      console.error('加载设置失败:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async saveSettings(): Promise<void> {
    if (this.serverUrl) {
      await storageService.saveServerUrl(this.serverUrl);
      await storageService.addHistoryUrl(this.serverUrl);
    }
    if (this.userName) {
      await storageService.saveUserName(this.userName);
    }
    promptAction.showToast({ message: '设置已保存' });
  }

  async clearHistory(): Promise<void> {
    await storageService.clearHistoryUrls();
    this.historyUrls = [];
    promptAction.showToast({ message: '历史记录已清除' });
  }

  build() {
    Column() {
      // 标题栏
      Row() {
        Button('< 返回')
          .fontSize(16)
          .backgroundColor('transparent')
          .fontColor('#007AFF')
          .onClick(() => router.back());

        Text('设置')
          .fontSize(20)
          .fontWeight(FontWeight.Bold);

        Blank();

        Button('保存')
          .fontSize(16)
          .backgroundColor('transparent')
          .fontColor('#007AFF')
          .onClick(() => this.saveSettings());
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })
      .backgroundColor('#FFFFFF');

      if (this.isLoading) {
        Column() {
          LoadingProgress().width(32).height(32);
        }
        .width('100%')
        .height(200)
        .justifyContent(FlexAlign.Center);
      } else {
        Scroll() {
          Column() {
            // 服务器设置
            Column() {
              Text('服务器设置')
                .fontSize(14)
                .fontColor('#999999')
                .margin({ bottom: 8 });

              TextInput({ placeholder: 'http://192.168.x.x:3001', text: this.serverUrl })
                .width('100%')
                .height(48)
                .borderRadius(8)
                .backgroundColor('#F5F5F5')
                .onChange((value: string) => {
                  this.serverUrl = value;
                });
            }
            .width('100%')
            .padding(16)
            .backgroundColor('#FFFFFF')
            .borderRadius(12)
            .margin({ bottom: 16 });

            // 历史记录
            if (this.historyUrls.length > 0) {
              Column() {
                Row() {
                  Text('历史连接')
                    .fontSize(14)
                    .fontColor('#999999');

                  Blank();

                  Text('清除')
                    .fontSize(14)
                    .fontColor('#FF4444')
                    .onClick(() => this.clearHistory());
                }
                .width('100%')
                .margin({ bottom: 8 });

                List() {
                  ForEach(this.historyUrls, (url: string) => {
                    ListItem() {
                      Row() {
                        Text(url)
                          .fontSize(14)
                          .fontColor('#333333');

                        Blank();

                        Text('使用')
                          .fontSize(12)
                          .fontColor('#007AFF');
                      }
                      .width('100%')
                      .padding(12)
                      .backgroundColor('#F8F8F8')
                      .borderRadius(8)
                      .onClick(() => {
                        this.serverUrl = url;
                      });
                    }
                    .margin({ bottom: 8 });
                  });
                }
                .width('100%')
                .height(Math.min(this.historyUrls.length * 56, 200));
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(12)
              .margin({ bottom: 16 });
            }

            // 用户信息
            Column() {
              Text('用户信息')
                .fontSize(14)
                .fontColor('#999999')
                .margin({ bottom: 8 });

              TextInput({ placeholder: '裁判员姓名', text: this.userName })
                .width('100%')
                .height(48)
                .borderRadius(8)
                .backgroundColor('#F5F5F5')
                .onChange((value: string) => {
                  this.userName = value;
                });
            }
            .width('100%')
            .padding(16)
            .backgroundColor('#FFFFFF')
            .borderRadius(12)
            .margin({ bottom: 16 });

            // 关于
            Column() {
              Text('关于')
                .fontSize(14)
                .fontColor('#999999')
                .margin({ bottom: 8 });

              Row() {
                Text('版本')
                  .fontSize(16);
                Blank();
                Text('1.0.0')
                  .fontSize(14)
                  .fontColor('#999999');
              }
              .width('100%')
              .padding({ top: 12, bottom: 12 });

              Divider();

              Row() {
                Text('EventControlSystem')
                  .fontSize(16);
                Blank();
                Text('HarmonyOS 裁判端')
                  .fontSize(14)
                  .fontColor('#999999');
              }
              .width('100%')
              .padding({ top: 12, bottom: 12 });
            }
            .width('100%')
            .padding(16)
            .backgroundColor('#FFFFFF')
            .borderRadius(12);
          }
          .width('100%')
          .padding(16);
        }
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F0F0F0');
  }
}
