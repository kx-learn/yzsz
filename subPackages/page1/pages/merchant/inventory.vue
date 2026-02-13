<template>
	<view class="inventory-page">
		<!-- 搜索和筛选 -->
		<view class="search-bar">
			<view class="search-box">
				<input v-model="searchKeyword" class="search-input" placeholder="搜索商品名称" />
				<text class="search-icon iconfont icon-sousuo"></text>
			</view>
			<view class="sort-btn" @tap="showSortMenu">
				<text class="sort-text">排序</text>
				<text class="sort-arrow">▼</text>
			</view>
		</view>

		<!-- 库存列表 -->
		<view class="inventory-list">
			<view 
				v-for="item in filteredInventory" 
				:key="item.id"
				class="inventory-item"
			>
				<image :src="item.image" class="product-image" mode="aspectFill" />
				<view class="product-info">
					<text class="product-name">{{ item.name }}</text>
					<text class="product-sku">SKU: {{ item.sku }}</text>
					<view class="stock-info">
						<text class="stock-label">库存:</text>
						<text class="stock-value" :class="getStockClass(item.stock, item.minStock)">
							{{ item.stock }}
						</text>
						<text class="stock-unit">{{ item.unit }}</text>
					</view>
				</view>
			<view class="item-actions">
				<button class="action-btn primary" @tap="adjustStock(item)">调整库存</button>
			</view>
			</view>
			
			<!-- 空状态 -->
			<view v-if="filteredInventory.length === 0" class="empty-state">
				<text class="empty-icon iconfont icon-gouwuchekong"></text>
				<text class="empty-text">暂无库存数据</text>
			</view>
		</view>

		<!-- 调整库存弹窗 -->
		<view v-if="showAdjustModal" class="modal-overlay" @tap="closeAdjustModal">
			<view class="modal-content" @tap.stop>
				<view class="modal-header">
					<text class="modal-title">调整库存</text>
					<text class="modal-close" @tap="closeAdjustModal">×</text>
				</view>
				<view class="modal-body">
					<view class="adjust-info">
						<text class="info-label">商品名称</text>
						<text class="info-value">{{ selectedItem?.name }}</text>
					</view>
					<view class="adjust-info">
						<text class="info-label">当前库存</text>
						<text class="info-value">{{ selectedItem?.stock }} {{ selectedItem?.unit }}</text>
					</view>
					<view class="adjust-type">
						<view 
							class="type-btn" 
							:class="{ active: adjustType === 'in' }"
							@tap="adjustType = 'in'"
						>
							入库
						</view>
						<view 
							class="type-btn" 
							:class="{ active: adjustType === 'out' }"
							@tap="adjustType = 'out'"
						>
							出库
						</view>
					</view>
					<view class="adjust-input">
						<text class="input-label">数量</text>
						<input v-model="adjustAmount" type="number" class="input-field" placeholder="请输入数量" />
					</view>
					<view class="adjust-input">
						<text class="input-label">备注</text>
						<textarea v-model="adjustRemark" class="textarea-field" placeholder="请输入备注（选填）" />
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @tap="closeAdjustModal">取消</button>
					<button class="modal-btn confirm" @tap="confirmAdjust">确认</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getProductList, updateProduct } from '@/api/product.js'
import config from '@/utils/config.js'

const searchKeyword = ref('')
const currentFilter = ref('all')

const inventory = ref([])

const stats = ref({
	total: 0,
	lowStock: 0,
	outOfStock: 0
})

const filteredInventory = computed(() => {
	let result = inventory.value
	
	// 按状态筛选
	if (currentFilter.value === 'low') {
		result = result.filter(item => item.stock > 0 && item.stock < item.minStock)
	} else if (currentFilter.value === 'out') {
		result = result.filter(item => item.stock === 0)
	}
	
	// 按关键词搜索
	if (searchKeyword.value) {
		const keyword = searchKeyword.value.toLowerCase()
		result = result.filter(item => 
			item.name.toLowerCase().includes(keyword) ||
			item.sku.toLowerCase().includes(keyword)
		)
	}
	
	return result
})

const showAdjustModal = ref(false)
const selectedItem = ref(null)
const selectedProduct = ref(null) // 保存原始商品数据
const adjustType = ref('in')
const adjustAmount = ref('')
const adjustRemark = ref('')

const filterByStatus = (status) => {
	currentFilter.value = status
}

const getStockClass = (stock, minStock) => {
	if (stock === 0) return 'out'
	if (stock < minStock) return 'low'
	return 'normal'
}

const adjustStock = (item) => {
	selectedItem.value = item
	selectedProduct.value = item.productData // 保存原始商品数据
	showAdjustModal.value = true
	adjustType.value = 'in'
	adjustAmount.value = ''
	adjustRemark.value = ''
}

const closeAdjustModal = () => {
	showAdjustModal.value = false
	selectedItem.value = null
	selectedProduct.value = null
	adjustAmount.value = ''
	adjustRemark.value = ''
}

const refreshStats = () => {
	stats.value = {
		total: inventory.value.length,
		lowStock: inventory.value.filter(item => item.stock > 0 && item.stock < item.minStock).length,
		outOfStock: inventory.value.filter(item => item.stock === 0).length
	}
}

const confirmAdjust = async () => {
	if (!adjustAmount.value || adjustAmount.value <= 0) {
		uni.showToast({ title: '请输入有效数量', icon: 'none' })
		return
	}
	
	if (!selectedProduct.value || !selectedItem.value) {
		uni.showToast({ title: '商品信息错误', icon: 'none' })
		return
	}
	
	try {
		uni.showLoading({ title: '更新中...' })
	
	const amount = parseInt(adjustAmount.value)
		const currentStock = selectedItem.value.stock
		let newStock = 0
		
	if (adjustType.value === 'in') {
			newStock = currentStock + amount
		} else {
			newStock = Math.max(0, currentStock - amount)
		}
		
		// 准备更新数据
		const updateData = {}
		
		// 如果商品有SKU，更新SKU的库存
		if (selectedItem.value.skuData && selectedProduct.value.skus && selectedProduct.value.skus.length > 0) {
			// 更新第一个SKU的库存
			const skus = selectedProduct.value.skus.map((sku, index) => {
				if (index === 0) {
					return {
						...sku,
						stock: newStock
					}
				}
				return sku
			})
			updateData.skus = skus
		} else {
			// 直接更新商品的库存字段
			updateData.stock = newStock
		}
		
		// 调用更新商品接口
		const productId = selectedProduct.value.id || selectedProduct.value.product_id
		await updateProduct(productId, updateData)
		
		// 更新本地数据
		selectedItem.value.stock = newStock
		
		// 如果原始商品数据中有库存字段，也更新它
		if (selectedItem.value.skuData) {
			selectedItem.value.skuData.stock = newStock
	} else {
			selectedProduct.value.stock = newStock
	}
	
	refreshStats()
		uni.hideLoading()
	uni.showToast({ title: '调整成功', icon: 'success' })
	closeAdjustModal()
	} catch (error) {
		uni.hideLoading()
		console.error('调整库存失败:', error)
		const errorMsg = error.message || error.detail || error.msg || '调整失败，请重试'
		uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
	}
}


const showSortMenu = () => {
	uni.showActionSheet({
		itemList: ['按库存从高到低', '按库存从低到高', '按名称排序'],
		success: (res) => {
			if (res.tapIndex === 0) {
				inventory.value.sort((a, b) => b.stock - a.stock)
			} else if (res.tapIndex === 1) {
				inventory.value.sort((a, b) => a.stock - b.stock)
			} else {
				inventory.value.sort((a, b) => a.name.localeCompare(b.name))
			}
			refreshStats()
		}
	})
}

/**
 * 加载商品列表（分页加载所有商品，包括已下架的商品）
 */
const loadProductList = async () => {
	try {
		uni.showLoading({ title: '加载中...' })
		
		let allProducts = []
		let currentPage = 1
		const pageSize = 100 // 每页数量
		let hasMore = true
		
		// 循环加载所有页面
		while (hasMore) {
			console.log(`[库存管理] 正在加载第 ${currentPage} 页商品...`)
			
			// 调用商品列表接口，不传status参数以获取所有商品（包括已下架的）
			const res = await getProductList({ 
				page: currentPage, 
				pageSize: pageSize,
				size: pageSize // 兼容不同的参数名
			})
			
			// 解析响应数据
			let products = []
			let total = 0
			let totalPages = 0
			
			if (res.data) {
				// 尝试获取总数和总页数
				if (res.data.total !== undefined) {
					total = res.data.total
					totalPages = Math.ceil(total / pageSize)
				}
				if (res.data.totalPages !== undefined) {
					totalPages = res.data.totalPages
				}
				if (res.data.pages !== undefined) {
					totalPages = res.data.pages
				}
				
				// 获取商品列表
				if (Array.isArray(res.data.rows)) {
					products = res.data.rows
				} else if (Array.isArray(res.data.list)) {
					products = res.data.list
				} else if (Array.isArray(res.data.data)) {
					products = res.data.data
				} else if (Array.isArray(res.data)) {
					products = res.data
				}
			} else if (Array.isArray(res.rows)) {
				products = res.rows
			} else if (Array.isArray(res.list)) {
				products = res.list
			} else if (Array.isArray(res)) {
				products = res
			}
			
			// 合并到总列表
			if (products && products.length > 0) {
				allProducts = allProducts.concat(products)
				console.log(`[库存管理] 第 ${currentPage} 页加载了 ${products.length} 个商品，累计 ${allProducts.length} 个`)
			}
			
			// 判断是否还有更多数据
			if (totalPages > 0) {
				// 如果有总页数信息，使用总页数判断
				hasMore = currentPage < totalPages
			} else {
				// 如果没有总页数信息，根据当前页返回的数据量判断
				hasMore = products && products.length >= pageSize
			}
			
			currentPage++
			
			// 防止无限循环（最多加载100页）
			if (currentPage > 100) {
				console.warn('[库存管理] 已达到最大页数限制（100页），停止加载')
				hasMore = false
			}
		}
		
		console.log(`[库存管理] 共加载 ${allProducts.length} 个商品`)
		
		let products = allProducts
		
		// 过滤掉轮播图商品（名称包含"轮播图"或SKU以"BANNER-"开头）
		products = products.filter(product => {
			const productName = (product.name || product.product_name || '').toLowerCase()
			const isBannerByName = productName.includes('轮播图')
			
			// 检查SKU
			let isBannerBySku = false
			if (product.skus && product.skus.length > 0) {
				const sku = product.skus[0]
				const skuCode = (sku.sku_code || sku.sku || '').toUpperCase()
				isBannerBySku = skuCode.startsWith('BANNER-')
			}
			if (product.sku_code) {
				const skuCode = (product.sku_code || '').toUpperCase()
				isBannerBySku = isBannerBySku || skuCode.startsWith('BANNER-')
			}
			if (product.sku) {
				const skuCode = (product.sku || '').toUpperCase()
				isBannerBySku = isBannerBySku || skuCode.startsWith('BANNER-')
			}
			
			if (isBannerByName || isBannerBySku) {
				console.log(`[库存管理] 过滤掉轮播图商品: ${product.name} (ID: ${product.id})`)
				return false
			}
			
			return true
		})
		
		// 转换为库存管理格式
		inventory.value = products.map(product => {
			// 获取第一个SKU的库存信息，或者使用商品本身的库存
			const sku = product.skus && product.skus.length > 0 ? product.skus[0] : null
			const stock = sku ? (sku.stock || sku.inventory || 0) : (product.stock || product.inventory || 0)
			const minStock = sku ? (sku.min_stock || sku.minStock || 10) : (product.min_stock || product.minStock || 10)
			
			// 处理图片路径
			let image = product.banner_images && product.banner_images.length > 0 
				? product.banner_images[0] 
				: (product.main_image || product.image || product.image_url || product.cover_image || '/static/logo.png')
			
			// 如果图片是相对路径，需要拼接服务器地址
			if (image && !image.startsWith('http') && !image.startsWith('/static') && !image.startsWith('data:')) {
				const imagePath = image.startsWith('/') ? image : `/${image}`
				image = `${config.baseURL}${imagePath}`
			}
			
			return {
				id: product.id || product.product_id,
				name: product.name || product.product_name,
				sku: sku ? (sku.sku || sku.sku_code || `SKU-${sku.id || sku.sku_id}`) : (product.sku || `SKU-${product.id}`),
				stock: stock,
				minStock: minStock,
				unit: sku ? (sku.unit || '件') : (product.unit || '件'),
				image: image,
				productData: product, // 保存原始商品数据，用于更新
				skuData: sku // 保存SKU数据，用于更新
			}
		})
		
		refreshStats()
		uni.hideLoading()
	} catch (error) {
		console.error('加载商品列表失败:', error)
		uni.hideLoading()
		uni.showToast({ title: '加载失败', icon: 'none' })
		inventory.value = []
		refreshStats()
	}
}

const reloadInventory = () => {
	loadProductList()
}

onMounted(() => {
	loadProductList()
})

onShow(() => {
	loadProductList()
})
</script>

<style scoped>
.inventory-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: 40rpx;
}

.search-bar {
	background: white;
	padding: 20rpx 30rpx;
	display: flex;
	gap: 16rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.search-box {
	flex: 1;
	position: relative;
}

.search-input {
	width: 100%;
	padding: 20rpx 60rpx 20rpx 20rpx;
	background: #f5f5f5;
	border-radius: 25rpx;
	font-size: 26rpx;
}

.search-icon {
	position: absolute;
	right: 20rpx;
	top: 50%;
	transform: translateY(-50%);
	font-size: 28rpx;
}

.sort-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 20rpx 24rpx;
	background: #f5f5f5;
	border-radius: 25rpx;
}

.sort-text {
	font-size: 26rpx;
	color: #666;
}

.sort-arrow {
	font-size: 20rpx;
	color: #999;
}

.inventory-list {
	padding: 20rpx 30rpx;
}

.inventory-item {
	background: white;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
	display: flex;
	gap: 20rpx;
}

.product-image {
	width: 120rpx;
	height: 120rpx;
	border-radius: 12rpx;
	flex-shrink: 0;
}

.product-info {
	flex: 1;
}

.product-name {
	display: block;
	font-size: 28rpx;
	color: #333;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.product-sku {
	display: block;
	font-size: 22rpx;
	color: #999;
	margin-bottom: 12rpx;
}

.stock-info {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.stock-label {
	font-size: 24rpx;
	color: #666;
}

.stock-value {
	font-size: 28rpx;
	font-weight: bold;
}

.stock-value.normal {
	color: #4caf50;
}

.stock-value.low {
	color: #ff9800;
}

.stock-value.out {
	color: #f44336;
}

.stock-unit {
	font-size: 22rpx;
	color: #999;
}

.item-actions {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.item-actions .action-btn {
	padding: 14rpx 20rpx;
	border: none;
	border-radius: 10rpx;
	font-size: 24rpx;
	font-weight: 500;
	text-align: center;
	transition: all 0.3s ease;
}

.item-actions .action-btn:active {
	transform: scale(0.95);
}

.item-actions .action-btn.primary {
	background: linear-gradient(135deg, #4CAF50, #66BB6A);
	color: white;
}

.item-actions .action-btn.secondary {
	background: linear-gradient(135deg, #2196F3, #42A5F5);
	color: white;
}

.action-btn {
	padding: 12rpx 24rpx;
	font-size: 24rpx;
	background: #ff9800;
	color: white;
	border-radius: 20rpx;
	border: none;
	height: auto;
	line-height: 1.5;
}

.action-btn.secondary {
	background: #f5f5f5;
	color: #666;
}

.empty-state {
	text-align: center;
	padding: 120rpx 0;
}

.empty-icon {
	display: block;
	font-size: 120rpx;
	margin-bottom: 20rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 弹窗样式 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	border-radius: 20rpx;
	width: 600rpx;
	max-height: 80vh;
	overflow-y: auto;
}

.modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.modal-close {
	font-size: 48rpx;
	color: #999;
}

.modal-body {
	padding: 30rpx;
}

.adjust-info {
	display: flex;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}

.info-label {
	font-size: 26rpx;
	color: #666;
}

.info-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 600;
}

.adjust-type {
	display: flex;
	gap: 20rpx;
	margin: 24rpx 0;
}

.type-btn {
	flex: 1;
	padding: 20rpx;
	text-align: center;
	background: #f5f5f5;
	border-radius: 12rpx;
	font-size: 26rpx;
	color: #666;
}

.type-btn.active {
	background: #ff9800;
	color: white;
}

.adjust-input {
	margin-bottom: 24rpx;
}

.input-label {
	display: block;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
}

.input-field {
	width: 100%;
	padding: 20rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	font-size: 26rpx;
}

.textarea-field {
	width: 100%;
	padding: 20rpx;
	background: #f5f5f5;
	border-radius: 12rpx;
	font-size: 26rpx;
	min-height: 120rpx;
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 30rpx;
	border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
	flex: 1;
	height: 72rpx;
	border-radius: 36rpx;
	font-size: 28rpx;
	border: none;
}

.modal-btn.cancel {
	background: #f5f5f5;
	color: #666;
}

.modal-btn.confirm {
	background: #ff9800;
	color: white;
}
</style>
