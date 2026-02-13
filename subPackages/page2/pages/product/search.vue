<template>
  <view class="search-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="iconfont icon-sousuo search-icon"></text>
        <input 
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索商品"
          focus
          confirm-type="search"
          @confirm="handleSearch"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="clearKeyword">×</text>
      </view>
      <text class="search-btn" @click="handleSearch">搜索</text>
    </view>

    <!-- 热门搜索 - 只在没有输入时显示 -->
    <view v-if="!searchKeyword" class="hot-search-section">
      <view class="section-header">
        <text class="section-title">🔥 热门搜索</text>
      </view>
      <view class="hot-tags">
        <view 
          v-for="(item, index) in hotSearchList" 
          :key="index"
          class="hot-tag"
          @click="searchByKeyword(item)"
        >
          <text class="hot-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</text>
          <text class="hot-text">{{ item }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索历史 - 只在没有输入时显示 -->
    <view v-if="!searchKeyword && searchHistory.length > 0" class="history-section">
      <view class="section-header">
        <text class="section-title">🕐 搜索历史</text>
        <text class="clear-history" @click="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view 
          v-for="(item, index) in searchHistory" 
          :key="index"
          class="history-item"
          @click="searchByKeyword(item)"
        >
          <text class="history-icon iconfont icon-sousuo"></text>
          <text class="history-text">{{ item }}</text>
          <text class="delete-icon" @click.stop="deleteHistory(index)">×</text>
        </view>
      </view>
    </view>

    <!-- 搜索建议 - 只在有输入时显示 -->
    <view v-if="searchKeyword && suggestions.length > 0 && !searchResults.length" class="suggestions-section">
      <view 
        v-for="(item, index) in suggestions" 
        :key="index"
        class="suggestion-item"
        @click="searchByKeyword(item)"
      >
        <text class="suggestion-icon iconfont icon-sousuo"></text>
        <text class="suggestion-text">{{ item }}</text>
        <text class="suggestion-arrow">→</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="searchKeyword && searchResults.length > 0" class="search-results">
      <!-- 排序栏 -->
      <view class="sort-bar">
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'default' }"
          @click="setSortType('default')"
        >
          <text class="sort-text">综合</text>
        </view>
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'sales' }"
          @click="setSortType('sales')"
        >
          <text class="sort-text">销量</text>
        </view>
        <view 
          class="sort-item" 
          :class="{ active: sortType === 'price' }"
          @click="setSortType('price')"
        >
          <text class="sort-text">价格</text>
          <view class="price-arrows">
            <text class="arrow-up" :class="{ active: sortType === 'price' && priceOrder === 'asc' }">▲</text>
            <text class="arrow-down" :class="{ active: sortType === 'price' && priceOrder === 'desc' }">▼</text>
          </view>
        </view>
      </view>
      
      <view class="results-header">
        <text class="results-count">找到 {{ sortedResults.length }} 个商品</text>
      </view>
      <view class="results-grid">
        <view 
          v-for="product in sortedResults" 
          :key="product.id"
          class="result-item"
          @click="goToDetail(product.id)"
        >
          <image :src="product.image" class="result-image" mode="aspectFill" />
          <view class="result-info">
            <text class="result-name">{{ product.name }}</text>
            <view class="result-price-row">
              <text class="result-price">¥{{ product.price }}</text>
              <text v-if="product.originPrice" class="result-origin-price">¥{{ product.originPrice }}</text>
            </view>
            <view v-if="product.isVip" class="result-vip-tag">会员专享</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索中状态 -->
    <view v-if="searching" class="searching-state">
      <text class="searching-text">搜索中...</text>
    </view>

    <!-- 无结果状态 -->
    <view v-if="searchKeyword && !searching && searchResults.length === 0 && hasSearched" class="no-results">
      <text class="no-results-icon iconfont icon-sousuo"></text>
      <text class="no-results-text">未找到相关商品</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { searchProducts } from '@/api/product.js'
import config from '@/utils/config.js'

const searchKeyword = ref('')
const searchHistory = ref([])
const searchResults = ref([])
const searching = ref(false)
const hasSearched = ref(false)

// 排序相关
const sortType = ref('default') // default: 综合, sales: 销量, price: 价格
const priceOrder = ref('asc') // asc: 升序, desc: 降序

// 热门搜索 - 从 API 获取
const hotSearchList = ref([])

/**
 * 加载热门搜索
 */
const loadHotSearch = async () => {
	try {
		// 如果没有专门的 API，可以从商品分类或搜索统计中获取
		// 暂时返回空数组，等待后端提供 API
		hotSearchList.value = []
	} catch (error) {
		console.error('加载热门搜索失败', error)
		hotSearchList.value = []
	}
}

// 搜索建议
const suggestions = computed(() => {
  if (!searchKeyword.value) return []
  
  const keyword = searchKeyword.value.toLowerCase()
  const allKeywords = [...hotSearchList.value, ...searchHistory.value]
  
  return allKeywords
    .filter(item => item.toLowerCase().includes(keyword))
    .slice(0, 5)
})

// 排序后的结果
const sortedResults = computed(() => {
  if (!searchResults.value || searchResults.value.length === 0) {
    return []
  }
  
  let result = [...searchResults.value]
  
  // 根据排序类型排序
  if (sortType.value === 'sales') {
    // 按销量降序
    result.sort((a, b) => (b.sales || 0) - (a.sales || 0))
  } else if (sortType.value === 'price') {
    // 按价格排序
    if (priceOrder.value === 'asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else {
      result.sort((a, b) => (b.price || 0) - (a.price || 0))
    }
  }
  // default: 综合排序，保持原顺序（按搜索相关性）
  
  return result
})

/**
 * 加载搜索历史
 */
const loadHistory = () => {
  const history = uni.getStorageSync('searchHistory') || []
  searchHistory.value = history
}

/**
 * 保存搜索历史
 */
const saveHistory = (keyword) => {
  if (!keyword.trim()) return
  
  // 去重，将新搜索的关键词放到最前面
  let history = searchHistory.value.filter(item => item !== keyword)
  history.unshift(keyword)
  
  // 最多保存10条
  if (history.length > 10) {
    history = history.slice(0, 10)
  }
  
  searchHistory.value = history
  uni.setStorageSync('searchHistory', history)
}

/**
 * 执行搜索（调用模糊搜索接口）
 */
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }
  
  saveHistory(searchKeyword.value)
  await performSearch(searchKeyword.value)
}

/**
 * 点击关键词搜索
 */
const searchByKeyword = async (keyword) => {
  searchKeyword.value = keyword
  saveHistory(keyword)
  await performSearch(keyword)
}

/**
 * 执行模糊搜索
 */
const performSearch = async (keyword) => {
  if (!keyword || !keyword.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  searching.value = true
  hasSearched.value = true
  searchResults.value = []
  // 重置排序
  sortType.value = 'default'
  priceOrder.value = 'asc'

  try {
    const res = await searchProducts({
      keyword: keyword.trim(),
      page: 1,
      pageSize: 100
    })

    if (res && res.data) {
      const productList = res.data.list || res.data || []
      
      // 处理图片URL的辅助函数
      const processImageUrl = (img) => {
        if (!img) return null
        if (img.startsWith('http://') || img.startsWith('https://')) return img
        if (img.startsWith('/static')) return img
        const imagePath = img.startsWith('/') ? img : `/${img}`
        return `${config.baseURL}${imagePath}`
      }
      
      searchResults.value = productList
        .filter(p => {
          // 过滤掉已下架的商品
          const isOnSale = p.status === 'on_sale' || p.status === 1 || p.status === 'active'
          // 过滤掉名称中包含"轮播图"的假商品
          const name = (p.name || '').toString()
          const isNotBanner = !name.includes('轮播图')
          return isOnSale && isNotBanner
        })
        .map(p => {
          // 处理图片：优先使用 banner_images 数组的第一张，然后尝试其他字段
          let image = null
          
          // 优先使用 banner_images 数组的第一张
          if (p.banner_images && Array.isArray(p.banner_images) && p.banner_images.length > 0) {
            image = processImageUrl(p.banner_images[0])
          }
          
          // 如果没有 banner_images，尝试使用 images 数组
          if (!image && p.images && Array.isArray(p.images) && p.images.length > 0) {
            image = processImageUrl(p.images[0])
          }
          
          // 如果还没有，尝试使用 main_image
          if (!image && p.main_image) {
            image = processImageUrl(p.main_image)
          }
          
          // 如果还没有，尝试其他字段
          if (!image) {
            image = processImageUrl(p.image_url) || processImageUrl(p.image) || '/static/logo.png'
          }
          
          // 处理价格：使用 SKU 中的 price（现价）和 original_price（原价）
          let price = 0
          let originPrice = null
          const isMemberProduct = p.is_member_product === 1 || p.is_member_product === true
          
          // 优先使用第一个 SKU 的价格
          if (p.skus && p.skus.length > 0) {
            const firstSku = p.skus[0]
            if (firstSku.price !== undefined && firstSku.price !== null) {
              price = parseFloat(firstSku.price)
            }
            if (firstSku.original_price !== undefined && firstSku.original_price !== null) {
              originPrice = parseFloat(firstSku.original_price)
            }
          } else if (p.price) {
            // 如果没有 SKU，使用商品级别的价格
            price = parseFloat(p.price)
          }
          
          return {
            id: p.id,
            name: p.name,
            price: price,
            originPrice: originPrice, // 使用 SKU 中的 original_price
            image: image,
            sales: p.sales || 0,
            isVip: isMemberProduct,
            category: p.category || '',
            tags: (p.attributes || []).map(attr => attr.value).filter(Boolean) || p.tags || []
          }
        })
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
    uni.showToast({ title: '搜索失败，请重试', icon: 'none' })
  } finally {
    searching.value = false
  }
}

/**
 * 跳转到商品详情
 */
const goToDetail = (productId) => {
  uni.navigateTo({ url: `/subPackages/page2/pages/product/detail?id=${productId}` })
}

/**
 * 清空输入
 */
const clearKeyword = () => {
  searchKeyword.value = ''
  searchResults.value = []
  hasSearched.value = false
}

/**
 * 删除单条历史
 */
const deleteHistory = (index) => {
  searchHistory.value.splice(index, 1)
  uni.setStorageSync('searchHistory', searchHistory.value)
}

/**
 * 清空历史
 */
const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = []
        uni.removeStorageSync('searchHistory')
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

/**
 * 设置排序类型
 */
const setSortType = (type) => {
  if (type === 'price') {
    // 如果是价格排序，切换升序/降序
    if (sortType.value === 'price') {
      priceOrder.value = priceOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortType.value = 'price'
      priceOrder.value = 'asc' // 默认升序
    }
  } else {
    sortType.value = type
  }
}

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

onLoad(() => {
  loadHistory()
  loadHotSearch()
  uni.setNavigationBarTitle({ title: '搜索商品' })
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: white;
  border-bottom: 1rpx solid #eee;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #f5f5f5;
  border-radius: 50rpx;
}

.search-icon {
  font-size: 36rpx;
  color: #999;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.clear-icon {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.search-btn {
	font-size: 28rpx;
	color: #576b95;
	font-weight: 500;
	padding: 8rpx 16rpx;
}

/* 热门搜索 */
.hot-search-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.hot-tags {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.hot-tag {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.hot-rank {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e0e0;
  color: #666;
  font-size: 20rpx;
  font-weight: bold;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.hot-rank.rank-1 {
  background: linear-gradient(135deg, #ff6b6b, #ff4757);
  color: white;
}

.hot-rank.rank-2 {
  background: linear-gradient(135deg, #ffa502, #ff6348);
  color: white;
}

.hot-rank.rank-3 {
  background: linear-gradient(135deg, #ffd32a, #ffb142);
  color: white;
}

.hot-text {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 搜索历史 */
.history-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.clear-history {
  font-size: 24rpx;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.history-icon {
  font-size: 28rpx;
  color: #999;
}

.history-text {
  flex: 1;
  font-size: 28rpx;
  color: #666;
}

.delete-icon {
  font-size: 40rpx;
  color: #ccc;
  line-height: 1;
}

/* 搜索建议 */
.suggestions-section {
  background: white;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.suggestion-icon {
  font-size: 28rpx;
  color: #999;
}

.suggestion-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.suggestion-arrow {
  font-size: 24rpx;
  color: #ccc;
}

/* 搜索结果 */
.search-results {
  background: white;
  min-height: 100vh;
  padding: 30rpx;
}

/* 排序栏 - 淘宝样式 */
.sort-bar {
  display: flex;
  align-items: center;
  background: white;
  border-bottom: 1rpx solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.sort-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 28rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
  transition: color 0.2s;
}

.sort-item:active {
  background: #f5f5f5;
}

.sort-item.active {
  color: #ff4757;
  font-weight: 600;
}

.sort-item.active::after {
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

.sort-text {
  font-size: 28rpx;
  line-height: 1;
}

.price-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-left: 6rpx;
  height: 32rpx;
}

.arrow-up,
.arrow-down {
  font-size: 16rpx;
  line-height: 0.8;
  color: #999;
  transition: color 0.2s;
  height: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-up {
  margin-bottom: -2rpx;
}

.arrow-down {
  margin-top: -2rpx;
}

.arrow-up.active {
  color: #ff4757;
}

.arrow-down.active {
  color: #ff4757;
}

.results-header {
  margin-bottom: 30rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.results-count {
  font-size: 28rpx;
  color: #666;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.result-item {
  background: #f8f9fa;
  border-radius: 16rpx;
  overflow: hidden;
}

.result-image {
  width: 100%;
  height: 300rpx;
}

.result-info {
  padding: 20rpx;
}

.result-name {
  display: block;
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.result-price {
  font-size: 30rpx;
  color: #ff4757;
  font-weight: bold;
}

.result-origin-price {
  font-size: 22rpx;
  color: #999;
  text-decoration: line-through;
}

.result-vip-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 600;
}

/* 搜索中状态 */
.searching-state {
  text-align: center;
  padding: 200rpx 0;
}

.searching-text {
  font-size: 28rpx;
  color: #999;
}

/* 无结果状态 */
.no-results {
  text-align: center;
  padding: 200rpx 0;
}

.no-results-icon {
  display: block;
  font-size: 120rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.no-results-text {
  display: block;
  font-size: 32rpx;
  color: #999;
}
</style>
