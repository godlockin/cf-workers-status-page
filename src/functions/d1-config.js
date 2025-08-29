// D1数据库配置管理模块
// 支持从D1数据库读取配置信息，作为环境变量的补充或替代方案

/**
 * 从D1数据库获取站点配置
 * @param {D1Database} db - D1数据库实例
 * @returns {Promise<Object>} 配置对象
 */
export async function getSiteConfigFromD1(db) {
  try {
    const { results } = await db.prepare('SELECT key, value FROM site_config').all();
    
    const config = {};
    results.forEach(row => {
      config[row.key] = row.value;
    });
    
    return {
      title: config.site_title || 'Status Page',
      url: config.site_url || 'https://status.example.com',
      logo: config.site_logo || 'logo-192x192.png',
      daysInHistogram: parseInt(config.days_in_histogram) || 90,
      collectResponseTimes: (config.collect_response_times || 'false').toLowerCase() === 'true',
      user_agent: config.user_agent || 'cf-worker-status-page',
      
      // 状态文本配置
      allmonitorsOperational: config.all_operational_text || 'All Systems Operational',
      notAllmonitorsOperational: config.not_all_operational_text || 'Not All Systems Operational',
      monitorLabelOperational: config.operational_text || 'Operational',
      monitorLabelNotOperational: config.not_operational_text || 'Not Operational',
      monitorLabelNoData: config.no_data_text || 'No data',
      dayInHistogramNoData: config.histogram_no_data_text || 'No data',
      dayInHistogramOperational: config.histogram_operational_text || 'All good',
      dayInHistogramNotOperational: config.histogram_not_operational_text || ' incident(s)'
    };
  } catch (error) {
    console.error('Error fetching site config from D1:', error);
    return null;
  }
}

/**
 * 从D1数据库获取监控配置
 * @param {D1Database} db - D1数据库实例
 * @returns {Promise<Array>} 监控配置数组
 */
export async function getMonitorsFromD1(db) {
  try {
    const { results } = await db.prepare(
      'SELECT id, name, description, url, method, expect_status, follow_redirect, linkable FROM monitors WHERE enabled = true'
    ).all();
    
    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      url: row.url,
      method: row.method || 'GET',
      expectStatus: row.expect_status || 200,
      followRedirect: Boolean(row.follow_redirect),
      linkable: row.linkable !== false
    }));
  } catch (error) {
    console.error('Error fetching monitors from D1:', error);
    return [];
  }
}

/**
 * 保存监控历史数据到D1数据库
 * @param {D1Database} db - D1数据库实例
 * @param {string} monitorId - 监控ID
 * @param {number} status - HTTP状态码
 * @param {number} responseTime - 响应时间(毫秒)
 * @param {string} errorMessage - 错误信息(可选)
 */
export async function saveMonitorHistory(db, monitorId, status, responseTime, errorMessage = null) {
  try {
    await db.prepare(
      'INSERT INTO monitor_history (monitor_id, status, response_time, error_message) VALUES (?, ?, ?, ?)'
    ).bind(monitorId, status, responseTime, errorMessage).run();
  } catch (error) {
    console.error('Error saving monitor history to D1:', error);
  }
}

/**
 * 获取监控历史数据
 * @param {D1Database} db - D1数据库实例
 * @param {string} monitorId - 监控ID
 * @param {number} days - 获取最近多少天的数据
 * @returns {Promise<Array>} 历史数据数组
 */
export async function getMonitorHistory(db, monitorId, days = 90) {
  try {
    const { results } = await db.prepare(
      'SELECT status, response_time, timestamp, error_message FROM monitor_history WHERE monitor_id = ? AND timestamp >= datetime("now", "-" || ? || " days") ORDER BY timestamp DESC'
    ).bind(monitorId, days).all();
    
    return results;
  } catch (error) {
    console.error('Error fetching monitor history from D1:', error);
    return [];
  }
}

/**
 * 更新站点配置
 * @param {D1Database} db - D1数据库实例
 * @param {string} key - 配置键
 * @param {string} value - 配置值
 */
export async function updateSiteConfig(db, key, value) {
  try {
    await db.prepare(
      'INSERT OR REPLACE INTO site_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, value).run();
  } catch (error) {
    console.error('Error updating site config in D1:', error);
  }
}

/**
 * 添加或更新监控配置
 * @param {D1Database} db - D1数据库实例
 * @param {Object} monitor - 监控配置对象
 */
export async function upsertMonitor(db, monitor) {
  try {
    await db.prepare(
      `INSERT OR REPLACE INTO monitors 
       (id, name, description, url, method, expect_status, follow_redirect, linkable, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(
      monitor.id,
      monitor.name,
      monitor.description || '',
      monitor.url,
      monitor.method || 'GET',
      monitor.expectStatus || 200,
      monitor.followRedirect || false,
      monitor.linkable !== false
    ).run();
  } catch (error) {
    console.error('Error upserting monitor in D1:', error);
  }
}

/**
 * 删除监控配置
 * @param {D1Database} db - D1数据库实例
 * @param {string} monitorId - 监控ID
 */
export async function deleteMonitor(db, monitorId) {
  try {
    // 删除监控配置
    await db.prepare('DELETE FROM monitors WHERE id = ?').bind(monitorId).run();
    // 删除相关历史数据
    await db.prepare('DELETE FROM monitor_history WHERE monitor_id = ?').bind(monitorId).run();
  } catch (error) {
    console.error('Error deleting monitor from D1:', error);
  }
}