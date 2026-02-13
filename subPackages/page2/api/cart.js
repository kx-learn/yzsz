/**
 * 购物车相关接口
 */

import request from '@/utils/request.js'

/**
 * 获取购物车列表
 * @param {Number} userId 用户ID（必需）
 * @returns {Promise}
 */
export const getCartList = (userId) => {
    if (!userId) {
        return Promise.reject(new Error('用户ID不能为空'))
    }
    return request.get(`/cart/${userId}`)
}

/**
 * 加入购物车
 * @param {Object} data
 * @param {Number} data.user_id 用户ID（必需，整数）
 * @param {Number} data.product_id 商品ID（必需，整数）
 * @param {Number} data.quantity 数量（必需，整数，默认1）
 * @param {String} data.sku SKU编码（可选，兼容旧版本）
 * @param {Object} data.specifications 规格信息（可选，格式：{ "规格名称": "规格值" }）
 * @param {Object} data.specs 规格信息（可选，兼容旧版本，会自动转换为 specifications）
 * @returns {Promise}
 */
export const addToCart = (data) => {
    // 参数验证和类型转换
    if (!data.user_id && data.user_id !== 0) {
        return Promise.reject(new Error('用户ID不能为空'))
    }
    if (!data.product_id && data.product_id !== 0) {
        return Promise.reject(new Error('商品ID不能为空'))
    }
    
    // 确保参数是整数类型（根据API文档要求）
    const requestData = {
        user_id: parseInt(data.user_id, 10),
        product_id: parseInt(data.product_id, 10),
        quantity: parseInt(data.quantity || 1, 10)
    }
    
    // 处理规格信息：如果有 specs，转换为 specifications；如果有 specifications，直接使用
    if (data.specifications && typeof data.specifications === 'object') {
        // 只传递选中的规格（过滤掉空值）
        const validSpecs = {}
        Object.keys(data.specifications).forEach(key => {
            const value = data.specifications[key]
            if (value !== null && value !== undefined && value !== '') {
                validSpecs[key] = value
            }
        })
        
        // 只有当有有效规格时才添加 specifications 字段
        if (Object.keys(validSpecs).length > 0) {
            requestData.specifications = validSpecs
        }
    } else if (data.specs && typeof data.specs === 'object') {
        // 兼容旧版本的 specs 字段，转换为 specifications
        const validSpecs = {}
        Object.keys(data.specs).forEach(key => {
            const value = data.specs[key]
            if (value !== null && value !== undefined && value !== '') {
                validSpecs[key] = value
            }
        })
        
        if (Object.keys(validSpecs).length > 0) {
            requestData.specifications = validSpecs
        }
    }
    
    // 如果提供了sku，也包含进去（兼容旧版本）
    if (data.sku) {
        requestData.sku = data.sku
    }
    
    // 验证整数转换是否成功
    if (isNaN(requestData.user_id)) {
        return Promise.reject(new Error('用户ID必须是有效的整数'))
    }
    if (isNaN(requestData.product_id)) {
        return Promise.reject(new Error('商品ID必须是有效的整数'))
    }
    if (isNaN(requestData.quantity) || requestData.quantity < 1) {
        return Promise.reject(new Error('数量必须是大于0的整数'))
    }
    
    return request.post('/cart/add', requestData)
}

/**
 * 更新购物车商品数量
 * @param {Number} id 购物车记录ID
 * @param {Number} quantity 新数量
 * @param {Number|Boolean} selected 是否选中（可选，默认保持原状态）
 * @returns {Promise}
 */
export const updateCartItem = (id, quantity, selected = null) => {
    // 后端可能不支持PUT方法，改用POST方法
    const data = {
        cartId: id,
        quantity: quantity
    }
    // 如果指定了选中状态，则包含该字段
    if (selected !== null) {
        data.selected = selected ? 1 : 0
    }
    // 先尝试POST方法（因为后端返回405，说明不支持PUT）
    return request.post('/cart/update', data)
}

/**
 * 更新购物车选中状态
 * @param {Array} ids 购物车记录ID列表
 * @param {Boolean} selected 是否选中
 * @returns {Promise}
 */
export const updateCartSelection = (ids, selected) => {
    // 后端可能不支持PUT方法，改用POST方法
    return request.post('/cart/select', { ids, selected })
}

/**
 * 减少购物车商品数量（按规格扣减）
 * @param {Object} data
 * @param {Number} data.user_id 用户ID（必需）
 * @param {Number} data.product_id 商品ID（必需）
 * @param {Number} data.quantity 要减少的数量（必需，默认1）
 * @param {Object} data.specifications 规格信息（可选，格式：{ "规格名称": "规格值" }）
 * @returns {Promise}
 */
export const decreaseCartItem = (data) => {
    // 参数验证和类型转换
    if (!data.user_id && data.user_id !== 0) {
        return Promise.reject(new Error('用户ID不能为空'))
    }
    if (!data.product_id && data.product_id !== 0) {
        return Promise.reject(new Error('商品ID不能为空'))
    }
    
    // 确保参数是整数类型
    const requestData = {
        user_id: parseInt(data.user_id, 10),
        product_id: parseInt(data.product_id, 10),
        quantity: parseInt(data.quantity || 1, 10)
    }
    
    // 处理规格信息：如果有 specifications，直接使用
    if (data.specifications && typeof data.specifications === 'object') {
        // 只传递选中的规格（过滤掉空值）
        const validSpecs = {}
        Object.keys(data.specifications).forEach(key => {
            const value = data.specifications[key]
            if (value !== null && value !== undefined && value !== '') {
                validSpecs[key] = value
            }
        })
        
        // 只有当有有效规格时才添加 specifications 字段
        if (Object.keys(validSpecs).length > 0) {
            requestData.specifications = validSpecs
        }
    }
    
    // 验证整数转换是否成功
    if (isNaN(requestData.user_id)) {
        return Promise.reject(new Error('用户ID必须是有效的整数'))
    }
    if (isNaN(requestData.product_id)) {
        return Promise.reject(new Error('商品ID必须是有效的整数'))
    }
    if (isNaN(requestData.quantity) || requestData.quantity < 1) {
        return Promise.reject(new Error('数量必须是大于0的整数'))
    }
    
    return request.post('/cart/decrease', requestData)
}

/**
 * 删除购物车商品
 * @param {Number} userId 用户ID
 * @param {Number} productId 商品ID
 * @returns {Promise}
 */
export const deleteCartItem = (userId, productId) => {
    return request.delete(`/cart/${userId}/${productId}`)
}

/**
 * 批量删除购物车商品（兼容旧版本）
 * @param {Array} ids 购物车记录ID列表
 * @returns {Promise}
 * @deprecated 请使用 deleteCartItem
 */
export const deleteCartItems = (ids) => {
    return request.post('/cart/delete', { ids })
}

/**
 * 清空购物车
 * @returns {Promise}
 */
export const clearCart = () => {
    return request.delete('/cart/clear')
}

/**
 * 获取购物车数量
 * @returns {Promise}
 */
export const getCartCount = () => {
    return request.get('/cart/count')
}
