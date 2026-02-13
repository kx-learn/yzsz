/**
 * 环境变量使用示例
 * 
 * 使用方法：
 * import { SESSION_KEY, getEnv } from '@/utils/env.js'
 * 
 * // 直接使用常量
 * const sessionKey = SESSION_KEY
 * 
 * // 或使用函数获取
 * const sessionKey = getEnv('SESSION_KEY')
 */

// 示例：在 API 调用中使用
// import { SESSION_KEY } from '@/utils/env.js'
// 
// // 注意：根据微信安全规范，session_key 不应在请求和响应中明文传输
// // 如果需要在代码中使用，应该从环境变量读取，而不是硬编码
// if (SESSION_KEY) {
//   // 使用 SESSION_KEY 的逻辑
// }
