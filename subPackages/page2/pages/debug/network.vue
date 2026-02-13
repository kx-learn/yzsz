<template>
  <view class="debug-page">
    <view class="debug-section">
      <text class="title">网络诊断工具</text>
      
      <view class="test-item">
        <text class="label">当前配置：</text>
        <text class="value">{{ baseURL }}</text>
      </view>
      
      <button class="btn" @tap="testNetwork">测试网络连接</button>
      <button class="btn" @tap="testHttps">测试HTTPS访问</button>
      <button class="btn" @tap="testWechatAPI">测试微信登录接口</button>
      
      <view class="result" v-if="result">
        <text class="result-title">测试结果：</text>
        <text class="result-content">{{ result }}</text>
      </view>
      
      <view class="error" v-if="error">
        <text class="error-title">错误信息：</text>
        <text class="error-content">{{ error }}</text>
      </view>
      
      <view class="tips">
        <text class="tips-title">常见问题解决：</text>
        <text class="tip-item">1. 检查网络连接是否正常</text>
        <text class="tip-item">2. 确认域名 8.136.35.215 可访问</text>
        <text class="tip-item">3. 在微信开发者工具中关闭"域名校验"</text>
        <text class="tip-item">4. 检查防火墙是否阻止了请求</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import config from '@/utils/config.js'

const baseURL = ref(config.baseURL)
const result = ref('')
const error = ref('')

const testNetwork = () => {
  result.value = ''
  error.value = ''
  
  uni.request({
    url: 'https://www.baidu.com',
    method: 'GET',
    timeout: 5000,
    success: (res) => {
      result.value = '网络连接正常，可以访问外网'
      console.log('网络测试成功')
    },
    fail: (err) => {
      error.value = `网络连接失败: ${err.errMsg}`
      console.error('网络测试失败:', err)
    }
  })
}

const testHttps = () => {
  result.value = ''
  error.value = ''
  
  uni.request({
    url: 'http://8.136.35.215',
    method: 'GET',
    timeout: 10000,
    success: (res) => {
      result.value = `HTTPS访问成功，状态码: ${res.statusCode}`
      console.log('HTTPS测试成功:', res)
    },
    fail: (err) => {
      error.value = `HTTPS访问失败: ${err.errMsg}`
      console.error('HTTPS测试失败:', err)
    }
  })
}

const testWechatAPI = () => {
  result.value = ''
  error.value = ''
  
  uni.request({
    url: 'http://8.136.35.215/user/wechat-login',
    method: 'POST',
    data: { code: 'test_code' },
    header: {
      'Content-Type': 'application/json'
    },
    timeout: 10000,
    success: (res) => {
      result.value = `接口访问成功，状态码: ${res.statusCode}`
      console.log('API测试成功:', res)
    },
    fail: (err) => {
      error.value = `接口访问失败: ${err.errMsg}`
      console.error('API测试失败:', err)
    }
  })
}
</script>

<style scoped>
.debug-page {
  padding: 40rpx;
}

.debug-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
  display: block;
}

.test-item {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.value {
  font-size: 24rpx;
  color: #3d6bff;
  word-break: break-all;
}

.btn {
  width: 100%;
  height: 80rpx;
  background: #3d6bff;
  color: #fff;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.result, .error {
  margin-top: 40rpx;
  padding: 20rpx;
  border-radius: 8rpx;
}

.result {
  background: #e8f5e9;
}

.error {
  background: #ffebee;
}

.result-title, .error-title {
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.result-title {
  color: #4caf50;
}

.error-title {
  color: #f44336;
}

.result-content, .error-content {
  font-size: 24rpx;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

.result-content {
  color: #2e7d32;
}

.error-content {
  color: #c62828;
}

.tips {
  margin-top: 40rpx;
  padding: 20rpx;
  background: #fff3cd;
  border-radius: 8rpx;
  border: 2rpx solid #ffc107;
}

.tips-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #856404;
  display: block;
  margin-bottom: 16rpx;
}

.tip-item {
  font-size: 24rpx;
  color: #856404;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}
</style>