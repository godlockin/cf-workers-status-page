// 环境变量配置管理模块
// 替代原有的 config.yaml 文件，支持从 Cloudflare Workers 环境变量读取配置

/**
 * 解析监控配置字符串
 * 格式: id1:name1:url1:method1:status1:redirect1:linkable1|id2:name2:url2...
 * 示例: "web1:My Website:https://example.com:GET:200:false:true|api1:My API:https://api.example.com:POST:201:true:false"
 */
function parseMonitors(monitorsString) {
  if (!monitorsString) return []
  
  return monitorsString.split('|').map(monitorStr => {
    const parts = monitorStr.split(':')
    if (parts.length < 7) {
      throw new Error(`Invalid monitor config format: ${monitorStr}`)
    }
    
    // 重新组合URL，因为URL中可能包含冒号
    const id = parts[0]?.trim()
    const name = parts[1]?.trim()
    const urlParts = parts.slice(2, parts.length - 4) // URL可能包含多个冒号
    const url = urlParts.join(':')
    const method = parts[parts.length - 4]?.trim() || 'GET'
    const expectStatus = parseInt(parts[parts.length - 3]) || 200
    const followRedirect = parts[parts.length - 2]?.trim().toLowerCase() === 'true'
    const linkable = parts[parts.length - 1]?.trim().toLowerCase() !== 'false'
    const description = parts[parts.length - 0] || '' // 描述字段可选
    
    return {
      id,
      name,
      description: description?.trim() || '',
      url: url?.trim(),
      method,
      expectStatus,
      followRedirect,
      linkable
    }
  }).filter(monitor => monitor.id && monitor.name && monitor.url)
}

/**
 * 获取配置对象
 * 优先从环境变量读取，如果没有则使用默认值
 */
export function getConfig() {
  // 基础设置配置
  const settings = {
    title: globalThis.SITE_TITLE || 'Status Page',
    url: globalThis.SITE_URL || 'https://status.example.com',
    logo: globalThis.SITE_LOGO || 'logo-192x192.png',
    daysInHistogram: parseInt(globalThis.DAYS_IN_HISTOGRAM) || 90,
    collectResponseTimes: (globalThis.COLLECT_RESPONSE_TIMES || 'false').toLowerCase() === 'true',
    user_agent: globalThis.USER_AGENT || 'cf-worker-status-page',
    
    // 状态文本配置
    allmonitorsOperational: globalThis.TEXT_ALL_OPERATIONAL || 'All Systems Operational',
    notAllmonitorsOperational: globalThis.TEXT_NOT_ALL_OPERATIONAL || 'Not All Systems Operational',
    monitorLabelOperational: globalThis.TEXT_OPERATIONAL || 'Operational',
    monitorLabelNotOperational: globalThis.TEXT_NOT_OPERATIONAL || 'Not Operational',
    monitorLabelNoData: globalThis.TEXT_NO_DATA || 'No data',
    dayInHistogramNoData: globalThis.TEXT_HISTOGRAM_NO_DATA || 'No data',
    dayInHistogramOperational: globalThis.TEXT_HISTOGRAM_OPERATIONAL || 'All good',
    dayInHistogramNotOperational: globalThis.TEXT_HISTOGRAM_NOT_OPERATIONAL || ' incident(s)'
  }

  // 监控配置
  const monitors = parseMonitors(globalThis.MONITORS_CONFIG)

  return {
    settings,
    monitors
  }
}

/**
 * 获取通知配置
 */
export function getNotificationConfig() {
  return {
    slackWebhookUrl: globalThis.SECRET_SLACK_WEBHOOK_URL,
    telegramApiToken: globalThis.SECRET_TELEGRAM_API_TOKEN,
    telegramChatId: globalThis.SECRET_TELEGRAM_CHAT_ID,
    discordWebhookUrl: globalThis.SECRET_DISCORD_WEBHOOK_URL
  }
}

/**
 * 验证必要的配置是否存在
 */
export function validateConfig() {
  const requiredVars = ['SITE_TITLE', 'SITE_URL', 'MONITORS_CONFIG'];
  const missing = requiredVars.filter(varName => {
    const value = globalThis[varName] || process.env?.[varName];
    return !value || value.trim() === '';
  });
  
  const errors = [];
  
  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const config = getConfig()

  if (!config.settings.title) {
    errors.push('SITE_TITLE is required')
  }

  if (!config.settings.url) {
    errors.push('SITE_URL is required')
  }

  if (!config.monitors || config.monitors.length === 0) {
    errors.push('MONITORS_CONFIG is required and must contain at least one monitor')
  }

  // 验证每个监控配置
  config.monitors.forEach((monitor, index) => {
    if (!monitor.id) {
      errors.push(`Monitor ${index + 1}: id is required`)
    }
    if (!monitor.name) {
      errors.push(`Monitor ${index + 1}: name is required`)
    }
    if (!monitor.url) {
      errors.push(`Monitor ${index + 1}: url is required`)
    }
    if (!monitor.url?.startsWith('http')) {
      errors.push(`Monitor ${index + 1}: url must start with http or https`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 默认导出配置对象
export default getConfig()