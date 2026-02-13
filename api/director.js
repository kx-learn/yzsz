/**
 * 董事相关接口
 */

import request from '@/utils/request.js'

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