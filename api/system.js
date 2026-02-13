/**
 * 系统配置相关接口
 */

import request from '@/utils/request.js'

/**
 * 获取系统标语
 * @returns {Promise} 返回 { banner_sentence, system_sentence }
 */
export const getSystemSentences = () => {
  return request.get('/api/system/sentences')
}

/**
 * 更新系统标语和轮播图语句
 * @param {Object} data 标语数据
 * @param {String} data.banner_sentence 轮播图语句（播报内容）
 * @param {String} data.system_sentence 系统标语（系统通知内容）
 * @returns {Promise}
 */
export const updateSystemSentences = (data) => {
  return request.put('/api/system/sentences', data)
}

