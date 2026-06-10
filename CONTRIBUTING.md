# 贡献指南

感谢您对 EventControlSystem 的关注！我们欢迎各种形式的贡献，包括但不限于代码贡献、文档改进、Bug 报告和功能建议。

## 如何贡献

### 1. 报告问题

如果您发现了 Bug 或有功能建议，请：

1. 在提交新 Issue 之前，先搜索是否已存在相同的问题
2. 使用 Issue 模板（如果可用）
3. 提供详细的复现步骤和环境信息

### 2. 代码贡献

#### 开发流程

1. **Fork 仓库**
   点击 GitHub 页面右上角的 "Fork" 按钮

2. **克隆您的 Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/EventControlSystem.git
   cd EventControlSystem
   ```

3. **创建分支**
   ```bash
   # 功能分支
   git checkout -b feature/your-feature-name

   # Bug 修复分支
   git checkout -b fix/your-bug-fix

   # 文档改进分支
   git checkout -b docs/improve-documentation
   ```

4. **进行开发**
   - 遵循项目的代码规范
   - 添加适当的测试
   - 保持提交原子性

5. **推送更改**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 清晰描述您的更改
   - 关联相关 Issue
   - 提供测试截图或说明

#### 代码规范

**TypeScript (后端 & Web)**
- 使用 2 空格缩进
- 使用单引号表示字符串
- 使用 `const` 和 `let`，避免 `var`
- 使用 PascalCase 命名接口和类
- 使用 camelCase 命名变量和函数
- 添加 JSDoc 注释

```typescript
/**
 * 获取比赛详情
 * @param id 比赛 ID
 * @returns 比赛详情或 null
 */
export async function getMatchById(id: string): Promise<Match | null> {
  // ...
}
```

**C# (Windows)**
- 遵循 .NET 命名规范
- 使用 `var` 声明局部变量（类型明显时）
- 使用可空引用类型
- 添加 XML 文档注释

```csharp
/// <summary>
/// 更新比赛比分
/// </summary>
/// <param name="matchId">比赛 ID</param>
/// <param name="homeScore">主队得分</param>
/// <param name="awayScore">客队得分</param>
public async Task UpdateScoreAsync(int matchId, int homeScore, int awayScore)
{
    // ...
}
```

**Kotlin (Android)**
- 使用 Kotlin 编码规范
- 优先使用不可变数据结构
- 使用协程处理异步操作
- 添加 KDoc 注释

```kotlin
/**
 * 获取比赛列表
 *
 * @param eventId 赛事 ID（可选）
 * @return 比赛列表
 */
suspend fun getMatches(eventId: String? = null): Result<List<Match>>
```

**ArkTS (HarmonyOS)**
- 遵循 ArkTS 规范
- 使用 TypeScript 类型注解
- 添加注释说明复杂逻辑

#### 提交信息规范

使用清晰的提交信息：

```
<type>: <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更改
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat: 添加比赛导出功能

- 支持 JSON 和 CSV 格式导出
- 添加导出历史记录
- 优化大数据量导出性能

Closes #123
```

### 3. 文档贡献

文档改进同样重要！如果您发现文档有任何问题：

1. 直接编辑 Markdown 文件
2. 提交更改
3. 创建 Pull Request

### 4. 测试贡献

我们重视代码质量，欢迎添加测试：

- 为后端 API 添加集成测试
- 为 Windows 应用添加单元测试
- 为 Web 面板添加 E2E 测试

---

## 项目结构

```
EventControlSystem/
├── server/                  # Node.js + Express + TypeScript 后端
│   ├── src/
│   │   ├── controllers/    # API 控制器（含请求验证中间件）
│   │   ├── services/       # 业务逻辑层
│   │   ├── repositories/   # Prisma 数据访问层
│   │   ├── socket/         # Socket.IO 实时通信
│   │   ├── middleware/     # 中间件（验证、请求ID、错误处理）
│   │   └── utils/          # 工具类（日志、错误、Prisma客户端）
│   ├── tests/              # Jest 集成测试
│   └── prisma/             # 数据库 schema 和迁移
├── windows/                # WPF + .NET 8.0 Windows 应用
│   ├── ScoringSystem/       # 计分裁判软件（深色主题+快捷键）
│   └── BroadcastControl/    # 导播控制软件（虚拟摄像机+转场）
├── android/
│   └── RefereeApp/         # Kotlin + Jetpack Compose 裁判端
├── refeerapp/              # HarmonyOS NEXT (ArkTS) 裁判端
│   └── entry/src/main/ets/
│       ├── model/           # 数据模型（MatchModels.ets）
│       ├── service/         # API/Socket/离线队列服务
│       ├── viewmodel/       # MVVM 视图模型
│       └── pages/           # UI 页面
└── web/
    ├── AnalysisPanel/       # React + Vite 赛况分析面板
    └── RegistrationApp/     # React + Vite 队伍报名管理
```

---

## 开发环境设置

请参考 [DEPLOYMENT.md](docs/DEPLOYMENT.md) 设置开发环境。

---

## Pull Request 检查清单

在提交 PR 之前，请确认：

- [ ] 代码遵循项目的代码规范
- [ ] 提交信息清晰描述了更改内容
- [ ] 新功能已添加适当的文档
- [ ] Bug 修复已添加测试
- [ ] 所有现有测试通过
- [ ] 分支已基于最新的 `master` 分支

---

## 行为准则

请尊重所有贡献者，保持友好和专业的沟通态度。我们期望一个包容、友好的社区环境。

---

## 许可

通过贡献代码，您同意将您的代码按照项目的 MIT 许可证进行许可。

---

## 联系方式

- GitHub Issues: [提交 Issue](https://github.com/huarongfei/EventControlSystem/issues)
- 邮箱: github.com/huarongfei

感谢您的贡献！
