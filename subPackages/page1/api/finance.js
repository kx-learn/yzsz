/**
 * 财务相关接口
 */

import request from '@/utils/request.js'

/**
 * 获取用户财务账户信息
 * @returns {Promise}
 */
export const getFinanceAccount = () => {
  return request.get('/finance/account')
}

/**
 * 获取账户流水记录
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.limit 每页数量
 * @param {String} params.flow_type 流水类型：all/income/expense
 * @returns {Promise}
 */
export const getAccountFlow = (params) => {
  return request.get('/finance/flow', params)
}

/**
 * 获取资金流水记录
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.limit 每页数量
 * @param {String} params.flow_type 流水类型
 * @returns {Promise}
 */
export const getFundsAllocation = (period = 'month') => {
  return request.get('/finance/allocation', { period })
}

/**
 * 查询平台积分余额（company_points）
 * @returns {Promise} 返回平台积分余额
 */
export const getCompanyPointsBalance = () => {
  return request.get('/api/finance/points/company')
}

/**
 * 查询平台资金余额
 * @returns {Promise} 返回平台资金余额
 */
export const getPlatformRevenueBalance = () => {
  return request.get('/api/finance/pool/platform-revenue')
}