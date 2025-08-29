// 配置系统测试脚本
// 用于验证环境变量和D1数据库配置是否正常工作

// 模拟Cloudflare Workers环境
globalThis.SITE_TITLE = 'Test Status Page';
globalThis.SITE_URL = 'https://test-status.example.com';
globalThis.MONITORS_CONFIG = 'test1:Test Monitor:https://example.com:GET:200:false:true';

// 导入配置模块
import { getConfig, getConfigAsync, validateConfig } from './src/functions/config.js';

/**
 * 测试环境变量配置
 */
function testEnvironmentConfig() {
  console.log('\n=== 测试环境变量配置 ===');
  
  try {
    const config = getConfig();
    console.log('✅ 环境变量配置加载成功');
    console.log('站点标题:', config.settings.title);
    console.log('站点URL:', config.settings.url);
    console.log('监控数量:', config.monitors.length);
    
    if (config.monitors.length > 0) {
      console.log('第一个监控:', config.monitors[0]);
    }
    
    // 验证配置
    const validation = validateConfig();
    if (validation.isValid) {
      console.log('✅ 配置验证通过');
    } else {
      console.log('❌ 配置验证失败:', validation.errors);
    }
    
  } catch (error) {
    console.error('❌ 环境变量配置测试失败:', error);
  }
}

/**
 * 测试D1数据库配置（模拟）
 */
async function testD1Config() {
  console.log('\n=== 测试D1数据库配置（模拟） ===');
  
  // 模拟D1数据库对象
  const mockDB = {
    prepare: (sql) => ({
      all: async () => {
        if (sql.includes('site_config')) {
          return {
            results: [
              { key: 'site_title', value: 'D1 Status Page' },
              { key: 'site_url', value: 'https://d1-status.example.com' },
              { key: 'days_in_histogram', value: '90' },
              { key: 'collect_response_times', value: 'true' }
            ]
          };
        } else if (sql.includes('monitors')) {
          return {
            results: [
              {
                id: 'd1-test1',
                name: 'D1 Test Monitor',
                description: 'Test monitor from D1',
                url: 'https://d1-example.com',
                method: 'GET',
                expect_status: 200,
                follow_redirect: false,
                linkable: true
              }
            ]
          };
        }
        return { results: [] };
      },
      bind: () => ({ run: async () => ({}) })
    })
  };
  
  try {
    const config = await getConfigAsync(mockDB);
    console.log('✅ D1数据库配置加载成功');
    console.log('站点标题:', config.settings.title);
    console.log('站点URL:', config.settings.url);
    console.log('监控数量:', config.monitors.length);
    
    if (config.monitors.length > 0) {
      console.log('第一个监控:', config.monitors[0]);
    }
    
  } catch (error) {
    console.error('❌ D1数据库配置测试失败:', error);
  }
}

/**
 * 测试配置回退机制
 */
async function testConfigFallback() {
  console.log('\n=== 测试配置回退机制 ===');
  
  // 模拟D1数据库失败的情况
  const failingDB = {
    prepare: () => {
      throw new Error('Database connection failed');
    }
  };
  
  try {
    const config = await getConfigAsync(failingDB);
    console.log('✅ 配置回退机制工作正常');
    console.log('回退到环境变量配置');
    console.log('站点标题:', config.settings.title);
    console.log('监控数量:', config.monitors.length);
    
  } catch (error) {
    console.error('❌ 配置回退机制测试失败:', error);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始配置系统测试...');
  
  testEnvironmentConfig();
  await testD1Config();
  await testConfigFallback();
  
  console.log('\n=== 测试完成 ===');
  console.log('如果所有测试都显示 ✅，说明配置系统工作正常');
  console.log('如果有 ❌，请检查相应的配置或代码');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testEnvironmentConfig, testD1Config, testConfigFallback, runAllTests };