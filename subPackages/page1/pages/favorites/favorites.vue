<template>
  <view class="favorites-page">
    <scroll-view 
      class="page-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @refresherrestore="onRestore"
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
      <!-- 空状态 -->
      <view v-if="favoriteList.length === 0 && !loading" class="empty-state">
        <view class="empty-icon iconfont icon-shoucang"></view>
        <text class="empty-title">暂无收藏商品</text>
        <text class="empty-desc">收藏喜欢的商品，方便下次查看</text>
        <button class="go-shopping-btn" @tap="goToShopping">去逛逛</button>
      </view>

      <!-- 收藏列表 -->
      <view v-else class="favorites-content">
        <!-- 批量操作栏 -->
        <view v-if="batchMode" class="batch-actions">
          <view class="batch-info">
            <text class="selected-count">已选择 {{ selectedItems.length }} 件商品</text>
          </view>
          <view class="batch-buttons">
            <button class="batch-btn select-all-btn" @tap="toggleSelectAll">
              {{ isAllSelected ? '取消全选' : '全选' }}
            </button>
            <button 
              class="batch-btn delete-btn" 
              @tap="batchDelete"
              :disabled="selectedItems.length === 0"
            >
              删除收藏
            </button>
          </view>
        </view>

        <!-- 商品列表 -->
        <view class="product-list">
          <view 
            v-for="item in favoriteList" 
            :key="item.id"
            class="product-item"
            :class="{ selected: batchMode && selectedItems.includes(item.id) }"
            @tap="handleItemClick(item)"
          >
            <!-- 批量选择框 -->
            <view v-if="batchMode" class="batch-checkbox" @tap.stop="toggleSelect(item.id)">
              <text class="checkbox">{{ selectedItems.includes(item.id) ? '☑️' : '☐' }}</text>
            </view>

            <!-- 商品图片 -->
            <image 
              :src="item.image || item.product_image || '/static/product1.jpg'" 
              mode="aspectFill" 
              class="product-image"
              @tap.stop="goToProductDetail(item)"
            />

            <!-- 商品信息 -->
            <view class="product-info">
              <text class="product-name" @tap.stop="goToProductDetail(item)">
                {{ item.name || item.product_name }}
              </text>
              
              <!-- 标签 -->
              <view class="product-badges">
                <view v-if="item.is_vip" class="badge vip-badge">
                  <text class="badge-text">会员</text>
                </view>
                <view v-if="item.is_hot" class="badge hot-badge">
                  <text class="badge-text">热销</text>
                </view>
              </view>

              <view class="price-row">
                <text class="current-price">¥{{ item.price || item.product_price }}</text>
                <text v-if="item.origin_price && item.origin_price > item.price" class="origin-price">
                  ¥{{ item.origin_price }}
                </text>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="product-actions">
              <view class="action-btn favorite-btn" @tap.stop="removeFromFavorites(item.id)">
                <text class="action-icon iconfont icon-shoucang favorited"></text>
              </view>
              <view class="action-btn cart-btn" @tap.stop="addToCart(item)">
                <text class="action-icon iconfont icon-gouwuche"></text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载中 -->
        <view v-if="loading && favoriteList.length > 0" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 已加载完 -->
        <view v-if="!hasMore && favoriteList.length > 0" class="no-more">
          <text class="no-more-text">已显示全部</text>
        </view>

        <!-- 没有更多了 -->
        <view v-if="!hasMore && favoriteList.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 浮动操作按钮 -->
    <view class="floating-actions">
      <view class="action-btn" @tap="toggleBatchMode">
        <text class="action-icon">{{ batchMode ? '✓' : '☰' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { getFavoriteList, removeFromFavorites as removeFromFavoritesApi, batchRemoveFavorites } from '../../api/favorites.js'
import { addToCart as addToCartApi } from '../../api/cart.js'

const favoriteList = ref([])
const loading = ref(false)
const refreshing = ref(false)
const batchMode = ref(false)
const selectedItems = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 计算属性
const isAllSelected = computed(() => {
  return favoriteList.value.length > 0 && selectedItems.value.length === favoriteList.value.length
})

// 删除初始化示例收藏数据函数

/**
 * 加载收藏列表（本地存储，按用户ID）
 */
const loadFavorites = async (isRefresh = false) => {
  if (loading.value && !isRefresh) return

  try {
    loading.value = true
    
    // 检查是否已登录
    const userInfo = uni.getStorageSync('userInfo') || {}
    if (!userInfo.id && !userInfo.user_id && !userInfo.userId) {
      console.log('未登录，显示空列表')
      favoriteList.value = []
      hasMore.value = false
      return
    }
    
    // 从本地存储获取收藏列表
      const page = isRefresh ? 1 : currentPage.value
      const params = { page, pageSize: pageSize.value }
      const res = await getFavoriteList(params)
      
    // 处理响应数据
      let newItems = []
      if (Array.isArray(res)) {
        newItems = res
      } else if (res.data && Array.isArray(res.data)) {
        newItems = res.data
      } else if (res.items && Array.isArray(res.items)) {
        newItems = res.items
      } else if (res.list && Array.isArray(res.list)) {
        newItems = res.list
      }

      if (isRefresh) {
        favoriteList.value = newItems
        currentPage.value = 1
      } else {
        favoriteList.value = [...favoriteList.value, ...newItems]
      }

    hasMore.value = res.hasMore !== undefined ? res.hasMore : (newItems.length >= pageSize.value)
    
  } catch (error) {
    console.error('加载收藏列表失败:', error)
    favoriteList.value = []
    hasMore.value = false
  } finally {
    loading.value = false
    refreshing.value = false
    if (isRefresh) {
      uni.stopPullDownRefresh()
    }
  }
}

/**
 * 下拉刷新（加载下一页）
 */
const onRefresh = () => {
  refreshing.value = true
  selectedItems.value = []
  // 下拉刷新时加载下一页
  if (hasMore.value && !loading.value) {
    currentPage.value++
    loadFavorites(false)
  } else {
    refreshing.value = false
  }
}

/**
 * 恢复下拉状态
 */
const onRestore = () => {
  refreshing.value = false
}

/**
 * 加载更多
 */
const loadMore = () => {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  loadFavorites()
}

/**
 * 切换批量模式
 */
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedItems.value = []
  }
}

/**
 * 切换选择状态
 */
const toggleSelect = (itemId) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

/**
 * 全选/取消全选
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = favoriteList.value.map(item => item.id)
  }
}

/**
 * 处理商品点击
 */
const handleItemClick = (item) => {
  if (batchMode.value) {
    toggleSelect(item.id)
  } else {
    goToProductDetail(item)
  }
}

/**
 * 跳转商品详情
 */
const goToProductDetail = (item) => {
  const productId = item.product_id || item.id
  uni.navigateTo({ 
    url: `/subPackages/page2/pages/product/detail?id=${productId}` 
  })
}

/**
 * 移除单个收藏（本地存储）
 */
const removeFromFavorites = async (productId) => {
  try {
    uni.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 使用本地存储API删除
            await removeFromFavoritesApi(productId)
          
          // 从列表中移除
          const index = favoriteList.value.findIndex(item => 
              item.id === productId || item.product_id === productId ||
              String(item.id) === String(productId) || String(item.product_id) === String(productId)
          )
          if (index > -1) {
            favoriteList.value.splice(index, 1)
          }
          
          // 从选中项中移除
          const selectedIndex = selectedItems.value.indexOf(productId)
          if (selectedIndex > -1) {
            selectedItems.value.splice(selectedIndex, 1)
          }
          
          uni.showToast({ title: '已取消收藏', icon: 'success' })
          } catch (error) {
            console.error('取消收藏失败:', error)
            uni.showToast({ 
              title: error.message || error.msg || '操作失败', 
              icon: 'none' 
            })
          }
        }
      }
    })
  } catch (error) {
    console.error('取消收藏失败:', error)
    uni.showToast({ 
      title: error.message || error.msg || '操作失败', 
      icon: 'none' 
    })
  }
}

/**
 * 批量删除收藏（本地存储）
 */
const batchDelete = async () => {
  if (selectedItems.value.length === 0) return

  try {
    uni.showModal({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedItems.value.length} 件商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 使用本地存储API批量删除
            await batchRemoveFavorites(selectedItems.value)
          
          // 从列表中移除
            favoriteList.value = favoriteList.value.filter(item => {
              const itemId = item.id || item.product_id
              return !selectedItems.value.some(selectedId => 
                itemId === selectedId || 
                String(itemId) === String(selectedId)
          )
            })
          
          selectedItems.value = []
          batchMode.value = false
          
          uni.showToast({ title: '删除成功', icon: 'success' })
          } catch (error) {
            console.error('批量删除失败:', error)
            uni.showToast({ 
              title: error.message || error.msg || '操作失败', 
              icon: 'none' 
            })
          }
        }
      }
    })
  } catch (error) {
    console.error('批量删除失败:', error)
    uni.showToast({ 
      title: error.message || error.msg || '操作失败', 
      icon: 'none' 
    })
  }
}

/**
 * 加入购物车
 */
const addToCart = async (item) => {
  try {
    // 获取用户信息
    const userInfo = uni.getStorageSync('userInfo') || {}
    const userId = userInfo.id || userInfo.user_id
    
    if (!userId) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    
    const productId = item.product_id || item.id
    await addToCartApi({ 
      user_id: userId,
      product_id: productId, 
      quantity: 1 
    })
    
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } catch (error) {
    console.error('加入购物车失败:', error)
    uni.showToast({ 
      title: error.message || error.msg || '操作失败', 
      icon: 'none' 
    })
  }
}

/**
 * 去购物
 */
const goToShopping = () => {
  uni.switchTab({ url: '/pages/home/home' })
}

onMounted(() => {
  loadFavorites(true)
})

onShow(() => {
  // 页面显示时刷新数据
  loadFavorites(true)
})

onPullDownRefresh(() => {
  loadFavorites(true)
})
</script>

<style scoped>
/* 引入 iconfont 样式 */
@import "@/static/999/iconfont.css";

.favorites-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-scroll {
  height: 100vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
  color: #ff4757 !important;
  opacity: 0.6;
}

.empty-title {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 60rpx;
  text-align: center;
}

.go-shopping-btn {
  background: #ff4757;
  color: white;
  font-size: 28rpx;
  padding: 20rpx 60rpx;
  border-radius: 40rpx;
  border: none;
}

.favorites-content {
  padding: 20rpx;
}

.batch-actions {
  background: white;
  padding: 20rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-info {
  flex: 1;
}

.selected-count {
  font-size: 28rpx;
  color: #333;
}

.batch-buttons {
  display: flex;
  gap: 16rpx;
}

.batch-btn {
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  border-radius: 20rpx;
  border: none;
}

.select-all-btn {
  background: #f0f0f0;
  color: #666;
}

.delete-btn {
  background: #ff4757;
  color: white;
}

.delete-btn:disabled {
  opacity: 0.5;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.product-item {
  background: white;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  position: relative;
  transition: all 0.3s;
}

.product-item.selected {
  background: #f0f8ff;
  border: 2rpx solid #3d6bff;
}

.batch-checkbox {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox {
  font-size: 32rpx;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-badges {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.badge {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.vip-badge {
  background: #ffe8e8;
  color: #ff4757;
}

.hot-badge {
  background: #e8f0ff;
  color: #3d6bff;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.current-price {
  font-size: 32rpx;
  color: #ff4757;
  font-weight: bold;
}

.origin-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  flex-shrink: 0;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.favorite-btn {
  background: #ffe8e8;
}

.cart-btn {
  background: #e8f0ff;
}

.action-icon {
  font-family: "iconfont" !important;
  font-size: 28rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: inline-block;
  line-height: 1;
}

.action-icon.iconfont {
  font-family: "iconfont" !important;
}

.action-icon.icon-shoucang.favorited {
  color: #ffc107 !important; /* 金黄色 - 已收藏 */
}

.action-icon.icon-gouwuche {
  color: #3d6bff !important;
}

.load-more, .no-more {
  text-align: center;
  padding: 40rpx;
}

.load-more-text, .no-more-text {
  font-size: 26rpx;
  color: #999;
}

.floating-actions {
  position: fixed;
  bottom: 160rpx;
  right: 40rpx;
  z-index: 999;
}

.floating-actions .action-btn {
  width: 80rpx;
  height: 80rpx;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  box-shadow: 0 4rpx 16rpx rgba(255, 71, 87, 0.3);
  margin-bottom: 20rpx;
}

.bottom-space {
  height: 160rpx;
}
</style>