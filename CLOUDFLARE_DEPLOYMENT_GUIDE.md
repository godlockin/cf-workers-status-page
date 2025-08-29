# Cloudflare Workers 状态页面手动部署指南

本指南将详细介绍如何在 Cloudflare Dashboard 中手动部署和配置 cf-workers-status-page 项目，实现完全通过环境变量进行配置管理。

## 前提条件

- 拥有 Cloudflare 账户
- 已将项目代码上传到 GitHub 仓库
- 了解基本的 Cloudflare Workers 操作
- 确认项目根目录包含以下关键文件：
  - `.yarnrc.yml` - Yarn 4配置文件（用于Cloudflare部署兼容性）
  - `package.json` - 项目依赖配置
  - `wrangler.toml` - Cloudflare Workers配置

## 第一步：创建 Cloudflare Worker 项目

### 1.1 登录 Cloudflare Dashboard
1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录您的账户

### 1.2 创建 Worker
1. 在左侧导航栏中点击 "Workers & Pages"
2. 点击 "Create application" 按钮
3. 选择 "Workers" 标签
4. 点击 "Create Worker" 按钮
5. 为您的 Worker 命名（建议使用 `cf-workers-status-page`）
6. 点击 "Deploy" 创建基础 Worker

## 第二步：连接 GitHub 仓库

### 2.1 设置 GitHub 集成
1. 在 Worker 详情页面，点击 "Settings" 标签
2. 在 "Deployments" 部分，点击 "Connect to Git"
3. 选择 "GitHub" 作为 Git 提供商
4. 授权 Cloudflare 访问您的 GitHub 账户
5. 选择包含项目代码的仓库
6. 选择要部署的分支（通常是 `main` 或 `master`）
7. 设置构建配置：
   - Build command: `yarn build`
   - Build output directory: `dist`
8. 点击 "Save and Deploy"

## 第三步：创建和配置 KV 命名空间

### 3.1 创建 KV 命名空间
1. 在 Cloudflare Dashboard 中，导航到 "Workers & Pages" > "KV"
2. 点击 "Create a namespace" 按钮
3. 命名空间名称输入：`STATUS_PAGE_KV`
4. 点击 "Add" 创建命名空间
5. 记录生成的命名空间 ID（稍后需要用到）

### 3.2 绑定 KV 命名空间到 Worker
1. 返回到您的 Worker 设置页面
2. 点击 "Settings" 标签
3. 滚动到 "Variables" 部分
4. 在 "KV Namespace Bindings" 区域：
   - Variable name: `KV_STATUS_PAGE`
   - KV namespace: 选择刚创建的 `STATUS_PAGE_KV`
5. 点击 "Save" 保存绑定

## 第四步：配置环境变量

### 4.1 基础配置变量
在 Worker 设置页面的 "Environment Variables" 部分添加以下变量：

#### 必需的基础配置：
```
SITE_TITLE = "我的状态页面"
SITE_URL = "https://your-worker.your-subdomain.workers.dev"
SITE_DESCRIPTION = "服务状态监控页面"
HISTOGRAM_DAYS = "90"
COLLECT_RESPONSE_TIMES = "true"
USER_AGENT = "cf-workers-status-page/1.0"
```

#### 可选配置：
```
SITE_LOGO_URL = "https://example.com/logo.png"
```

### 4.2 监控配置
添加监控配置变量：
```
MONITORS_CONFIG = "monitor1:网站首页:https://example.com:GET:200:true:true,monitor2:API服务:https://api.example.com/health:GET:200:false:true,monitor3:数据库:https://db.example.com/ping:GET:200:false:false"
```

**监控配置格式说明：**
每个监控项用逗号分隔，每个监控项的字段用冒号分隔：
- `monitor_id`: 监控项唯一标识符
- `name`: 显示名称
- `url`: 监控的URL
- `method`: HTTP方法（GET/POST等）
- `expected_codes`: 期望的HTTP状态码
- `follow_redirects`: 是否跟随重定向（true/false）
- `linkable`: 是否可点击链接（true/false）

### 4.3 通知配置（可选）
如需启用通知功能，添加以下加密环境变量：

#### Slack 通知：
```
SECRET_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
```

#### Telegram 通知：
```
SECRET_TELEGRAM_CHAT_ID = "your-chat-id"
SECRET_TELEGRAM_API_TOKEN = "your-bot-token"
```

#### Discord 通知：
```
SECRET_DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR/WEBHOOK"
```

**注意：** 敏感信息（如 Webhook URL 和 API Token）应该使用 "Encrypt" 选项进行加密存储。

## 第五步：配置定时任务（Cron Triggers）

### 5.1 设置 Cron 触发器
1. 在 Worker 设置页面，找到 "Triggers" 部分
2. 点击 "Add Cron Trigger"
3. 输入 Cron 表达式：`*/1 * * * *`（每分钟执行一次）
4. 点击 "Add Trigger" 保存

**Cron 表达式说明：**
- `*/1 * * * *`: 每分钟执行一次
- `*/5 * * * *`: 每5分钟执行一次
- `0 */1 * * *`: 每小时执行一次

## 第六步：自定义域名配置（可选）

### 6.1 添加自定义域名
1. 确保您的域名已添加到 Cloudflare
2. 在 Worker 设置页面，找到 "Triggers" 部分
3. 点击 "Add Custom Domain"
4. 输入您想要使用的子域名（如 `status.yourdomain.com`）
5. 点击 "Add Custom Domain"
6. 更新 `SITE_URL` 环境变量为您的自定义域名

## 第七步：部署和测试

### 7.1 触发部署
1. 推送代码更改到 GitHub 仓库
2. Cloudflare 将自动检测更改并开始部署
3. 在 Worker 的 "Deployments" 标签中查看部署状态

### 7.2 测试功能
1. 访问您的 Worker URL 或自定义域名
2. 检查状态页面是否正常显示
3. 验证监控项是否按预期工作
4. 检查定时任务是否正常执行（可在 "Logs" 中查看）

## 第八步：监控和维护

### 8.1 查看日志
1. 在 Worker 详情页面点击 "Logs" 标签
2. 使用实时日志查看 Worker 的执行情况
3. 检查是否有错误或异常

### 8.2 性能监控
1. 在 "Analytics" 标签中查看请求统计
2. 监控响应时间和错误率
3. 根据需要调整监控频率

### 8.3 更新配置
1. 需要修改监控项时，直接在环境变量中更新 `MONITORS_CONFIG`
2. 修改其他设置时，更新对应的环境变量
3. 无需重新部署，配置更改会立即生效

## 故障排除

### 常见部署问题

#### 1. 依赖安装失败
**错误信息**：`The lockfile would have been modified by this install, which is explicitly forbidden`

**解决方案**：
- 确保项目根目录包含 `.yarnrc.yml` 文件
- 该文件应包含 `enableImmutableInstalls: false` 配置
- 如果问题持续，请检查 `package.json` 中的依赖版本是否兼容

#### 2. React版本冲突
**错误信息**：React版本不匹配的警告

**解决方案**：
- 确保使用React 16.13.1版本（与flareact兼容）
- 检查 `package.json` 中的react和react-dom版本

#### 3. 构建失败
**错误信息**：PostCSS或其他构建工具找不到

**解决方案**：
- 确保所有依赖都在 `package.json` 中正确声明
- 检查构建脚本配置是否正确

#### 4. Assets配置错误
**错误信息**：需要指定assets目录或相关配置错误

**解决方案**：
- 确保 `wrangler.toml` 使用新的 `[assets]` 配置而非已弃用的 `[site]` 配置
- 验证assets目录路径正确指向构建输出目录（通常是 `./out`）
- 移除过时的 `type = "webpack"` 和 `webpack_config` 配置项

### 常见运行问题

1. **页面显示空白**
   - 检查 KV 命名空间是否正确绑定
   - 确认环境变量 `SITE_TITLE` 和 `SITE_URL` 已设置

2. **监控不工作**
   - 验证 `MONITORS_CONFIG` 格式是否正确
   - 检查 Cron 触发器是否已设置
   - 查看日志中的错误信息

3. **通知不发送**
   - 确认通知相关的环境变量已正确设置
   - 检查 Webhook URL 是否有效
   - 验证 API Token 是否正确

4. **部署失败**
   - 检查构建日志中的错误信息
   - 确认 GitHub 仓库权限设置正确
   - 验证 `package.json` 中的依赖是否完整

### 调试技巧

1. 使用 Cloudflare Workers 的实时日志功能
2. 在代码中添加 `console.log()` 语句进行调试
3. 使用 `wrangler dev` 在本地测试（需要安装 Wrangler CLI）

## 安全最佳实践

1. **敏感信息保护**
   - 所有 API Token 和 Webhook URL 都应使用加密环境变量
   - 定期轮换 API Token
   - 不要在代码中硬编码敏感信息

2. **访问控制**
   - 考虑为状态页面添加基本认证（如需要）
   - 限制 Worker 的访问来源（如有必要）

3. **监控安全**
   - 定期检查监控的目标 URL 是否安全
   - 避免监控包含敏感信息的端点

## 总结

通过以上步骤，您已经成功在 Cloudflare Dashboard 中手动部署了状态页面项目。这种部署方式的优势包括：

- **配置与代码分离**：所有配置都通过环境变量管理，代码仓库中不包含敏感信息
- **灵活的配置管理**：可以随时在 Cloudflare Dashboard 中修改配置，无需重新部署
- **自动化部署**：代码更新时自动触发部署
- **高可用性**：利用 Cloudflare 的全球网络确保服务可用性
- **成本效益**：使用 Cloudflare Workers 的免费额度即可满足大部分需求

如有任何问题，请参考 Cloudflare Workers 官方文档或在项目仓库中提交 Issue。