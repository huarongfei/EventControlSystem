# EventControl 鸿蒙裁判端 - 快速开始指南

> ⚠️ **重要更新**：实际代码位于 `D:\EventControlSystem\refereeapp\`  
> 此目录为旧版本保留，请参考 refereapp/ 中的最新代码。

---

## 项目结构（refereeapp/）

```
refereeapp/
├── entry/src/main/ets/
│   ├── entryability/
│   │   └── EntryAbility.ets           DevEco 生成，入口 Ability
│   ├── model/
│   │   └── MatchModels.ets            数据模型定义
│   ├── service/
│   │   ├── ApiService.ets             HTTP REST 请求
│   │   ├── SocketService.ets          WebSocket 实时连接
│   │   ├── StorageService.ets         Preferences 本地持久化
│   │   └── OfflineQueue.ets           离线事件缓存队列
│   ├── viewmodel/
│   │   └── RefereeViewModel.ets       业务逻辑层（MVVM）
│   ├── utils/
│   │   ├── DeviceInfo.ets             响应式断点工具
│   │   └── NetworkMonitor.ets          网络状态监控
│   └── pages/
│       ├── Index.ets                   连接页面
│       ├── MainPage.ets                裁判主控页面
│       ├── SettingsPage.ets           设置页面
│       └── HistoryPage.ets            历史比赛页面
└── build-profile.json5
```

---

## 第一步：打开项目

### 在 DevEco 中导入

1. 打开 **DevEco Studio NEXT**（必须是星河版，不是旧版本）
2. File → Open
3. 选择 `D:\EventControlSystem\refereeapp\`
4. 等待 Hvigor 同步完成

### 如果仍然报错

#### 错误："hvigor-wrapper.jar not found"

这是正常的！DevEco 会在首次同步时自动下载。只需：
1. 点击 **Sync Files**
2. 等待下载完成

#### 错误："SDK not found"

**解决**：
1. DevEco → Settings → SDK
2. 添加 **HarmonyOS SDK（Platform API 6.0.2）**
3. 添加 **HarmonyOS Build Tools**

---

## 多设备支持

本应用支持自动响应式布局：

| 设备类型 | 屏幕宽度 | 布局 |
|---------|---------|------|
| 手机 | < 520vp | Tab 切换 |
| 折叠屏 | 520-840vp | 横向双列 |
| 平板/电脑 | ≥ 840vp | 分栏布局 |

---

## 连接后端

项目默认连接的后端地址：`http://localhost:3001`

在 App 中输入您后端服务器的地址即可连接。

---

## 技术栈

- **语言**：ArkTS（TypeScript 超集）
- **UI 框架**：ArkUI
- **HTTP**：@ohos.net.http
- **WebSocket**：@ohos.net.webSocket
- **本地存储**：@kit.ArkData Preferences

---

## 常见问题

### Q: DevEco 报语法错误？
确保 ets 文件使用正确的 ArkTS 语法。注意：
- 类成员需要声明类型
- 接口用 `interface` 而不是 `type`
- 泛型语法：`Array<T>` 而不是 `T[]`

### Q: API 版本不兼容？
确保 `build-profile.json5` 中的 `compatibleSdkVersion` 与您的 SDK 匹配。

### Q: 离线模式不工作？
离线队列使用 Preferences 存储，需要在 EntryAbility 中初始化。

---

## 获取帮助

如果按照以上步骤仍有问题，请提供：
1. DevEco 版本（Help → About DevEco Studio）
2. 完整的错误信息截图
3. 项目结构截图
