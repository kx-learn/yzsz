/**
 * 调试工具
 */

export const debugLog = (title, data) => {
  console.log(`[DEBUG] ${title}:`, JSON.stringify(data, null, 2))
}

export const debugError = (title, error) => {
  console.error(`[ERROR] ${title}:`, error)
  if (error.errMsg) {
    console.error('错误信息:', error.errMsg)
  }
  if (error.data) {
    console.error('响应数据:', error.data)
  }
}
