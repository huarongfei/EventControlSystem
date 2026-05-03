# SDK 配置说明

> ⚠️ **重要更新**：实际代码位于 `D:\EventControlSystem\refereeapp\`  
> 此目录为旧版本保留，请参考 refereapp/ 中的最新代码。

---

## 开发环境要求

- **DevEco Studio**: NEXT 版本（推荐最新）
- **Node.js**: 18.x 或更高
- **JDK**: 11 或更高（建议使用 DevEco 内置 JDK）
- **HarmonyOS SDK**: 6.0.2(22)

## SDK 配置步骤

### 1. 配置 HarmonyOS SDK

1. 打开 DevEco Studio
2. 进入 Settings → SDK
3. 添加 **HarmonyOS SDK（Platform API Version 6.0.2）**
4. 添加 **HarmonyOS Build Tools**

### 2. 配置项目签名

1. 在 DevEco 中打开项目
2. 进入 File → Project Structure
3. 在 Signing Configs 中配置签名信息
4. 如果没有签名，可以选择 "Automatically generate signing"

### 3. 同步项目

1. 点击右上角 Sync Files
2. 或者在 Terminal 中运行 `./hvigorw assembleDebug`

## 常见问题

### Q: 提示 "不是鸿蒙项目"
确保使用 DevEco Studio NEXT 版本，而非旧版本。

### Q: 提示 "hvigor-wrapper.jar 不存在"
需要先在 DevEco 中打开项目，它会自动下载 wrapper。

### Q: 提示 SDK 版本不匹配
在 build-profile.json5 中调整 compatibleSdkVersion。
