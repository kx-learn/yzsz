<template>
	<view class="list-page">
		<!-- 筛选栏 -->
		<view class="filter-bar">
			<view 
				v-for="filter in filters" 
				:key="filter.value"
				class="filter-item"
				:class="{ active: currentFilter === filter.value }"
				@tap="switchFilter(filter.value)"
			>
				<text class="filter-text">{{ filter.label }}</text>
			</view>
		</view>

		<!-- 评价列表 -->
		<scroll-view 
			class="evaluations-list" 
			scroll-y 
			refresher-enabled
			:refresher-triggered="refreshing"
			@refresherrefresh="onRefresh"
			@scrolltolower="loadMore"
			:lower-threshold="100"
		>
			<view v-if="evaluations.length === 0 && !loading" class="empty-state">
				<text class="empty-icon iconfont icon-biaoqing2"></text>
				<text class="empty-text">暂无评价</text>
			</view>

			<view 
				v-for="evaluation in evaluations" 
				:key="evaluation.id"
				class="evaluation-item"
			>
				<!-- 商品信息 -->
				<view class="product-info-row" @tap="goToProduct(evaluation.product_id)">
					<image :src="evaluation.product_image" class="product-thumb" mode="aspectFill" />
					<view class="product-details">
						<text class="product-name">{{ evaluation.product_name }}</text>
						<text class="evaluation-time">{{ evaluation.created_at }}</text>
					</view>
					<text class="arrow">›</text>
				</view>

				<!-- 评价内容 -->
				<view class="evaluation-content">
					<!-- 评分 -->
					<view class="rating-row">
						<view class="stars">
							<text 
								v-for="i in 5" 
								:key="i"
								class="star iconfont"
								:class="i <= evaluation.rating ? 'icon-huangguan' : 'icon-shoucang'"
							></text>
						</view>
						<text class="rating-text">{{ getRatingText(evaluation.rating) }}</text>
					</view>

					<!-- 评价文字 -->
					<text class="evaluation-text">{{ evaluation.content }}</text>

					<!-- 评价图片 -->
					<view v-if="evaluation.images && evaluation.images.length > 0" class="evaluation-images">
						<image 
							v-for="(img, index) in evaluation.images" 
							:key="index"
							:src="img"
							class="evaluation-image"
							mode="aspectFill"
							@tap="previewImage(img, evaluation.images)"
						/>
					</view>

					<!-- 操作按钮 -->
					<view class="actions">
						<text class="action-btn" @tap="editEvaluation(evaluation)">编辑</text>
						<text class="action-btn delete" @tap="deleteEvaluation(evaluation.id)">删除</text>
					</view>
				</view>
			</view>

			<!-- 加载更多 -->
			<view v-if="loading" class="loading">
				<text class="loading-text">加载中...</text>
			</view>
			<view v-if="!hasMore && evaluations.length > 0" class="no-more">
				<text class="no-more-text">没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMyEvaluations, deleteEvaluation as deleteEvaluationApi } from '../../api/evaluation.js'

const filters = [
	{ label: '全部', value: 'all' },
	{ label: '有图', value: 'image' },
	{ label: '好评', value: 'good' },
	{ label: '中评', value: 'medium' },
	{ label: '差评', value: 'bad' }
]

const currentFilter = ref('all')
const evaluations = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(10)
const refreshing = ref(false)

/**
 * 切换筛选
 */
const switchFilter = (value) => {
	if (currentFilter.value === value) return
	currentFilter.value = value
	page.value = 1
	evaluations.value = []
	loadEvaluations()
}

/**
 * 获取评分文字
 */
const getRatingText = (rating) => {
	const texts = {
		1: '非常差',
		2: '差',
		3: '一般',
		4: '好',
		5: '非常好'
	}
	return texts[rating] || ''
}

/**
 * 加载评价列表
 */
const loadEvaluations = async (append = false) => {
	if (loading.value || !hasMore.value) return

	loading.value = true
	try {
		if (!append) {
			page.value = 1
			evaluations.value = []
		}
		
		const params = {
			page: page.value,
			pageSize: pageSize.value
		}

		// 根据筛选条件添加参数
		if (currentFilter.value !== 'all') {
			params.filter = currentFilter.value
		}

		const res = await getMyEvaluations(params)
		
		if (res && res.data) {
			const list = res.data.list || res.data || []
			
			if (list.length < pageSize.value) {
				hasMore.value = false
			} else {
				hasMore.value = true
			}

			if (append) {
				evaluations.value.push(...list)
			} else {
				evaluations.value = list
			}

			// 如果还有更多数据，页码加1，准备加载下一页
			if (hasMore.value) {
				page.value++
			}
		} else {
			hasMore.value = false
		}
	} catch (error) {
		console.error('加载评价失败:', error)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loading.value = false
		refreshing.value = false
	}
}

/**
 * 加载更多（下滑到底部触发）
 */
const loadMore = () => {
	if (!loading.value && hasMore.value) {
		loadEvaluations(true)
	}
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
	loadEvaluations(true)
}

/**
 * 编辑评价
 */
const editEvaluation = (evaluation) => {
	// 跳转到编辑页面，传递评价ID
	uni.navigateTo({
		url: `/page1/evaluation/submit?evaluationId=${evaluation.id}&productId=${evaluation.product_id}&productName=${encodeURIComponent(evaluation.product_name)}&productImage=${encodeURIComponent(evaluation.product_image)}`
	})
}

/**
 * 删除评价
 */
const deleteEvaluation = (evaluationId) => {
	uni.showModal({
		title: '提示',
		content: '确定要删除这条评价吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await deleteEvaluationApi(evaluationId)
					uni.showToast({ title: '删除成功', icon: 'success' })
					// 重新加载列表
					page.value = 1
					evaluations.value = []
					hasMore.value = true
					loadEvaluations()
				} catch (error) {
					console.error('删除评价失败:', error)
					uni.showToast({ title: '删除失败', icon: 'none' })
				}
			}
		}
	})
}

/**
 * 预览图片
 */
const previewImage = (current, urls) => {
	try {
		if (!current) {
			uni.showToast({ title: '图片路径无效', icon: 'none' })
			return
		}
		
		const imageUrls = urls && Array.isArray(urls) && urls.length > 0 
			? urls.filter(url => url && typeof url === 'string' && url.trim().length > 0)
			: [current]
		
		if (imageUrls.length === 0) {
			uni.showToast({ title: '暂无图片', icon: 'none' })
			return
		}
		
		// 确保 current 在 urls 中
		const finalCurrent = imageUrls.includes(current) ? current : imageUrls[0]
		
		uni.previewImage({
			current: finalCurrent,
			urls: imageUrls,
			fail: (err) => {
				console.error('[预览图片] 预览失败:', err)
				uni.showToast({ title: '预览失败', icon: 'none' })
			}
		})
	} catch (error) {
		console.error('[预览图片] 预览出错:', error)
		uni.showToast({ title: '预览失败', icon: 'none' })
	}
}

/**
 * 跳转到商品详情
 */
const goToProduct = (productId) => {
	uni.navigateTo({
		url: `/subPackages/page2/pages/product/detail?id=${productId}`
	})
}

onLoad(() => {
	uni.setNavigationBarTitle({ title: '我的评价' })
	loadEvaluations()
})

onShow(() => {
	// 从编辑页面返回时刷新列表
	if (evaluations.value.length > 0) {
		page.value = 1
		evaluations.value = []
		hasMore.value = true
		loadEvaluations()
	}
})
</script>

<style scoped>
.list-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
}

/* 筛选栏 */
.filter-bar {
	display: flex;
	background: white;
	padding: 0 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	position: sticky;
	top: 0;
	z-index: 10;
}

.filter-item {
	flex: 1;
	padding: 24rpx 0;
	text-align: center;
	position: relative;
}

.filter-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background: #ff4757;
	border-radius: 2rpx;
}

.filter-text {
	font-size: 28rpx;
	color: #666;
}

.filter-item.active .filter-text {
	color: #ff4757;
	font-weight: 600;
}

/* 评价列表 */
.evaluations-list {
	flex: 1;
	padding: 20rpx;
}

.empty-state {
	text-align: center;
	padding: 200rpx 0;
}

.empty-icon {
	display: block;
	font-size: 120rpx;
	margin-bottom: 30rpx;
	opacity: 0.5;
}

.empty-text {
	display: block;
	font-size: 32rpx;
	color: #999;
}

/* 评价项 */
.evaluation-item {
	background: white;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
}

.product-info-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.product-thumb {
	width: 100rpx;
	height: 100rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

.product-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.product-name {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.evaluation-time {
	font-size: 24rpx;
	color: #999;
}

.arrow {
	font-size: 32rpx;
	color: #ccc;
}

/* 评价内容 */
.evaluation-content {
	padding: 24rpx;
}

.rating-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.stars {
	display: flex;
	gap: 8rpx;
}

.star {
	font-size: 32rpx;
	line-height: 1;
}

.rating-text {
	font-size: 24rpx;
	color: #ff4757;
}

.evaluation-text {
	display: block;
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
	margin-bottom: 16rpx;
}

.evaluation-images {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.evaluation-image {
	width: 100%;
	aspect-ratio: 1;
	border-radius: 8rpx;
}

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 24rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f5f5f5;
}

.action-btn {
	font-size: 26rpx;
	color: #667eea;
	padding: 8rpx 16rpx;
}

.action-btn.delete {
	color: #ff4757;
}

.loading,
.no-more {
	text-align: center;
	padding: 40rpx 0;
}

.loading-text,
.no-more-text {
	font-size: 28rpx;
	color: #999;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>

