<template>
  <view class="content-manage-page">
    <view class="page-header">
      <text class="page-title">内容管理</text>
    </view>

    <view class="menu-section">
      <view class="menu-item" @tap="goToBannerManage">
        <view class="menu-left">
          <text class="menu-icon">🖼️</text>
          <text class="menu-text">首页轮播图管理</text>
        </view>
        <view class="menu-right">
          <text class="menu-arrow">›</text>
        </view>
      </view>
      
      <view class="menu-item" @tap="goToSystemNotice">
        <view class="menu-left">
          <text class="menu-icon">📬</text>
          <text class="menu-text">发送系统通知</text>
        </view>
        <view class="menu-right">
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const goToBannerManage = () => {
  uni.navigateTo({ url: '/subPackages/page2/pages/merchant/banner-manage' })
}

const goToSystemNotice = () => {
  uni.navigateTo({ url: '/page1/merchant/system-notice' })
}
</script>

<style scoped>
.content-manage-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.page-header {
  margin-bottom: 30rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.menu-section {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.menu-icon {
  font-size: 40rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.menu-right {
  display: flex;
  align-items: center;
}

.menu-arrow {
  font-size: 24rpx;
  color: #ccc;
}
</style>





