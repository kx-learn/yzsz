<template>
  <view class="explain-page">
    <view class="explain-section">
      <text class="title">🔐 微信 AppID 一致性说明</text>
      
      <!-- 流程图 -->
      <view class="flow-section">
        <text class="flow-title">📋 微信登录完整流程</text>
        
        <view class="flow-step">
          <view class="step-number">1</view>
          <view class="step-content">
            <text class="step-title">前端获取 Code</text>
            <text class="step-desc">小程序调用 uni.login() 获取登录凭证</text>
            <view class="code-block">
              <text class="code-text">AppID: {{ currentAppId }}</text>
              <text class="code-text">Code: 临时登录凭证（5分钟有效）</text>
            </view>
          </view>
        </view>
        
        <view class="flow-arrow">↓</view>
        
        <view class="flow-step">
          <view class="step-number">2</view>
          <view class="step-content">
            <text class="step-title">前端发送到后端</text>
            <text class="step-desc">将 Code 发送到后端登录接口</text>
            <view class="code-block">
              <text class="code-text">POST /user/wechat_login</text>
              <text class="code-text">{ "code": "获取到的code" }</text>
            </view>
          </view>
        </view>
        
        <view class="flow-arrow">↓</view>
        
        <view class="flow-step">
          <view class="step-number">3</view>
          <view class="step-content">
            <text class="step-title">后端调用微信 API</text>
            <text class="step-desc">后端使用 AppID + AppSecret + Code 换取用户信息</text>
            <view class="code-block">
              <text class="code-text">GET https://api.weixin.qq.com/sns/jscode2session</text>
              <text class="code-text">appid={{ currentAppId }}</text>
              <text class="code-text">secret=后端配置的AppSecret</text>
              <text class="code-text">js_code=前端传来的code</text>
            </view>
          </view>
        </view>
        
        <view class="flow-arrow">↓</view>
        
        <view class="flow-step">
          <view class="step-number">4</view>
          <view class="step-content">
            <text class="step-title">微信服务器验证</text>
            <text class="step-desc">微信验证 AppID、AppSecret、Code 的匹配性</text>
            <view class="code-block success" v-if="isMatched">
              <text class="code-text">✅ AppID 匹配：验证通过</text>
              <text class="code-text">✅ AppSecret 正确：身份验证通过</text>
              <text class="code-text">✅ Code 有效：返回用户信息</text>
            </view>
            <view class="code-block error" v-else>
              <text class="code-text">❌ AppID 不匹配：验证失败</text>
              <text class="code-text">❌ 返回错误：40029 invalid code</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 为什么必须一致 -->
      <view class="reason-section">
        <text class="reason-title">🤔 为什么前后端 AppID 必须一致？</text>
        
        <view class="reason-item">
          <text class="reason-label">🔒 安全防护</text>
          <text class="reason-desc">防止恶意应用盗用其他应用的登录凭证</text>
        </view>
        
        <view class="reason-item">
          <text class="reason-label">🎯 身份绑定</text>
          <text class="reason-desc">Code 在生成时就绑定了特定的 AppID，只能被对应的应用使用</text>
        </view>
        
        <view class="reason-item">
          <text class="reason-label">👤 用户标识</text>
          <text class="reason-desc">OpenID 基于 AppID 生成，不同 AppID 会产生不同的用户标识</text>
        </view>
        
        <view class="reason-item">
          <text class="reason-label">🔐 密钥配对</text>
          <text class="reason-desc">AppID 和 AppSecret 是配对的，必须同时正确才能通过验证</text>
        </view>
      </view>
      
      <!-- 常见错误 -->
      <view class="error-section">
        <text class="error-title">⚠️ 常见的 AppID 不匹配错误</text>
        
        <view class="error-item">
          <text class="error-code">错误码 40029</text>
          <text class="error-desc">invalid code - Code 无效或已过期</text>
          <text class="error-solution">检查前后端 AppID 是否一致</text>
        </view>
        
        <view class="error-item">
          <text class="error-code">错误码 40001</text>
          <text class="error-desc">invalid credential - AppSecret 错误</text>
          <text class="error-solution">检查后端 AppSecret 配置</text>
        </view>
        
        <view class="error-item">
          <text class="error-code">错误码 40013</text>
          <text class="error-desc">invalid appid - AppID 无效</text>
          <text class="error-solution">检查 AppID 格式和有效性</text>
        </view>
      </view>
      
      <!-- 检查工具 -->
      <view class="check-section">
        <text class="check-title">🔍 AppID 配置检查</text>
        
        <view class="check-item">
          <text class="check-label">前端 AppID：</text>
          <text class="check-value">{{ currentAppId }}</text>
          <button @tap="checkAppId" class="check-btn">检查配置</button>
        </view>
        
        <view class="check-item">
          <text class="check-label">后端 AppID：</text>
          <text class="check-value">需要在后端配置中确认</text>
        </view>
        
        <view class="check-result" v-if="checkResult">
          <text class="result-text">{{ checkResult }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const currentAppId = ref('请在 manifest.json 中查看')
const isMatched = ref(true)
const checkResult = ref('')

// 获取当前小程序的 AppID
const getAppId = () => {
  // 尝试从 manifest.json 或运行时获取 AppID
  // 在实际运行时，可以通过 uni.getAccountInfoSync() 获取
  try {
    const accountInfo = uni.getAccountInfoSync()
    if (accountInfo && accountInfo.miniProgram) {
      currentAppId.value = accountInfo.miniProgram.appId
    }
  } catch (error) {
    console.log('无法获取 AppID，可能在开发环境中')
  }
}

const checkAppId = () => {
  getAppId()
  
  if (currentAppId.value && currentAppId.value !== '请在 manifest.json 中查看') {
    checkResult.value = `✅ 当前小程序 AppID: ${currentAppId.value}
    
请确保后端配置的 AppID 与此完全一致！`
  } else {
    checkResult.value = `⚠️ 无法获取 AppID，请检查：
1. 是否在微信开发者工具中运行
2. manifest.json 中是否配置了正确的 AppID
3. 是否已经注册微信小程序`
  }
}

// 页面加载时尝试获取 AppID
getAppId()
</script>

<style scoped>
.explain-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.explain-section {
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

.flow-section {
  margin-bottom: 40rpx;
}

.flow-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #2196f3;
  margin-bottom: 30rpx;
}

.flow-step {
  display: flex;
  margin-bottom: 20rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  background: #2196f3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.step-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.code-block {
  background: #2d3748;
  color: #e2e8f0;
  padding: 16rpx;
  border-radius: 8rpx;
  font-family: 'Courier New', monospace;
}

.code-block.success {
  background: #065f46;
  color: #d1fae5;
}

.code-block.error {
  background: #7f1d1d;
  color: #fecaca;
}

.code-text {
  display: block;
  font-size: 22rpx;
  line-height: 1.4;
  margin-bottom: 4rpx;
}

.flow-arrow {
  text-align: center;
  font-size: 40rpx;
  color: #2196f3;
  margin: 20rpx 0;
}

.reason-section, .error-section, .check-section {
  margin-top: 40rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

.reason-section {
  background: #e8f5e9;
  border: 2rpx solid #4caf50;
}

.error-section {
  background: #ffeaea;
  border: 2rpx solid #f44336;
}

.check-section {
  background: #fff3cd;
  border: 2rpx solid #ffc107;
}

.reason-title, .error-title, .check-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.reason-item, .error-item, .check-item {
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: rgba(255,255,255,0.5);
  border-radius: 8rpx;
}

.reason-label, .error-code, .check-label {
  display: block;
  font-size: 24rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.reason-desc, .error-desc, .error-solution, .check-value {
  display: block;
  font-size: 22rpx;
  color: #666;
  line-height: 1.4;
}

.error-solution {
  color: #2196f3;
  margin-top: 8rpx;
}

.check-btn {
  width: 200rpx;
  height: 60rpx;
  background: #2196f3;
  color: white;
  border-radius: 8rpx;
  font-size: 24rpx;
  margin-top: 12rpx;
}

.check-result {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #e3f2fd;
  border-radius: 8rpx;
}

.result-text {
  font-size: 24rpx;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>