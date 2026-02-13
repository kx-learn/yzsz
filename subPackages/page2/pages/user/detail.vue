<template>
	<view class="detail-page">
		<!-- 用户头部信息 -->
		<view class="user-header">
			<view class="avatar-wrapper">
				<image :src="userInfo.avatar_path || userInfo.avatar || '/static/logo.png'" mode="aspectFill" class="avatar" />
			</view>
			<text class="user-name">{{ userInfo.name || userInfo.nickname || '未设置昵称' }}</text>
			<view class="level-badge">
				<text class="level-icon">{{ getLevelIcon(userInfo.member_level || 0) }}</text>
				<text class="level-text">{{ getLevelText(userInfo.member_level || 0) }}</text>
			</view>
			<text class="user-id">ID: {{ userInfo.id || userInfo.user_id || userInfo.uid || '-' }}</text>
		</view>

		<!-- 基础信息 -->
		<view class="info-card">
			<view class="card-title">基础信息</view>
			<view class="info-item">
				<text class="info-label">加入时间</text>
				<text class="info-value">{{ formatDate(userInfo.created_at) || '-' }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">会员等级</text>
				<text class="info-value">{{ getLevelText(userInfo.member_level || 0) }}</text>
			</view>
			<view class="info-item">
				<text class="info-label">推荐人</text>
				<text class="info-value">{{ referrerName || '-' }}</text>
			</view>
		</view>

		<!-- 贡献数据 -->
		<view class="info-card">
			<view class="card-title">贡献数据</view>
			<view class="contribution-row">
				<view class="contribution-item">
					<text class="contribution-value">¥{{ totalContribution.toFixed(2) }}</text>
					<text class="contribution-label">累计贡献</text>
				</view>
				<view class="contribution-item">
					<text class="contribution-value">{{ orderCount }}</text>
					<text class="contribution-label">订单数量</text>
				</view>
				<view class="contribution-item">
					<text class="contribution-value">{{ teamTotalCount }}</text>
					<text class="contribution-label">团队人数</text>
				</view>
			</view>
		</view>

		<!-- 团队信息 -->
		<view class="info-card">
			<view class="card-title">团队信息</view>
			<view class="info-item">
				<text class="info-label">直推人数</text>
				<text class="info-value">{{ directCount }}人</text>
			</view>
			<view class="info-item">
				<text class="info-label">团队总人数</text>
				<text class="info-value">{{ teamTotalCount }}人</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getUserInfo, getReferDirect, getReferTeam } from '@/api/user.js'
import { getOrderList } from '@/api/order.js'
import { getLevelIcon, getLevelText } from '@/utils/level.js'

const userInfo = ref({
	id: '',
	avatar_path: '',
	name: '',
	member_level: 0,
	created_at: '',
	referrer_name: ''
})

const referrerName = ref('-')
const totalContribution = ref(0)
const orderCount = ref(0)
const directCount = ref(0)
const teamTotalCount = ref(0)

/**
 * 格式化日期
 */
const formatDate = (dateStr) => {
	if (!dateStr) return '-'
	try {
		const date = new Date(dateStr)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}`
	} catch (error) {
		return dateStr
	}
}

/**
 * 加载用户详情
 */
const loadUserDetail = async (mobile) => {
	try {
		uni.showLoading({ title: '加载中...' })
		
		// 获取用户详情
		const userRes = await getUserInfo(mobile)
		const userData = userRes.data || userRes
		console.log('[用户详情] 用户信息:', userData)
		
		userInfo.value = {
			...userInfo.value,
			...userData,
			id: userData.id || userData.user_id || userData.uid || userInfo.value.id,
			member_level: userData.member_level || userData.level || 0,
			created_at: userData.created_at || userData.createdAt || userData.join_time || '',
			name: userData.name || userData.nickname || userInfo.value.name
		}
		
		// 获取推荐人信息
		if (userData.referrer_name) {
			referrerName.value = userData.referrer_name
		} else if (userData.referrer) {
			referrerName.value = userData.referrer.name || userData.referrer.nickname || userData.referrer.mobile || '-'
		}
		
		// 获取订单列表（用于统计订单数量和累计贡献）
		const userId = userInfo.value.id || userInfo.value.user_id || userInfo.value.uid
		if (userId) {
			try {
				const orderRes = await getOrderList({ userId: userId, status: 'all' })
				const orders = orderRes.data?.rows || orderRes.data || orderRes.rows || orderRes || []
				
				orderCount.value = Array.isArray(orders) ? orders.length : 0
				
				// 计算累计贡献（所有订单的实际支付金额之和）
				if (Array.isArray(orders)) {
					totalContribution.value = orders.reduce((sum, order) => {
						const amount = parseFloat(order.actual_amount || order.actualAmount || order.total_amount || order.totalAmount || 0)
						return sum + (isNaN(amount) ? 0 : amount)
					}, 0)
				}
				console.log('[用户详情] 订单统计:', { orderCount: orderCount.value, totalContribution: totalContribution.value })
			} catch (orderError) {
				console.error('[用户详情] 获取订单失败:', orderError)
			}
		}
		
		// 获取直推人数
		try {
			const directRes = await getReferDirect({ mobile, page: 1, size: 1 })
			const directData = directRes.data || directRes
			directCount.value = directData.total || 0
			console.log('[用户详情] 直推人数:', directCount.value)
		} catch (directError) {
			console.error('[用户详情] 获取直推人数失败:', directError)
		}
		
		// 获取团队总人数
		try {
			const teamRes = await getReferTeam({ mobile, max_layer: 6 })
			const teamData = teamRes.data || teamRes
			
			// 递归统计团队人数
			const countTeamMembers = (members) => {
				if (!Array.isArray(members)) return 0
				let count = 0
				members.forEach(member => {
					count++
					if (member.children && Array.isArray(member.children)) {
						count += countTeamMembers(member.children)
					}
				})
				return count
			}
			
			if (Array.isArray(teamData)) {
				teamTotalCount.value = countTeamMembers(teamData)
			} else if (teamData.total) {
				teamTotalCount.value = teamData.total
			}
			console.log('[用户详情] 团队总人数:', teamTotalCount.value)
		} catch (teamError) {
			console.error('[用户详情] 获取团队人数失败:', teamError)
		}
		
		uni.hideLoading()
	} catch (error) {
		console.error('[用户详情] 加载失败:', error)
		uni.hideLoading()
		uni.showToast({ title: '加载失败', icon: 'none' })
	}
}

onLoad(async (options) => {
	// 优先使用传入的 mobile，否则从本地存储获取
	let mobile = options.mobile
	if (!mobile) {
		const storedUserInfo = uni.getStorageSync('userInfo') || {}
		mobile = storedUserInfo.mobile || storedUserInfo.phone
	}
	
	if (!mobile) {
		uni.showToast({ title: '缺少用户手机号', icon: 'none' })
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
		return
	}
	
	await loadUserDetail(mobile)
})

onMounted(() => {
	// 如果 onLoad 中没有加载，尝试从本地存储加载
	if (!userInfo.value.mobile) {
		const storedUserInfo = uni.getStorageSync('userInfo') || {}
		if (storedUserInfo.mobile || storedUserInfo.phone) {
			loadUserDetail(storedUserInfo.mobile || storedUserInfo.phone)
		}
	}
})
</script>

<style scoped>
.detail-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

/* 用户头部 */
.user-header {
	background: linear-gradient(135deg, #9b7ef8 0%, #6b4fd8 100%);
	padding: 60rpx 40rpx 80rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.avatar-wrapper {
	width: 160rpx;
	height: 160rpx;
	border-radius: 50%;
	background: #4ade80;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.avatar {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.user-name {
	font-size: 36rpx;
	font-weight: 600;
	color: #fff;
}

.level-badge {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 24rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10rpx);
}

.level-icon {
	font-size: 28rpx;
}

.level-text {
	font-size: 24rpx;
	color: #fff;
	font-weight: 500;
}

.user-id {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
}

/* 信息卡片 */
.info-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin: 24rpx 32rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 24rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: #666;
}

.info-value {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

/* 贡献数据 */
.contribution-row {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
}

.contribution-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 16rpx;
	background: #f8f9fa;
	border-radius: 16rpx;
}

.contribution-value {
	font-size: 32rpx;
	font-weight: 600;
	color: #3d6bff;
	margin-bottom: 8rpx;
}

.contribution-label {
	font-size: 24rpx;
	color: #999;
}
</style>


