<template>
	<view class="store-detail-page">
		<scroll-view class="store-scroll" scroll-y>
			<!-- 店铺LOGO和基本信息 -->
			<view class="store-header">
				<view class="store-logo-wrapper">
					<image 
						v-if="storeInfo.store_logo_url" 
						:src="storeInfo.store_logo_url" 
						class="store-logo" 
						mode="aspectFill"
						@error="handleLogoError"
					/>
					<view v-else class="store-logo-placeholder">
						<text class="iconfont icon-dianpu" style="font-size: 60rpx; color: #999;"></text>
					</view>
				</view>
				<view class="store-basic-info">
					<text class="store-name">{{ storeInfo.store_name || '未命名店铺' }}</text>
					<text v-if="storeInfo.store_description" class="store-description">{{ storeInfo.store_description }}</text>
				</view>
			</view>

			<!-- 店铺详细信息 -->
			<view class="store-info-card">
				<view class="info-section">
					<view class="section-title">店铺信息</view>
					
					<view v-if="storeInfo.contact_name" class="info-item">
						<text class="info-label">联系人：</text>
						<text class="info-value">{{ storeInfo.contact_name }}</text>
					</view>
					
					<view v-if="storeInfo.contact_phone" class="info-item">
						<text class="info-label">联系电话：</text>
						<text class="info-value" @tap="makePhoneCall(storeInfo.contact_phone)">{{ storeInfo.contact_phone }}</text>
					</view>
					
					<view v-if="storeInfo.contact_email" class="info-item">
						<text class="info-label">联系邮箱：</text>
						<text class="info-value">{{ storeInfo.contact_email }}</text>
					</view>
					
					<view v-if="storeInfo.store_address" class="info-item">
						<text class="info-label">店铺地址：</text>
						<text class="info-value">{{ storeInfo.store_address }}</text>
					</view>
					
					<view v-if="storeInfo.business_hours" class="info-item">
						<text class="info-label">营业时间：</text>
						<text class="info-value">{{ storeInfo.business_hours }}</text>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-if="!loading && !storeInfo.store_id" class="empty-state">
				<text class="empty-icon iconfont icon-dianpu"></text>
				<text class="empty-text">该店铺暂未设置店铺信息</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getStoreInfo, previewStoreLogo } from '@/api/store.js'
import config from '@/utils/config.js'

const storeInfo = ref({
	store_id: null,
	store_name: '',
	store_description: '',
	store_logo_url: '',
	store_logo_image_id: '',
	contact_name: '',
	contact_phone: '',
	contact_email: '',
	store_address: '',
	business_hours: ''
})

const loading = ref(false)
const userId = ref(null)

onLoad((options) => {
	if (options.user_id) {
		userId.value = Number(options.user_id)
		loadStoreInfo()
	} else {
		uni.showToast({ title: '参数错误', icon: 'none' })
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	}
})

/**
 * 加载店铺信息
 */
const loadStoreInfo = async () => {
	if (!userId.value) {
		return
	}
	
	loading.value = true
	try {
		const res = await getStoreInfo(userId.value)
		console.log('[店铺详情] API响应:', res)
		
		// 处理不同的响应格式
		let info = null
		if (res.data) {
			if (typeof res.data === 'object') {
				info = res.data
			} else if (typeof res.data === 'string') {
				try {
					info = JSON.parse(res.data)
				} catch (e) {
					console.warn('[店铺详情] 解析data字符串失败:', e)
				}
			}
		}
		
		// 如果data中没有，尝试根对象
		if (!info && res.store_id) {
			info = res
		}
		
		if (info && info.store_id) {
			// 处理LOGO URL（与店铺设置一致，优先使用 preview 接口）
			let logoUrl = ''
			if (info.store_logo_image_id) {
				logoUrl = previewStoreLogo(info.store_logo_image_id)
			} else if (info.store_logo_url) {
				logoUrl = info.store_logo_url
				if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
					logoUrl = logoUrl.startsWith('/') ? `${config.baseURL}${logoUrl}` : `${config.baseURL}/${logoUrl}`
				}
			}
			
			storeInfo.value = {
				store_id: info.store_id,
				store_name: info.store_name || '',
				store_description: info.store_description || '',
				store_logo_url: logoUrl,
				store_logo_image_id: info.store_logo_image_id || '',
				contact_name: info.contact_name || '',
				contact_phone: info.contact_phone || '',
				contact_email: info.contact_email || '',
				store_address: info.store_address || '',
				business_hours: info.business_hours || ''
			}
		} else {
			console.log('[店铺详情] 店铺信息不存在')
		}
	} catch (error) {
		console.error('[店铺详情] 加载店铺信息失败', error)
		uni.showToast({ title: '加载店铺信息失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

/**
 * 处理LOGO加载错误，尝试备用URL
 */
const handleLogoError = () => {
	const imageId = storeInfo.value.store_logo_image_id
	if (!imageId) {
		storeInfo.value.store_logo_url = ''
		return
	}
	const baseURL = config.baseURL || ''
	// 若预览URL失败，尝试直接访问 /api/store/logo/{image_id}
	if (storeInfo.value.store_logo_url?.includes('/api/store/logo/preview/')) {
		const directUrl = imageId.includes('.') 
			? `${baseURL}/api/store/logo/${imageId}` 
			: `${baseURL}/api/store/logo/${imageId}.png`
		storeInfo.value.store_logo_url = directUrl
	} else {
		storeInfo.value.store_logo_url = ''
	}
}

/**
 * 拨打电话
 */
const makePhoneCall = (phone) => {
	if (!phone) return
	uni.makePhoneCall({
		phoneNumber: phone,
		fail: (err) => {
			console.error('[店铺详情] 拨打电话失败', err)
			uni.showToast({ title: '拨打电话失败', icon: 'none' })
		}
	})
}
</script>

<style scoped>
/* 引入 iconfont 样式 */
@import "@/static/999/iconfont.css";

.store-detail-page {
	min-height: 100vh;
	background: #f5f5f5;
}

.store-scroll {
	height: 100vh;
}

.store-header {
	background: #fff;
	padding: 40rpx;
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.store-logo-wrapper {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	overflow: hidden;
	background: #f5f5f5;
	flex-shrink: 0;
	margin-right: 24rpx;
}

.store-logo {
	width: 100%;
	height: 100%;
}

.store-logo-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f5f5;
}

.store-basic-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.store-name {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.store-description {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
}

.store-info-card {
	background: #fff;
	margin: 0 20rpx 20rpx;
	border-radius: 16rpx;
	padding: 32rpx;
}

.info-section {
	display: flex;
	flex-direction: column;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 24rpx;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid #eee;
}

.info-item {
	display: flex;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: #666;
	width: 160rpx;
	flex-shrink: 0;
}

.info-value {
	font-size: 28rpx;
	color: #333;
	flex: 1;
	word-break: break-all;
}

.info-value:active {
	color: #2d8cf0;
}

.loading-state,
.empty-state {
	padding: 80rpx 40rpx;
	text-align: center;
}

.loading-text,
.empty-text {
	font-size: 28rpx;
	color: #999;
}

.empty-icon {
	font-size: 80rpx;
	color: #ccc;
	display: block;
	margin-bottom: 20rpx;
}
</style>
