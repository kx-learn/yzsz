import request from '@/utils/request.js'

/**
 * 获取允许转正的资金池列表
 */
export const getTransformAllowed = () => {
  return request.get('/api/fund-pools/transform-allowed')
}

/**
 * 查询资金池转正操作明细
 */
export const getTransformLogs = (params) => {
  return request.get('/api/fund-pools/transform-logs', params || {})
}

/**
 * 查询资金池分配配置（包含余额 balance）
 * @returns {Promise}
 */
export const getFundPoolAllocations = () => {
  return request.get('/api/fund-pools/allocations')
}

/**
 * 资金池转正：转化为优惠券
 * 接口要求参数为 query：pool_type, user_id, amount, coupon_type, applicable_product_type, remark
 */
export const transformToCoupon = (params) => {
  const pairs = []
  const add = (k, v) => {
    if (v == null) return
    const s = String(v)
    if (!s) return
    pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(s)}`)
  }
  add('pool_type', params.pool_type)
  add('user_id', params.user_id)
  add('amount', params.amount)
  add('coupon_type', params.coupon_type)
  add('applicable_product_type', params.applicable_product_type)
  if (params.remark != null && params.remark !== '') add('remark', params.remark)
  const query = pairs.join('&')
  const url = '/api/fund-pools/transform-to-coupon' + (query ? `?${query}` : '')
  return request.post(url, {})
}