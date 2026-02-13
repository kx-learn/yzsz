/**
 * 环境变量加载工具
 * 从 .env 文件加载环境变量
 */

// 环境变量配置对象
const env = {}

// 在 uni-app 中，可以通过 process.env 访问环境变量
// 但 .env 文件需要构建工具支持，这里提供一个兼容方案
if (typeof process !== 'undefined' && process.env) {
  // 从 process.env 读取环境变量
  env.SESSION_KEY = process.env.SESSION_KEY || process.env.VUE_APP_SESSION_KEY || ''
} else {
  // 如果 process.env 不可用，使用默认值
  env.SESSION_KEY = ''
}

/**
 * 获取环境变量
 * @param {String} key 环境变量键名
 * @param {*} defaultValue 默认值
 * @returns {*} 环境变量值
 */
export function getEnv(key, defaultValue = '') {
  return env[key] !== undefined ? env[key] : defaultValue
}

/**
 * 获取 SESSION_KEY 常量
 * @returns {String} SESSION_KEY 值
 */
export const SESSION_KEY = env.SESSION_KEY

// 导出所有环境变量
export default env
