<template>
	<view class="store-list-page">
		<scroll-view 
			class="store-scroll" 
			scroll-y 
			@scrolltolower="loadMore"
			:lower-threshold="100"
		>
			<!-- 店铺列表 -->
			<view class="store-list">
				<view 
					v-for="store in storeList" 
					:key="store.store_id || store.id" 
					class="store-item"
					@tap="viewStoreDetail(store)"
				>
					<!-- 店铺LOGO -->
					<view class="store-logo-wrapper">
						<image 
							v-if="store.store_logo_url" 
							:src="store.store_logo_url" 
							class="store-logo" 
							mode="aspectFill"
							@error="handleLogoError(store)"
						/>
						<view v-else class="store-logo-placeholder">
							<text class="iconfont icon-neirongguanli" style="font-size: 40rpx; color: #999;"></text>
						</view>
					</view>
					
					<!-- 店铺信息 -->
					<view class="store-info">
						<view class="store-name">{{ store.store_name || '未命名店铺' }}</view>
						<view class="store-description" v-if="store.store_description">
							{{ store.store_description }}
						</view>
						<view class="store-meta" v-if="store.user_name">
							<text class="meta-item">店主：{{ store.user_name }}</text>
						</view>
						<view class="store-meta">
							<text class="meta-item" v-if="store.contact_name">联系人：{{ store.contact_name }}</text>
							<text class="meta-item" v-if="store.contact_phone">电话：{{ store.contact_phone }}</text>
						</view>
						<view class="store-meta" v-if="store.store_address">
							<text class="meta-item">地址：{{ store.store_address }}</text>
						</view>
						<view class="store-time" v-if="store.created_at">
							创建时间：{{ formatTime(store.created_at) }}
						</view>
					</view>
				</view>
			</view>
			
			<!-- 加载状态 -->
			<view class="load-status">
				<view v-if="loading" class="loading-text">加载中...</view>
				<view v-else-if="!hasMore && storeList.length > 0" class="no-more-text">没有更多店铺了</view>
				<view v-else-if="storeList.length === 0 && !loading" class="empty-text">暂无店铺数据</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getStoreList, previewStoreLogo } from '@/api/store.js'
import config from '@/utils/config.js'

const storeList = ref([])
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const loading = ref(false)

/**
 * 加载店铺列表
 */
const loadStores = async (append = false) => {
	if (loading.value) return
	
	try {
		loading.value = true
		
		if (!append) {
			uni.showLoading({ title: '加载中...' })
		}
		
		const res = await getStoreList(page.value, pageSize.value)
		console.log('[店铺列表] API响应:', res)
		
		// 解析响应数据 - 支持多种格式
		let stores = []
		if (res.items && Array.isArray(res.items)) {
			// 格式: { total, items: [...] }
			stores = res.items
		} else if (res.data && Array.isArray(res.data)) {
			stores = res.data
		} else if (res.data?.items && Array.isArray(res.data.items)) {
			stores = res.data.items
		} else if (res.data?.data && Array.isArray(res.data.data)) {
			stores = res.data.data
		} else if (res.data?.list && Array.isArray(res.data.list)) {
			stores = res.data.list
		} else if (Array.isArray(res.list)) {
			stores = res.list
		}
		
		console.log('[店铺列表] 解析出的店铺数量:', stores.length)
		
		// 统一字段名：将 id 转换为 store_id（如果存在）
		stores = stores.map(store => {
			if (store.id && !store.store_id) {
				store.store_id = store.id
			}
			return store
		})
		
		// 处理店铺LOGO URL
		stores = stores.map(store => {
			if (store.store_logo_image_id) {
				store.store_logo_url = previewStoreLogo(store.store_logo_image_id)
			} else if (store.store_logo_url && !store.store_logo_url.startsWith('http://') && !store.store_logo_url.startsWith('https://')) {
				// 如果是相对路径，添加baseURL
				if (store.store_logo_url.startsWith('/')) {
					const baseURL = (config.default || config).baseURL || ''
					store.store_logo_url = baseURL + store.store_logo_url
				}
			}
			return store
		})
		
		if (append) {
			storeList.value = [...storeList.value, ...stores]
		} else {
			storeList.value = stores
		}
		
		// 判断是否还有更多数据
		// 如果返回的数据少于pageSize，说明没有更多了
		// 或者检查total字段
		if (stores.length < pageSize.value) {
			hasMore.value = false
		} else if (res.total !== undefined) {
			// 如果有total字段，可以根据total和当前已加载数量判断
			const loadedCount = append ? storeList.value.length + stores.length : stores.length
			hasMore.value = loadedCount < res.total
		}
		
		uni.hideLoading()
		loading.value = false
	} catch (error) {
		loading.value = false
		uni.hideLoading()
		console.error('[店铺列表] 加载失败', error)
		uni.showToast({ 
			title: error.message || '加载失败', 
			icon: 'none',
			duration: 2000
		})
	}
}

/**
 * 加载更多
 */
const loadMore = () => {
	if (!hasMore.value || loading.value) return
	
	page.value++
	loadStores(true)
}

/**
 * 处理LOGO加载错误
 */
const handleLogoError = (store) => {
	console.error('[店铺列表] LOGO加载失败:', store.store_logo_image_id)
	// 可以尝试其他URL或显示默认图片
	if (store.store_logo_image_id) {
		const baseURL = (config.default || config).baseURL || ''
		// 尝试直接访问文件URL
		if (store.store_logo_image_id.includes('.png') || store.store_logo_image_id.includes('.jpg') || store.store_logo_image_id.includes('.jpeg')) {
			store.store_logo_url = `${baseURL}/api/store/logo/${store.store_logo_image_id}`
		}
	}
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
	if (!timeStr) return '-'
	try {
		const date = new Date(timeStr)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
	} catch (e) {
		return timeStr
	}
}

/**
 * 查看店铺详情
 */
const viewStoreDetail = (store) => {
	// 可以跳转到店铺详情页面，或者显示店铺信息
	uni.showModal({
		title: store.store_name || '店铺信息',
		content: `联系人：${store.contact_name || '-'}\n电话：${store.contact_phone || '-'}\n地址：${store.store_address || '-'}`,
		showCancel: false
	})
}

onMounted(() => {
	loadStores()
})

onShow(() => {
	// 每次显示时刷新第一页
	page.value = 1
	hasMore.value = true
	loadStores()
})
</script>

<style scoped>
/* 引入 iconfont 样式 */
@import "@/static/999/iconfont.css";

.store-list-page {
	height: 100vh;
	background: #f5f5f5;
}

.store-scroll {
	height: 100%;
}

.store-list {
	padding: 20rpx;
}

.store-item {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
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

.store-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.store-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 12rpx;
}

.store-description {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.store-meta {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 8rpx;
	display: flex;
	flex-wrap: wrap;
}

.meta-item {
	margin-right: 24rpx;
}

.store-time {
	font-size: 22rpx;
	color: #ccc;
	margin-top: 8rpx;
}

.load-status {
	padding: 40rpx;
	text-align: center;
}

.loading-text,
.no-more-text,
.empty-text {
	font-size: 26rpx;
	color: #999;
}
</style>
