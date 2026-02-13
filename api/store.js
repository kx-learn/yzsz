/**
 * 店铺设置相关接口
 * 包括店铺信息创建、更新、查询、LOGO上传、设置状态查询等功能
 */

import request from '@/utils/request.js'
import config from '@/utils/config.js'

/**
 * 创建店铺信息
 * 支付进件成功后,创建店铺基础信息(名称、LOGO、联系人等)
 * @param {Object} data 店铺信息
 * @param {Number} data.user_id 用户ID
 * @param {String} data.store_name 店铺名称
 * @param {String} data.store_logo_image_id 店铺LOGO图片ID
 * @param {String} data.store_description 店铺描述
 * @param {String} data.contact_name 联系人姓名
 * @param {String} data.contact_phone 联系人电话
 * @param {String} data.contact_email 联系人邮箱
 * @param {String} data.business_hours 营业时间
 * @param {String} data.store_address 店铺地址
 * @returns {Promise}
 */
export const createStoreInfo = (data) => {
	return request.post('/api/store/info/create', data)
}

/**
 * 更新店铺信息
 * @param {Object} data 店铺信息
 * @param {Number} data.user_id 用户ID（必需，作为查询参数）
 * @param {Number} data.store_id 店铺ID（可选，如果提供会包含在请求体中）
 * @param {String} data.store_name 店铺名称
 * @param {String} data.store_logo_image_id 店铺LOGO图片ID
 * @param {String} data.store_description 店铺描述
 * @param {String} data.contact_name 联系人姓名
 * @param {String} data.contact_phone 联系人电话
 * @param {String} data.contact_email 联系人邮箱
 * @param {String} data.business_hours 营业时间
 * @param {String} data.store_address 店铺地址
 * @returns {Promise}
 */
export const updateStoreInfo = (data) => {
	// 从data中提取user_id作为查询参数
	const user_id = data.user_id
	if (!user_id) {
		return Promise.reject(new Error('user_id 是必需的参数'))
	}
	
	// 创建请求体，排除user_id（因为它是查询参数）
	const { user_id: _, ...body } = data
	
	// 将user_id作为查询参数添加到URL中
	const url = `/api/store/info/update?user_id=${user_id}`
	
	return request.put(url, body)
}

/**
 * 获取店铺信息
 * 查询当前用户的店铺详细信息
 * @param {Number} user_id 用户ID
 * @returns {Promise}
 */
export const getStoreInfo = (user_id) => {
	// request.get 的第二个参数直接是查询参数对象，不需要包装在 params 中
	return request.get('/api/store/info', { user_id })
}

/**
 * 获取店铺设置状态
 * 查询用户是否具备开店权限、是否已设置店铺信息
 * @param {Number} user_id 用户ID
 * @returns {Promise}
 */
export const getStoreSetupStatus = (user_id) => {
	// request.get 的第二个参数直接是查询参数对象，不需要包装在 params 中
	return request.get('/api/store/setup-status', { user_id })
}

/**
 * 上传店铺LOGO
 * @param {String} filePath 图片文件路径
 * @param {Number} user_id 用户ID
 * @returns {Promise}
 */
export const uploadStoreLogo = (filePath, user_id) => {
	return new Promise((resolve, reject) => {
		const baseURL = config.baseURL || ''
		// 获取用户ID，优先使用传入的参数，否则从存储中获取
		const userId = user_id || (() => {
			const userInfo = uni.getStorageSync('userInfo') || {}
			return userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		})()
		
		if (!userId) {
			reject(new Error('用户ID不能为空'))
			return
		}
		
		uni.uploadFile({
			url: `${baseURL}/api/store/logo/upload`,
			filePath: filePath,
			name: 'file',
			formData: {
				user_id: userId
			},
			header: {
				'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`,
				'accept': 'application/json'
			},
			success: (res) => {
		console.log('[上传LOGO] ========== 上传响应 ==========')
		console.log('[上传LOGO] 响应状态码:', res.statusCode)
		console.log('[上传LOGO] 响应数据:', res.data)
		console.log('[上传LOGO] 响应数据类型:', typeof res.data)
		console.log('[上传LOGO] 用户ID:', userId)
		console.log('[上传LOGO] 完整响应对象:', res)
				
				// 检查HTTP状态码
				if (res.statusCode === 200 || res.statusCode === 201) {
					try {
						// 尝试解析响应数据
						let data = res.data
						if (typeof res.data === 'string') {
							try {
								data = JSON.parse(res.data)
							} catch (parseError) {
								console.warn('[上传LOGO] JSON解析失败，使用原始字符串:', parseError)
								// 如果解析失败，可能是纯文本响应，直接使用
								data = { raw: res.data }
							}
						}
						
						console.log('[上传LOGO] 解析后的数据:', data)
						
						// 更宽松的成功判断：只要HTTP状态码是200/201，就认为成功
						// 检查是否有明确的错误信息
						if (data.code && data.code !== 0 && data.code !== 200) {
							// 有明确的错误码且不是成功码
							const errorMsg = data.message || data.msg || data.error || `上传失败(code: ${data.code})`
							console.error('[上传LOGO] 业务错误码:', data.code, errorMsg)
							reject(new Error(errorMsg))
						} else if (data.error || (data.message && data.message.includes('失败'))) {
							// 有明确的错误信息
							const errorMsg = data.message || data.msg || data.error || '上传失败'
							console.error('[上传LOGO] 业务错误:', errorMsg)
							reject(new Error(errorMsg))
						} else {
							// HTTP状态码是200/201，且没有明确的错误信息，认为成功
							console.log('[上传LOGO] 上传成功，返回数据:', data)
							resolve(data)
						}
					} catch (e) {
						console.error('[上传LOGO] 处理响应时出错:', e, '原始数据:', res.data)
						// 如果HTTP状态码是200/201，即使解析出错也认为可能成功
						if (res.statusCode === 200 || res.statusCode === 201) {
							console.log('[上传LOGO] HTTP状态码成功，返回原始数据')
							resolve({ data: res.data, raw: true })
						} else {
							reject(new Error('处理响应失败: ' + (e.message || e)))
						}
					}
				} else {
					// HTTP状态码不是200/201，说明请求失败
					let errorMsg = res.data
					try {
						const parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
						errorMsg = parsed.message || parsed.detail || parsed.error || parsed.msg || res.data
					} catch (e) {
						// 解析失败，使用原始数据
					}
					console.error('[上传LOGO] HTTP错误:', res.statusCode, errorMsg)
					reject(new Error(`上传失败[${res.statusCode}]: ${errorMsg}`))
				}
			},
			fail: (err) => {
				console.error('[上传LOGO] 上传失败:', err)
				reject(new Error(err.errMsg || err.message || '上传失败'))
			}
		})
	})
}

/**
 * 删除店铺LOGO
 * @param {Number} user_id 用户ID
 * @returns {Promise}
 */
export const deleteStoreLogo = (user_id) => {
	// 获取用户ID，优先使用传入的参数，否则从存储中获取
	const userId = user_id || (() => {
		const userInfo = uni.getStorageSync('userInfo') || {}
		return userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
	})()
	
	if (!userId) {
		return Promise.reject(new Error('用户ID不能为空'))
	}
	
	// 确保user_id是数字类型
	const numericUserId = Number(userId)
	if (!numericUserId || isNaN(numericUserId)) {
		return Promise.reject(new Error('用户ID格式错误'))
	}
	
	// 将user_id作为查询参数直接拼接到URL中（更可靠）
	const url = `/api/store/logo/delete?user_id=${numericUserId}`
	console.log('[删除LOGO] 请求URL:', url)
	
	return request.delete(url)
}

/**
 * 预览LOGO
 * @param {String} image_id 图片ID（包含扩展名，如：store_logo_350_xxx.jpg）
 * @returns {String} LOGO预览URL
 */
export const previewStoreLogo = (image_id) => {
	const baseURL = config.baseURL || ''
	// 预览接口需要完整的 image_id（包括扩展名），直接使用
	return `${baseURL}/api/store/logo/preview/${image_id}`
}

/**
 * 获取店铺列表（管理后台）
 * @param {Number} page 页码，默认1
 * @param {Number} page_size 每页条数，默认10，最大100
 * @returns {Promise}
 */
export const getStoreList = (page = 1, page_size = 10) => {
	return request.get('/api/store/admin/list', { 
		page: Math.max(1, page), 
		page_size: Math.min(100, Math.max(1, page_size)) 
	})
}
