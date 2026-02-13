/**
 * 收藏相关接口（使用本地存储，按用户ID区分）
 */

import * as favoritesUtils from '../utils/favorites.js'

/**
 * 收藏商品（本地存储）
 * @param {Number|Object} productIdOrData 商品ID或商品数据对象
 * @returns {Promise}
 */
export const addToFavorites = (productIdOrData) => {
  return new Promise((resolve, reject) => {
    try {
      // 如果传入的是商品ID，需要从商品详情获取数据
      // 这里假设传入的是商品数据对象
      if (typeof productIdOrData === 'number' || typeof productIdOrData === 'string') {
        // 如果只传了ID，需要从其他地方获取商品数据
        // 这里返回错误，提示需要传入完整的商品数据
        reject(new Error('请传入完整的商品数据对象'))
        return
      }

      const result = favoritesUtils.addToFavorites(productIdOrData)
      resolve({ success: true, message: '收藏成功', data: result })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 取消收藏（本地存储）
 * @param {Number} productId 商品ID
 * @returns {Promise}
 */
export const removeFromFavorites = (productId) => {
  return new Promise((resolve, reject) => {
    try {
      const result = favoritesUtils.removeFromFavorites(productId)
      resolve({ success: true, message: '取消收藏成功', data: result })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 获取收藏列表（本地存储）
 * @param {Object} params 查询参数
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 * @returns {Promise}
 */
export const getFavoriteList = (params = {}) => {
  return new Promise((resolve) => {
    try {
      const result = favoritesUtils.getFavoriteList(params)
      resolve({
        success: true,
        data: result.data,
        hasMore: result.hasMore,
        total: result.total
      })
    } catch (error) {
      console.error('获取收藏列表失败', error)
      resolve({
        success: true,
        data: [],
        hasMore: false,
        total: 0
      })
    }
  })
}

/**
 * 检查商品是否已收藏（本地存储）
 * @param {Number} productId 商品ID
 * @returns {Promise}
 */
export const checkFavoriteStatus = (productId) => {
  return new Promise((resolve) => {
    try {
      const isFavorite = favoritesUtils.checkFavoriteStatus(productId)
      resolve({
        success: true,
        data: {
          is_favorite: isFavorite
        }
      })
    } catch (error) {
      console.error('检查收藏状态失败', error)
      resolve({
        success: true,
        data: {
          is_favorite: false
        }
      })
    }
  })
}

/**
 * 批量移除收藏（本地存储）
 * @param {Array} productIds 商品ID列表
 * @returns {Promise}
 */
export const batchRemoveFavorites = (productIds) => {
  return new Promise((resolve, reject) => {
    try {
      const result = favoritesUtils.batchRemoveFavorites(productIds)
      resolve({ success: true, message: '批量删除成功', data: result })
    } catch (error) {
      reject(error)
    }
  })
}