/**
 * 团队相关接口
 */

import request from '@/utils/request.js'

/**
 * 获取团队统计数据
 */
export const getTeamStats = () => {
  return request.get('/team/stats')
}

/**
 * 获取直推会员列表
 * 使用 /user/refer-direct 接口
 * @param {Object} params 查询参数
 * @param {String} params.mobile 用户手机号（必需）
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 * @param {String} params.sortBy 排序字段
 * @param {String} params.order 排序方向
 */
export const getDirectMembers = (params) => {
  // 如果没有提供 mobile，尝试从本地存储获取
  if (!params.mobile) {
    const userInfo = uni.getStorageSync('userInfo') || {}
    params.mobile = userInfo.mobile || userInfo.phone
  }
  return request.get('/user/refer-direct', params)
}

/**
 * 获取用户的推荐人信息
 * @param {Number} userId 用户ID
 */
export const getReferrer = (userId) => {
  return request.get(`/team/referrer/${userId}`)
}

/**
 * 获取推荐关系链路（从当前用户到顶层）
 */
export const getReferralChain = () => {
  return request.get('/team/referral-chain')
}

/**
 * 获取团队层级结构
 * 使用 /user/refer-team 接口（递归获取团队列表）
 */
export const getTeamStructure = () => {
  // 获取当前用户的手机号
  const userInfo = uni.getStorageSync('userInfo') || {}
  const mobile = userInfo.mobile || userInfo.phone
  if (!mobile) {
    return Promise.reject(new Error('用户手机号不能为空'))
  }
  return request.get('/user/refer-team', { mobile, max_layer: 6 })
}

/**
 * 获取团队奖励统计
 * @param {Object} params 查询参数
 * @param {String} params.timeFilter 时间筛选
 * @param {Number} params.userLevel 用户等级
 */
export const getTeamRewards = (params) => {
  return request.get('/team/rewards', params)
}

/**
 * 获取团队层级详情
 * @param {Number} layer 层级
 */
export const getTeamLayers = (layer) => {
  return request.get(`/team/layers/${layer}`)
}

/**
 * 获取指定层级的会员列表
 * @param {Number} layer 层级（1-6）
 * @param {Object} params 查询参数
 */
export const getLayerMembers = (layer, params) => {
  return request.get(`/team/layer/${layer}/members`, params)
}

/**
 * 获取奖励历史记录
 * 使用 /reward/list 接口
 * @param {Object} params 查询参数
 * @param {String} params.mobile 用户手机号（必需）
 * @param {Number} params.page 页码
 * @param {Number} params.size 每页数量
 */
export const getRewardHistory = (params = {}) => {
  // 如果没有提供 mobile，尝试从本地存储获取
  if (!params.mobile) {
    const userInfo = uni.getStorageSync('userInfo') || {}
    params.mobile = userInfo.mobile || userInfo.phone
  }
  // 兼容 pageSize 参数，转换为 size
  if (params.pageSize && !params.size) {
    params.size = params.pageSize
    delete params.pageSize
  }
  return request.get('/reward/list', params)
}

/**
 * 获取会员详情
 * @param {String} memberId 会员ID
 */
export const getMemberDetail = (memberId) => {
  return request.get(`/team/member/${memberId}`)
}

/**
 * 获取会员购买记录
 * @param {String} memberId 会员ID
 * @param {Object} params 查询参数
 */
export const getMemberPurchases = (memberId, params) => {
  return request.get(`/team/member/${memberId}/purchases`, params)
}

/**
 * 获取团队奖励规则
 */
export const getRewardRules = () => {
  return request.get('/team/reward-rules')
}

/**
 * 计算团队奖励
 * @param {Object} data 计算参数
 * @param {Number} data.userLevel 用户等级
 * @param {Number} data.purchaseAmount 购买金额
 * @param {Number} data.memberLevel 购买会员等级
 * @param {Number} data.layer 层级
 */
export const calculateTeamReward = (data) => {
  return request.post('/team/calculate-reward', data)
}

/**
 * 获取推荐码
 */
export const getReferralCode = () => {
  return request.get('/user/referral-code')
}

/**
 * 生成推荐海报
 */
export const generatePoster = () => {
  return request.post('/user/generate-poster')
}

/**
 * 获取团队培训资料
 */
export const getTrainingMaterials = () => {
  return request.get('/team/training-materials')
}

/**
 * 获取团队数据分析
 * @param {Object} params 查询参数
 */
export const getTeamAnalytics = (params) => {
  return request.get('/team/analytics', params)
}

/**
 * 查询联创状态
 * @param {Number} user_id 用户ID（必需，作为query参数）
 * @returns {Promise}
 */
export const getUniLevelStatus = (user_id) => {
  if (!user_id) {
    return Promise.reject(new Error('用户ID不能为空'))
  }
  return request.get('/unilevel/status', { user_id })
}

/**
 * 自动晋升联创
 * @param {Number} user_id 用户ID（必需，作为query参数）
 * @returns {Promise}
 * 注意：如果已经是最高等级或条件未达标，会静默返回错误，不显示提示
 */
export const promoteUniLevel = (user_id) => {
  if (!user_id) {
    return Promise.reject(new Error('用户ID不能为空'))
  }
  // POST请求，但user_id作为query参数传递
  const url = `/unilevel/promote?user_id=${encodeURIComponent(user_id)}`
  
  return request.post(url, {}).catch((error) => {
    // 如果是400错误且提示已达到最高等级或条件未达标，静默处理，不抛出错误
    if (error.code === 400 || error.statusCode === 400) {
      const errorMsg = error.message || error.errorMsg || error.msg || ''
      if (errorMsg.includes('已到达最高等级') || errorMsg.includes('条件未达标') || errorMsg.includes('无法晋升')) {
        // 静默返回，不显示错误
        return Promise.resolve({ 
          data: { unilevel: null, message: '已达到最高等级或条件未达标' },
          silent: true 
        })
      }
    }
    // 其他错误正常抛出
    throw error
  })
}
