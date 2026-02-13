<template>
	<view class="donate-page">
		<!-- 捐赠雨点页面暂时不显示，原内容已注释
		<view class="info-card">
			<view class="info-header">
				<text class="info-icon">💝</text>
				<text class="info-title">捐赠雨点到公益基金</text>
			</view>
			<view class="info-content">
				<text class="info-text">• 点数与资金1:1兑换</text>
				<text class="info-text">• 同时记录用户点数减少和公益基金增加的流水</text>
			</view>
		</view>
		<view class="balance-card">
			<view class="balance-label">当前剩余雨点</view>
			<view class="balance-amount">
				<text class="amount-value">{{ formatPoints(currentPoints) }}</text>
				<text class="amount-unit">点</text>
			</view>
		</view>
		<view class="input-card">
			<view class="input-label">捐赠金额</view>
			<view class="input-wrapper">
				<input 
					class="amount-input" 
					type="digit" 
					v-model="donateAmount" 
					placeholder="请输入捐赠金额"
					@input="handleAmountInput"
				/>
				<text class="input-unit">点</text>
			</view>
			<view class="quick-amounts">
				<view 
					class="quick-btn" 
					v-for="amount in quickAmounts" 
					:key="amount"
					@tap="setQuickAmount(amount)"
				>
					{{ amount }}点
				</view>
			</view>
		</view>
		<view class="donate-btn-wrapper">
			<button 
				class="donate-btn" 
				:class="{ disabled: !canDonate }"
				:disabled="!canDonate || donating"
				@tap="handleDonate"
			>
				{{ donating ? '捐赠中...' : '确认捐赠' }}
			</button>
		</view>
		-->
		<view class="donate-placeholder">
			<text class="placeholder-text">功能暂未开放</text>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { donatePoints } from '@/api/charity.js'
import { getPointsSummary } from '@/api/points.js'

// 当前剩余雨点
const currentPoints = ref(0)

// 捐赠金额
const donateAmount = ref('')

// 是否正在捐赠
const donating = ref(false)

// 快速金额选项
const quickAmounts = ref([10, 50, 100, 200, 500])

/**
 * 格式化点数
 */
const formatPoints = (val) => {
	return Number(val || 0).toFixed(4)
}

/**
 * 是否可以捐赠
 */
const canDonate = computed(() => {
	const amount = Number(donateAmount.value)
	return amount > 0 && amount <= currentPoints.value
})

/**
 * 处理金额输入
 */
const handleAmountInput = (e) => {
	const value = e.detail.value
	// 只允许数字和小数点
	const numValue = value.replace(/[^\d.]/g, '')
	// 限制小数点后4位
	const parts = numValue.split('.')
	if (parts.length > 2) {
		donateAmount.value = parts[0] + '.' + parts.slice(1).join('')
	} else if (parts.length === 2 && parts[1].length > 4) {
		donateAmount.value = parts[0] + '.' + parts[1].substring(0, 4)
	} else {
		donateAmount.value = numValue
	}
}

/**
 * 设置快速金额
 */
const setQuickAmount = (amount) => {
	if (amount <= currentPoints.value) {
		donateAmount.value = String(amount)
	} else {
		uni.showToast({
			title: '金额不能超过剩余雨点',
			icon: 'none'
		})
	}
}

/**
 * 加载当前雨点余额
 */
const loadCurrentPoints = async () => {
	try {
		// 获取用户ID
		const userInfo = uni.getStorageSync('userInfo') || {}
		console.log('[捐赠页面] 从本地存储读取的用户信息:', userInfo)
		
		// 优先使用 id，然后 user_id（与团队页面保持一致）
		const userId = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		
		console.log('[捐赠页面] 提取的用户ID:', userId, {
			id: userInfo.id,
			user_id: userInfo.user_id,
			userId: userInfo.userId,
			uid: userInfo.uid
		})
		
		if (!userId) {
			console.error('[捐赠页面] 用户ID不存在，用户信息:', userInfo)
			uni.showToast({
				title: '用户ID不存在，请重新登录',
				icon: 'none',
				duration: 2000
			})
			currentPoints.value = 0
			return
		}

		const res = await getPointsSummary(userId)
		console.log('[捐赠页面] 雨点余额API响应:', res)
		
		// 处理响应数据，兼容不同的响应格式
		const summary = res.data || res || {}
		console.log('[捐赠页面] 解析后的汇总数据:', summary)
		
		// 优先使用 remaining_points（剩余雨点），这是用户可用的雨点数
		if (summary.remaining_points !== undefined) {
			currentPoints.value = parseFloat(summary.remaining_points || 0)
			console.log('[捐赠页面] 使用 remaining_points:', currentPoints.value)
		} else if (summary.true_total_points !== undefined) {
			// 兼容可能的字段名
			currentPoints.value = parseFloat(summary.true_total_points || 0)
			console.log('[捐赠页面] 使用 true_total_points:', currentPoints.value)
		} else if (summary.total_points !== undefined) {
			currentPoints.value = parseFloat(summary.total_points || 0)
			console.log('[捐赠页面] 使用 total_points:', currentPoints.value)
		} else {
			currentPoints.value = 0
			console.warn('[捐赠页面] 未找到雨点余额字段，使用默认值0')
		}
		
		console.log('[捐赠页面] 最终雨点余额:', currentPoints.value)
	} catch (error) {
		console.error('[捐赠页面] 加载雨点余额失败:', error)
		currentPoints.value = 0
		uni.showToast({
			title: error.message || '加载失败',
			icon: 'none'
		})
	}
}

/**
 * 处理捐赠
 */
const handleDonate = async () => {
	if (!canDonate.value) {
		uni.showToast({
			title: '请输入有效的捐赠金额',
			icon: 'none'
		})
		return
	}

	const amount = Number(donateAmount.value)
	if (amount <= 0) {
		uni.showToast({
			title: '捐赠金额必须大于0',
			icon: 'none'
		})
		return
	}

	if (amount > currentPoints.value) {
		uni.showToast({
			title: '捐赠金额不能超过剩余雨点',
			icon: 'none'
		})
		return
	}

	// 确认对话框
	uni.showModal({
		title: '确认捐赠',
		content: `确定要捐赠 ${formatPoints(amount)} 点雨点到公益基金吗？`,
		confirmText: '确认',
		confirmColor: '#3d6bff',
		cancelText: '取消',
		success: async (res) => {
			if (res.confirm) {
				await performDonate(amount)
			}
		}
	})
}

/**
 * 执行捐赠
 */
const performDonate = async (amount) => {
	try {
		donating.value = true
		
		const userInfo = uni.getStorageSync('userInfo') || {}
		// 优先使用 id，然后 user_id（与团队页面保持一致）
		const userId = userInfo.id || userInfo.user_id || userInfo.userId || userInfo.uid
		
		console.log('[捐赠页面] 执行捐赠 - 用户ID:', userId, {
			id: userInfo.id,
			user_id: userInfo.user_id,
			userId: userInfo.userId,
			uid: userInfo.uid
		})
		
		if (!userId) {
			console.error('[捐赠页面] 执行捐赠 - 用户ID不存在，用户信息:', userInfo)
			throw new Error('用户ID不存在，请重新登录')
		}

		console.log('[捐赠页面] 开始捐赠:', { userId, amount })
		
		const res = await donatePoints(userId, amount)
		console.log('[捐赠页面] 捐赠成功:', res)
		
		uni.showToast({
			title: '捐赠成功',
			icon: 'success',
			duration: 2000
		})

		// 清空输入
		donateAmount.value = ''
		
		// 刷新余额
		await loadCurrentPoints()
		
	} catch (error) {
		console.error('[捐赠页面] 捐赠失败:', error)
		uni.showToast({
			title: error.message || '捐赠失败，请重试',
			icon: 'none',
			duration: 2000
		})
	} finally {
		donating.value = false
	}
}

onLoad(async () => {
	await loadCurrentPoints()
})
</script>

<style scoped>
.donate-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
	padding-bottom: 40rpx;
}

/* 暂时不显示时的占位 */
.donate-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	padding: 40rpx;
}
.placeholder-text {
	font-size: 30rpx;
	color: #999;
}

/* 顶部说明卡片 */
.info-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	margin: 30rpx;
	padding: 40rpx;
	border-radius: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
}

.info-header {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.info-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.info-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #ffffff;
}

.info-content {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.info-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1.6;
}

/* 余额卡片 */
.balance-card {
	background: #ffffff;
	margin: 30rpx;
	padding: 40rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	text-align: center;
}

.balance-label {
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 20rpx;
}

.balance-amount {
	display: flex;
	align-items: baseline;
	justify-content: center;
	gap: 10rpx;
}

.amount-value {
	font-size: 64rpx;
	font-weight: bold;
	color: #3d6bff;
}

.amount-unit {
	font-size: 32rpx;
	color: #999999;
}

/* 输入卡片 */
.input-card {
	background: #ffffff;
	margin: 30rpx;
	padding: 40rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.input-label {
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 20rpx;
	font-weight: 500;
}

.input-wrapper {
	display: flex;
	align-items: center;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	padding: 0 30rpx;
	margin-bottom: 30rpx;
	background: #f8f9fa;
}

.amount-input {
	flex: 1;
	height: 88rpx;
	font-size: 32rpx;
	color: #333333;
}

.input-unit {
	font-size: 28rpx;
	color: #999999;
	margin-left: 10rpx;
}

.quick-amounts {
	display: flex;
	gap: 20rpx;
	flex-wrap: wrap;
}

.quick-btn {
	padding: 16rpx 32rpx;
	background: #f0f2f5;
	border-radius: 8rpx;
	font-size: 26rpx;
	color: #333333;
	border: 2rpx solid transparent;
}

.quick-btn:active {
	background: #e5e7eb;
	border-color: #3d6bff;
}

/* 捐赠按钮 */
.donate-btn-wrapper {
	padding: 0 30rpx;
	margin: 40rpx 0;
}

.donate-btn {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 48rpx;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
}

.donate-btn.disabled {
	background: #cccccc;
	box-shadow: none;
}

.donate-btn:not(.disabled):active {
	opacity: 0.8;
}

</style>

