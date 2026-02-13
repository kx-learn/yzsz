/**
 * 评价相关接口
 */

import request from '@/utils/request.js'

/**
 * 提交商品评价
 * @param {Object} data 评价数据
 * @param {Number} data.order_id 订单ID
 * @param {Number} data.product_id 商品ID
 * @param {Number} data.rating 评分 1-5
 * @param {String} data.content 评价内容
 * @param {Array} data.images 评价图片数组
 * @param {Boolean} data.is_anonymous 是否匿名
 */
export const submitEvaluation = (data) => {
  return request.post('/evaluation/submit', data)
}

/**
 * 获取商品评价列表
 * @param {Object} params 查询参数
 * @param {Number} params.product_id 商品ID
 * @param {String} params.filter 筛选条件：all-全部, image-有图, good-好评(4-5星), medium-中评(3星), bad-差评(1-2星)
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 */
export const getProductEvaluations = (params) => {
  return request.get('/evaluation/product', { params })
}

/**
 * 获取我的评价列表
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 */
export const getMyEvaluations = (params = {}) => {
  return request.get('/evaluation/my', { params })
}

/**
 * 获取评价详情
 * @param {Number} evaluation_id 评价ID
 */
export const getEvaluationDetail = (evaluation_id) => {
  return request.get(`/evaluation/detail/${evaluation_id}`)
}

/**
 * 编辑评价
 * @param {Number} evaluation_id 评价ID
 * @param {Object} data 评价数据
 */
export const updateEvaluation = (evaluation_id, data) => {
  return request.put(`/evaluation/${evaluation_id}`, data)
}

/**
 * 删除评价
 * @param {Number} evaluation_id 评价ID
 */
export const deleteEvaluation = (evaluation_id) => {
  return request.delete(`/evaluation/${evaluation_id}`)
}

/**
 * 获取评价统计
 * @param {Number} product_id 商品ID
 */
export const getEvaluationStats = (product_id) => {
  return request.get(`/evaluation/stats/${product_id}`)
}

