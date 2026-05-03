# EventControlSystem IDE 项目配置

本目录包含用于在各种 IDE 中打开项目的配置文件。

## 项目结构

```
EventControlSystem/
├── EventControlSystem.sln          # Visual Studio 解决方案
├── NuGet.Config                     # NuGet 包源配置
├── windows/
│   ├── ScoringSystem/               # 计分裁判软件 (WPF)
│   └── BroadcastControl/           # 导播控制软件 (WPF)
├── android/
│   └── RefereeApp/                 # 裁判端 Android 应用
│       ├── local.properties         # Android SDK 路径配置
│       ├── build.gradle.kts         # 根构建配置
│       ├── settings.gradle.kts       # 项目设置
│       └── app/                    # App 模块
│           └── build.gradle.kts     # 模块构建配置
└── server/                         # Node.js 后端
```

## Visual Studio 打开步骤

### 方式一：直接打开解决方案文件
1. 双击 `EventControlSystem.sln` 文件
2. Visual Studio 2022 会自动加载两个 WPF 项目
3. 按 F5 或点击"启动"按钮运行

### 方式二：从 VS 中打开
1. 打开 Visual Studio 2022
2. 选择"打开项目或解决方案"
3. 浏览到 `EventControlSystem.sln`

### 项目依赖
- .NET 8.0 SDK
- NuGet 包会自动恢复

## Android Studio 打开步骤

### 前提条件
1. 安装 Android Studio Hedgehog (2023.1.1) 或更高版本
2. 安装 Android SDK (API 34)
3. 配置 JAVA_HOME 指向 JDK 17 或更高版本

### 打开项目
1. 打开 Android Studio
2. 选择 "Open an Existing Project"
3. 浏览到 `android/RefereeApp` 目录
4. 点击 "OK" 打开项目

### 首次打开配置
Android Studio 会自动检测 Gradle Wrapper 并配置项目。

如果遇到问题：
1. 点击 "File" → "Invalidate Caches" → "Invalidate and Restart"
2. 等待 Gradle 同步完成

### 构建和运行
1. 连接 Android 设备或启动模拟器
2. 点击 Android Studio 工具栏的绿色运行按钮
3. 选择目标设备
4. 应用会自动安装并运行

### 关键配置
| 配置项 | 值 |
|--------|-----|
| compileSdk | 34 |
| minSdk | 26 |
| targetSdk | 34 |
| Kotlin | 1.9.22 |
| Gradle | 8.5 |
| Compose BOM | 2024.02.00 |

## Web 前端 (VS Code / WebStorm)

### 使用 VS Code
```bash
cd web/AnalysisPanel
code .
npm install
npm run dev
```

### 使用 WebStorm
1. Open → 选择 `web/AnalysisPanel` 目录
2. WebStorm 会自动识别 Vite + React 项目
3. 运行 `npm install` 后启动开发服务器

## 后端 (VS Code / WebStorm)

### 使用 VS Code
```bash
cd server
code .
npm install
npm run dev
```

### API 地址配置
- 默认地址：`http://localhost:3001`
- 可在 Web 面板的设置页面修改

## 多端同时运行

推荐启动顺序：
1. 后端：`cd server && npm run dev`
2. Web 面板：`cd web/AnalysisPanel && npm run dev`
3. Windows 计分软件：Visual Studio 中 F5 运行
4. Windows 导播软件：Visual Studio 中 F5 运行
5. Android 裁判端：Android Studio 中运行

## 常见问题

### Visual Studio 找不到 .NET 8.0
下载并安装 .NET 8.0 SDK：https://dotnet.microsoft.com/download/dotnet/8.0

### Android Studio Gradle 同步失败
1. 检查 `local.properties` 中的 sdk.dir 路径是否正确
2. 确保网络可以访问 Google Maven 仓库
3. 尝试使用代理或配置国内镜像

### 端口被占用
后端默认使用 3001 端口，如需修改编辑 `server/src/index.ts`
