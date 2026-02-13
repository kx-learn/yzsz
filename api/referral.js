/**
 * 推荐关系相关接口
 */

import request from '@/utils/request.js'

/**
 * 获取推荐关系信息
 * @returns {Promise}
 */
export const getReferralInfo = () => {
  return request.get('/referral/info')
}

/**
 * 获取我推荐的用户列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.limit 每页数量
 * @returns {Promise}
 */
export const getMyReferrals = (params = {}) => {
  return request.get('/referral/my-referrals', params)
}

/**
 * 获取推荐奖励记录
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getReferralRewards = (params = {}) => {
  return request.get('/referral/rewards', params)
}

/**
 * 生成推荐码/链接
 * @returns {Promise}
 */
export const generateReferralCode = () => {
  return request.post('/referral/generate-code')
}

/**
 * 绑定推荐人
 * @param {String} referralCode 推荐码
 * @returns {Promise}
 */
export const bindReferrer = (referralCode) => {
  return request.post('/referral/bind', {
    referral_code: referralCode
  })
}