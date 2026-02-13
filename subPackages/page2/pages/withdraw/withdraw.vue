<template>
	<view class="withdraw-page">
		<!-- 可提现金额 -->
		<view class="balance-card">
			<text class="balance-label">可提现金额（元）</text>
			<text class="balance-value">{{ balance }}</text>
		</view>

		<!-- 提现表单 -->
		<view class="withdraw-form">
			<view class="form-item">
				<text class="form-label">提现金额</text>
				<view class="input-wrapper">
					<text class="currency">¥</text>
					<input
						class="amount-input"
						type="digit"
						v-model="amount"
						placeholder="请输入提现金额（整数）"
						@input="calculateTax"
					/>
				</view>
				<text class="form-tip">提现金额必须为整数</text>
			</view>

			<view class="form-item">
				<text class="form-label">个人所得税（6%）</text>
				<view class="tax-display">
					<text class="tax-value">¥{{ tax }}</text>
				</view>
			</view>

			<view class="form-item">
				<text class="form-label">实际到账</text>
				<view class="actual-display">
					<text class="actual-value">¥{{ actualAmount }}</text>
				</view>
				<text class="form-tip">实际到账 = 提现金额 × 94%</text>
			</view>
		</view>

		<!-- 提现说明 -->
		<view class="notice-section">
			<view class="notice-title">提现说明</view>
			<view class="notice-list">
				<text class="notice-item">1. 提现金额必须为整数（1的倍数）</text>
				<text class="notice-item">2. 提现时将扣除6%的个人所得税</text>
				<text class="notice-item">3. 提现申请提交后，平台将在1-3个工作日内审核</text>
				<text class="notice-item">4. 审核通过后，资金将打款至您绑定的账户</text>
				<text class="notice-item">5. 每日提现次数不限，单笔最低提现金额为1元</text>
			</view>
		</view>

		<!-- 提现按钮 -->
		<view class="button-section">
			<button class="withdraw-btn" :class="{ disabled: !canWithdraw }" @tap="handleWithdraw" :disabled="!canWithdraw">
				提交申请
			</button>
		</view>

		<!-- 提现记录 -->
		<view class="record-section">
			<view class="record-header">
				<text class="record-title">提现记录</text>
			</view>
			<view class="record-list">
				<view class="record-item" v-for="item in recordList" :key="item.id">
					<view class="record-left">
						<text class="record-amount">¥{{ item.amount }}</text>
						<text class="record-time">{{ item.createTime }}</text>
					</view>
					<view class="record-right">
						<text class="record-status" :class="'status-' + item.status">
							{{ getStatusText(item.status) }}
						</text>
						<text class="record-actual">到账¥{{ item.actualAmount }}</text>
					</view>
				</view>
				<view class="empty-state" v-if="recordList.length === 0">
					<text class="empty-text">暂无提现记录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getFinanceAccount } from '../../api/finance.js'

const balance = ref(0)
const amount = ref('')
const tax = ref('0.00')
const actualAmount = ref('0.00')
const recordList = ref([])

const canWithdraw = computed(() => {
	const num = parseInt(amount.value)
	return num > 0 && num <= balance.value && num === parseFloat(amount.value)
})

/**
 * 计算税费和实际到账
 */
const calculateTax = () => {
	const num = parseFloat(amount.value) || 0
	const taxAmount = num * 0.06
	const actual = num * 0.94

	tax.value = taxAmount.toFixed(2)
	actualAmount.value = actual.toFixed(2)
}

/**
 * 加载余额
 */
const loadBalance = async () => {
	// 优先从本地存储读取余额（与用户中心和余额页面保持一致）
	const localBalance = uni.getStorageSync('userBalance')
	
	if (typeof localBalance === 'number') {
		balance.value = localBalance
		console.log('提现中心：使用本地余额', localBalance)
		return
	}
	
	try {
		const res = await getFinanceAccount()
		balance.value = res.data.balance || 0
		// 保存到本地存储
		uni.setStorageSync('userBalance', balance.value)
		console.log('提现中心：从接口加载余额', balance.value)
	} catch (error) {
		console.error('加载余额失败', error)
		balance.value = 0
	}
}

/**
 * 提交提现申请（已禁用）
 */
const handleWithdraw = async () => {
	uni.showToast({ title: '提现功能已暂停', icon: 'none' })
}

/**
 * 加载提现记录（已禁用）
 */
const loadRecordList = async () => {
	recordList.value = []
}

const getStatusText = (status) => {
	const texts = {
		pending: '审核中',
		success: '已到账',
		failed: '已拒绝'
	}
	return texts[status] || '未知'
}

onLoad(() => {
	loadBalance()
})

onShow(() => {
	// 每次显示页面时刷新余额
	loadBalance()
})
</script>

<style scoped>
.withdraw-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

/* 余额卡片 */
.balance-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 60rpx 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.balance-label {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
}

.balance-value {
	font-size: 72rpx;
	font-weight: bold;
	color: #fff;
}

/* 提现表单 */
.withdraw-form {
	background: #fff;
	margin: 30rpx;
	border-radius: 20rpx;
	padding: 40rpx 30rpx;
}

.form-item {
	margin-bottom: 40rpx;
}

.form-item:last-child {
	margin-bottom: 0;
}

.form-label {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 16rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	border: 2rpx solid #eee;
	border-radius: 12rpx;
	padding: 0 20rpx;
	height: 88rpx;
}

.currency {
	font-size: 32rpx;
	color: #333;
	margin-right: 12rpx;
}

.amount-input {
	flex: 1;
	font-size: 32rpx;
	color: #333;
}

.form-tip {
	font-size: 24rpx;
	color: #999;
	margin-top: 12rpx;
	display: block;
}

.tax-display,
.actual-display {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 24rpx 20rpx;
}

.tax-value,
.actual-value {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.actual-value {
	color: #ff5252;
}

/* 提现说明 */
.notice-section {
	background: #fff;
	margin: 0 30rpx 30rpx;
	border-radius: 20rpx;
	padding: 30rpx;
}

.notice-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

.notice-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.notice-item {
	font-size: 24rpx;
	color: #666;
	line-height: 1.6;
}

/* 提现按钮 */
.button-section {
	padding: 0 30rpx 30rpx;
}

.withdraw-btn {
	width: 100%;
	height: 88rpx;
	line-height: 88rpx;
	background: linear-gradient(135deg, #667eea, #764ba2);
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 44rpx;
	border: none;
}

.withdraw-btn.disabled {
	opacity: 0.5;
}

/* 提现记录 */
.record-section {
	background: #fff;
	margin: 0 30rpx;
	border-radius: 20rpx;
	padding: 30rpx;
}

.record-header {
	margin-bottom: 24rpx;
}

.record-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.record-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.record-item {
	display: flex;
	justify-content: space-between;
	padding: 24rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.record-left,
.record-right {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.record-right {
	align-items: flex-end;
}

.record-amount {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.record-time {
	font-size: 24rpx;
	color: #999;
}

.record-status {
	font-size: 24rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.status-pending {
	background: #fff3e0;
	color: #ff9800;
}

.status-success {
	background: #e8f5e9;
	color: #4caf50;
}

.status-failed {
	background: #ffebee;
	color: #f44336;
}

.record-actual {
	font-size: 24rpx;
	color: #666;
}

.empty-state {
	text-align: center;
	padding: 80rpx 0;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>
