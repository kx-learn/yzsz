<template>
	<view class="submit-page">
		<view class="header">
			<text class="title">评价商品</text>
		</view>

		<!-- 商品信息 -->
		<view class="product-card">
			<image :src="productInfo.image" class="product-image" mode="aspectFill" />
			<view class="product-info">
				<text class="product-name">{{ productInfo.name }}</text>
				<text class="product-spec" v-if="productInfo.spec">{{ productInfo.spec }}</text>
			</view>
		</view>

		<!-- 评分 -->
		<view class="rating-section">
			<text class="section-title">商品评分</text>
			<view class="stars">
				<text 
					v-for="i in 5" 
					:key="i"
					class="star iconfont"
					:class="i <= rating ? 'icon-huangguan' : 'icon-shoucang'"
					@tap="setRating(i)"
				></text>
			</view>
			<text class="rating-text">{{ ratingText }}</text>
		</view>

		<!-- 评价内容 -->
		<view class="content-section">
			<text class="section-title">评价内容</text>
			<textarea 
				v-model="content"
				class="content-input"
				placeholder="分享你的使用体验，帮助其他小伙伴~"
				maxlength="500"
				:show-confirm-bar="false"
			/>
			<text class="char-count">{{ content.length }}/500</text>
		</view>

		<!-- 上传图片 -->
		<view class="images-section">
			<text class="section-title">上传图片（最多9张）</text>
			<view class="images-grid">
				<view 
					v-for="(img, index) in images" 
					:key="`eval-img-${index}-${img}`"
					class="image-item"
				>
					<image :src="img" class="uploaded-image" mode="aspectFill" @tap="previewImage(index)" @error="handleImageError(index)" />
					<text class="delete-btn" @tap="deleteImage(index)">×</text>
				</view>
				<view 
					v-if="images.length < 9"
					class="upload-btn"
					@tap="chooseImage"
				>
					<text class="upload-icon">+</text>
					<text class="upload-text">上传图片</text>
				</view>
			</view>
		</view>

		<!-- 匿名评价 -->
		<view class="anonymous-section">
			<text class="section-title">匿名评价</text>
			<switch :checked="isAnonymous" @change="toggleAnonymous" color="#667eea" />
			<text class="anonymous-tip">匿名后，其他用户将看不到你的头像和昵称</text>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-section">
			<button class="submit-btn" :disabled="!canSubmit" @tap="submitEvaluation">
				{{ submitting ? '提交中...' : '提交评价' }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { submitEvaluation as submitEvaluationApi } from '../../api/evaluation.js'

const productInfo = ref({
	id: '',
	name: '',
	image: '',
	spec: ''
})

const orderId = ref('')
const rating = ref(5)
const content = ref('')
const images = ref([])
const isAnonymous = ref(false)
const submitting = ref(false)

const ratingText = computed(() => {
	const texts = {
		1: '非常差',
		2: '差',
		3: '一般',
		4: '好',
		5: '非常好'
	}
	return texts[rating.value] || ''
})

const canSubmit = computed(() => {
	return rating.value > 0 && content.value.trim().length > 0 && !submitting.value
})

/**
 * 设置评分
 */
const setRating = (value) => {
	rating.value = value
}

/**
 * 选择图片
 */
const chooseImage = () => {
	const remaining = 9 - images.value.length
	if (remaining <= 0) {
		uni.showToast({ title: '最多上传9张图片', icon: 'none' })
		return
	}
	
	uni.chooseImage({
		count: remaining,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			// 使用 concat 或扩展运算符追加图片，而不是覆盖
			console.log('[评价图片] 选择的图片数量:', res.tempFilePaths.length)
			console.log('[评价图片] 选择前的图片数量:', images.value.length)
			
			// 追加新图片到数组末尾
			images.value = images.value.concat(res.tempFilePaths)
			// 或者使用扩展运算符：images.value = [...images.value, ...res.tempFilePaths]
			
			console.log('[评价图片] 追加后的图片数量:', images.value.length)
			console.log('[评价图片] 所有图片路径:', images.value)
		},
		fail: (err) => {
			console.error('[评价图片] 选择图片失败:', err)
			uni.showToast({ title: '选择图片失败', icon: 'none' })
		}
	})
}

/**
 * 删除图片
 */
const deleteImage = (index) => {
	images.value.splice(index, 1)
}

/**
 * 预览图片
 */
const previewImage = (index) => {
	const imgList = images.value
	if (!imgList || imgList.length === 0) {
		uni.showToast({ title: '暂无图片', icon: 'none' })
		return
	}
	
	// 确保 urls 是数组，current 是当前图片路径
	const current = imgList[index] || imgList[0]
	console.log('[预览评价图片] 当前索引:', index, '图片路径:', current, '总数量:', imgList.length)
	
	uni.previewImage({
		urls: imgList, // 必须是数组
		current: current // 当前显示的图片路径
	})
}

/**
 * 处理图片加载错误
 */
const handleImageError = (index) => {
	console.error(`[评价图片加载错误] 索引: ${index}`)
	// 可以在这里添加默认图片或错误处理逻辑
}

/**
 * 切换匿名
 */
const toggleAnonymous = (e) => {
	isAnonymous.value = e.detail.value
}

/**
 * 提交评价
 */
const submitEvaluation = async () => {
	if (!canSubmit.value) {
		uni.showToast({ title: '请完善评价信息', icon: 'none' })
		return
	}

	submitting.value = true

	try {
		// 如果有图片，先上传图片
		let imageUrls = []
		if (images.value.length > 0) {
			uni.showLoading({ title: '上传图片中...' })
			// TODO: 实现图片上传逻辑
			// 这里应该调用图片上传API
			imageUrls = images.value // 临时使用本地路径
			uni.hideLoading()
		}

		const res = await submitEvaluationApi({
			order_id: orderId.value,
			product_id: productInfo.value.id,
			rating: rating.value,
			content: content.value.trim(),
			images: imageUrls,
			is_anonymous: isAnonymous.value
		})

		if (res.success !== false) {
			uni.showToast({ title: '评价成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		} else {
			uni.showToast({ title: res.message || '评价失败', icon: 'none' })
		}
	} catch (error) {
		console.error('提交评价失败:', error)
		uni.showToast({ title: '评价失败，请重试', icon: 'none' })
	} finally {
		submitting.value = false
	}
}

onLoad((options) => {
	if (options.orderId) {
		orderId.value = options.orderId
	}
	if (options.productId) {
		productInfo.value.id = options.productId
	}
	if (options.productName) {
		productInfo.value.name = decodeURIComponent(options.productName)
	}
	if (options.productImage) {
		productInfo.value.image = decodeURIComponent(options.productImage)
	}
	if (options.productSpec) {
		productInfo.value.spec = decodeURIComponent(options.productSpec)
	}

	uni.setNavigationBarTitle({ title: '评价商品' })
})
</script>

<style scoped>
.submit-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

.header {
	padding: 30rpx;
	background: white;
	border-bottom: 1rpx solid #f0f0f0;
}

.title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

/* 商品信息 */
.product-card {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 30rpx;
	background: white;
	margin-bottom: 20rpx;
}

.product-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

.product-info {
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

.product-spec {
	font-size: 24rpx;
	color: #999;
}

/* 评分 */
.rating-section {
	padding: 30rpx;
	background: white;
	margin-bottom: 20rpx;
}

.section-title {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 24rpx;
	font-weight: 500;
}

.stars {
	display: flex;
	gap: 20rpx;
	margin-bottom: 16rpx;
}

.star {
	font-size: 56rpx;
	line-height: 1;
	transition: transform 0.2s;
}

.star:active {
	transform: scale(0.9);
}

.rating-text {
	font-size: 24rpx;
	color: #ff4757;
}

/* 评价内容 */
.content-section {
	padding: 30rpx;
	background: white;
	margin-bottom: 20rpx;
	position: relative;
}

.content-input {
	width: 100%;
	min-height: 200rpx;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
	box-sizing: border-box;
}

.char-count {
	position: absolute;
	right: 50rpx;
	bottom: 50rpx;
	font-size: 24rpx;
	color: #999;
}

/* 图片上传 */
.images-section {
	padding: 30rpx;
	background: white;
	margin-bottom: 20rpx;
}

.images-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
}

.image-item {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	border-radius: 12rpx;
	overflow: hidden;
}

.uploaded-image {
	width: 100%;
	height: 100%;
}

.delete-btn {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(0, 0, 0, 0.6);
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	line-height: 1;
}

.upload-btn {
	width: 100%;
	aspect-ratio: 1;
	background: #f8f9fa;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
}

.upload-icon {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.upload-text {
	font-size: 24rpx;
	color: #999;
}

/* 匿名评价 */
.anonymous-section {
	padding: 30rpx;
	background: white;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.anonymous-tip {
	flex: 1;
	font-size: 24rpx;
	color: #999;
}

/* 提交按钮 */
.submit-section {
	padding: 0 30rpx;
	margin-top: 40rpx;
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea, #764ba2);
	color: white;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
}

.submit-btn:disabled {
	background: #e0e0e0;
	color: #999;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>

