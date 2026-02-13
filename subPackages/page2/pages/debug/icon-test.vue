<template>
  <view class="icon-test-page">
    <view class="test-section">
      <text class="title">🎨 图标测试页面</text>
      
      <view class="icon-list">
        <view class="icon-item">
          <text class="iconfont icon-icon-phone"></text>
          <text class="icon-name">手机图标 (icon-icon-phone)</text>
        </view>
        
        <view class="icon-item">
          <text class="iconfont icon-icon-code"></text>
          <text class="icon-name">验证码图标 (icon-icon-code)</text>
        </view>
        
        <view class="icon-item">
          <text class="iconfont icon-shouye"></text>
          <text class="icon-name">首页图标 (icon-shouye)</text>
        </view>
        
        <view class="icon-item">
          <text class="iconfont icon-wode"></text>
          <text class="icon-name">我的图标 (icon-wode)</text>
        </view>
        
        <view class="icon-item">
          <text class="iconfont icon-tuandui"></text>
          <text class="icon-name">团队图标 (icon-tuandui)</text>
        </view>
        
        <view class="icon-item">
          <text class="iconfont icon-tongzhi"></text>
          <text class="icon-name">通知图标 (icon-tongzhi)</text>
        </view>
      </view>
      
      <view class="demo-section">
        <text class="demo-title">登录表单预览</text>
        
        <view class="demo-input">
          <text class="iconfont icon-icon-phone"></text>
          <text class="demo-text">手机号输入框</text>
        </view>
        
        <view class="demo-input">
          <text class="iconfont icon-icon-code"></text>
          <text class="demo-text">验证码输入框</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// 无需额外逻辑
</script>

<style scoped>
@font-face {
  font-family: "iconfont";
  src: url('/static/999/iconfont.woff2') format('woff2'),
       url('/static/999/iconfont.woff') format('woff'),
       url('/static/999/iconfont.ttf') format('truetype');
  font-display: swap;
}

.iconfont {
  font-family: "iconfont" !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-test-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 40rpx;
}

.icon-list {
  margin-bottom: 40rpx;
}

.icon-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
}

.icon-item .iconfont {
  font-size: 40rpx;
  color: #3d6bff;
  margin-right: 20rpx;
  min-width: 40rpx;
  text-align: center;
}

.icon-name {
  font-size: 28rpx;
  color: #333;
}

.demo-section {
  padding-top: 40rpx;
  border-top: 2rpx solid #e0e0e0;
}

.demo-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.demo-input {
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border-radius: 22rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid transparent;
}

.demo-input .iconfont {
  font-size: 34rpx;
  color: #8c9eff;
  margin-right: 16rpx;
  min-width: 34rpx;
  text-align: center;
}

.demo-text {
  font-size: 32rpx;
  color: #666;
}
</style>