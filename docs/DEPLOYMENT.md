# EventControlSystem 部署指南

## 环境要求

### 开发环境
- Node.js 18+
- npm 9+ 或 yarn
- .NET 8 SDK（Windows 端）
- JDK 17+（Android 端，可选）
- Android Studio（Android 端，可选）

### 生产环境
- Node.js 18+ LTS
- PostgreSQL 14+（可选，默认使用 SQLite）
- 2GB+ RAM
- 稳定的网络连接

---

## 后端部署

### 方式一：直接部署

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/EventControlSystem.git
cd EventControlSystem

# 安装依赖
cd server
npm install

# 生成 Prisma Client
npx prisma generate

# 推送数据库 Schema
npx prisma db push

# 构建
npm run build

# 启动
npm start
```

### 方式二：使用 PM2 进程管理器

```bash
# 全局安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "ecs-backend" -- start

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 方式三：Docker 部署

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate

COPY dist ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

```bash
# 构建镜像
docker build -t eventcontrolsystem-backend ./server

# 运行容器
docker run -d -p 3001:3001 --name ecs-backend eventcontrolsystem-backend
```

---

## 环境变量配置

在 `server/` 目录下创建 `.env` 文件：

```env
# 端口（默认 3001）
PORT=3001

# 数据库连接（使用 SQLite 时）
DATABASE_URL=file:./dev.db

# 或使用 PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/eventcontrol

# CORS 允许的来源（生产环境应设置具体域名）
CORS_ORIGIN=http://localhost:5173

# 日志级别
LOG_LEVEL=info

# Node 环境
NODE_ENV=production
```

---

## Windows 计分裁判软件部署

### 开发环境

```bash
cd windows/ScoringSystem
dotnet build
dotnet run
```

### 发布为独立应用

```bash
cd windows/ScoringSystem
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

发布文件位于 `bin/Release/net8.0-windows/win-x64/publish/`

---

## Windows 导播控制软件部署

### 开发环境

```bash
cd windows/BroadcastControl
dotnet build
dotnet run
```

### 发布为独立应用

```bash
cd windows/BroadcastControl
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```

---

## Android 裁判端部署

### 构建 APK

```bash
cd android/RefereeApp

# 设置 Gradle Wrapper（首次）
gradle wrapper --gradle-version 8.5

# 构建 Debug APK
./gradlew assembleDebug

# 构建 Release APK（需要签名配置）
./gradlew assembleRelease
```

### 安装到设备

```bash
# 通过 USB 安装
./gradlew installDebug

# 或手动安装
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 发布到应用商店

1. 配置签名密钥
2. 创建 Release 构建
3. 使用 Android Studio 或命令行上传到应用商店

---

## Web 赛况分析面板部署

### 构建

```bash
cd web/AnalysisPanel
npm install
npm run build
```

构建产物位于 `dist/` 目录。

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 部署到 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/eventcontrol/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## HarmonyOS 裁判端部署

1. 使用 DevEco Studio 打开项目 `refeerapp/`
2. 连接 HarmonyOS 设备或启动模拟器
3. 点击运行或调试

**注意**：需要 HarmonyOS NEXT 6.0.2(22) 或更高版本

---

## 生产环境检查清单

### 安全
- [ ] 修改默认端口
- [ ] 设置强 CORS 策略
- [ ] 配置数据库密码
- [ ] 启用 HTTPS
- [ ] 添加速率限制
- [ ] 敏感数据加密

### 性能
- [ ] 启用数据库索引
- [ ] 配置缓存策略
- [ ] 启用压缩（Gzip）
- [ ] 配置 CDN（静态资源）

### 监控
- [ ] 配置日志收集
- [ ] 设置告警机制
- [ ] 监控 API 响应时间
- [ ] 监控数据库连接

### 备份
- [ ] 配置数据库备份
- [ ] 定期备份用户数据
- [ ] 测试恢复流程

---

## 故障排除

### 后端启动失败

1. 检查端口是否被占用：`lsof -i :3001`
2. 检查数据库连接：`npx prisma db push`
3. 查看日志：`npm start 2>&1 | tee logs/app.log`

### WebSocket 连接失败

1. 检查后端是否运行
2. 检查 CORS 配置
3. 检查代理设置（如果使用 Nginx）

### 数据库迁移问题

```bash
# 重置数据库
npx prisma db push --force-reset

# 重新生成 Prisma Client
npx prisma generate
```

---

## 联系支持

如有问题，请提交 Issue 或联系维护团队。
