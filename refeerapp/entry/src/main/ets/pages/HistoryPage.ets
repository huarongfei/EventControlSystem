// HistoryPage.ets - 历史比赛页面
import router from '@ohos.router';
import promptAction from '@ohos.promptAction';
import { MatchInfo, MatchStatus } from '../model/MatchModels';
import { apiService } from '../service/ApiService';

@Entry
@Component
struct HistoryPage {
  @State matchList: MatchInfo[] = [];
  @State isLoading: boolean = true;
  @State errorMessage: string = '';
  @State serverUrl: string = '';

  aboutToAppear(): void {
    this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const response = await apiService.getMatchList();

      if (response.success && response.data) {
        // 只显示已结束的比赛
        this.matchList = response.data.filter((match: MatchInfo) =>
          match.status === MatchStatus.FINISHED || match.status === MatchStatus.CANCELLED
        );
      } else {
        this.errorMessage = response.message || '获取历史记录失败';
      }
    } catch (err) {
      this.errorMessage = '网络错误，请检查连接';
    } finally {
      this.isLoading = false;
    }
  }

  private getMatchStatusText(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.FINISHED: return '已结束';
      case MatchStatus.CANCELLED: return '已取消';
      default: return '未知';
    }
  }

  private getMatchStatusColor(status: MatchStatus): string {
    switch (status) {
      case MatchStatus.FINISHED: return '#4CAF50';
      case MatchStatus.CANCELLED: return '#F44336';
      default: return '#999999';
    }
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

        Text('历史比赛')
          .fontSize(20)
          .fontWeight(FontWeight.Bold);

        Blank();

        Button('刷新')
          .fontSize(16)
          .backgroundColor('transparent')
          .fontColor('#007AFF')
          .onClick(() => this.loadHistory());
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })
      .backgroundColor('#FFFFFF');

      if (this.isLoading) {
        Column() {
          LoadingProgress().width(48).height(48);
          Text('加载中...')
            .fontSize(14)
            .fontColor('#999999')
            .margin({ top: 16 });
        }
        .width('100%')
        .height(300)
        .justifyContent(FlexAlign.Center);
      } else if (this.errorMessage) {
        Column() {
          Text('⚠️')
            .fontSize(48);
          Text(this.errorMessage)
            .fontSize(14)
            .fontColor('#999999')
            .margin({ top: 16 });
          Button('重试')
            .margin({ top: 24 })
            .onClick(() => this.loadHistory());
        }
        .width('100%')
        .height(300)
        .justifyContent(FlexAlign.Center);
      } else if (this.matchList.length === 0) {
        Column() {
          Text('📋')
            .fontSize(48);
          Text('暂无历史比赛')
            .fontSize(16)
            .fontColor('#999999')
            .margin({ top: 16 });
        }
        .width('100%')
        .height(300)
        .justifyContent(FlexAlign.Center);
      } else {
        List() {
          ForEach(this.matchList, (match: MatchInfo) => {
            ListItem() {
              Column() {
                Row() {
                  Text(match.homeTeam.name)
                    .fontSize(18)
                    .fontWeight(FontWeight.Bold)
                    .layoutWeight(1);

                  Text('VS')
                    .fontSize(14)
                    .fontColor('#999999')
                    .margin({ left: 8, right: 8 });

                  Text(match.awayTeam.name)
                    .fontSize(18)
                    .fontWeight(FontWeight.Bold)
                    .layoutWeight(1)
                    .textAlign(TextAlign.End);
                }
                .width('100%');

                Row() {
                  Text(`${match.homeTeam.score} : ${match.awayTeam.score}`)
                    .fontSize(32)
                    .fontWeight(FontWeight.Bold)
                    .fontColor('#333333');

                  Blank();

                  Text(this.getMatchStatusText(match.status))
                    .fontSize(12)
                    .fontColor('#FFFFFF')
                    .backgroundColor(this.getMatchStatusColor(match.status))
                    .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                    .borderRadius(4);
                }
                .width('100%')
                .margin({ top: 12 });

                Row() {
                  Text(`第${match.currentQuarter}节结束`)
                    .fontSize(12)
                    .fontColor('#999999');
                }
                .width('100%')
                .margin({ top: 8 });
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(12)
              .margin({ bottom: 12 });
            }
            .onClick(() => {
              // 查看比赛详情
              promptAction.showToast({ message: '查看比赛详情功能开发中' });
            });
          });
        }
        .width('100%')
        .height('100%')
        .padding(16);
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F0F0F0');
  }
}
