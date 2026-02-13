<template>
  <view class="debug-page">
    <view class="debug-section">
      <text class="title">🔍 微信登录详细调试</text>
      
      <!-- 步骤1：获取Code -->
      <view class="step-section">
        <text class="step-title">步骤1：获取微信 Code</text>
        <button @tap="getWechatCode" class="step-btn" :disabled="loading">
          {{ codeInfo.code ? '重新获取 Code' : '获取微信 Code' }}
        </button>
        
        <view v-if="codeInfo.code" class="success-info">
          <text class="info-label"><text class="iconfont icon-chenggong"></text> Code 获取成功：</text>
          <text class="code-value">{{ codeInfo.code }}</text>
          <text class="time-info">获取时间：{{ codeInfo.time }}</text>
        </view>
      </view>
      
      <!-- 步骤2：测试登录接口 -->
      <view class="step-section">
        <text class="step-title">步骤2：测试登录接口</text>
        <button @tap="testLogin" class="step-btn" :disabled="!codeInfo.code || loading">
          使用 Code 测试登录
        </button>
        
        <view v-if="loginResult" class="result-info">
          <text class="info-label">📋 详细响应：</text>
          <text class="result-content">{{ loginResult }}</text>
        </view>
        
        <view v-if="loginError" class="error-info">
          <text class="info-label"><text class="iconfont icon-shibai"></text> 详细错误：</text>
          <text class="error-content">{{ loginError }}</text>
        </view>
      </view>
      
      <!-- 步骤3：原始请求测试 -->
      <view class="step-section">
        <text class="step-title">步骤3：原始请求测试</text>
        <button @tap="testRawRequest" class="step-btn" :disabled="!codeInfo.code || loading">
          发送原始 HTTP 请求
        </button>
        
        <view v-if="rawResult" class="result-info">
          <text class="info-label">🔗 原始响应：</text>
          <text class="result-content">{{ rawResult }}</text>
        </view>
      </view>
      
      <!-- 诊断信息 -->
      <view class="diagnosis-section">
        <text class="diagnosis-title">🩺 诊断信息</text>
        <view class="diagnosis-item">
          <text class="diagnosis-label">当前环境：</text>
          <text class="diagnosis-value">{{ environment }}</text>
        </view>
        <view class="diagnosis-item">
          <text class="diagnosis-label">接口地址：</text>
          <text class="diagnosis-value">{{ apiUrl }}</text>
        </view>
        <view class="diagnosis-item">
          <text class="diagnosis-label">Code 状态：</text>
          <text class="diagnosis-value">{{ codeInfo.code ? '已获取' : '未获取' }}</text>
        </view>
      </view>
      
      <!-- 测试跳转 -->
      <view class="step-section">
        <text class="step-title">步骤4：测试页面跳转</text>
        <button @tap="testNavigation" class="step-btn">
          测试跳转到首页
        </button>
      </view>
      
      <!-- 解决方案建议 -->
      <view class="solution-section">
        <text class="solution-title">💡 可能的解决方案</text>
        <text class="solution-item">1. 确认微信小程序 AppID 配置正确</text>
        <text class="solution-item">2. 检查后端微信 AppSecret 配置</text>
        <text class="solution-item">3. 确认 Code 没有重复使用</text>
        <text class="solution-item">4. 检查服务器时间是否正确</text>
        <text class="solution-item">5. 查看后端日志获取详细错误</text>
        <text class="solution-item">6. 如果跳转超时，检查 tabBar 配置</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { wechatLogin } from '@/api/auth.js'
import { saveAuth } from '@/utils/auth.js'

const loading = ref(false)
const codeInfo = ref({ code: '', time: '' })
const loginResult = ref('')
const loginError = ref('')
const rawResult = ref('')
const environment = ref('微信开发者工具')
const apiUrl = ref('http://8.136.35.215/user/wechat-login')

/**
 * 获取微信 Code
 */
const getWechatCode = () => {
  loading.value = true
  codeInfo.value = { code: '', time: '' }
  loginResult.value = ''
  loginError.value = ''
  rawResult.value = ''
  
  uni.getProvider({
    service: 'oauth',
    success: ({ provider }) => {
      if (!provider.includes('weixin')) {
        uni.showToast({ title: '当前环境不支持微信登录', icon: 'none' })
        loading.value = false
        return
      }
      
      uni.login({
        provider: 'weixin',
        success: ({ code }) => {
          if (code) {
            codeInfo.value = {
              code: code,
              time: new Date().toLocaleString()
            }
            console.log('获取到微信 Code：', code)
            uni.showToast({ title: 'Code 获取成功', icon: 'success' })
          } else {
            uni.showToast({ title: 'Code 获取失败', icon: 'none' })
          }
          loading.value = false
        },
        fail: (error) => {
          console.error('获取微信 Code 失败：', error)
          uni.showToast({ title: 'Code 获取失败', icon: 'none' })
          loading.value = false
        }
      })
    },
    fail: (error) => {
      console.error('获取登录渠道失败：', error)
      uni.showToast({ title: '获取登录渠道失败', icon: 'none' })
      loading.value = false
    }
  })
}

/**
 * 测试登录接口（使用封装的方法）
 */
const testLogin = async () => {
  if (!codeInfo.value.code) {
    uni.showToast({ title: '请先获取 Code', icon: 'none' })
    return
  }
  
  loading.value = true
  loginResult.value = ''
  loginError.value = ''
  
  try {
    console.log('开始测试登录，Code：', codeInfo.value.code)
    const res = await wechatLogin(codeInfo.value.code)
    
    loginResult.value = `登录成功！
    
响应数据：
${JSON.stringify(res, null, 2)}`
    
    console.log('登录测试成功：', res)
    // 如果后端返回 token，则统一保存 token（其他用户信息由页面逻辑负责保存）
    if (res && res.token) {
      try {
        saveAuth(res)
        // 仍然保留 userInfo 的本地保存，因为调试页面需要展示
        uni.setStorageSync('userInfo', res.user || {})
        console.log('[Login-Debug] 已使用 saveAuth 保存 token，本次 token 长度:', String(res.token).length)
      } catch (saveErr) {
        console.error('[Login-Debug] 保存 token/userInfo 失败:', saveErr)
      }
    }

    uni.showToast({ title: '登录成功', icon: 'success' })
    
  } catch (error) {
    loginError.value = `登录失败详情：

错误类型：${error.constructor.name}
错误信息：${error.message || error.msg || '未知错误'}
错误码：${error.error_code || error.code || '无'}
HTTP状态：${error.statusCode || '无'}

完整错误对象：
${JSON.stringify(error, null, 2)}`
    
    console.error('登录测试失败：', error)
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
  
  loading.value = false
}

/**
 * 测试原始请求（不使用封装的方法）
 */
const testRawRequest = () => {
  if (!codeInfo.value.code) {
    uni.showToast({ title: '请先获取 Code', icon: 'none' })
    return
  }
  
  loading.value = true
  rawResult.value = ''
  
  uni.request({
    url: 'http://8.136.35.215/user/wechat-login',
    method: 'POST',
    data: {
      code: codeInfo.value.code
    },
    header: {
      'Content-Type': 'application/json'
    },
    timeout: 15000,
    success: (res) => {
      rawResult.value = `原始请求成功！

HTTP状态码：${res.statusCode}
响应头：${JSON.stringify(res.header, null, 2)}

响应数据：
${JSON.stringify(res.data, null, 2)}`
      
      console.log('原始请求成功：', res)
    },
    fail: (error) => {
      rawResult.value = `原始请求失败！

错误信息：${error.errMsg}
错误详情：${JSON.stringify(error, null, 2)}`
      
      console.error('原始请求失败：', error)
    },
    complete: () => {
      loading.value = false
    }
  })
}

/**
 * 测试页面跳转
 */
const testNavigation = () => {
  uni.showLoading({ title: '测试跳转...' })
  
  // 尝试跳转到首页
  uni.switchTab({
    url: '/pages/home/home',
    success: () => {
      uni.hideLoading()
      console.log('跳转测试成功')
    },
    fail: (err) => {
      uni.hideLoading()
      console.error('跳转测试失败:', err)
      uni.showModal({
        title: '跳转测试失败',
        content: `错误信息: ${err.errMsg}\n\n这可能是导致登录后跳转超时的原因`,
        showCancel: false
      })
    }
  })
}
</script>

<style scoped>
.debug-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.debug-section {
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

.step-section {
  margin-bottom: 40rpx;
  padding: 30rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
}

.step-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #2196f3;
  margin-bottom: 20rpx;
}

.step-btn {
  width: 100%;
  height: 80rpx;
  background: #2196f3;
  color: white;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.step-btn:disabled {
  background: #ccc;
}

.success-info, .result-info, .error-info {
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 20rpx;
}

.success-info {
  background: #e8f5e9;
  border: 2rpx solid #4caf50;
}

.result-info {
  background: #e3f2fd;
  border: 2rpx solid #2196f3;
}

.error-info {
  background: #ffeaea;
  border: 2rpx solid #f44336;
}

.info-label {
  font-size: 26rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
}

.code-value, .result-content, .error-content {
  font-size: 24rpx;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  display: block;
  margin-bottom: 8rpx;
}

.time-info {
  font-size: 22rpx;
  color: #666;
  display: block;
}

.diagnosis-section, .solution-section {
  margin-top: 40rpx;
  padding: 30rpx;
  border-radius: 16rpx;
}

.diagnosis-section {
  background: #fff3cd;
  border: 2rpx solid #ffc107;
}

.solution-section {
  background: #d1ecf1;
  border: 2rpx solid #17a2b8;
}

.diagnosis-title, .solution-title {
  font-size: 28rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.diagnosis-item {
  margin-bottom: 12rpx;
}

.diagnosis-label {
  font-size: 24rpx;
  font-weight: bold;
  display: inline-block;
  min-width: 160rpx;
}

.diagnosis-value {
  font-size: 24rpx;
  color: #666;
}

.solution-item {
  font-size: 24rpx;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
  padding-left: 20rpx;
}
</style>