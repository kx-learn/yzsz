/**
 * 报表相关接口
 */

import request from '@/utils/request.js'

/**
 * 查询公益基金余额
 * @returns {Promise}
 */
export const getPublicWelfareBalance = () => {
  return request.get('/api/public-welfare')
}

/**
 * 公益基金流水明细
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getPublicWelfareFlow = (params) => {
  return request.get('/api/public-welfare/flow', params)
}

/**
 * 公益基金交易报表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getPublicWelfareReport = (params) => {
  return request.get('/api/admin/reports/public-welfare', params)
}

/**
 * 周补贴明细报表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getWeeklySubsidyReport = (params) => {
  return request.get('/api/reports/subsidy/weekly', params)
}

/**
 * 月补贴明细报表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getMonthlySubsidyReport = (params) => {
  return request.get('/api/reports/subsidy/monthly', params)
}

/**
 * 查询奖励列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getRewardsPending = (params) => {
  return request.get('/api/rewards/pending', params)
}

/**
 * 财务总览报告
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getFinanceReport = (params) => {
  return request.get('/api/reports/finance', params)
}

/**
 * 资金流水报告
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getAccountFlowReport = (params) => {
  return request.get('/api/reports/account-flow', params)
}

/**
 * 积分抵扣明细报表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getPointsDeductionReport = (params) => {
  return request.get('/api/admin/reports/points-deduction', params)
}

/**
 * 平台资金池变动报表
 * @param {Object} params 查询参数
 * @param {String} params.account_type 资金池类型 (required): public_welfare|subsidy_pool|honor_director|company_points|platform_revenue_pool
 * @param {String} params.start_date 开始日期 yyyy-MM-dd (required)
 * @param {String} params.end_date 结束日期 yyyy-MM-dd (required)
 * @param {Number} params.page 页码 (optional, default: 1)
 * @param {Number} params.page_size 每页条数 (optional, default: 20, max: 100)
 * @returns {Promise}
 */
export const getPoolFlow = (params) => {
  return request.get('/api/reports/pool-flow', params)
}

/**
 * 综合点数流水报表（所有雨点流水）
 * @param {Object} params 查询参数
 * @param {Number} params.user_id 用户ID (可选)
 * @param {String} params.start_date 开始日期 yyyy-MM-dd (可选)
 * @param {String} params.end_date 结束日期 yyyy-MM-dd (可选)
 * @param {Number} params.page 页码 (可选, default: 1, minimum: 1)
 * @param {Number} params.page_size 每页条数 (可选, default: 20, minimum: 1, maximum: 100)
 * @returns {Promise}
 */
export const getAllPointsFlows = (params) => {
  return request.get('/api/reports/points/all-flows', params)
}

/**
 * 总会员积分明细报表
 * @param {Object} params 查询参数
 * @param {Number} params.user_id 用户ID (可选)
 * @param {String} params.start_date 开始日期 yyyy-MM-dd (可选)
 * @param {String} params.end_date 结束日期 yyyy-MM-dd (可选)
 * @param {Number} params.page 页码 (可选, default: 1, minimum: 1)
 * @param {Number} params.page_size 每页条数 (可选, default: 40, minimum: 1, maximum: 100)
 * @returns {Promise}
 */
export const getMemberPointsDetailReport = (params) => {
  return request.get('/api/reports/points/member/detail', params)
}

