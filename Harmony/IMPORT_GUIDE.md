# EventControl 鸿蒙裁判端 - 项目导入指南

> ⚠️ **重要更新**：实际代码位于 `D:\EventControlSystem\refeerapp\`  
> 此目录为旧版本保留，请参考 refereapp/ 中的最新代码。

---

## 方法一：在 DevEco 中导入现有项目（推荐）

### 步骤 1：在 DevEco 中打开项目

1. 打开 **DevEco Studio NEXT**（必须是星河版）
2. File → Open
3. 选择 `D:\EventControlSystem\refereeapp\`
4. 等待 Hvigor 同步完成

### 步骤 2：等待同步

1. 点击右上角 **Sync Files** 按钮
2. 等待 Hvigor 同步完成
3. 应该看到 `BUILD SUCCESSFUL`

---

## 方法二：创建新项目后复制文件

如果方法一失败，尝试以下步骤：

### 步骤 1：在 DevEco 中创建空项目

1. 打开 DevEco Studio NEXT
2. File → New → Create Project
3. 选择 **Empty Ability** 模板
4. 选择设备类型（建议选择 **Phone**）
5. 设置项目名称（建议：`RefereeApp`）
6. 点击 Finish 创建项目

### 步骤 2：复制源代码文件

将 refereapp/ 目录下的所有 ets 文件复制到新项目的对应位置：

```
你的新项目/
├── entry/src/main/ets/          ← 替换整个 ets 目录
└── entry/src/main/module.json5  ← 替换此文件
```

### 步骤 3：同步项目

1. 点击右上角 **Sync Files** 按钮
2. 等待 Hvigor 同步完成

---

## 常见错误解决方案

### 错误 1: "hvigor-wrapper.jar not found"
**原因**：缺少 Hvigor wrapper 文件  
**解决**：DevEco 会自动下载，只需点击 Sync Files

### 错误 2: "SDK not found"
**原因**：未配置 HarmonyOS SDK  
**解决**：
1. DevEco → Settings → SDK
2. 添加 **HarmonyOS SDK（Platform API 6.0.2）**
3. 添加 **HarmonyOS Build Tools**

### 错误 3: "module.json5 syntax error"
**解决**：确保 JSON 格式正确（无尾部逗号）

### 错误 4: "ArkTS compile failed"
**解决**：检查 ets 文件语法，确保使用正确的 ArkTS 语法

---

## 成功标志

在 DevEco 中看到以下内容表示项目已正确配置：
- 左侧 Project 面板显示完整的项目结构
- 顶部显示 "Hvigor: BUILD SUCCESSFUL"
- 底部 Build Output 显示编译日志

---

## 技术支持

如果仍有问题，请提供：
1. DevEco 版本号
2. 完整的错误信息
3. 项目结构截图
