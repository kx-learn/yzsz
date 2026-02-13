<template>
  <view class="container">
    <view class="header">
      <text class="title">服务器地址切换</text>
      <text class="subtitle">开发者工具</text>
    </view>

    <view class="server-list">
      <view 
        class="server-item" 
        :class="{ active: currentServer === 'production' }"
        @click="selectServer('production')"
      >
        <view class="server-info">
          <text class="server-name">正式服务器</text>
          <text class="server-url">{{ serverConfigs.production }}</text>
        </view>
        <view class="server-status">
          <text v-if="currentServer === 'production'" class="status-badge">当前使用</text>
        </view>
      </view>

      <view 
        class="server-item" 
        :class="{ active: currentServer === 'local' }"
        @click="selectServer('local')"
      >
        <view class="server-info">
          <text class="server-name">本地服务器</text>
          <text class="server-url">{{ serverConfigs.local }}</text>
        </view>
        <view class="server-status">
          <text v-if="currentServer === 'local'" class="status-badge">当前使用</text>
        </view>
      </view>

      <view 
        class="server-item" 
        :class="{ active: currentServer === 'custom' }"
      >
        <view class="server-info">
          <text class="server-name">自定义服务器</text>
          <input 
            class="custom-input" 
            v-model="customUrl" 
            placeholder="请输入自定义服务器地址"
            @input="onCustomUrlChange"
          />
        </view>
        <view class="server-status">
          <button 
            class="btn-custom" 
            size="mini" 
            type="primary"
            @click="selectServer('custom')"
          >
            使用
          </button>
        </view>
      </view>
    </view>

    <view class="test-section">
      <text class="section-title">连接测试</text>
      <button class="btn-test" @click="testConnection">测试当前服务器连接</button>
      <view v-if="testResult" class="test-result" :class="{ success: testResult.success }">
        <text>{{ testResult.message }}</text>
      </view>
    </view>

    <view class="tips">
      <text class="tips-title">提示：</text>
      <text class="tips-text">1. 切换服务器后需要重启应用</text>
      <text class="tips-text">2. 本地服务器需要先启动后端服务</text>
      <text class="tips-text">3. 自定义服务器请确保地址格式正确</text>
    </view>
  </view>
</template>

<script>
import config, { switchServer, getCurrentServerType } from '@/utils/config.js'
import request from '@/utils/request.js'

export default {
  data() {
    return {
      currentServer: 'production',
      serverConfigs: config.serverConfigs,
      customUrl: '',
      testResult: null
    }
  },

  onLoad() {
    this.currentServer = getCurrentServerType()
    this.customUrl = uni.getStorageSync('custom_server_url') || ''
  },

  methods: {
    selectServer(type) {
      if (type === 'custom' && !this.customUrl) {
        uni.showToast({
          title: '请输入自定义服务器地址',
          icon: 'none'
        })
        return
      }

      uni.showModal({
        title: '确认切换',
        content: `确定要切换到${type === 'production' ? '正式' : type === 'local' ? '本地' : '自定义'}服务器吗？`,
        success: (res) => {
          if (res.confirm) {
            switchServer(type, this.customUrl)
          }
        }
      })
    },

    onCustomUrlChange(e) {
      this.customUrl = e.detail.value
    },

    async testConnection() {
      this.testResult = null
      
      uni.showLoading({
        title: '测试中...'
      })

      try {
        const res = await request.get('/health')
        
        uni.hideLoading()
        
        this.testResult = {
          success: true,
          message: '✓ 连接成功！服务器运行正常'
        }
      } catch (error) {
        uni.hideLoading()
        
        this.testResult = {
          success: false,
          message: '✗ 连接失败：' + (error.errMsg || '网络错误')
        }
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.server-list {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.server-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.3s;
}

.server-item:last-child {
  border-bottom: none;
}

.server-item.active {
  background-color: #f0f9ff;
}

.server-info {
  flex: 1;
}

.server-name {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.server-url {
  display: block;
  font-size: 24rpx;
  color: #666;
  word-break: break-all;
}

.custom-input {
  margin-top: 10rpx;
  padding: 10rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.server-status {
  margin-left: 20rpx;
}

.status-badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  background-color: #07c160;
  color: #fff;
  font-size: 22rpx;
  border-radius: 20rpx;
}

.btn-custom {
  padding: 8rpx 20rpx;
}

.test-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.btn-test {
  width: 100%;
  background-color: #1989fa;
  color: #fff;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.test-result {
  margin-top: 20rpx;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  text-align: center;
}

.test-result.success {
  background-color: #f0f9ff;
  color: #07c160;
}

.test-result:not(.success) {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.tips {
  background-color: #fffbe6;
  border-radius: 16rpx;
  padding: 30rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #faad14;
  margin-bottom: 15rpx;
}

.tips-text {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 40rpx;
}
</style>
