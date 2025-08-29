# D1数据库配置指南

本指南将帮助您设置Cloudflare D1数据库，用于存储状态页面的配置和历史数据。

## 概述

该项目支持两种配置方式：
1. **环境变量配置**：适合简单部署，配置存储在Cloudflare Workers环境变量中
2. **D1数据库配置**：适合复杂场景，配置存储在D1数据库中，支持动态修改和历史数据存储

## D1数据库设置步骤

### 1. 创建D1数据库

在Cloudflare Dashboard中创建D1数据库：

```bash
# 使用Wrangler CLI创建数据库
wrangler d1 create status-page-db
```

创建成功后，您会看到类似以下的输出：
```
✅ Successfully created DB 'status-page-db'!

Add the following to your wrangler.toml:
[[d1_databases]]
binding = "DB"
database_name = "status-page-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 更新wrangler.toml配置

将上一步获得的数据库ID添加到 `wrangler.toml` 文件中：

```toml
[[d1_databases]]
binding = "DB"
database_name = "status-page-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # 替换为实际的数据库ID
preview_database_id = ""  # 可选：预览环境数据库ID
```

### 3. 初始化数据库表结构

使用提供的SQL脚本初始化数据库：

```bash
# 执行数据库初始化脚本
wrangler d1 execute status-page-db --file=./d1-setup.sql
```

### 4. 验证数据库设置

检查数据库表是否创建成功：

```bash
# 查看数据库表
wrangler d1 execute status-page-db --command=".tables"

# 查看示例配置
wrangler d1 execute status-page-db --command="SELECT * FROM site_config LIMIT 5;"
```

## 配置管理

### 使用D1数据库配置

当D1数据库配置完成后，系统会优先从数据库读取配置。您可以通过以下方式管理配置：

#### 站点配置

```sql
-- 更新站点标题
UPDATE site_config SET value = 'My Status Page' WHERE key = 'site_title';

-- 更新站点URL
UPDATE site_config SET value = 'https://status.mysite.com' WHERE key = 'site_url';

-- 查看所有配置
SELECT * FROM site_config;
```

#### 监控配置

```sql
-- 添加新的监控项
INSERT INTO monitors (id, name, description, url, method, expect_status) 
VALUES ('my-api', 'My API', 'API健康检查', 'https://api.mysite.com/health', 'GET', 200);

-- 更新监控项
UPDATE monitors SET url = 'https://new-api.mysite.com/health' WHERE id = 'my-api';

-- 禁用监控项
UPDATE monitors SET enabled = false WHERE id = 'my-api';

-- 查看所有监控项
SELECT * FROM monitors WHERE enabled = true;
```

### 环境变量配置（备用方案）

如果不使用D1数据库，您仍然可以使用环境变量进行配置。在Cloudflare Workers Dashboard中设置以下环境变量：

#### 必需的环境变量

```bash
SITE_TITLE="My Status Page"
SITE_URL="https://status.mysite.com"
MONITORS_CONFIG="web1:My Website:https://mysite.com:GET:200:false:true|api1:My API:https://api.mysite.com:GET:200:false:false"
```

#### 可选的环境变量

```bash
SITE_LOGO="logo-192x192.png"
DAYS_IN_HISTOGRAM="90"
COLLECT_RESPONSE_TIMES="true"
USER_AGENT="cf-worker-status-page"

# 状态文本自定义
TEXT_ALL_OPERATIONAL="所有系统正常"
TEXT_NOT_ALL_OPERATIONAL="系统异常"
TEXT_OPERATIONAL="正常"
TEXT_NOT_OPERATIONAL="异常"
TEXT_NO_DATA="无数据"
```

#### 通知配置（加密环境变量）

```bash
SECRET_SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
SECRET_TELEGRAM_API_TOKEN="bot123456:ABC-DEF..."
SECRET_TELEGRAM_CHAT_ID="-123456789"
SECRET_DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

## 监控配置格式说明

### 环境变量格式

`MONITORS_CONFIG` 环境变量使用以下格式：

```
id1:name1:url1:method1:status1:redirect1:linkable1|id2:name2:url2:method2:status2:redirect2:linkable2
```

参数说明：
- `id`: 监控项唯一标识符
- `name`: 显示名称
- `url`: 监控URL
- `method`: HTTP方法（GET/POST/PUT等）
- `status`: 期望的HTTP状态码
- `redirect`: 是否跟随重定向（true/false）
- `linkable`: 是否在页面上显示为链接（true/false）

示例：
```
web:My Website:https://example.com:GET:200:false:true|api:My API:https://api.example.com:GET:200:false:false
```

### D1数据库格式

在D1数据库中，监控配置存储在 `monitors` 表中，每个字段对应一个列，更加灵活和易于管理。

## 部署步骤

1. **配置wrangler.toml**：确保D1数据库配置正确
2. **初始化数据库**：运行SQL初始化脚本
3. **设置环境变量**：在Cloudflare Dashboard中配置必要的环境变量
4. **部署Worker**：运行 `wrangler deploy`
5. **验证配置**：访问状态页面确认配置生效

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `wrangler.toml` 中的数据库ID是否正确
   - 确认数据库已创建并初始化

2. **配置不生效**
   - 检查环境变量是否正确设置
   - 确认D1数据库中的配置数据是否正确

3. **监控不工作**
   - 检查监控URL是否可访问
   - 确认期望的HTTP状态码是否正确

### 调试命令

```bash
# 查看数据库内容
wrangler d1 execute status-page-db --command="SELECT * FROM monitors;"
wrangler d1 execute status-page-db --command="SELECT * FROM site_config;"

# 查看最近的监控历史
wrangler d1 execute status-page-db --command="SELECT * FROM monitor_history ORDER BY timestamp DESC LIMIT 10;"

# 本地开发测试
wrangler dev --local
```

## 数据迁移

如果您需要从环境变量配置迁移到D1数据库配置，可以使用以下步骤：

1. 创建并初始化D1数据库
2. 将现有的环境变量配置导入到数据库中
3. 测试数据库配置是否正常工作
4. 移除不需要的环境变量（保留加密的通知配置）

这样可以实现平滑的配置迁移，确保服务不中断。