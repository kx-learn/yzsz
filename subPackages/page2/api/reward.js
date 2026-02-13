/**
 * 奖励相关接口
 */

import request from '@/utils/request.js'

/**
 * 我的团队奖励
 * @param {Object} params 查询参数
 * @param {String} params.mobile 用户手机号（必需）
 * @param {Number} params.page 页码（可选，默认1）
 * @param {Number} params.size 每页数量（可选，默认10）
 * @returns {Promise}
 */
export const getRewardList = (params = {}) => {
  return request.get('/reward/list', params)
}

/**
 * 查询推荐奖励列表
 * @param {Object} params 查询参数
 * @param {Number} params.user_id 用户ID（可选）
 * @param {String} params.status 奖励状态（可选，默认'pending'，可选'pending'|'approved'|'rejected'|'all'）
 * @param {Number} params.page 页码（可选，默认1）
 * @param {Number} params.page_size 每页条数（可选，默认20，最大100）
 * @returns {Promise}
 */
export const getReferralRewards = (params = {}) => {
  // 构建query参数
  const queryParams = []
  if (params.user_id) {
    queryParams.push(`user_id=${encodeURIComponent(params.user_id)}`)
  }
  if (params.status) {
    queryParams.push(`status=${encodeURIComponent(params.status)}`)
  }
  if (params.page) {
    queryParams.push(`page=${encodeURIComponent(params.page)}`)
  }
  if (params.page_size) {
    queryParams.push(`page_size=${encodeURIComponent(params.page_size)}`)
  }

  const url = queryParams.length > 0
    ? `/api/rewards/referral?${queryParams.join('&')}`
    : '/api/rewards/referral'

  return request.get(url)
}

/**
 * 按订单查看奖励
 * @param {Number} orderId 订单ID
 * @returns {Promise}
 */
export const getRewardByOrder = (orderId) => {
  return request.get(`/reward/by-order/${orderId}`)
}

/**
 * 晋升荣誉董事
 * @param {Object} data 晋升数据
 * @returns {Promise}
 */
export const tryPromote = (data) => {
  return request.post('/director/try-promote', data)
}

/**
 * 是否荣誉董事
 * @returns {Promise}
 */
export const getIsDirector = () => {
  return request.get('/director/is')
}

/**
 * 分红明细
 * @returns {Promise}
 */
export const getDividend = () => {
  return request.get('/director/dividend')
}

/**
 * 所有活跃董事
 * @returns {Promise}
 */
export const getDirectorList = () => {
  return request.get('/director/list')
}

/**
 * 手动触发周分红（仅内部）
 * @param {Object} data 分红数据
 * @returns {Promise}
 */
export const calcWeek = (data) => {
  return request.post('/director/calc-week', data)
}

/**
 * 等级变动审计
 * @returns {Promise}
 */
export const getAudit = () => {
  return request.get('/audit')
}

/**
 * 查询推荐和团队奖励点数 (累计点数)
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getSpecialPoints = (params = {}) => {
  return request.get('/special-points', params)
}

/**
 * 查询周补贴专用点数
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getSubsidyPoints = (params = {}) => {
  return request.get('/subsidy-points', params)
}

/**
 * 查询联创星级专用点数
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getUniLevelPoints = (params = {}) => {
  return request.get('/unilevel-points', params)
}

/**
 * 查询用户四个点数总和
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getAllPoints = (params = {}) => {
  return request.get('/all-points', params)
}

/**
 * 报表：推荐+团队合并用户点数报表
 */
export const getReferralTeamReport = (params = {}) => {
  return request.get('/api/reports/points/referral-team', params)
}

/**
 * 报表：周补贴用户点数报表
 */
export const getSubsidyReport = (params = {}) => {
  return request.get('/api/reports/points/subsidy', params)
}

/**
 * 报表：联创星级用户点数报表
 */
export const getUniLevelReport = (params = {}) => {
  return request.get('/api/reports/points/unilevel', params)
}

/**
 * 报表：所有点数流水报表
 */
export const getAllPointsReport = () => {
  return request.get('/api/reports/points/all')
}

// 兼容旧版本接口
/**
 * 获取荣誉董事分红记录（兼容旧版本）
 * @param {Object} params 查询参数
 */
export const getDirectorDividend = (params) => {
  return request.get('/reward/director/dividend', params)
}
