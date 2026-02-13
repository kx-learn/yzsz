/**
 * 收藏功能工具函数（本地存储，按用户ID区分）
 */

/**
 * 获取当前用户ID
 */
const getCurrentUserId = () => {
  try {
    const userInfo = uni.getStorageSync('userInfo') || {}
    return userInfo.id || userInfo.user_id || userInfo.userId || null
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return null
  }
}

/**
 * 获取存储key（按用户ID）
 */
const getStorageKey = () => {
  const userId = getCurrentUserId()
  if (!userId) {
    console.warn('未找到用户ID，使用默认key')
    return 'productFavorites_default'
  }
  return `productFavorites_user_${userId}`
}

/**
 * 获取当前用户的收藏列表
 */
export const getLocalFavorites = () => {
  try {
    const storageKey = getStorageKey()
    const favorites = uni.getStorageSync(storageKey) || []
    return Array.isArray(favorites) ? favorites : []
  } catch (error) {
    console.error('获取本地收藏列表失败', error)
    return []
  }
}

/**
 * 保存当前用户的收藏列表
 */
export const saveLocalFavorites = (favorites) => {
  try {
    const storageKey = getStorageKey()
    uni.setStorageSync(storageKey, favorites)
    console.log('[收藏] 保存成功，用户ID:', getCurrentUserId(), '收藏数量:', favorites.length)
  } catch (error) {
    console.error('保存本地收藏列表失败', error)
    throw error
  }
}

/**
 * 检查商品是否已收藏
 */
export const checkFavoriteStatus = (productId) => {
  try {
    const favorites = getLocalFavorites()
    return favorites.some(fav => 
      fav.id === productId || 
      fav.product_id === productId ||
      String(fav.id) === String(productId) ||
      String(fav.product_id) === String(productId)
    )
  } catch (error) {
    console.error('检查收藏状态失败', error)
    return false
  }
}

/**
 * 添加收藏
 */
export const addToFavorites = (productData) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('请先登录')
    }

    const favorites = getLocalFavorites()
    const productId = productData.id || productData.product_id

    // 检查是否已存在
    const exists = favorites.some(fav => 
      fav.id === productId || 
      fav.product_id === productId ||
      String(fav.id) === String(productId) ||
      String(fav.product_id) === String(productId)
    )

    if (exists) {
      console.log('商品已收藏，跳过添加')
      return true
    }

    // 添加收藏
    const favoriteItem = {
      id: productId,
      product_id: productId,
      name: productData?.name || '',
      image: productData?.images?.[0] || productData?.image || productData?.banner_images?.[0] || productData?.product_image || '',
      price: productData?.price || productData?.product_price || 0,
      original_price: productData?.original_price || productData?.origin_price || productData?.price || productData?.product_price || 0,
      is_vip: productData?.is_vip || productData?.isVip || false,
      is_hot: productData?.is_hot || productData?.isHot || false,
      addTime: Date.now(),
      userId: userId // 记录用户ID，用于数据迁移
    }

    favorites.push(favoriteItem)
    saveLocalFavorites(favorites)
    console.log('[收藏] 添加成功，商品ID:', productId)
    return true
  } catch (error) {
    console.error('添加收藏失败', error)
    throw error
  }
}

/**
 * 移除收藏
 */
export const removeFromFavorites = (productId) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('请先登录')
    }

    const favorites = getLocalFavorites()
    const filteredFavorites = favorites.filter(fav => 
      fav.id !== productId && 
      fav.product_id !== productId &&
      String(fav.id) !== String(productId) &&
      String(fav.product_id) !== String(productId)
    )

    saveLocalFavorites(filteredFavorites)
    console.log('[收藏] 移除成功，商品ID:', productId)
    return true
  } catch (error) {
    console.error('移除收藏失败', error)
    throw error
  }
}

/**
 * 批量移除收藏
 */
export const batchRemoveFavorites = (productIds) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      throw new Error('请先登录')
    }

    const favorites = getLocalFavorites()
    const filteredFavorites = favorites.filter(fav => {
      const favId = fav.id || fav.product_id
      return !productIds.some(id => 
        favId === id || 
        String(favId) === String(id)
      )
    })

    saveLocalFavorites(filteredFavorites)
    console.log('[收藏] 批量移除成功，数量:', productIds.length)
    return true
  } catch (error) {
    console.error('批量移除收藏失败', error)
    throw error
  }
}

/**
 * 获取收藏列表（支持分页）
 */
export const getFavoriteList = (params = {}) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      return {
        data: [],
        hasMore: false,
        total: 0
      }
    }

    const favorites = getLocalFavorites()
    const page = params.page || 1
    const pageSize = params.pageSize || 10

    // 按添加时间倒序排列
    const sortedFavorites = [...favorites].sort((a, b) => (b.addTime || 0) - (a.addTime || 0))

    // 分页
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageData = sortedFavorites.slice(start, end)

    return {
      data: pageData,
      hasMore: end < sortedFavorites.length,
      total: sortedFavorites.length,
      page: page,
      pageSize: pageSize
    }
  } catch (error) {
    console.error('获取收藏列表失败', error)
    return {
      data: [],
      hasMore: false,
      total: 0
    }
  }
}

