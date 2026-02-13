/**
 * 退款相关接口
 */

import request from '@/utils/request.js'

/**
 * 申请退款
 * @param {Object} params 退款申请参数
 * @param {String} params.order_number 订单号（必需）
 * @param {String} params.refund_type 退款类型（必需）：refund_only-仅退款, return_refund-退货退款, exchange-换货
 * @param {String} params.reason_code 售后原因（必需，包含选择的原因和填写的说明）
 * @param {Array<String>} params.images 凭证图片URL数组（可选）
 * @returns {Promise}
 */
export const applyRefund = (params) => {
  if (!params.order_number) {
    return Promise.reject(new Error('订单号不能为空'))
  }
  if (!params.refund_type) {
    return Promise.reject(new Error('退款类型不能为空'))
  }
  if (!params.reason_code) {
    return Promise.reject(new Error('退款原因不能为空'))
  }

  // 构建请求数据
  const data = {
    order_number: params.order_number,
    refund_type: params.refund_type,
    reason_code: params.reason_code
  }

  // 可选字段
  if (params.images && Array.isArray(params.images) && params.images.length > 0) {
    data.images = params.images
  }

  return request.post('/refund/apply', data)
}


/**
 * 查询退款进度
 * @param {String} orderNumber 订单号（必需）
 * @returns {Promise}
 */
export const getRefundProgress = (orderNumber) => {
  if (!orderNumber) {
    return Promise.reject(new Error('订单号不能为空'))
  }

  return request.get(`/refund/progress/${orderNumber}`)
}

/**
 * 审核退款申请（商户端）
 * @param {Object} params 审核参数
 * @param {String} params.order_number 订单号（必需）
 * @param {Boolean} params.approve 是否通过（必需）：true-通过, false-拒绝
 * @param {String} params.reject_reason 拒绝原因（可选，拒绝时填写）
 * @param {String} params.merchant_address 退货地址（可选，暂时不使用，地址通过平台设置接口统一管理）
 * @returns {Promise}
 */
export const auditRefund = (params) => {
  if (!params.order_number) {
    return Promise.reject(new Error('订单号不能为空'))
  }
  if (params.approve === undefined || params.approve === null) {
    return Promise.reject(new Error('审核结果不能为空'))
  }

  const data = {
    order_number: params.order_number,
    approve: Boolean(params.approve)
  }

  // 如果拒绝，reject_reason 传入拒绝原因
  if (params.reject_reason) {
    data.reject_reason = params.reject_reason
  }

  // merchant_address 参数保留在接口定义中，但暂时不传递
  // 地址通过 /address/platform-return 接口统一管理，用户可通过该接口查看
  // if (params.merchant_address) {
  //   data.merchant_address = params.merchant_address
  // }

  return request.post('/refund/audit', data)
}

/**
 * 退款类型映射（将中文转换为后端代码）
 * @param {String} chineseType 中文类型
 * @returns {String} 后端代码
 */
export const mapRefundType = (chineseType) => {
  const typeMap = {
    '仅退款': 'refund_only',
    '退货退款': 'return'
  }
  return typeMap[chineseType] || 'refund_only'
}

/**
 * 通过退款申请（商户端便捷函数）
 * @param {String} orderNumber 订单号
 * @returns {Promise}
 */
export const approveRefund = (orderNumber) => {
  return auditRefund({
    order_number: orderNumber,
    approve: true
  })
}

/**
 * 拒绝退款申请（商户端便捷函数）
 * @param {String} orderNumber 订单号
 * @param {String} reason 拒绝原因
 * @returns {Promise}
 */
export const rejectRefund = (orderNumber, reason = '') => {
  return auditRefund({
    order_number: orderNumber,
    approve: false,
    reject_reason: reason
  })
}


