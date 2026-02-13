<template>
	<view class="reward-page">
		<!-- 总收益概览 -->
		<view class="total-section">
			<view class="total-card">
				<text class="total-label">累计收益（元）</text>
				<text class="total-value">{{ formatAmount(totalReward) }}</text>
			</view>
		</view>

		<!-- 奖励类型标签页 -->
		<view class="tabs-section">
			<scroll-view class="tabs-scroll" scroll-x>
				<view class="tabs-list">
					<view
						class="tab-item"
						:class="{ active: currentTab === item.value }"
						v-for="item in tabs"
						:key="item.value"
						@tap="switchTab(item.value)"
					>
						<text class="tab-text">{{ item.label }}</text>
						<view class="tab-line" v-if="currentTab === item.value"></view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 筛选栏 -->
		<view class="filter-section">
			<view class="filter-item" @tap="showDatePicker">
				<text class="filter-icon">📅</text>
				<text class="filter-text">{{ dateFilter || '选择日期' }}</text>
			</view>
			<view class="filter-item" @tap="showStatusFilter">
				<text class="filter-icon iconfont icon-sousuo"></text>
				<text class="filter-text">{{ statusFilter || '全部状态' }}</text>
			</view>
		</view>

		<!-- 奖励列表 -->
		<scroll-view 
			class="reward-scroll"
			scroll-y
			refresher-enabled
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="loadMore"
			:lower-threshold="100"
		>
		<view class="reward-list">
			<view class="reward-item" v-for="item in rewardList" :key="item.id">
				<view class="item-left">
					<view class="item-icon" :class="'type-' + item.type">
						<text v-if="getTypeIconClass(item.type)" class="iconfont" :class="getTypeIconClass(item.type)"></text>
						<text v-else>{{ getTypeIcon(item.type) }}</text>
					</view>
					<view class="item-info">
						<text class="item-title">{{ item.title }}</text>
						<text class="item-desc">{{ item.desc }}</text>
						<text class="item-time">{{ item.time }}</text>
					</view>
				</view>
				<view class="item-right">
					<text class="item-amount" :class="item.status === 'pending' ? 'pending' : ''">
						+¥{{ formatAmount(item.amount) }}
					</text>
					<text class="item-status" :class="'status-' + item.status">
						{{ getStatusText(item.status) }}
					</text>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="rewardList.length === 0">
				<text class="empty-icon iconfont icon-xiaoshoutongji"></text>
				<text class="empty-text">暂无奖励记录</text>
			</view>

			<!-- 加载中 -->
			<view v-if="loading && rewardList.length > 0" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>
			
			<!-- 已加载完 -->
			<view v-if="!hasMore && rewardList.length > 0" class="no-more">
				<text class="no-more-text">已显示全部</text>
			</view>
		</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getRewardList } from '../../api/reward.js'

const formatAmount = (val) => {
	return Number(val || 0).toFixed(4)
}

const tabs = [
	{ label: '全部', value: 'all' },
	{ label: '雨点奖励', value: 'rainpoint' },
	{ label: '周补贴', value: 'weekly' },
]

const currentTab = ref('all')
const totalReward = ref(0)
const dateFilter = ref('')
const statusFilter = ref('')
const rewardList = ref([])
const hasMore = ref(true)
const page = ref(1)
const loading = ref(false)
const refreshing = ref(false)

/**
 * 切换标签
 */
const switchTab = (tab) => {
	currentTab.value = tab
	page.value = 1
	rewardList.value = []
	loadRewardList()
}

/**
 * 加载奖励列表
 */
const loadRewardList = async (append = false) => {
	if (loading.value) return
	
	try {
		loading.value = true
		
		if (!append) {
			page.value = 1
			rewardList.value = []
		}
		
		const params = {
			type: currentTab.value === 'all' ? '' : currentTab.value,
			page: page.value,
			pageSize: 20
		}

		const res = await getRewardList(params)
		
		// 如果API返回错误或空数据，清空列表
		if (!res || !res.data) {
			if (page.value === 1) {
				rewardList.value = []
				totalReward.value = 0
			}
			hasMore.value = false
			return
		}
		
		// 处理不同的响应格式
		const list = res.data?.list || res.data || res.list || []
		const total = res.data?.total || res.total || 0
		
		// 如果列表为空，确保清空数据
		if (!Array.isArray(list) || list.length === 0) {
			if (page.value === 1) {
				rewardList.value = []
				totalReward.value = 0
			}
			hasMore.value = false
			return
		}
		
		// 映射数据格式
		const mappedList = list.map(item => ({
			id: item.id,
			title: item.title || item.user_name || item.name || '',
			desc: item.desc || item.description || item.product_name || '',
			time: item.time || item.created_at || item.create_time || '',
			amount: parseFloat(item.amount || item.reward_amount || 0),
			type: item.type || item.reward_type || 'team',
			status: item.status || 'pending'
		}))
		
		const hasMoreData = res.data?.hasMore !== undefined ? res.data.hasMore : (list.length >= 20)
		
		if (append) {
			rewardList.value = [...rewardList.value, ...mappedList]
		} else {
			rewardList.value = mappedList
			totalReward.value = total
		}

		hasMore.value = hasMoreData
		
		// 如果还有更多数据，页码加1，准备加载下一页
		if (hasMore.value) {
			page.value++
		}
	} catch (error) {
		console.error('加载奖励列表失败', error)
		// API失败时清空所有数据
		if (!append) {
			rewardList.value = []
			totalReward.value = 0
		}
		hasMore.value = false
	} finally {
		loading.value = false
		refreshing.value = false
	}
}

/**
 * 加载更多（下滑到底部触发）
 */
const loadMore = () => {
	if (!hasMore.value || loading.value) return
	loadRewardList(true)
}

/**
 * 下拉刷新（加载下一页）
 */
const onRefresh = () => {
	if (!hasMore.value || loading.value) {
		refreshing.value = false
		return
	}
	refreshing.value = true
	loadRewardList(true)
}

/**
 * 显示日期选择器
 */
const showDatePicker = () => {
	uni.showActionSheet({
		itemList: ['今天', '最近7天', '最近30天', '全部'],
		success: (res) => {
			const items = ['今天', '最近7天', '最近30天', '全部']
			dateFilter.value = items[res.tapIndex]
			page.value = 1
			rewardList.value = []
			loadRewardList()
		}
	})
}

/**
 * 显示状态筛选
 */
const showStatusFilter = () => {
	uni.showActionSheet({
		itemList: ['全部状态', '已到账', '待到账'],
		success: (res) => {
			const items = ['全部状态', '已到账', '待到账']
			statusFilter.value = items[res.tapIndex]
			page.value = 1
			rewardList.value = []
			loadRewardList()
		}
	})
}

/**
 * 获取类型图标
 */
const getTypeIcon = (type) => {
	// 已废弃，使用getTypeIconClass代替
	return ''
}

const getTypeIconClass = (type) => {
	const iconClasses = {
		rainpoint: 'icon-butie',
		promotion: 'icon-butie',  // 兼容旧数据
		team: 'icon-tuandui',      // 兼容旧数据
		weekly: 'icon-butie',
		director: 'icon-huangguan'
	}
	return iconClasses[type] || 'icon-butie'
}

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
	const texts = {
		completed: '已到账',
		pending: '待到账',
		failed: '失败'
	}
	return texts[status] || '未知'
}

onLoad(() => {
	loadRewardList()
})
</script>

<style scoped>
.reward-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

/* 总收益 */
.total-section {
	background: linear-gradient(135deg, #3d6bff, #6ca4ff);
	padding: 60rpx 30rpx 40rpx;
}

.total-card {
	background: rgba(255, 255, 255, 0.95);
	border-radius: 16rpx;
	padding: 50rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.total-label {
	font-size: 26rpx;
	color: #999;
}

.total-value {
	font-size: 64rpx;
	font-weight: bold;
	color: #3d6bff;
}

/* 标签页 */
.tabs-section {
	background: #fff;
	margin-top: -20rpx;
	position: relative;
	z-index: 10;
}

.tabs-scroll {
	white-space: nowrap;
}

.tabs-list {
	display: inline-flex;
	padding: 0 30rpx;
}

.tab-item {
	padding: 30rpx 24rpx;
	position: relative;
	display: inline-block;
}

.tab-text {
	font-size: 28rpx;
	color: #666;
	transition: all 0.3s;
}

.tab-item.active .tab-text {
	color: #3d6bff;
	font-weight: bold;
	font-size: 30rpx;
}

.tab-line {
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 40rpx;
	height: 6rpx;
	background: #3d6bff;
	border-radius: 3rpx;
}

/* 筛选栏 */
.filter-section {
	background: #fff;
	padding: 20rpx 30rpx;
	display: flex;
	gap: 20rpx;
	border-top: 1rpx solid #f5f5f5;
}

.filter-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 16rpx;
	background: #f8f9fa;
	border-radius: 8rpx;
}

.filter-icon {
	font-size: 24rpx;
}

.filter-text {
	font-size: 24rpx;
	color: #666;
}

/* 滚动容器 */
.reward-scroll {
	height: calc(100vh - 400rpx);
}

/* 奖励列表 */
.reward-list {
	padding: 20rpx 30rpx;
}

/* 加载中 */
.loading-state {
	text-align: center;
	padding: 40rpx 0;
}

.loading-text {
	font-size: 28rpx;
	color: #999;
}

/* 已加载完 */
.no-more {
	text-align: center;
	padding: 40rpx 0;
}

.no-more-text {
	font-size: 24rpx;
	color: #ccc;
}

.reward-item {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-between;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.item-left {
	display: flex;
	gap: 20rpx;
	flex: 1;
}

.item-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	flex-shrink: 0;
}

.type-rainpoint {
	background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.type-promotion {
	background: linear-gradient(135deg, #fff3e0, #ffe0b2);
}

.type-team {
	background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.type-weekly {
	background: linear-gradient(135deg, #f3e5f5, #e1bee7);
}

.type-director {
	background: linear-gradient(135deg, #fff9e6, #ffecb3);
}

.item-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.item-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.item-desc {
	font-size: 24rpx;
	color: #999;
}

.item-time {
	font-size: 22rpx;
	color: #ccc;
}

.item-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8rpx;
}

.item-amount {
	font-size: 32rpx;
	font-weight: bold;
	color: #ff5252;
}

.item-amount.pending {
	color: #ff9800;
}

.item-status {
	font-size: 22rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}

.status-completed {
	background: #e8f5e9;
	color: #4caf50;
}

.status-pending {
	background: #fff3e0;
	color: #ff9800;
}

.status-failed {
	background: #ffebee;
	color: #f44336;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
	padding: 120rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 加载更多 */
.load-more {
	text-align: center;
	padding: 40rpx 0;
}

.load-text {
	font-size: 26rpx;
	color: #3d6bff;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>
