-- D1数据库初始化脚本
-- 用于创建状态页面所需的数据库表结构

-- 监控配置表
CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    expect_status INTEGER DEFAULT 200,
    follow_redirect BOOLEAN DEFAULT false,
    linkable BOOLEAN DEFAULT true,
    enabled BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 监控历史数据表
CREATE TABLE IF NOT EXISTS monitor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL,
    status INTEGER NOT NULL,
    response_time INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id)
);

-- 站点配置表
CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT OR REPLACE INTO site_config (key, value, description) VALUES
('site_title', 'Status Page', '站点标题'),
('site_url', 'https://status.example.com', '站点URL'),
('site_logo', 'logo-192x192.png', '站点Logo'),
('days_in_histogram', '90', '历史图表显示天数'),
('collect_response_times', 'true', '是否收集响应时间'),
('user_agent', 'cf-worker-status-page', 'User Agent字符串'),
('all_operational_text', 'All Systems Operational', '所有系统正常文本'),
('not_all_operational_text', 'Not All Systems Operational', '系统异常文本'),
('operational_text', 'Operational', '正常状态文本'),
('not_operational_text', 'Not Operational', '异常状态文本'),
('no_data_text', 'No data', '无数据文本');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_monitor_history_monitor_id ON monitor_history(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_history_timestamp ON monitor_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitors_enabled ON monitors(enabled);

-- 插入示例监控配置
INSERT OR REPLACE INTO monitors (id, name, description, url, method, expect_status, follow_redirect, linkable) VALUES
('example-web', 'Example Website', '示例网站监控', 'https://example.com', 'GET', 200, false, true),
('example-api', 'Example API', '示例API监控', 'https://api.example.com/health', 'GET', 200, false, false);