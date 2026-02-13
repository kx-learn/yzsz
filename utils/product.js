/**
 * 商品数据管理工具
 * 统一管理所有商品数据,确保各页面数据一致性
 */

import { getProductList } from '@/api/product.js'

/**
 * 初始化商品数据
 * 在App启动时调用,从API获取商品数据
 */
export const initProducts = async () => {
    const existingProducts = uni.getStorageSync('allProducts') || []

    // 如果已有商品数据,不重复初始化
    if (existingProducts.length > 0) {
        console.log('商品数据已存在,跳过初始化')
        return
    }

    console.log('从API加载商品数据...')
    
    // 从API获取商品数据，不再使用硬编码数据
    try {
        const res = await getProductList({ page: 1, pageSize: 100 })
        if (res && res.data && res.data.length > 0) {
            uni.setStorageSync('allProducts', res.data)
            console.log(`商品数据加载完成,共 ${res.data.length} 个商品`)
        } else {
            console.warn('API未返回商品数据')
            uni.setStorageSync('allProducts', [])
        }
    } catch (error) {
        // 静默处理错误，避免阻止应用启动
        console.warn('加载商品数据失败（不影响应用启动）:', error.message || error)
        // 设置空数组，避免后续代码报错
        uni.setStorageSync('allProducts', [])
        // 不抛出错误，让应用正常启动
    }
}

/**
 * 获取所有商品
 */
export const getAllProducts = () => {
    return uni.getStorageSync('allProducts') || []
}

/**
 * 根据ID获取商品
 */
export const getProductById = (id) => {
    const products = getAllProducts()
    const product = products.find(p => p.id == id)

    if (!product) {
        console.warn(`商品ID ${id} 不存在`)
        return null
    }

    return formatProduct(product)
}

/**
 * 获取会员商品列表
 */
export const getVipProducts = (limit = 10) => {
    const products = getAllProducts()
    return products
        .filter(p => p.isVip && p.status === 'on_sale')
        .slice(0, limit)
        .map(p => formatProduct(p))
}

/**
 * 获取普通商品列表
 */
export const getNormalProducts = (limit = 10) => {
    const products = getAllProducts()
    return products
        .filter(p => !p.isVip && p.status === 'on_sale')
        .slice(0, limit)
        .map(p => formatProduct(p))
}

/**
 * 格式化商品数据
 * 确保所有字段都存在且格式正确
 */
export const formatProduct = (product) => {
    if (!product) return null

    return {
        id: product.id,
        name: product.name || '未命名商品',
        price: Number(product.price) || 0,
        originPrice: product.originPrice || product.price * 1.5,
        image: product.image || product.images?.[0] || '/static/logo.png',
        images: product.images || [product.image || '/static/logo.png'],
        description: product.description || '',
        isVip: Boolean(product.isVip),
        status: product.status || 'on_sale',
        sales: product.sales || 0,
        stock: product.stock || 999,
        category: product.category || (product.isVip ? 'vip' : 'normal'),
        levelUp: product.levelUp || false,
        maxPointsDeduction: product.maxPointsDeduction || 0,
        productType: product.productType || (product.isVip ? 'vip' : 'normal')
    }
}

/**
 * 更新商品数据
 */
export const updateProduct = (id, updates) => {
    const products = getAllProducts()
    const index = products.findIndex(p => p.id == id)

    if (index === -1) {
        console.warn(`商品ID ${id} 不存在`)
        return false
    }

    products[index] = {
        ...products[index],
        ...updates
    }

    uni.setStorageSync('allProducts', products)
    console.log(`商品ID ${id} 更新成功`)
    return true
}

/**
 * 添加商品
 */
export const addProduct = (product) => {
    const products = getAllProducts()

    // 检查ID是否已存在
    if (products.some(p => p.id === product.id)) {
        console.warn(`商品ID ${product.id} 已存在`)
        return false
    }

    products.push(formatProduct(product))
    uni.setStorageSync('allProducts', products)
    console.log(`商品ID ${product.id} 添加成功`)
    return true
}

/**
 * 删除商品
 */
export const deleteProduct = (id) => {
    const products = getAllProducts()
    const filteredProducts = products.filter(p => p.id != id)

    if (filteredProducts.length === products.length) {
        console.warn(`商品ID ${id} 不存在`)
        return false
    }

    uni.setStorageSync('allProducts', filteredProducts)
    console.log(`商品ID ${id} 删除成功`)
    return true
}

/**
 * 搜索商品
 */
export const searchProducts = (keyword) => {
    if (!keyword) return []

    const products = getAllProducts()
    const lowerKeyword = keyword.toLowerCase()

    return products
        .filter(p => {
            return p.name.toLowerCase().includes(lowerKeyword) ||
                p.description?.toLowerCase().includes(lowerKeyword)
        })
        .map(p => formatProduct(p))
}

/**
 * 按分类获取商品
 */
export const getProductsByCategory = (category) => {
    const products = getAllProducts()
    return products
        .filter(p => p.category === category && p.status === 'on_sale')
        .map(p => formatProduct(p))
}

/**
 * 获取热销商品
 */
export const getHotProducts = (limit = 10) => {
    const products = getAllProducts()
    return products
        .filter(p => p.status === 'on_sale')
        .sort((a, b) => (b.sales || 0) - (a.sales || 0))
        .slice(0, limit)
        .map(p => formatProduct(p))
}
