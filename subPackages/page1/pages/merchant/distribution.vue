<template>
	<view class="distribution-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">手动发放</text>
		</view>

		<!-- 发放按钮区域 -->
		<view class="distribution-buttons">
			<button class="distribute-btn subsidy-btn" @tap="handleDistributeSubsidy" :disabled="isDistributing">
				<text class="btn-icon">💰</text>
				<text class="btn-text">发放周补贴</text>
			</button>
			<button class="distribute-btn dividend-btn" @tap="handleDistributeDividend" :disabled="isDistributing">
				<text class="btn-icon">🎁</text>
				<text class="btn-text">发放联创分红</text>
			</button>
		</view>

		<!-- 说明信息 -->
		<view class="info-section">
			<view class="info-card">
				<text class="info-title">操作说明</text>
				<view class="info-content">
					<text class="info-item">• 发放周补贴：根据用户积分发放周补贴</text>
					<text class="info-item">• 发放联创分红：根据联创等级发放分红</text>
					<text class="info-item">• 请谨慎操作，避免重复发放</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { distributeSubsidy } from '../../api/subsidy.js'
import { distributeDividend } from '../../api/unilevel.js'

// 发放状态
const isDistributing = ref(false)

/**
 * 手动发放周补贴
 */
const handleDistributeSubsidy = () => {
	uni.showModal({
		title: '确认发放',
		content: '确定要手动发放周补贴吗？此操作将根据用户积分发放补贴。',
		success: async (res) => {
			if (res.confirm) {
				isDistributing.value = true
				try {
					uni.showLoading({ title: '发放中...', mask: true })
					const result = await distributeSubsidy()
					uni.hideLoading()
					
					if (result && (result.success !== false && result.ok !== false)) {
						uni.showToast({
							title: '周补贴发放成功',
							icon: 'success',
							duration: 2000
						})
					} else {
						const errorMsg = result?.message || result?.msg || '发放失败'
						uni.showToast({
							title: errorMsg,
							icon: 'none',
							duration: 3000
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('[手动发放] 发放周补贴失败:', error)
					const errorMsg = error.message || error.msg || error.detail || '发放失败，请重试'
					uni.showToast({
						title: errorMsg,
						icon: 'none',
						duration: 3000
					})
				} finally {
					isDistributing.value = false
				}
			}
		}
	})
}

/**
 * 手动发放联创星级分红
 */
const handleDistributeDividend = () => {
	uni.showModal({
		title: '确认发放',
		content: '确定要手动发放联创星级分红吗？此操作将根据联创等级发放分红。',
		success: async (res) => {
			if (res.confirm) {
				isDistributing.value = true
				try {
					uni.showLoading({ title: '发放中...', mask: true })
					const result = await distributeDividend()
					uni.hideLoading()
					
					if (result && (result.success !== false && result.ok !== false)) {
						uni.showToast({
							title: '联创分红发放成功',
							icon: 'success',
							duration: 2000
						})
					} else {
						const errorMsg = result?.message || result?.msg || '发放失败'
						uni.showToast({
							title: errorMsg,
							icon: 'none',
							duration: 3000
						})
					}
				} catch (error) {
					uni.hideLoading()
					console.error('[手动发放] 发放联创分红失败:', error)
					const errorMsg = error.message || error.msg || error.detail || '发放失败，请重试'
					uni.showToast({
						title: errorMsg,
						icon: 'none',
						duration: 3000
					})
				} finally {
					isDistributing.value = false
				}
			}
		}
	})
}
</script>

<style scoped>
.distribution-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 40rpx 30rpx;
}

.page-header {
	margin-bottom: 40rpx;
}

.page-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.distribution-buttons {
	display: flex;
	gap: 20rpx;
	margin-bottom: 40rpx;
}

.distribute-btn {
	flex: 1;
	height: 200rpx;
	border-radius: 20rpx;
	border: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
	font-size: 28rpx;
	font-weight: 600;
	transition: all 0.3s;
	box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
}

.distribute-btn:disabled {
	opacity: 0.6;
}

.distribute-btn:active:not(:disabled) {
	transform: scale(0.98);
}

.subsidy-btn {
	background: linear-gradient(135deg, #ff9800, #ff6b35);
	color: white;
}

.subsidy-btn:active:not(:disabled) {
	box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.4);
}

.dividend-btn {
	background: linear-gradient(135deg, #9c27b0, #7b1fa2);
	color: white;
}

.dividend-btn:active:not(:disabled) {
	box-shadow: 0 4rpx 12rpx rgba(156, 39, 176, 0.4);
}

.btn-icon {
	font-size: 60rpx;
	line-height: 1;
}

.btn-text {
	font-size: 28rpx;
	line-height: 1;
	font-weight: 600;
}

.info-section {
	margin-top: 40rpx;
}

.info-card {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.info-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 20rpx;
	display: block;
}

.info-content {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.info-item {
	font-size: 24rpx;
	color: #666;
	line-height: 1.6;
}
</style>

