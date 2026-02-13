<template>
	<view class="settings-page">
		<!-- 店铺LOGO -->
		<view class="logo-section">
			<view class="logo-wrapper" @tap="selectLogo">
				<image 
					v-if="storeInfo.store_logo_url" 
					:src="storeInfo.store_logo_url" 
					class="logo-image" 
					mode="aspectFill"
					@error="handleLogoError"
					@load="handleLogoLoad"
				/>
				<view v-else class="logo-placeholder">
					<text class="iconfont icon-xiangji" style="font-size: 60rpx; color: #999;"></text>
					<text class="logo-text">点击上传LOGO</text>
				</view>
				<view v-if="storeInfo.store_logo_url" class="logo-delete" @tap.stop="deleteLogo">
					<text class="iconfont icon-shanchu" style="font-size: 32rpx; color: #fff;"></text>
				</view>
			</view>
		</view>

		<!-- 店铺信息表单 -->
		<view class="form-section">
			<view class="form-item">
				<text class="form-label">店铺名称 *</text>
				<input 
					v-model="formData.store_name"
					class="form-input"
					placeholder="请输入店铺名称"
					maxlength="50"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">店铺描述</text>
				<textarea 
					v-model="formData.store_description"
					class="form-textarea"
					placeholder="请输入店铺描述"
					:maxlength="500"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">联系人姓名 *</text>
				<input 
					v-model="formData.contact_name"
					class="form-input"
					placeholder="请输入联系人姓名"
					maxlength="20"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">联系人电话 *</text>
				<input 
					v-model="formData.contact_phone"
					class="form-input"
					type="number"
					placeholder="请输入联系人电话"
					maxlength="20"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">联系人邮箱</text>
				<input 
					v-model="formData.contact_email"
					class="form-input"
					type="email"
					placeholder="请输入联系人邮箱"
					maxlength="100"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">营业时间</text>
				<input 
					v-model="formData.business_hours"
					class="form-input"
					placeholder="例如：周一至周五 9:00-18:00"
					maxlength="100"
				/>
			</view>

			<view class="form-item">
				<text class="form-label">店铺地址 *</text>
				<textarea 
					v-model="formData.store_address"
					class="form-textarea"
					placeholder="请输入店铺详细地址"
					:maxlength="200"
				/>
			</view>
		</view>

		<!-- 设置状态提示 -->
		<view v-if="setupStatus" class="status-section">
			<view class="status-item">
				<text class="status-label">开店权限</text>
				<text class="status-value" :class="{ success: setupStatus.has_store_permission }">
					{{ setupStatus.has_store_permission ? '已开通' : '未开通' }}
				</text>
			</view>
			<view class="status-item">
				<text class="status-label">支付账户</text>
				<text class="status-value" :class="{ success: setupStatus.has_payment_account }">
					{{ setupStatus.has_payment_account ? '已绑定' : '未绑定' }}
				</text>
			</view>
			<view class="status-item">
				<text class="status-label">店铺信息</text>
				<text class="status-value" :class="{ success: setupStatus.has_store_info }">
					{{ setupStatus.has_store_info ? '已设置' : '未设置' }}
				</text>
			</view>
		</view>

		<!-- 保存按钮 -->
		<view class="action-section">
			<button class="save-btn" @tap="saveStoreInfo" :disabled="saving">
				<text v-if="saving">保存中...</text>
				<text v-else>{{ storeInfo.store_id ? '更新店铺信息' : '创建店铺信息' }}</text>
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { 
	createStoreInfo, 
	updateStoreInfo, 
	getStoreInfo, 
	getStoreSetupStatus,
	uploadStoreLogo,
	deleteStoreLogo,
	previewStoreLogo
} from '@/api/store.js'
import { getUserInfo } from '@/api/user.js'
import config from '@/utils/config.js'

const formData = ref({
	store_name: '',
	store_description: '',
	contact_name: '',
	contact_phone: '',
	contact_email: '',
	business_hours: '',
	store_address: ''
})

const storeInfo = ref({
	store_id: null,
	store_logo_url: '',
	store_logo_image_id: ''
})

const setupStatus = ref(null)
const saving = ref(false)
const currentUserId = ref(null)

/**
 * 加载用户信息
 * 优先从本地存储获取 user_id（商家模式登录后已有），避免依赖 getUserInfo 接口（需要 mobile）
 */
const loadUserInfo = async () => {
	try {
		// 优先从本地存储获取（商家/用户登录后都会保存）
		const stored = uni.getStorageSync('userInfo') || {}
		currentUserId.value = stored.id || stored.user_id || stored.userId || stored.uid
		
		// 若本地没有，再尝试调用接口（需要 mobile，部分登录方式可能没有）
		if (!currentUserId.value) {
			const userInfo = await getUserInfo()
			const data = userInfo?.data || userInfo
			currentUserId.value = data?.id || data?.uid || data?.user_id || userInfo?.id || userInfo?.user_id
		}
		
		if (currentUserId.value) {
			await loadStoreData()
		} else {
			console.warn('[店铺设置] 无法获取用户ID，请确保已登录')
			uni.showToast({ title: '请先登录', icon: 'none' })
		}
	} catch (error) {
		console.error('[店铺设置] 加载用户信息失败', error)
		// 失败时仍尝试用本地存储的 user_id 加载店铺数据
		const stored = uni.getStorageSync('userInfo') || {}
		currentUserId.value = stored.id || stored.user_id || stored.userId || stored.uid
		if (currentUserId.value) {
			await loadStoreData()
		} else {
			uni.showToast({ title: '加载失败，请重试', icon: 'none' })
		}
	}
}

/**
 * 处理店铺信息数据，填充到表单和storeInfo
 */
const processStoreInfo = (info) => {
	if (!info || !info.store_id) {
		return false
	}
	
	// 处理LOGO URL，优先使用 store_logo_image_id 生成预览URL
	let logoUrl = ''
	if (info.store_logo_image_id) {
		// 优先使用 store_logo_image_id 生成预览URL（预览接口需要完整的image_id）
		logoUrl = previewStoreLogo(info.store_logo_image_id)
		console.log('[店铺设置] 使用store_logo_image_id生成预览URL:', {
			imageId: info.store_logo_image_id,
			previewUrl: logoUrl
		})
	} else if (info.store_logo_url) {
		// 如果没有 image_id，使用 store_logo_url
		logoUrl = info.store_logo_url
		if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
			// 如果是相对路径，添加baseURL
			if (logoUrl.startsWith('/')) {
				const baseURL = (config.default || config).baseURL || ''
				logoUrl = baseURL + logoUrl
			}
		}
		console.log('[店铺设置] 使用store_logo_url:', logoUrl)
	}
	
	storeInfo.value = {
		store_id: info.store_id,
		store_logo_url: logoUrl,
		store_logo_image_id: info.store_logo_image_id || ''
	}
	
	// 填充表单
	formData.value = {
		store_name: info.store_name || '',
		store_description: info.store_description || '',
		contact_name: info.contact_name || '',
		contact_phone: info.contact_phone || '',
		contact_email: info.contact_email || '',
		business_hours: info.business_hours || '',
		store_address: info.store_address || ''
	}
	
	return true
}

/**
 * 加载店铺数据
 */
const loadStoreData = async () => {
	if (!currentUserId.value) {
		// 尝试从存储中获取用户ID
		const userInfo = uni.getStorageSync('userInfo') || {}
		currentUserId.value = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		if (!currentUserId.value) {
			console.log('[店铺设置] 用户ID不存在，无法加载数据')
			return
		}
	}
	
	// 确保user_id是数字类型
	const userId = Number(currentUserId.value)
	if (!userId || isNaN(userId)) {
		console.error('[店铺设置] 用户ID无效:', currentUserId.value)
		uni.showToast({ title: '用户ID无效', icon: 'none' })
		return
	}
	
	console.log('[店铺设置] 开始加载店铺数据，用户ID:', userId, '类型:', typeof userId)
	
	// 确保加载状态一定会被关闭（含安全超时兜底）
	let loadingShown = false
	const safeHideLoading = () => {
		if (loadingShown) {
			uni.hideLoading()
			loadingShown = false
		}
	}
	// 安全兜底：8秒后强制关闭加载（防止接口挂死导致一直转圈）
	const safetyTimer = setTimeout(safeHideLoading, 8000)
	
	try {
		uni.showLoading({ title: '加载中...' })
		loadingShown = true
		
		// 添加超时保护，最多等待6秒（比兜底早结束，便于正常走 finally）
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('加载超时')), 6000)
		})
		
		// 优先尝试直接获取店铺信息（更可靠）
		let loaded = false
		try {
			console.log('[店铺设置] 调用getStoreInfo，参数:', userId)
			const infoRes = await Promise.race([getStoreInfo(userId), timeoutPromise])
			console.log('[店铺设置] getStoreInfo 响应:', infoRes)
			
			// 尝试多种响应格式
			let info = null
			if (infoRes && infoRes.data) {
				if (typeof infoRes.data === 'object') {
					info = infoRes.data
				} else if (typeof infoRes.data === 'string') {
					try {
						info = JSON.parse(infoRes.data)
					} catch (e) {
						console.warn('[店铺设置] 解析data字符串失败:', e)
					}
				}
			}
			
			// 如果data中没有，尝试根对象
			if (!info && infoRes) {
				info = infoRes.store_id ? infoRes : null
			}
			
			if (info && info.store_id) {
				loaded = processStoreInfo(info)
				console.log('[店铺设置] 从getStoreInfo加载成功')
			}
		} catch (e) {
			console.log('[店铺设置] getStoreInfo失败，尝试getStoreSetupStatus:', e.message)
		}
		
		// 如果直接获取失败，尝试从设置状态中获取
		if (!loaded) {
			try {
				console.log('[店铺设置] 调用getStoreSetupStatus，参数:', userId)
				const statusRes = await Promise.race([getStoreSetupStatus(userId), timeoutPromise])
				console.log('[店铺设置] getStoreSetupStatus 响应:', statusRes)
				
				if (statusRes) {
					setupStatus.value = statusRes.data || statusRes
					
					// 如果已有店铺信息，加载详细信息
					if (setupStatus.value?.has_store_info) {
						let info = setupStatus.value.store_info
						
						// 如果store_info不存在，但has_store_info为true，再次尝试getStoreInfo
						if (!info) {
							try {
								console.log('[店铺设置] store_info不存在，再次调用getStoreInfo，参数:', userId)
								const infoRes = await Promise.race([getStoreInfo(userId), timeoutPromise])
								if (infoRes) {
									const resData = infoRes.data || infoRes
									info = resData.store_id ? resData : null
									console.log('[店铺设置] 二次getStoreInfo结果:', info)
								}
							} catch (e2) {
								console.warn('[店铺设置] 二次getStoreInfo失败:', e2)
							}
						}
						
						if (info && info.store_id) {
							loaded = processStoreInfo(info)
							console.log('[店铺设置] 从getStoreSetupStatus加载成功')
						}
					}
				}
			} catch (e) {
				console.error('[店铺设置] getStoreSetupStatus失败:', e)
			}
		}
		
		// 如果还是没有加载到，清空表单（准备创建新店铺）
		if (!loaded) {
			console.log('[店铺设置] 店铺信息不存在，将创建新店铺')
			storeInfo.value = {
				store_id: null,
				store_logo_url: '',
				store_logo_image_id: ''
			}
			formData.value = {
				store_name: '',
				store_description: '',
				contact_name: '',
				contact_phone: '',
				contact_email: '',
				business_hours: '',
				store_address: ''
			}
		}
	} catch (error) {
		console.error('[店铺设置] 加载店铺数据失败', error)
		// 如果超时或其他错误，也清空表单允许用户创建新店铺
		if (!storeInfo.value || !storeInfo.value.store_id) {
			storeInfo.value = {
				store_id: null,
				store_logo_url: '',
				store_logo_image_id: ''
			}
			formData.value = {
				store_name: '',
				store_description: '',
				contact_name: '',
				contact_phone: '',
				contact_email: '',
				business_hours: '',
				store_address: ''
			}
		}
	} finally {
		clearTimeout(safetyTimer)
		safeHideLoading()
	}
}

/**
 * LOGO图片加载成功
 */
const handleLogoLoad = (e) => {
	console.log('[店铺设置] LOGO图片加载成功:', storeInfo.value.store_logo_url)
}

/**
 * LOGO图片加载失败
 */
const handleLogoError = (e) => {
	console.error('[店铺设置] LOGO图片加载失败:', {
		url: storeInfo.value.store_logo_url,
		imageId: storeInfo.value.store_logo_image_id,
		error: e
	})
	
	// 若当前是临时路径失败，尝试用服务器URL（可能域名已配置）
	const curUrl = storeInfo.value.store_logo_url || ''
	if (storeInfo.value._serverLogoUrl && curUrl !== storeInfo.value._serverLogoUrl) {
		storeInfo.value.store_logo_url = storeInfo.value._serverLogoUrl
		storeInfo.value = { ...storeInfo.value }
		return
	}
	
	// 如果当前使用的是预览URL但失败了，尝试其他方式
	if (storeInfo.value.store_logo_image_id) {
		const imageId = storeInfo.value.store_logo_image_id
		const baseURL = (config.default || config).baseURL || ''
		
		// 如果当前使用的是预览URL，尝试直接访问文件URL
		if (storeInfo.value.store_logo_url.includes('/api/store/logo/preview/')) {
			// 预览URL失败，尝试直接访问文件（如果imageId包含扩展名）
			if (imageId.includes('.png') || imageId.includes('.jpg') || imageId.includes('.jpeg')) {
				const directUrl = `${baseURL}/api/store/logo/${imageId}`
				console.log('[店铺设置] 预览URL失败，尝试直接访问URL:', directUrl)
				storeInfo.value.store_logo_url = directUrl
			} else {
				// 没有扩展名，尝试添加扩展名
				const directUrl = `${baseURL}/api/store/logo/${imageId}.png`
				console.log('[店铺设置] 预览URL失败，尝试添加扩展名:', directUrl)
				storeInfo.value.store_logo_url = directUrl
			}
		} else if (!storeInfo.value.store_logo_url.includes('/api/store/logo/')) {
			// 如果还没使用任何LOGO URL，尝试预览URL
			const previewUrl = previewStoreLogo(imageId)
			console.log('[店铺设置] 尝试使用预览URL:', previewUrl)
			storeInfo.value.store_logo_url = previewUrl
		} else {
			// 已经尝试过多种方式，还是失败
			uni.showToast({ 
				title: '图片加载失败，请检查网络或重新上传', 
				icon: 'none',
				duration: 2000
			})
		}
	} else {
		uni.showToast({ 
			title: '图片加载失败，请重新上传', 
			icon: 'none',
			duration: 2000
		})
	}
}

/**
 * 选择LOGO
 */
const selectLogo = () => {
	uni.chooseImage({
		count: 1,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const tempFilePath = res.tempFilePaths[0]
			try {
				uni.showLoading({ title: '上传中...' })
				
				// 确保有用户ID
				if (!currentUserId.value) {
					const userInfo = uni.getStorageSync('userInfo') || {}
					currentUserId.value = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
				}
				
				console.log('[店铺设置] 开始上传LOGO，用户ID:', currentUserId.value)
				const uploadRes = await uploadStoreLogo(tempFilePath, currentUserId.value)
				console.log('[店铺设置] 上传响应完整数据:', JSON.stringify(uploadRes, null, 2))
				
				// 处理不同的响应格式
				let imageId = null
				let imageUrl = null
				const data = uploadRes.data || uploadRes
				const dataObj = typeof data === 'object' ? data : {}
				
				// 尝试多种可能的响应格式
				imageId = dataObj.image_id || dataObj.file_id || dataObj.id || dataObj.imageId ||
					uploadRes.image_id || uploadRes.file_id || uploadRes.id || uploadRes.imageId
				imageUrl = dataObj.url || dataObj.image_url || dataObj.imageUrl || dataObj.path || dataObj.file_path ||
					uploadRes.url || uploadRes.image_url || uploadRes.imageUrl
				
				if (typeof data === 'string') imageId = data
				if (!imageId && uploadRes.result) {
					imageId = uploadRes.result.image_id || uploadRes.result.file_id || uploadRes.result.id
					imageUrl = imageUrl || uploadRes.result.url || uploadRes.result.image_url
				}
				
				console.log('[店铺设置] 解析结果 - imageId:', imageId, 'imageUrl:', imageUrl)
				
				if (imageId) {
					// 保存 image_id 供保存店铺信息时使用
					storeInfo.value.store_logo_image_id = imageId
					
					// 优先用临时文件路径立即显示（微信小程序中网络图需配置域名，临时路径可立即显示）
					const baseURL = config.baseURL || ''
					let serverUrl = ''
					if (imageUrl) {
						serverUrl = imageUrl.startsWith('http') ? imageUrl : (imageUrl.startsWith('/') ? baseURL + imageUrl : baseURL + '/' + imageUrl)
					} else {
						serverUrl = previewStoreLogo(imageId)
					}
					
					// 立即用临时路径显示，避免网络图域名未配置导致不显示
					storeInfo.value.store_logo_url = tempFilePath
					// 保存服务器URL，供保存后重新加载或下次进入时使用
					storeInfo.value._serverLogoUrl = serverUrl
					
					// 强制触发视图更新
					storeInfo.value = { ...storeInfo.value }
					
					console.log('[店铺设置] 已用临时路径显示LOGO，服务器URL:', serverUrl)
					
					uni.hideLoading()
					uni.showToast({ title: '上传成功', icon: 'success' })
				} else {
					uni.hideLoading()
					console.error('[店铺设置] 上传响应中未找到图片ID，完整响应:', uploadRes)
					// 即使没有找到imageId，也显示响应内容，帮助调试
					uni.showModal({
						title: '上传响应',
						content: `响应数据: ${JSON.stringify(uploadRes).substring(0, 200)}...`,
						showCancel: false
					})
					uni.showToast({ title: '上传成功，但未获取到图片ID', icon: 'none', duration: 3000 })
				}
			} catch (error) {
				uni.hideLoading()
				console.error('[店铺设置] 上传LOGO失败', error)
				console.error('[店铺设置] 错误详情:', {
					message: error.message,
					stack: error.stack,
					error: error
				})
				uni.showToast({ 
					title: error.message || '上传失败，请检查网络连接', 
					icon: 'none',
					duration: 3000
				})
			}
		},
		fail: (err) => {
			console.error('[店铺设置] 选择图片失败', err)
		}
	})
}

/**
 * 删除LOGO
 */
const deleteLogo = async () => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除店铺LOGO吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					uni.showLoading({ title: '删除中...' })
					
					// 确保有用户ID
					if (!currentUserId.value) {
						const userInfo = uni.getStorageSync('userInfo') || {}
						currentUserId.value = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
					}
					
					await deleteStoreLogo(currentUserId.value)
					storeInfo.value.store_logo_url = ''
					storeInfo.value.store_logo_image_id = ''
					
					uni.hideLoading()
					uni.showToast({ title: '删除成功', icon: 'success' })
					
					// 如果已有店铺信息，更新店铺信息（移除logo_id）
					if (storeInfo.value.store_id) {
						try {
							const data = {
								...formData.value,
								user_id: currentUserId.value,
								store_id: storeInfo.value.store_id,
								store_logo_image_id: '' // 清空logo
							}
							await updateStoreInfo(data)
							console.log('[店铺设置] LOGO删除后已更新店铺信息')
						} catch (e) {
							console.warn('[店铺设置] 更新店铺信息失败（不影响删除）:', e)
						}
					}
				} catch (error) {
					uni.hideLoading()
					console.error('[店铺设置] 删除LOGO失败', error)
					uni.showToast({ title: error.message || '删除失败', icon: 'none' })
				}
			}
		}
	})
}

/**
 * 保存店铺信息
 */
const saveStoreInfo = async () => {
	// 验证必填字段
	if (!formData.value.store_name || !formData.value.store_name.trim()) {
		uni.showToast({ title: '请输入店铺名称', icon: 'none' })
		return
	}
	if (!formData.value.contact_name || !formData.value.contact_name.trim()) {
		uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
		return
	}
	if (!formData.value.contact_phone || !formData.value.contact_phone.trim()) {
		uni.showToast({ title: '请输入联系人电话', icon: 'none' })
		return
	}
	if (!formData.value.store_address || !formData.value.store_address.trim()) {
		uni.showToast({ title: '请输入店铺地址', icon: 'none' })
		return
	}
	
	if (!currentUserId.value) {
		// 尝试从存储中获取
		const userInfo = uni.getStorageSync('userInfo') || {}
		currentUserId.value = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		if (!currentUserId.value) {
			uni.showToast({ title: '用户信息错误', icon: 'none' })
			return
		}
	}
	
	try {
		saving.value = true
		uni.showLoading({ title: '保存中...' })
		
		const data = {
			...formData.value,
			user_id: currentUserId.value,
			store_logo_image_id: storeInfo.value.store_logo_image_id || ''
		}
		
		let res
		let isCreate = !storeInfo.value.store_id
		
		if (storeInfo.value.store_id) {
			// 更新
			// 注意：store_id 不需要在请求体中，user_id 会作为查询参数传递
			// 但为了兼容性，如果API需要store_id，可以保留
			res = await updateStoreInfo(data)
		} else {
			// 创建
			res = await createStoreInfo(data)
		}
		
		console.log('[店铺设置] 保存响应:', res)
		
		// 如果是创建，尝试从响应中获取store_id
		if (isCreate && res) {
			const resData = res.data || res
			if (resData && resData.store_id) {
				storeInfo.value.store_id = resData.store_id
				console.log('[店铺设置] 从响应中获取store_id:', resData.store_id)
			}
		}
		
		uni.hideLoading()
		uni.showToast({ title: '保存成功', icon: 'success' })
		
		// 延迟一下再重新加载数据，确保服务器已更新
		setTimeout(async () => {
			await loadStoreData()
		}, 500)
		
		saving.value = false
	} catch (error) {
		saving.value = false
		uni.hideLoading()
		console.error('[店铺设置] 保存失败', error)
		const errorMsg = error.message || error.detail || error.msg || '保存失败，请重试'
		uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
		
		// 即使保存失败，也尝试重新加载数据（可能已经保存了）
		console.log('[店铺设置] 保存失败，但尝试重新加载数据以确认状态')
		setTimeout(async () => {
			await loadStoreData()
		}, 1000)
	}
}

onMounted(() => {
	loadUserInfo()
})

onShow(() => {
	// 每次显示页面时都重新加载数据，确保数据是最新的
	if (currentUserId.value) {
		loadStoreData()
	} else {
		// 如果没有用户ID，尝试加载
		loadUserInfo()
	}
})
</script>

<style scoped>
/* 引入 iconfont 样式 */
@import "@/static/999/iconfont.css";

.settings-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

/* LOGO区域 */
.logo-section {
	background: white;
	padding: 40rpx;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: center;
}

.logo-wrapper {
	position: relative;
	width: 200rpx;
	height: 200rpx;
	border-radius: 20rpx;
	overflow: hidden;
	background: #f5f5f5;
	border: 2rpx dashed #ddd;
}

.logo-image {
	width: 100%;
	height: 100%;
}

.logo-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
}

.logo-text {
	font-size: 24rpx;
	color: #999;
}

.logo-delete {
	position: absolute;
	top: 10rpx;
	right: 10rpx;
	width: 50rpx;
	height: 50rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 表单区域 */
.form-section {
	background: white;
	padding: 30rpx 20rpx;
	margin-bottom: 20rpx;
}

.form-item {
	margin-bottom: 30rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	display: block;
	font-size: 26rpx;
	color: #333;
	margin-bottom: 12rpx;
	font-weight: 500;
}

.form-input {
	width: 100%;
	padding: 24rpx 16rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
	line-height: 1.5;
	height: auto;
	min-height: 80rpx;
	overflow-x: visible;
	overflow-y: visible;
	text-align: left;
}

.form-textarea {
	width: 100%;
	min-height: 150rpx;
	padding: 24rpx 16rpx;
	border: 2rpx solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
	line-height: 1.6;
	word-break: break-all;
	word-wrap: break-word;
	overflow-wrap: break-word;
	white-space: normal;
	overflow: visible;
	text-align: left;
}

/* 状态区域 */
.status-section {
	background: white;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.status-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.status-item:last-child {
	border-bottom: none;
}

.status-label {
	font-size: 28rpx;
	color: #666;
}

.status-value {
	font-size: 28rpx;
	color: #f44336;
	font-weight: 500;
}

.status-value.success {
	color: #4caf50;
}

/* 操作区域 */
.action-section {
	padding: 0 30rpx;
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #4caf50, #66bb6a);
	border-radius: 44rpx;
	color: white;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.3);
}

.save-btn:disabled {
	opacity: 0.6;
}
</style>
