# 环境变量配置指南

本项目已经重构为完全基于环境变量的配置系统，不再依赖 `config.yaml` 文件。所有配置都通过 Cloudflare Workers 的环境变量进行管理。

## 必需的环境变量

### 基础配置

| 变量名 | 描述 | 示例值 | 必需 |
|--------|------|--------|------|
| `SITE_TITLE` | 状态页面标题 | `"我的服务状态"` | ✅ |
| `SITE_URL` | 状态页面URL | `"https://status.example.com"` | ✅ |
| `MONITORS_CONFIG` | 监控配置字符串 | 见下方详细说明 | ✅ |

### 可选配置

| 变量名 | 描述 | 默认值 | 示例值 |
|--------|------|--------|--------|
| `SITE_DESCRIPTION` | 页面描述 | `""` | `"服务状态监控页面"` |
| `SITE_LOGO_URL` | Logo URL | `""` | `"https://example.com/logo.png"` |
| `HISTOGRAM_DAYS` | 历史数据天数 | `90` | `"30"` |
| `COLLECT_RESPONSE_TIMES` | 是否收集响应时间 | `true` | `"false"` |
| `USER_AGENT` | HTTP请求User-Agent | `"cf-workers-status-page"` | `"MyStatusPage/1.0"` |

## 监控配置格式

`MONITORS_CONFIG` 环境变量使用特殊格式来定义多个监控项：

### 格式说明
```
monitor_id:name:url:method:expected_status:follow_redirects:linkable|monitor_id2:name2:url2:method2:expected_status2:follow_redirects2:linkable2
```

### 字段说明
- `monitor_id`: 监控项的唯一标识符
- `name`: 显示在页面上的监控项名称
- `url`: 要监控的URL地址
- `method`: HTTP请求方法（GET、POST等）
- `expected_status`: 期望的HTTP状态码
- `follow_redirects`: 是否跟随重定向（true/false）
- `linkable`: 监控项是否可点击（true/false）

### 配置示例
```
website:网站首页:https://example.com:GET:200:true:true|api:API服务:https://api.example.com/health:GET:200:false:true|database:数据库:https://db.example.com/ping:GET:200:false:false
```

这个配置定义了三个监控项：
1. **网站首页** - 监控主网站，可点击
2. **API服务** - 监控API健康检查端点，可点击
3. **数据库** - 监控数据库连接，不可点击

## 通知配置（可选）

### Slack 通知
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `SECRET_SLACK_WEBHOOK_URL` | Slack Webhook URL | `"https://hooks.slack.com/services/..."` |

### Telegram 通知
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `SECRET_TELEGRAM_CHAT_ID` | Telegram 聊天ID | `"123456789"` |
| `SECRET_TELEGRAM_API_TOKEN` | Telegram Bot Token | `"bot123456:ABC-DEF..."` |

### Discord 通知
| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `SECRET_DISCORD_WEBHOOK_URL` | Discord Webhook URL | `"https://discord.com/api/webhooks/..."` |

## 在 Cloudflare Dashboard 中设置

### 1. 普通环境变量
1. 进入 Worker 设置页面
2. 找到 "Environment Variables" 部分
3. 点击 "Add variable"
4. 输入变量名和值
5. 点击 "Save"

### 2. 加密环境变量（推荐用于敏感信息）
1. 在添加环境变量时，勾选 "Encrypt" 选项
2. 用于存储 Webhook URL、API Token 等敏感信息

## 配置验证

系统会在启动时验证以下内容：
- 必需的环境变量是否存在
- 监控配置格式是否正确
- URL 格式是否有效

如果配置有误，Worker 会在日志中显示详细的错误信息。

## 迁移指南

如果您之前使用 `config.yaml` 文件，请按以下步骤迁移：

### 1. 提取现有配置
从您的 `config.yaml` 文件中提取配置值：

```yaml
# 原 config.yaml
settings:
  title: "我的状态页面"
  url: "https://status.example.com"
  logo: "https://example.com/logo.png"
  
monitors:
  - id: web
    name: "网站"
    url: "https://example.com"
    method: GET
    expectStatus: 200
```

### 2. 转换为环境变量
```bash
SITE_TITLE="我的状态页面"
SITE_URL="https://status.example.com"
SITE_LOGO_URL="https://example.com/logo.png"
MONITORS_CONFIG="web:网站:https://example.com:GET:200:true:true"
```

### 3. 在 Cloudflare Dashboard 中设置
将转换后的环境变量添加到 Worker 的环境变量配置中。

### 4. 删除 config.yaml
确认配置正常工作后，可以从代码仓库中删除 `config.yaml` 文件。

## 故障排除

### 常见错误

1. **"Missing required environment variables"**
   - 检查是否设置了所有必需的环境变量
   - 确认变量名拼写正确

2. **"Invalid monitor config format"**
   - 检查 `MONITORS_CONFIG` 格式是否正确
   - 确保使用管道符 `|` 分隔多个监控项
   - 确保每个监控项有7个字段

3. **监控不工作**
   - 检查 URL 是否可访问
   - 验证 HTTP 方法和期望状态码是否正确
   - 查看 Worker 日志获取详细错误信息

### 调试技巧

1. 使用 Cloudflare Workers 的实时日志功能
2. 临时添加 `console.log()` 输出配置值
3. 使用 `wrangler dev` 在本地测试

## 最佳实践

1. **安全性**
   - 所有敏感信息（Webhook URL、API Token）使用加密环境变量
   - 定期轮换 API Token

2. **可维护性**
   - 使用描述性的监控项名称
   - 保持监控配置简洁明了
   - 定期检查和更新监控URL

3. **性能**
   - 合理设置监控频率
   - 避免监控过多的端点
   - 使用适当的超时设置

## 示例配置

以下是一个完整的环境变量配置示例：

```bash
# 基础配置
SITE_TITLE="MyCompany 服务状态"
SITE_URL="https://status.mycompany.com"
SITE_DESCRIPTION="MyCompany 各项服务的实时状态监控"
SITE_LOGO_URL="https://mycompany.com/assets/logo.png"
HISTOGRAM_DAYS="30"
COLLECT_RESPONSE_TIMES="true"
USER_AGENT="MyCompany-StatusPage/1.0"

# 监控配置
MONITORS_CONFIG="website:官网:https://mycompany.com:GET:200:true:true|api:API服务:https://api.mycompany.com/health:GET:200:false:true|cdn:CDN:https://cdn.mycompany.com/ping:GET:200:false:false|database:数据库:https://db-health.mycompany.com:GET:200:false:false"

# 通知配置（加密）
SECRET_SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
SECRET_TELEGRAM_CHAT_ID="-1001234567890"
SECRET_TELEGRAM_API_TOKEN="1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
```

这个配置创建了一个包含4个监控项的状态页面，并启用了多种通知方式。