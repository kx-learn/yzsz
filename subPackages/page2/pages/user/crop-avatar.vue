<template>
	<view class="crop-container">
		<view class="crop-header" :style="headerStyle">
			<view class="header-title">裁剪头像</view>
		</view>
		
		<view class="crop-content" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
			<image 
				:src="imageSrc" 
				mode="aspectFit"
				:style="imageStyle"
				class="crop-image"
				@load="onImageLoad"
			/>
			<view class="crop-mask">
				<view class="crop-box" :style="cropBoxStyle"></view>
			</view>
		</view>
		
		<view class="crop-toolbar">
			<view class="toolbar-btn cancel" @tap="cancel">取消</view>
			<view class="crop-tips-text">拖动调整 / 双指缩放</view>
			<view class="toolbar-btn confirm" @tap="confirm">完成</view>
		</view>
		
		<!-- 隐藏的canvas用于裁剪 -->
		<canvas 
			canvas-id="cropCanvas" 
			:style="{ width: cropSize + 'px', height: cropSize + 'px' }"
			class="hidden-canvas"
		></canvas>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const imageSrc = ref('')
const imageWidth = ref(0)
const imageHeight = ref(0)
const screenWidth = ref(375)
const screenHeight = ref(667)
const cropSize = ref(300) // 裁剪框大小（正方形）
const headerStyle = ref({})
const imageX = ref(0)
const imageY = ref(0)
const scale = ref(1) // 缩放比例
const baseWidth = ref(0) // 基础宽度（初始加载时的宽度）
const baseHeight = ref(0) // 基础高度（初始加载时的高度）
const startX = ref(0)
const startY = ref(0)
const startImageX = ref(0)
const startImageY = ref(0)
const startScale = ref(1)
const initialDistance = ref(0) // 初始双指距离
const isDragging = ref(false)
const isScaling = ref(false) // 是否正在缩放

onLoad((options) => {
	if (options.imageSrc) {
		imageSrc.value = decodeURIComponent(options.imageSrc)
	}
	
	// 适配胶囊按钮位置
	try {
		const menuBtn = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null
		if (menuBtn) {
			headerStyle.value = {
				paddingTop: `${menuBtn.top}px`,
				height: `${menuBtn.height}px`,
				paddingBottom: '4px' // 微调底部留白
			}
		} else {
			throw new Error('No menu button info')
		}
	} catch (e) {
		// Fallback
		const sysCtx = uni.getSystemInfoSync()
		headerStyle.value = {
			paddingTop: `${(sysCtx.statusBarHeight || 0) + 12}px`,
			height: '32px',
			paddingBottom: '4px'
		}
	}
	
	// 获取系统信息
	uni.getSystemInfo({
		success: (res) => {
			screenWidth.value = res.windowWidth
			screenHeight.value = res.windowHeight - 200 // 减去头部和底部高度
			cropSize.value = Math.min(screenWidth.value * 0.8, 300)
		}
	})
})

const cropBoxStyle = computed(() => {
	const left = (screenWidth.value - cropSize.value) / 2
	const top = (screenHeight.value - cropSize.value) / 2
	return {
		width: cropSize.value + 'px',
		height: cropSize.value + 'px',
		left: left + 'px',
		top: top + 'px'
	}
})

const imageStyle = computed(() => {
	const scaledWidth = baseWidth.value * scale.value
	const scaledHeight = baseHeight.value * scale.value
	return {
		width: baseWidth.value + 'px',
		height: baseHeight.value + 'px',
		transform: `translate(${imageX.value}px, ${imageY.value}px) scale(${scale.value})`,
		transformOrigin: '0 0'
	}
})

// 计算当前实际显示的图片尺寸（考虑缩放）
const currentImageWidth = computed(() => baseWidth.value * scale.value)
const currentImageHeight = computed(() => baseHeight.value * scale.value)

const onImageLoad = (e) => {
	const { width, height } = e.detail
	const screenAspect = screenWidth.value / screenHeight.value
	const imageAspect = width / height
	
	// 计算图片显示尺寸（保持宽高比，适应屏幕）
	let displayWidth, displayHeight
	if (imageAspect > screenAspect) {
		// 图片更宽，以宽度为准
		displayWidth = screenWidth.value
		displayHeight = screenWidth.value / imageAspect
	} else {
		// 图片更高，以高度为准
		displayHeight = screenHeight.value
		displayWidth = screenHeight.value * imageAspect
	}
	
	// 如果图片小于裁剪框，放大到至少覆盖裁剪框
	if (displayWidth < cropSize.value || displayHeight < cropSize.value) {
		const scaleRatio = Math.max(cropSize.value / displayWidth, cropSize.value / displayHeight) * 1.2
		displayWidth *= scaleRatio
		displayHeight *= scaleRatio
	}
	
	// 保存基础尺寸
	baseWidth.value = displayWidth
	baseHeight.value = displayHeight
	imageWidth.value = displayWidth
	imageHeight.value = displayHeight
	
	// 重置缩放
	scale.value = 1
	
	// 居中显示
	imageX.value = (screenWidth.value - displayWidth) / 2
	imageY.value = (screenHeight.value - displayHeight) / 2
}

// 计算两点之间的距离
const getDistance = (touch1, touch2) => {
	const dx = touch1.clientX - touch2.clientX
	const dy = touch1.clientY - touch2.clientY
	return Math.sqrt(dx * dx + dy * dy)
}

const onTouchStart = (e) => {
	if (e.touches.length === 1) {
		// 单指拖动
		isDragging.value = true
		isScaling.value = false
		startX.value = e.touches[0].clientX
		startY.value = e.touches[0].clientY
		startImageX.value = imageX.value
		startImageY.value = imageY.value
	} else if (e.touches.length === 2) {
		// 双指缩放
		isDragging.value = false
		isScaling.value = true
		initialDistance.value = getDistance(e.touches[0], e.touches[1])
		startScale.value = scale.value
		startImageX.value = imageX.value
		startImageY.value = imageY.value
	}
}

const onTouchMove = (e) => {
	if (e.touches.length === 1 && isDragging.value) {
		// 单指拖动
		const deltaX = e.touches[0].clientX - startX.value
		const deltaY = e.touches[0].clientY - startY.value
		
		let newX = startImageX.value + deltaX
		let newY = startImageY.value + deltaY
		
		// 限制移动范围，确保裁剪框内始终有图片
		const cropLeft = (screenWidth.value - cropSize.value) / 2
		const cropRight = cropLeft + cropSize.value
		const cropTop = (screenHeight.value - cropSize.value) / 2
		const cropBottom = cropTop + cropSize.value
		
		const currentWidth = currentImageWidth.value
		const currentHeight = currentImageHeight.value
		
		// 限制X轴移动
		if (newX > cropLeft) {
			newX = cropLeft
		} else if (newX + currentWidth < cropRight) {
			newX = cropRight - currentWidth
		}
		
		// 限制Y轴移动
		if (newY > cropTop) {
			newY = cropTop
		} else if (newY + currentHeight < cropBottom) {
			newY = cropBottom - currentHeight
		}
		
		imageX.value = newX
		imageY.value = newY
	} else if (e.touches.length === 2 && isScaling.value) {
		// 双指缩放
		const currentDistance = getDistance(e.touches[0], e.touches[1])
		const scaleRatio = currentDistance / initialDistance.value
		let newScale = startScale.value * scaleRatio
		
		// 限制缩放范围（最小缩放保证填满裁剪框，最大3倍）
		const minScale = Math.max(cropSize.value / baseWidth.value, cropSize.value / baseHeight.value)
		newScale = Math.max(minScale, Math.min(3, newScale))
		scale.value = newScale
		
		// 缩放时调整位置，使图片中心保持在双指中心
		const cropLeft = (screenWidth.value - cropSize.value) / 2
		const cropRight = cropLeft + cropSize.value
		const cropTop = (screenHeight.value - cropSize.value) / 2
		const cropBottom = cropTop + cropSize.value
		
		const currentWidth = currentImageWidth.value
		const currentHeight = currentImageHeight.value
		
		// 限制位置，确保裁剪框内始终有图片
		let newX = imageX.value
		let newY = imageY.value
		
		if (newX > cropLeft) {
			newX = cropLeft
		} else if (newX + currentWidth < cropRight) {
			newX = cropRight - currentWidth
		}
		
		if (newY > cropTop) {
			newY = cropTop
		} else if (newY + currentHeight < cropBottom) {
			newY = cropBottom - currentHeight
		}
		
		imageX.value = newX
		imageY.value = newY
	}
}

const onTouchEnd = () => {
	isDragging.value = false
	isScaling.value = false
}

const cancel = () => {
	uni.navigateBack()
}

const confirm = () => {
	uni.showLoading({ title: '处理中...' })
	
	// 计算裁剪区域在原图中的位置和尺寸
	const cropLeft = (screenWidth.value - cropSize.value) / 2
	const cropTop = (screenHeight.value - cropSize.value) / 2
	
	// 获取原始图片信息
	uni.getImageInfo({
		src: imageSrc.value,
		success: (imageInfo) => {
			// 计算裁剪区域在原始图片中的位置
			// 图片显示尺寸（考虑缩放）与实际尺寸的比例
			const currentDisplayWidth = currentImageWidth.value
			const currentDisplayHeight = currentImageHeight.value
			const scaleX = imageInfo.width / baseWidth.value
			const scaleY = imageInfo.height / baseHeight.value
			
			// 裁剪区域在显示图片中的相对位置（需要考虑缩放）
			const relativeX = cropLeft - imageX.value
			const relativeY = cropTop - imageY.value
			
			// 转换为原始图片中的位置（需要考虑缩放比例）
			const sourceX = Math.max(0, relativeX * scaleX)
			const sourceY = Math.max(0, relativeY * scaleY)
			const sourceWidth = Math.min(cropSize.value * scaleX, imageInfo.width - sourceX)
			const sourceHeight = Math.min(cropSize.value * scaleY, imageInfo.height - sourceY)
			
			// 使用canvas裁剪图片
			try {
				const ctx = uni.createCanvasContext('cropCanvas')
				
				// 在canvas上绘制裁剪后的图片
				ctx.drawImage(
					imageSrc.value,
					sourceX, sourceY, sourceWidth, sourceHeight,
					0, 0, cropSize.value, cropSize.value
				)
				
				ctx.draw(false, () => {
					// 导出canvas为图片（增加延迟，确保canvas绘制完成）
					setTimeout(() => {
						uni.canvasToTempFilePath({
							canvasId: 'cropCanvas',
							width: cropSize.value,
							height: cropSize.value,
							destWidth: cropSize.value,
							destHeight: cropSize.value,
							fileType: 'jpg',
							quality: 0.9,
							success: (res) => {
								uni.hideLoading()
								if (!res.tempFilePath) {
									console.error('[裁剪页面] 裁剪结果路径为空')
									uni.showToast({ title: '处理失败：路径为空', icon: 'none' })
									return
								}
								// 使用事件总线传递裁剪结果
								uni.$emit('avatarCropped', res.tempFilePath)
								// 延迟返回，确保事件已发送
								setTimeout(() => {
									uni.navigateBack()
								}, 200)
							},
							fail: (err) => {
								uni.hideLoading()
								console.error('[裁剪页面] 导出图片失败:', err)
								uni.showToast({ 
									title: '处理失败：' + (err.errMsg || '未知错误'), 
									icon: 'none',
									duration: 3000
								})
							}
						})
					}, 500) // 增加延迟到500ms，确保canvas绘制完成
				})
			} catch (canvasError) {
				uni.hideLoading()
				console.error('[裁剪页面] Canvas操作失败:', canvasError)
				uni.showToast({ 
					title: '处理失败：' + (canvasError.message || '未知错误'), 
					icon: 'none',
					duration: 3000
				})
			}
		},
		fail: (err) => {
			uni.hideLoading()
			console.error('获取图片信息失败:', err)
			uni.showToast({ title: '处理失败', icon: 'none' })
		}
	})
}
</script>

<style scoped>
.crop-container {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: #000;
	z-index: 9999;
}

.crop-header {
	display: flex;
	justify-content: center;
	align-items: center;
	background: rgba(0, 0, 0, 0.8);
	color: #fff;
	box-sizing: content-box;
}

/* .header-btn removed */

.header-title {
	font-size: 36rpx;
	font-weight: 500;
}

.crop-content {
	position: relative;
	width: 100%;
	height: calc(100vh - 200rpx);
	overflow: hidden;
	touch-action: none;
}

.crop-image {
	position: absolute;
	top: 0;
	left: 0;
	user-select: none;
	-webkit-user-select: none;
	pointer-events: none;
}

.crop-mask {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	pointer-events: none;
}

.crop-box {
	position: absolute;
	border: 4rpx solid #fff;
	box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	pointer-events: none;
}

.crop-toolbar {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background: rgba(0, 0, 0, 0.9);
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 40rpx;
	padding-bottom: constant(safe-area-inset-bottom);
	padding-bottom: env(safe-area-inset-bottom);
	z-index: 10000;
}

.toolbar-btn {
	font-size: 32rpx;
	padding: 20rpx;
}

.toolbar-btn.cancel {
	color: #fff;
}

.toolbar-btn.confirm {
	color: #007aff;
	font-weight: bold;
}

.crop-tips-text {
	font-size: 24rpx;
	color: #999;
}

/* 隐藏的canvas用于裁剪 */
canvas {
	position: fixed;
	left: -9999px;
	top: -9999px;
}
</style>
