<template>
  <view class="address-list-page">
    <!-- 地址列表 -->
    <scroll-view 
      class="address-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @refresherrestore="onRestore"
      @scrolltolower="handleScrollToLower"
      :lower-threshold="50"
      enable-back-to-top
    >
    <view class="address-list">
      <view 
        v-for="address in addressList" 
        :key="address.id"
        class="address-item"
        :class="{ 
          'select-mode': true,
          'selected': selectedAddressId === address.id 
        }"
      >
        <!-- 选择图标（选择模式和管理模式都显示） -->
        <view 
          class="select-icon" 
          :class="{ 
            'selected-icon': selectedAddressId === address.id,
            'clickable': true
          }"
          @tap.stop="handleIconClick(address)"
        >
          <text v-if="selectedAddressId === address.id" class="icon-text">✓</text>
        </view>
        
        <view class="address-content" @tap="selectAddress(address)">
          <view class="address-header">
            <text class="receiver-name">{{ address.name }}</text>
            <text class="receiver-phone">{{ address.phone || address.mobile }}</text>
            <view v-if="address.is_default || address.isDefault" class="default-tag" @tap.stop="setAsDefault(address)">默认</view>
            <view v-else class="set-default-btn" @tap.stop="setAsDefault(address)">设为默认</view>
          </view>
          <text class="address-detail">{{ address.fullAddress || `${address.province}${address.city}${address.district}${address.detail}` }}</text>
        </view>
        
        <!-- 操作按钮 -->
        <view class="address-actions">
          <view class="action-icon edit-icon" @tap.stop="editAddress(address)">
            <text class="icon iconfont icon-bianji"></text>
          </view>
          <view class="action-icon delete-icon" @tap.stop="deleteAddress(address.id)">
            <text class="icon iconfont icon-shanchu"></text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="addressList.length === 0" class="empty-state">
      <text class="empty-text">暂无收货地址</text>
      <text class="empty-desc">添加收货地址，享受便捷购物体验</text>
    </view>
    
    <!-- 加载更多提示 -->
    <view v-if="loading" class="loading-more">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 没有更多数据提示 -->
    <view v-if="!loading && addressList.length > 0 && !hasMore" class="no-more">
      <text class="no-more-text">没有更多地址了</text>
    </view>
    </scroll-view>
    
    <!-- 添加地址按钮 -->
    <view class="add-address-btn" @tap="addAddress">
      <text class="add-btn-text">+ 添加新地址</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getAddressList, deleteAddress as deleteAddressApi, setDefaultAddress } from '@/api/user.js'
import { setStorage, removeStorage } from '@/utils/storage.js'

const addressList = ref([])
const isSelectMode = ref(false)
const selectedAddressId = ref(null)
const refreshing = ref(false)
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = ref(20)

/**
 * 处理圆圈图标点击
 */
const handleIconClick = (address) => {
  // 点击圆圈选择地址
  selectAddress(address)
}

/**
 * 选择地址（用于订单确认页面）
 */
const selectAddress = (address) => {
  // 设置选中状态，给用户视觉反馈
  selectedAddressId.value = address.id
  
  console.log('选中地址:', address.name, 'ID:', address.id)
  
  // 格式化地址数据，确保包含所有必要字段
  const formattedAddress = {
    ...address,
    id: address.id || address.addr_id,
    addr_id: address.addr_id || address.id,
    phone: address.phone || address.mobile,
    isDefault: address.is_default || address.isDefault || false,
    fullAddress: address.fullAddress || `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail || ''}`
  }
  
  // 立即更新上一页的地址
  const pages = getCurrentPages()
  const prevPage = pages[pages.length - 2]
  if (prevPage && prevPage.$vm) {
    // 直接设置选中地址
    prevPage.$vm.selectedAddress = formattedAddress
    console.log('[地址列表] 已更新上一页选中地址:', formattedAddress)
    
    // 如果是订单确认页面，也刷新地址列表以确保数据同步
    if (prevPage.route && (prevPage.route.includes('order/confirm') || prevPage.route.includes('order/confirm-with-points'))) {
      // 延迟刷新，确保选中地址已设置
      setTimeout(() => {
        if (typeof prevPage.$vm.loadAddresses === 'function') {
          prevPage.$vm.loadAddresses()
        } else if (typeof prevPage.$vm.loadAddress === 'function') {
          prevPage.$vm.loadAddress()
        }
      }, 100)
    }
  }
  
  // 显示提示
  uni.showToast({
    title: '已选择',
    icon: 'success',
    duration: 1000
  })
  
  // 延迟返回上一页，确保数据已更新
  setTimeout(() => {
    uni.navigateBack()
  }, 300)
}

/**
 * 添加地址
 */
const addAddress = () => {
  uni.navigateTo({ 
    url: '/subPackages/page2/pages/address/edit?mode=add' 
  })
}

/**
 * 编辑地址
 */
const editAddress = (address) => {
  uni.navigateTo({ 
    url: `/subPackages/page2/pages/address/edit?mode=edit&id=${address.id}&data=${encodeURIComponent(JSON.stringify(address))}` 
  })
}

/**
 * 设置默认地址
 */
const setAsDefault = async (address) => {
  if (address.is_default || address.isDefault) {
    uni.showToast({ title: '该地址已是默认地址', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '设置中...' })
    await setDefaultAddress({ addr_id: address.id })
    uni.hideLoading()
    uni.showToast({ title: '设置成功', icon: 'success' })
    
    // 刷新地址列表
    await loadAddressList()
  } catch (error) {
    uni.hideLoading()
    console.error('设置默认地址失败:', error)
    uni.showToast({ 
      title: error.message || error.msg || '设置失败，请重试', 
      icon: 'none' 
    })
  }
}

/**
 * 删除地址
 */
const deleteAddress = async (addressId) => {
  uni.showModal({
    title: '删除地址',
    content: '确定要删除这个收货地址吗？删除后无法恢复。',
    confirmText: '删除',
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...', mask: true })
          await deleteAddressApi(addressId)
          uni.hideLoading()
          
          // 删除成功后，立即调用API获取最新地址列表
          await loadAddressList()
          
          // 通知订单确认页面刷新地址（如果选中的地址被删除）
          const pages = getCurrentPages()
          const prevPage = pages[pages.length - 2]
          if (prevPage && prevPage.$vm) {
            // 检查上一页是否是订单确认页面
            if (prevPage.route && (prevPage.route.includes('order/confirm') || prevPage.route.includes('order/confirm-with-points'))) {
              // 如果上一页有loadAddresses或loadAddress方法，调用它刷新
              if (typeof prevPage.$vm.loadAddresses === 'function') {
                prevPage.$vm.loadAddresses()
              } else if (typeof prevPage.$vm.loadAddress === 'function') {
                prevPage.$vm.loadAddress()
              }
            }
          }
          
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (error) {
          uni.hideLoading()
          console.error('删除地址失败:', error)
          
          // 检查错误信息，如果后端已删除成功，只显示警告
          const errorMsg = error.message || error.msg || error.detail || ''
          const errorStr = String(errorMsg).toLowerCase()
          
          // 如果错误信息包含"403"、"forbidden"或"不属于"，可能是权限问题，但后端可能已删除
          if (errorStr.includes('403') || errorStr.includes('forbidden') || errorStr.includes('不属于')) {
            // 即使显示错误，也重新获取最新列表（因为后端可能已删除）
            await loadAddressList()
            
            // 通知订单确认页面刷新地址
            const pages = getCurrentPages()
            const prevPage = pages[pages.length - 2]
            if (prevPage && prevPage.$vm) {
              if (prevPage.route && (prevPage.route.includes('order/confirm') || prevPage.route.includes('order/confirm-with-points'))) {
                if (typeof prevPage.$vm.loadAddresses === 'function') {
                  prevPage.$vm.loadAddresses()
                } else if (typeof prevPage.$vm.loadAddress === 'function') {
                  prevPage.$vm.loadAddress()
                }
              }
            }
            
            uni.showToast({ 
              title: '地址已删除', 
              icon: 'success',
              duration: 2000
            })
          } else {
            // 其他错误，显示错误信息
            uni.showModal({
              title: '删除失败',
              content: errorMsg || '删除失败，请重试',
              showCancel: false
            })
          }
        }
      }
    }
  })
}

/**
 * 加载地址列表
 */
const loadAddressList = async (page = 1, append = false) => {
  try {
    if (!append) {
      loading.value = true
      uni.showLoading({ title: '加载中...' })
    }
    
    const response = await getAddressList()
    
    if (!append) {
      uni.hideLoading()
      loading.value = false
    }
    
    console.log('地址列表响应:', response)
    
    // 根据后端响应格式解析数据
    let addresses = []
    if (Array.isArray(response)) {
      addresses = response
    } else if (response.rows && Array.isArray(response.rows)) {
      // 后端返回格式: { rows: [...] }
      addresses = response.rows
    } else if (response.data && Array.isArray(response.data)) {
      addresses = response.data
    } else if (response.items && Array.isArray(response.items)) {
      addresses = response.items
    } else if (response.addresses && Array.isArray(response.addresses)) {
      addresses = response.addresses
    }
    
    console.log('解析到的地址数组:', addresses)
    
    // 格式化数据
    const formattedAddresses = addresses.map(addr => ({
      ...addr,
      phone: addr.phone || addr.mobile, // 兼容不同字段名
      isDefault: addr.is_default || addr.isDefault || false,
      fullAddress: addr.fullAddress || `${addr.province}${addr.city}${addr.district}${addr.detail}`,
      distanceKm: addr.distanceKm || 5
    }))
    
    if (append) {
      // 追加模式：合并到现有列表
      addressList.value = [...addressList.value, ...formattedAddresses]
    } else {
      // 替换模式：直接替换
      addressList.value = formattedAddresses
    }
    
    console.log('处理后的地址列表:', addressList.value)
    
    // 判断是否还有更多数据（如果返回的数据少于pageSize，说明没有更多了）
    hasMore.value = formattedAddresses.length >= pageSize.value
    
    // 如果API返回空数组，清除本地缓存（避免显示其他用户的地址）
    if (addressList.value.length === 0) {
      console.log('[地址列表] API返回空地址列表，清除本地缓存')
      removeStorage('addressList')
    } else if (!append) {
      // 只在非追加模式下保存到本地缓存
      setStorage('addressList', addressList.value)
    }
    
    // 如果是选择模式，默认选中默认地址
    if (isSelectMode.value && !selectedAddressId.value) {
      const defaultAddress = addressList.value.find(addr => addr.is_default || addr.isDefault)
      if (defaultAddress) {
        selectedAddressId.value = defaultAddress.id
      } else if (addressList.value.length > 0) {
        // 如果没有默认地址，选中第一个
        selectedAddressId.value = addressList.value[0].id
      }
    }
    
  } catch (error) {
    uni.hideLoading()
    loading.value = false
    console.error('加载地址列表失败:', error)
    
    // 如果网络请求失败，清除本地缓存，避免显示错误的地址
    if (!append) {
      console.warn('[地址列表] API请求失败，清除本地地址缓存')
      removeStorage('addressList')
      addressList.value = []
    }
    
    uni.showToast({ 
      title: error.message || error.msg || '加载地址失败，请检查网络', 
      icon: 'none',
      duration: 2000
    })
  }
}

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  currentPage.value = 1
  hasMore.value = true
  try {
    await loadAddressList(1, false)
    uni.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    console.error('刷新失败', error)
    uni.showToast({
      title: '刷新失败',
      icon: 'none',
      duration: 1500
    })
  } finally {
    setTimeout(() => {
      refreshing.value = false
    }, 500)
  }
}

/**
 * 刷新恢复
 */
const onRestore = () => {
  refreshing.value = false
}

/**
 * 滚动到底部加载更多
 */
const handleScrollToLower = () => {
  console.log('[地址列表] 滚动到底部，加载更多')
  if (!loading.value && hasMore.value) {
    currentPage.value++
    loadAddressList(currentPage.value, true)
  }
}



onLoad((options) => {
  console.log('地址列表页面加载，参数:', options)
  // 默认进入选择模式
  isSelectMode.value = true
  uni.setNavigationBarTitle({ title: '选择收货地址' })
  console.log('isSelectMode:', isSelectMode.value)
})

onMounted(() => {
  loadAddressList()
})

// 页面显示时刷新地址列表
onShow(() => {
  loadAddressList()
  console.log('地址列表页显示，刷新列表')
})
</script>

<style scoped>
.address-list-page {
  min-height: 100vh;
  background: #f5f5f5;
  position: relative;
}

.address-scroll {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-bottom: 40rpx;
}

.address-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s;
  position: relative;
}

.address-item.select-mode {
  cursor: pointer;
}

.address-item.select-mode:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.address-item.selected {
  border: 2rpx solid #3d6bff;
  background: #f0f8ff;
  box-shadow: 0 4rpx 12rpx rgba(61, 107, 255, 0.2);
}

.select-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: white;
  transition: all 0.3s;
  align-self: center;
}

.select-icon.clickable {
  cursor: pointer;
}

.select-icon.clickable:active {
  transform: scale(0.9);
}

.select-icon.selected-icon {
  background: #3d6bff;
  border-color: #3d6bff;
}

.icon-text {
  font-size: 22rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
}

.select-arrow {
  font-size: 32rpx;
  color: #3d6bff;
  flex-shrink: 0;
  align-self: center;
}

.address-content {
  flex: 1;
  cursor: pointer;
}

.address-content:active {
  opacity: 0.8;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.receiver-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.receiver-phone {
  font-size: 28rpx;
  color: #666;
}

.default-tag {
  background: #ff4757;
  color: white;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
}

.set-default-btn {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  color: #666;
  border-radius: 8rpx;
  font-size: 20rpx;
  margin-left: 12rpx;
  cursor: pointer;
}

.address-detail {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.address-actions {
  display: flex;
  gap: 16rpx;
  align-self: center;
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-icon:active {
  transform: scale(0.9);
}

.edit-icon {
  background: #e8f0ff;
}

.edit-icon .icon {
  color: #3d6bff;
}

.delete-icon {
  background: #ffe8e8;
}

.delete-icon .icon {
  color: #ff4757;
}

.icon {
  font-size: 32rpx;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #ccc;
}

.add-address-btn {
  position: fixed;
  bottom: 40rpx;
  left: 40rpx;
  right: 40rpx;
  height: 88rpx;
  background: #ff4757;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn-text {
  font-size: 32rpx;
  color: white;
  font-weight: bold;
}

.loading-more,
.no-more {
  padding: 40rpx 0;
  text-align: center;
}

.loading-text,
.no-more-text {
  font-size: 26rpx;
  color: #999;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>