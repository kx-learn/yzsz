<template>
	<view class="invite-page">
		<!-- 推荐码卡片 -->
		<view class="code-card">
			<view class="card-header">
				<text class="header-title">我的推荐码</text>
				<text class="header-desc">好友登录时填写此码，将自动成为我的直推</text>
			</view>
			<view class="code-display">
				<text class="code-text">{{ referralCode }}</text>
				<button class="copy-btn" @tap="copyCode">复制</button>
			</view>
			<!-- 二维码显示区域 -->
			<view class="qrcode-section">
				<text class="qrcode-title">扫码填写邀请码</text>
				<view class="qrcode-wrapper">
					<image 
						v-if="qrCodeUrl" 
						:src="qrCodeUrl" 
						mode="aspectFit"
						class="qrcode-image"
						@error="handleQrCodeError"
						@load="handleQrCodeLoad"
						lazy-load
					/>
					<view v-else class="qrcode-loading">
						<text class="loading-text">二维码加载中...</text>
					</view>
				</view>
				<view class="qrcode-actions">
					<button class="refresh-btn" @tap="refreshQRCode" :disabled="refreshing">
						{{ refreshing ? '刷新中...' : '刷新二维码' }}
					</button>
				</view>
				<text class="qrcode-desc">好友扫描此二维码可自动填写邀请码</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getOrCreateLocalReferralCode } from '@/utils/referral.js'
import { getReferralQR, refreshReferralQR } from '@/api/user.js'

const referralCode = ref('')
const qrCodeUrl = ref('')
const refreshing = ref(false)

/**
 * 加载推荐码（从用户信息中读取 referral_code）
 */
const loadReferralCode = async () => {
	try {
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userId = userInfo.id || userInfo.user_id || 'guest'
		
		// 优先使用后端返回的 referral_code
		if (userInfo.referral_code) {
			referralCode.value = userInfo.referral_code
			console.log('[推荐好友] 使用后端邀请码:', userInfo.referral_code)
		} else {
			// 如果后端没有返回，使用本地生成的
			const localCode = getOrCreateLocalReferralCode(userId)
			referralCode.value = localCode || 'INVITE123'
			console.log('[推荐好友] 使用本地邀请码:', referralCode.value)
		}
	} catch (error) {
		console.error('生成推荐码失败', error)
		referralCode.value = 'INVITE123'
	}
}

/**
 * 加载推荐二维码
 */
const loadQRCode = async () => {
	try {
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userId = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		
		if (!userId) {
			console.error('[推荐二维码] 用户ID不存在')
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		console.log('[推荐二维码] 开始获取二维码，user_id:', userId)
		const url = await getReferralQR(userId)
		
		// 验证 URL 是否有效
		if (!url || typeof url !== 'string' || url.trim() === '') {
			throw new Error('获取到的二维码URL无效或为空')
		}
		
		// 记录URL信息（用于调试）
		console.log('[推荐二维码] URL类型检查:', {
			isString: typeof url === 'string',
			length: url.length,
			startsWithHttps: url.startsWith('https://'),
			startsWithHttp: url.startsWith('http://'),
			startsWithData: url.startsWith('data:'),
			firstChars: url.substring(0, 50)
		})
		
		qrCodeUrl.value = url.trim()
		console.log('[推荐二维码] 获取成功:', url)
	} catch (error) {
		console.error('[推荐二维码] 获取失败:', error)
		console.error('[推荐二维码] 错误详情:', {
			message: error.message,
			code: error.code,
			statusCode: error.statusCode,
			detail: error.detail
		})
		
		// 根据错误类型显示不同的提示
		let errorMsg = '获取二维码失败'
		if (error.message) {
			errorMsg = error.message
		} else if (error.statusCode === 404) {
			errorMsg = '二维码接口不存在'
		} else if (error.statusCode === 401) {
			errorMsg = '请先登录'
		} else if (error.statusCode === 500) {
			errorMsg = '服务器错误，请稍后重试'
		}
		
		uni.showToast({
			title: errorMsg,
			icon: 'none',
			duration: 2000
		})
	}
}

/**
 * 刷新推荐二维码
 */
const refreshQRCode = async () => {
	if (refreshing.value) return
	
	try {
		refreshing.value = true
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userId = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		
		if (!userId) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			})
			return
		}
		
		console.log('[推荐二维码] 开始刷新二维码，user_id:', userId)
		const url = await refreshReferralQR(userId)
		qrCodeUrl.value = url
		console.log('[推荐二维码] 刷新成功:', url)
		uni.showToast({
			title: '二维码已刷新',
			icon: 'success'
		})
	} catch (error) {
		console.error('[推荐二维码] 刷新失败:', error)
		uni.showToast({
			title: error.message || '刷新二维码失败',
			icon: 'none'
		})
	} finally {
		refreshing.value = false
	}
}

/**
 * 二维码加载错误处理
 */
const handleQrCodeError = (e) => {
	console.error('[推荐二维码] 图片加载失败:', e)
	console.error('[推荐二维码] 当前URL:', qrCodeUrl.value)
	console.error('[推荐二维码] 错误详情:', {
		errMsg: e.errMsg || e.message || '未知错误',
		url: qrCodeUrl.value
	})
	
	// 检查 URL 是否有效
	if (!qrCodeUrl.value || qrCodeUrl.value.trim() === '') {
		uni.showToast({
			title: '二维码URL为空，请刷新',
			icon: 'none',
			duration: 2000
		})
		// 自动重试加载
		setTimeout(() => {
			loadQRCode()
		}, 1000)
		return
	}
	
	// 提示用户并自动重试刷新
	uni.showToast({
		title: '二维码加载失败，正在刷新...',
		icon: 'none',
		duration: 2000
	})
	
	// 自动重试刷新
	setTimeout(() => {
		refreshQRCode()
	}, 1500)
}

/**
 * 二维码加载成功处理
 */
const handleQrCodeLoad = () => {
	console.log('[推荐二维码] 图片加载成功')
}

/**
 * 复制推荐码
 */
const copyCode = () => {
	uni.setClipboardData({
		data: referralCode.value,
		success: () => {
			uni.showToast({ title: '推荐码已复制', icon: 'success' })
		}
	})
}

onLoad(() => {
	loadReferralCode()
	loadQRCode()
})
</script>

<style scoped>
.invite-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f0f4ff 0%, #e8f0ff 100%);
	padding: 60rpx 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

/* 背景装饰 */
.invite-page::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
	            radial-gradient(circle at 80% 70%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
	pointer-events: none;
}

/* 推荐码卡片 */
.code-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 32rpx;
	padding: 60rpx 50rpx;
	width: 100%;
	max-width: 680rpx;
	box-sizing: border-box;
	box-shadow: 0 20rpx 60rpx rgba(102, 126, 234, 0.3),
	            0 8rpx 24rpx rgba(118, 75, 162, 0.2);
	position: relative;
	overflow: hidden;
}

/* 卡片装饰 */
.code-card::before {
	content: '';
	position: absolute;
	top: -50%;
	right: -50%;
	width: 200%;
	height: 200%;
	background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
	pointer-events: none;
}

.card-header {
	margin-bottom: 50rpx;
	text-align: center;
	position: relative;
	z-index: 1;
}

.header-title {
	font-size: 42rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 20rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	letter-spacing: 2rpx;
}

.header-desc {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1.6;
	text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.code-display {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255, 255, 255, 0.25);
	backdrop-filter: blur(10rpx);
	border-radius: 20rpx;
	padding: 40rpx 36rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	position: relative;
	z-index: 1;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.code-text {
	font-size: 56rpx;
	font-weight: bold;
	color: #fff;
	letter-spacing: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	font-family: 'Courier New', monospace;
}

.copy-btn {
	background: #fff;
	color: #667eea;
	font-size: 28rpx;
	font-weight: 600;
	padding: 18rpx 40rpx;
	border-radius: 50rpx;
	border: none;
	height: auto;
	line-height: 1.5;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
}

.copy-btn:active {
	transform: scale(0.95);
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 二维码区域 */
.qrcode-section {
	margin-top: 50rpx;
	text-align: center;
	position: relative;
	z-index: 1;
}

.qrcode-title {
	font-size: 32rpx;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.95);
	display: block;
	margin-bottom: 30rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.qrcode-wrapper {
	display: flex;
	justify-content: center;
	align-items: center;
	background: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin: 0 auto;
	width: fit-content;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
	min-height: 300rpx;
}

.qrcode-image {
	width: 300rpx;
	height: 300rpx;
	border-radius: 10rpx;
}

.qrcode-loading {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 300rpx;
	height: 300rpx;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

.qrcode-actions {
	margin-top: 30rpx;
	display: flex;
	justify-content: center;
}

.refresh-btn {
	background: rgba(255, 255, 255, 0.25);
	backdrop-filter: blur(10rpx);
	color: #fff;
	font-size: 26rpx;
	font-weight: 600;
	padding: 16rpx 40rpx;
	border-radius: 50rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	height: auto;
	line-height: 1.5;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
}

.refresh-btn:active {
	transform: scale(0.95);
	box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.1);
}

.refresh-btn[disabled] {
	opacity: 0.6;
}

.qrcode-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.85);
	display: block;
	margin-top: 30rpx;
	line-height: 1.6;
}
</style>
