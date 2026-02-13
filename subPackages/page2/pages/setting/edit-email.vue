<template>
  <view class="edit-email-page">
    <view class="form-section">
      <view class="section-title">设置邮箱地址</view>
      <view class="form-group">
        <text class="form-label">邮箱地址</text>
        <input 
          v-model="email"
          class="form-input"
          placeholder="请输入邮箱地址"
          type="text"
        />
      </view>
      
      <view v-if="needVerification" class="form-group">
        <text class="form-label">验证码</text>
        <view class="code-input-group">
          <input 
            v-model="verificationCode"
            class="code-input"
            placeholder="请输入验证码"
            type="number"
            maxlength="6"
          />
          <button 
            class="send-code-btn"
            :disabled="!canSendCode"
            @tap="sendCode"
          >
            {{ codeButtonText }}
          </button>
        </view>
      </view>
    </view>

    <view class="tips-section">
      <text class="tips-title">温馨提示</text>
      <text class="tips-text">• 邮箱用于接收订单通知和重要信息</text>
      <text class="tips-text">• 请确保邮箱地址正确且可正常接收邮件</text>
      <text class="tips-text">• 验证码有效期为5分钟</text>
    </view>

    <view class="submit-section">
      <button 
        class="submit-btn" 
        :disabled="!canSubmit"
        @tap="handleSubmit"
      >
        {{ needVerification ? '验证并保存' : '保存' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const email = ref('')
const verificationCode = ref('')
const needVerification = ref(false)
const countdown = ref(0)
const timer = ref(null)

// 计算属性
const canSendCode = computed(() => {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailReg.test(email.value) && countdown.value === 0
})

const canSubmit = computed(() => {
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailValid = emailReg.test(email.value)
  
  if (needVerification.value) {
    return emailValid && verificationCode.value.length === 6
  }
  return emailValid
})

const codeButtonText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s后重发`
  }
  return '发送验证码'
})

/**
 * 发送验证码
 */
const sendCode = async () => {
  if (!canSendCode.value) return
  
  try {
    uni.showLoading({ title: '发送中...' })
    
    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    
    needVerification.value = true
    startCountdown()
    
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '发送失败，请重试', icon: 'none' })
  }
}

/**
 * 开始倒计时
 */
const startCountdown = () => {
  countdown.value = 60
  timer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer.value)
      timer.value = null
    }
  }, 1000)
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  // 验证邮箱格式
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(email.value)) {
    uni.showToast({ title: '邮箱格式不正确', icon: 'none' })
    return
  }
  
  try {
    uni.showLoading({ title: '保存中...' })
    
    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 保存到本地存储
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.email = email.value
    uni.setStorageSync('userInfo', userInfo)
    
    uni.hideLoading()
    uni.showToast({ title: '邮箱设置成功', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

/**
 * 加载当前邮箱
 */
const loadCurrentEmail = () => {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.email) {
    email.value = userInfo.email
  }
}

onLoad(() => {
  loadCurrentEmail()
})

onMounted(() => {
  // 页面卸载时清除定时器
  uni.$on('onUnload', () => {
    if (timer.value) {
      clearInterval(timer.value)
    }
  })
})
</script>

<style scoped>
.edit-email-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.form-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.code-input-group {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.code-input {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.send-code-btn {
  width: 200rpx;
  height: 80rpx;
  background: #3d6bff;
  color: white;
  font-size: 26rpx;
  border-radius: 8rpx;
  border: none;
}

.send-code-btn:disabled {
  opacity: 0.5;
}

.tips-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.tips-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.tips-text {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8rpx;
}

.submit-section {
  padding: 40rpx 0;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #ff4757;
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 44rpx;
  border: none;
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>