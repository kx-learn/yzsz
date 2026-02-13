<template>
  <view class="service-page">
    <!-- 聊天记录 -->
    <scroll-view class="chat-container" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <view class="chat-list">
        <view 
          v-for="message in messages" 
          :key="message.id"
          class="message-item"
          :class="message.type"
        >
          <image 
            :src="message.type === 'user' ? userAvatar : serviceAvatar" 
            class="message-avatar" 
            mode="aspectFill"
            @error="handleAvatarError"
          />
          <view class="message-content">
            <view class="message-bubble">
              <text class="message-text">{{ message.content }}</text>
            </view>
            <text class="message-time">{{ message.time }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷回复 -->
    <view v-if="quickReplies.length > 0" class="quick-replies">
      <view 
        v-for="reply in quickReplies" 
        :key="reply.id"
        class="quick-reply-item"
        @tap="sendQuickReply(reply.content)"
      >
        <text class="reply-text">{{ reply.content }}</text>
      </view>
    </view>

    <!-- 输入框 -->
    <view class="input-container">
      <view class="input-box">
        <input 
          v-model="inputText"
          class="message-input"
          placeholder="请输入您的问题..."
          confirm-type="send"
          @confirm="sendMessage"
        />
        <view class="input-actions">
          <view class="action-btn" @tap="showMoreActions">
            <text class="action-icon">➕</text>
          </view>
          <view class="send-btn" :class="{ active: inputText.trim() }" @tap="sendMessage">
            <text class="send-text">发送</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 更多操作 -->
    <view v-if="showActions" class="more-actions" @tap="hideMoreActions">
      <view class="actions-content" @tap.stop>
        <view class="action-item" @tap="selectImage">
          <text class="action-icon">📷</text>
          <text class="action-text">图片</text>
        </view>
        <view class="action-item" @tap="makePhoneCall">
          <text class="action-icon">📞</text>
          <text class="action-text">电话</text>
        </view>
        <view class="action-item" @tap="showFAQ">
          <text class="action-icon">❓</text>
          <text class="action-text">常见问题</text>
        </view>
      </view>
    </view>

    <!-- 常见问题 -->
    <view v-if="showFAQModal" class="faq-modal" @tap="hideFAQ">
      <view class="faq-content" @tap.stop>
        <view class="faq-header">
          <text class="faq-title">常见问题</text>
          <text class="close-btn" @tap="hideFAQ">✕</text>
        </view>
        <scroll-view class="faq-list" scroll-y>
          <view 
            v-for="faq in faqList" 
            :key="faq.id"
            class="faq-item"
            @tap="sendQuickReply(faq.question)"
          >
            <text class="faq-question">{{ faq.question }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const inputText = ref('')
const scrollTop = ref(0)
const isOnline = ref(true)
const showActions = ref(false)
const showFAQModal = ref(false)

// 获取用户头像
const userInfo = uni.getStorageSync('userInfo') || {}
const userAvatar = ref(userInfo.avatar_path || '/static/logo.png')
const serviceAvatar = '/static/logo.png' // 使用logo作为客服头像

/**
 * 获取当前时间（HH:MM格式）
 */
function getCurrentTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 加载聊天记录
 */
const loadMessages = () => {
  const storedMessages = uni.getStorageSync('chatMessages') || []
  
  if (storedMessages.length > 0) {
    messages.value = storedMessages
  } else {
    // 初始化欢迎消息
    messages.value = [
      {
        id: 1,
        type: 'service',
        content: '您好！欢迎咨询，有什么可以帮助您的吗？',
        time: getCurrentTime()
      }
    ]
    saveMessages()
  }
}

/**
 * 保存聊天记录
 */
const saveMessages = () => {
  uni.setStorageSync('chatMessages', messages.value)
}

// 聊天记录
const messages = ref([])

// 快捷回复
const quickReplies = ref([
  { id: 1, content: '商品咨询' },
  { id: 2, content: '订单问题' },
  { id: 3, content: '退换货' },
  { id: 4, content: '会员权益' }
])

// 常见问题
const faqList = ref([
  { id: 1, question: '如何成为会员？' },
  { id: 2, question: '会员有什么权益？' },
  { id: 3, question: '如何查看订单状态？' },
  { id: 4, question: '如何申请退换货？' },
  { id: 5, question: '积分如何使用？' },
  { id: 6, question: '配送时间是多久？' }
])

/**
 * 发送消息
 */
const sendMessage = () => {
  const content = inputText.value.trim()
  if (!content) return
  
  // 添加用户消息
  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: content,
    time: getCurrentTime()
  }
  messages.value.push(userMessage)
  saveMessages()
  
  // 清空输入框
  inputText.value = ''
  
  // 滚动到底部
  scrollToBottom()
  
  // 模拟客服回复
  setTimeout(() => {
    const serviceMessage = {
      id: Date.now() + 1,
      type: 'service',
      content: getAutoReply(content),
      time: getCurrentTime()
    }
    messages.value.push(serviceMessage)
    saveMessages()
    scrollToBottom()
  }, 1000)
}

/**
 * 发送快捷回复
 */
const sendQuickReply = (content) => {
  inputText.value = content
  sendMessage()
  hideFAQ()
}

/**
 * 获取自动回复
 */
const getAutoReply = (userMessage) => {
  const replies = {
    '商品咨询': '请问您想了解哪个商品呢？您可以提供商品名称或者描述，我来为您详细介绍。',
    '订单问题': '请提供您的订单号，我来帮您查询订单状态。',
    '退换货': '我们支持7天无理由退换货，请问您遇到了什么问题？',
    '会员权益': '会员可以享受专属商品、积分奖励、推荐奖励等多项权益，购买会员商品还可以升级等级哦！',
    '如何成为会员': '购买任意会员专享商品即可成为会员，不同价格的商品对应不同的会员等级。',
    '会员有什么权益': '会员可以享受积分奖励、推荐奖励、团队奖励、周补贴分配等权益。',
    '如何查看订单状态': '您可以在"我的"-"我的订单"中查看所有订单的状态。',
    '如何申请退换货': '在订单详情页面点击"申请退换货"，填写退换货原因即可。',
    '积分如何使用': '积分可以参与周补贴分配，每周根据积分比例获得补贴。',
    '配送时间是多久': '标准配送3-5天，快速配送1-2天，具体时间以实际配送为准。'
  }
  
  // 查找匹配的回复
  for (const [key, value] of Object.entries(replies)) {
    if (userMessage.includes(key)) {
      return value
    }
  }
  
  // 默认回复
  return '感谢您的咨询，我已经记录了您的问题，稍后会有专人为您处理。如有紧急问题，请拨打客服电话：400-123-4567'
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    // 使用更大的值确保滚动到底部
    const maxScroll = 999999
    scrollTop.value = scrollTop.value === maxScroll ? maxScroll - 1 : maxScroll
  })
}

/**
 * 显示更多操作
 */
const showMoreActions = () => {
  showActions.value = true
}

/**
 * 隐藏更多操作
 */
const hideMoreActions = () => {
  showActions.value = false
}

/**
 * 选择图片
 */
const selectImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      
      // 添加图片消息
      const imageMessage = {
        id: Date.now(),
        type: 'user',
        content: '[图片]',
        time: getCurrentTime(),
        image: tempFilePath
      }
      messages.value.push(imageMessage)
      saveMessages()
      scrollToBottom()
      
      // 客服回复
      setTimeout(() => {
        const serviceMessage = {
          id: Date.now() + 1,
          type: 'service',
          content: '我已经收到您发送的图片，正在为您处理...',
          time: getCurrentTime()
        }
        messages.value.push(serviceMessage)
        saveMessages()
        scrollToBottom()
      }, 1000)
    }
  })
  hideMoreActions()
}

/**
 * 拨打电话
 */
const makePhoneCall = () => {
  uni.makePhoneCall({
    phoneNumber: '400-123-4567',
    success: () => {
      console.log('拨打电话成功')
    },
    fail: () => {
      uni.showToast({ title: '拨打失败', icon: 'none' })
    }
  })
  hideMoreActions()
}

/**
 * 显示常见问题
 */
const showFAQ = () => {
  showFAQModal.value = true
  hideMoreActions()
}

/**
 * 隐藏常见问题
 */
const hideFAQ = () => {
  showFAQModal.value = false
}

/**
 * 头像加载失败处理
 */
const handleAvatarError = (e) => {
  console.log('头像加载失败，使用默认头像')
  // 使用默认头像
  if (e.target && e.target.src) {
    e.target.src = '/static/logo.png'
  }
}

onMounted(() => {
  loadMessages()
  // 延迟滚动，确保DOM渲染完成
  setTimeout(() => {
    scrollToBottom()
  }, 100)
  console.log('客服页面加载')
})

onShow(() => {
  // 每次显示页面时更新用户头像和加载消息
  const userInfo = uni.getStorageSync('userInfo') || {}
  userAvatar.value = userInfo.avatar_path || '/static/logo.png'
  loadMessages()
  // 延迟滚动，确保DOM渲染完成
  setTimeout(() => {
    scrollToBottom()
  }, 100)
})
</script>

<style scoped>
.service-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* 聊天容器 */
.chat-container {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #f5f5f5;
  height: 0;
  box-sizing: border-box;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  padding: 60rpx 30rpx 20rpx;
  min-height: 100%;
  box-sizing: border-box;
  padding-top: calc(60rpx + env(safe-area-inset-top));
}

.message-item {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  max-width: 100%;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.service {
  flex-direction: row;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  max-width: calc(100% - 120rpx);
  min-width: 100rpx;
  flex: 1;
  overflow: hidden;
}

.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  background: white;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  margin-bottom: 8rpx;
  max-width: 100%;
  word-wrap: break-word;
  word-break: break-all;
  box-sizing: border-box;
}

.message-item.user .message-bubble {
  background: #667eea;
  color: white;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.message-time {
  font-size: 22rpx;
  color: #999;
}

/* 快捷回复 */
.quick-replies {
  background: white;
  padding: 20rpx 40rpx;
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  border-top: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.quick-reply-item {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 40rpx;
  font-size: 26rpx;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.quick-reply-item:active {
  transform: scale(0.95);
  opacity: 0.8;
}

/* 输入框 */
.input-container {
  background: white;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.input-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #f5f5f5;
  border-radius: 25rpx;
  padding: 16rpx 24rpx;
}

.message-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  width: 60rpx;
  height: 60rpx;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.send-btn {
  padding: 12rpx 24rpx;
  background: #e0e0e0;
  color: #999;
  border-radius: 20rpx;
  font-size: 26rpx;
  transition: all 0.3s;
}

.send-btn.active {
  background: #667eea;
  color: white;
}

/* 更多操作 */
.more-actions {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.actions-content {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  padding: 40rpx;
  width: 100%;
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.action-item .action-icon {
  width: 100rpx;
  height: 100rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

/* 常见问题弹窗 */
.faq-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.faq-content {
  background: white;
  border-radius: 20rpx;
  margin: 40rpx;
  max-height: 80vh;
  width: calc(100% - 80rpx);
  display: flex;
  flex-direction: column;
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 40rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.faq-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 36rpx;
  color: #999;
}

.faq-list {
  flex: 1;
  padding: 20rpx 0;
}

.faq-item {
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.faq-question {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}
</style>