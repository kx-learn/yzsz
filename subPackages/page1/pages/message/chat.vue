<template>
  <view class="chat-page">
    <scroll-view 
      class="chat-content" 
      scroll-y 
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="message-list">
        <!-- 时间戳 -->
        <view class="time-divider" v-for="(msg, index) in messages" :key="'time-' + msg.id" v-if="shouldShowTime(msg, index)">
          <text class="time-text">{{ msg.time }}</text>
        </view>
        
        <view 
          :class="['message-item', msg.fromMe ? 'from-me' : 'from-other']" 
          v-for="msg in messages" 
          :key="msg.id"
          :id="'msg-' + msg.id"
        >
          <image 
            :src="msg.fromMe ? myAvatar : otherAvatar" 
            class="avatar" 
            mode="aspectFill"
          />
          <view class="message-content">
            <view :class="['message-bubble', msg.type || 'text']">
              <!-- 文本消息 -->
              <text class="message-text" v-if="msg.type === 'text' || !msg.type">{{ msg.content }}</text>
              
              <!-- 图片消息 -->
              <image v-if="msg.type === 'image'" :src="msg.content" class="message-image" mode="aspectFill" @tap="previewImage(msg.content)" />
              
              <!-- 语音消息 -->
              <view v-if="msg.type === 'voice'" class="message-voice" @tap="playVoice(msg)">
                <view class="voice-icon">
                  <view class="voice-wave"></view>
                  <view class="voice-wave"></view>
                  <view class="voice-wave"></view>
                </view>
                <text class="voice-duration">{{ msg.duration }}"</text>
              </view>
              
              <!-- 订单消息 -->
              <view v-if="msg.type === 'order'" class="message-order" @tap="viewOrder(msg.orderId)">
                <view class="order-header">
                  <text class="order-icon iconfont icon-daifahuo"></text>
                  <text class="order-title">订单消息</text>
                </view>
                <text class="order-no">订单号：{{ msg.orderNo }}</text>
                <view class="order-footer">
                  <text class="order-amount">¥{{ msg.amount }}</text>
                  <text class="order-status">查看详情 ></text>
                </view>
              </view>
              
              <!-- 红包消息 -->
              <view v-if="msg.type === 'redpack'" class="message-redpack" @tap="openRedpack(msg)">
                <view class="redpack-header">
                  <text class="redpack-icon iconfont icon-hongbao"></text>
                  <view class="redpack-info">
                    <text class="redpack-title">{{ msg.content }}</text>
                    <text class="redpack-subtitle">微信红包</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 更多功能面板 -->
    <view class="more-panel" v-if="showMorePanel">
      <view class="more-grid">
        <view class="more-item" @tap="chooseImage">
          <view class="more-icon">
            <text class="icon-text">📷</text>
          </view>
          <text class="more-text">相册</text>
        </view>
        <view class="more-item" @tap="takePhoto">
          <view class="more-icon">
            <text class="icon-text">📸</text>
          </view>
          <text class="more-text">拍摄</text>
        </view>
        <view class="more-item" @tap="sendOrder">
          <view class="more-icon">
            <text class="icon-text iconfont icon-daifahuo"></text>
          </view>
          <text class="more-text">订单</text>
        </view>
        <view class="more-item" @tap="sendRedpack">
          <view class="more-icon">
            <text class="icon-text iconfont icon-hongbao"></text>
          </view>
          <text class="more-text">红包</text>
        </view>
      </view>
    </view>

    <!-- 输入栏 -->
    <view class="chat-input-bar">
      <!-- 语音按钮 -->
      <view class="input-icon-btn" @tap="toggleInputMode">
        <text class="icon-text iconfont" :class="isVoiceMode ? '' : 'icon-AudioFilled'">{{ isVoiceMode ? '⌨️' : '' }}</text>
      </view>
      
      <!-- 文本输入框 -->
      <view class="input-wrapper" v-if="!isVoiceMode">
        <input 
          class="chat-input" 
          v-model="inputText" 
          placeholder="输入消息..."
          confirm-type="send"
          @confirm="sendMessage"
          @focus="onInputFocus"
          @blur="onInputBlur"
        />
      </view>
      
      <!-- 语音输入按钮 -->
      <view 
        v-else 
        class="voice-input-btn" 
        @touchstart="startRecord" 
        @touchend="stopRecord" 
        @touchcancel="cancelRecord"
        :class="{ recording: isRecording }"
      >
        <text>{{ isRecording ? '松开 发送' : '按住 说话' }}</text>
      </view>
      
      <!-- 表情按钮 -->
      <view class="input-icon-btn" @tap="showEmoji" v-if="!inputText">
        <text class="icon-text iconfont icon-biaoqing"></text>
      </view>
      
      <!-- 更多按钮 -->
      <view class="input-icon-btn" @tap="toggleMorePanel" v-if="!inputText">
        <text class="icon-text">{{ showMorePanel ? '⌨️' : '➕' }}</text>
      </view>
      
      <!-- 发送按钮 -->
      <view class="send-btn" @tap="sendMessage" v-if="inputText">
        <text>发送</text>
      </view>
    </view>

    <!-- 录音提示 -->
    <view class="recording-mask" v-if="isRecording">
      <view class="recording-box">
        <view class="recording-icon">
          <view class="mic-icon">🎤</view>
          <view class="sound-wave">
            <view class="wave-bar" v-for="i in 5" :key="i"></view>
          </view>
        </view>
        <text class="recording-text">松开 发送</text>
        <text class="recording-tip">上滑取消</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const messageId = ref('')
const messageTitle = ref('客服')
const otherName = ref('客服')
const inputText = ref('')
const scrollIntoView = ref('')
const showMorePanel = ref(false)
const isVoiceMode = ref(false)
const isRecording = ref(false)
const recordStartTime = ref(0) // 录音开始时间

const myAvatar = ref('/static/logo.png')
const otherAvatar = ref('/static/logo.png')

const messages = ref([
  {
    id: 1,
    type: 'text',
    content: '您好，有什么可以帮助您的吗？',
    time: '10:30',
    fromMe: false
  },
  {
    id: 2,
    type: 'text',
    content: '我想咨询一下订单的问题',
    time: '10:31',
    fromMe: true
  },
  {
    id: 3,
    type: 'text',
    content: '好的，请问您的订单号是多少？',
    time: '10:31',
    fromMe: false
  },
  {
    id: 4,
    type: 'voice',
    content: '语音消息',
    duration: 3,
    time: '10:32',
    fromMe: true
  }
])

onLoad((options) => {
  if (options.id) {
    messageId.value = options.id
  }
  if (options.title) {
    const decodedTitle = decodeURIComponent(options.title)
    messageTitle.value = decodedTitle
    otherName.value = decodedTitle
    uni.setNavigationBarTitle({
      title: decodedTitle
    })
  }
  
  scrollToBottom()
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messages.value.length > 0) {
      const lastId = messages.value[messages.value.length - 1].id
      scrollIntoView.value = 'msg-' + lastId
    }
  })
}

// 判断是否显示时间
const shouldShowTime = (msg, index) => {
  if (index === 0) return true
  // 这里可以添加更复杂的逻辑，比如超过5分钟显示时间
  return false
}

const sendMessage = () => {
  if (!inputText.value.trim()) {
    return
  }

  const newMessage = {
    id: messages.value.length + 1,
    type: 'text',
    content: inputText.value,
    time: getCurrentTime(),
    fromMe: true
  }

  messages.value.push(newMessage)
  inputText.value = ''
  showMorePanel.value = false
  scrollToBottom()

  // 模拟客服回复
  setTimeout(() => {
    const reply = {
      id: messages.value.length + 1,
      type: 'text',
      content: '收到您的消息，我们会尽快处理',
      time: getCurrentTime(),
      fromMe: false
    }
    messages.value.push(reply)
    scrollToBottom()
  }, 1000)
}

const toggleMorePanel = () => {
  showMorePanel.value = !showMorePanel.value
}

const toggleInputMode = () => {
  isVoiceMode.value = !isVoiceMode.value
  showMorePanel.value = false
}

const onInputFocus = () => {
  showMorePanel.value = false
}

const onInputBlur = () => {
  // 输入框失焦
}

const showEmoji = () => {
  uni.showToast({ title: '表情功能开发中', icon: 'none' })
}

const startRecord = () => {
  isRecording.value = true
  recordStartTime.value = Date.now() // 记录开始时间
  console.log('开始录音:', recordStartTime.value)
}

const stopRecord = () => {
  if (!isRecording.value) return
  
  isRecording.value = false
  
  // 计算录音时长（秒）
  const duration = Math.ceil((Date.now() - recordStartTime.value) / 1000)
  console.log('录音时长:', duration, '秒')
  
  // 最少1秒，最多60秒
  const finalDuration = Math.max(1, Math.min(duration, 60))
  
  // 发送语音消息
  const voiceMessage = {
    id: messages.value.length + 1,
    type: 'voice',
    content: '语音消息',
    duration: finalDuration, // 使用实际录音时长
    time: getCurrentTime(),
    fromMe: true
  }
  messages.value.push(voiceMessage)
  scrollToBottom()
  
  // 重置录音开始时间
  recordStartTime.value = 0
}

const cancelRecord = () => {
  isRecording.value = false
  uni.showToast({ title: '取消发送', icon: 'none' })
}

const playVoice = (msg) => {
  uni.showToast({ title: '播放语音', icon: 'none' })
}

const chooseImage = () => {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: (res) => {
      res.tempFilePaths.forEach(path => {
        const imageMessage = {
          id: messages.value.length + 1,
          type: 'image',
          content: path,
          time: getCurrentTime(),
          fromMe: true
        }
        messages.value.push(imageMessage)
      })
      showMorePanel.value = false
      scrollToBottom()
    }
  })
}

const takePhoto = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: (res) => {
      const imageMessage = {
        id: messages.value.length + 1,
        type: 'image',
        content: res.tempFilePaths[0],
        time: getCurrentTime(),
        fromMe: true
      }
      messages.value.push(imageMessage)
      showMorePanel.value = false
      scrollToBottom()
    }
  })
}

const sendOrder = () => {
  const orderMessage = {
    id: messages.value.length + 1,
    type: 'order',
    content: '订单消息',
    orderNo: 'ORD202411280001',
    orderId: 1,
    amount: 299.00,
    time: getCurrentTime(),
    fromMe: true
  }
  messages.value.push(orderMessage)
  showMorePanel.value = false
  scrollToBottom()
}

const sendRedpack = () => {
  uni.showModal({
    title: '发送红包',
    editable: true,
    placeholderText: '输入金额',
    success: (res) => {
      if (res.confirm && res.content) {
        const redpackMessage = {
          id: messages.value.length + 1,
          type: 'redpack',
          content: '恭喜发财，大吉大利',
          amount: parseFloat(res.content) || 0,
          time: getCurrentTime(),
          fromMe: true
        }
        messages.value.push(redpackMessage)
        showMorePanel.value = false
        scrollToBottom()
      }
    }
  })
}

const previewImage = (url) => {
  try {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      uni.showToast({ title: '图片路径无效', icon: 'none' })
      return
    }
    
    uni.previewImage({
      urls: [url],
      current: url,
      fail: (err) => {
        console.error('[预览图片] 预览失败:', err)
        uni.showToast({ title: '预览失败', icon: 'none' })
      }
    })
  } catch (error) {
    console.error('[预览图片] 预览出错:', error)
    uni.showToast({ title: '预览失败', icon: 'none' })
  }
}

const viewOrder = (orderId) => {
  uni.navigateTo({
    url: `/page1/order/detail?id=${orderId}`
  })
}

const openRedpack = (msg) => {
  uni.showToast({
    title: `红包 ¥${msg.amount}`,
    icon: 'success'
  })
}

const getCurrentTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ededed;
}

.chat-content {
  flex: 1;
  padding: 20rpx;
  padding-bottom: 40rpx; /* 增加底部内边距，防止消息被输入栏遮挡 */
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 时间分隔线 */
.time-divider {
  display: flex;
  justify-content: center;
  margin: 20rpx 0;
}

.time-text {
  font-size: 24rpx;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

/* 消息项 */
.message-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}

.message-item.from-me {
  flex-direction: row-reverse;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
  background: #fff;
  z-index: 1; /* 确保头像在最上层 */
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 500rpx;
}

/* 消息气泡 */
.message-bubble {
  position: relative;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  word-break: break-all;
}

/* 文本消息 */
.message-bubble.text {
  background: #fff;
}

.from-me .message-bubble.text {
  background: #95ec69;
}

/* 气泡小三角 */
.from-other .message-bubble::before {
  content: '';
  position: absolute;
  left: -10rpx;
  top: 20rpx;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8rpx 10rpx 8rpx 0;
  border-color: transparent #fff transparent transparent;
  z-index: 0; /* 确保三角在头像下方 */
}

.from-me .message-bubble.text::before {
  content: '';
  position: absolute;
  right: -10rpx;
  top: 20rpx;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8rpx 0 8rpx 10rpx;
  border-color: transparent transparent transparent #95ec69;
  z-index: 0; /* 确保三角在头像下方 */
}

.message-text {
  font-size: 32rpx;
  line-height: 1.5;
  color: #000;
}

/* 图片消息 */
.message-image {
  max-width: 400rpx;
  max-height: 400rpx;
  border-radius: 8rpx;
}

/* 语音消息 */
.message-voice {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 120rpx;
  padding: 16rpx 20rpx;
}

.from-me .message-voice {
  flex-direction: row-reverse;
}

.voice-icon {
  display: flex;
  gap: 4rpx;
  align-items: center;
}

.voice-wave {
  width: 4rpx;
  height: 20rpx;
  background: #000;
  border-radius: 2rpx;
  animation: wave 1s ease-in-out infinite;
}

.from-me .voice-wave {
  background: #000;
}

.voice-wave:nth-child(2) {
  animation-delay: 0.2s;
}

.voice-wave:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 100% {
    height: 20rpx;
  }
  50% {
    height: 32rpx;
  }
}

.voice-duration {
  font-size: 28rpx;
  color: #000;
}

/* 订单消息 */
.message-order {
  background: #fff;
  padding: 24rpx;
  border-radius: 8rpx;
  min-width: 400rpx;
  border: 1rpx solid #e5e5e5;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.order-icon {
  font-size: 32rpx;
}

.order-title {
  font-size: 28rpx;
  color: #000;
  font-weight: 600;
}

.order-no {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 16rpx;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-amount {
  font-size: 32rpx;
  color: #ff6b00;
  font-weight: bold;
}

.order-status {
  font-size: 24rpx;
  color: #576b95;
}

/* 红包消息 */
.message-redpack {
  background: linear-gradient(135deg, #fa9d3b, #f76260);
  padding: 32rpx;
  border-radius: 8rpx;
  min-width: 400rpx;
}

.redpack-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.redpack-icon {
  font-size: 56rpx;
}

.redpack-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.redpack-title {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

.redpack-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 更多功能面板 */
.more-panel {
  background: #f7f7f7;
  border-top: 1rpx solid #d9d9d9;
  padding: 40rpx 30rpx;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.more-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40rpx;
}

.more-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.more-icon {
  width: 120rpx;
  height: 120rpx;
  background: #fff;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #e5e5e5;
}

.icon-text {
  font-size: 56rpx;
}

.more-text {
  font-size: 26rpx;
  color: #666;
}

/* 输入栏 */
.chat-input-bar {
  background: #f7f7f7;
  padding: 16rpx 20rpx;
  display: flex;
  gap: 12rpx;
  align-items: center;
  border-top: 1rpx solid #d9d9d9;
}

.input-icon-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-icon-btn .icon-text {
  font-size: 48rpx;
}

.input-wrapper {
  flex: 1;
}

.chat-input {
  width: 100%;
  height: 68rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 32rpx;
  border: 1rpx solid #d9d9d9;
}

/* 语音输入按钮 */
.voice-input-btn {
  flex: 1;
  height: 68rpx;
  background: #fff;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #000;
  border: 1rpx solid #d9d9d9;
}

.voice-input-btn.recording {
  background: #d9d9d9;
}

/* 发送按钮 */
.send-btn {
  padding: 0 32rpx;
  height: 68rpx;
  background: #07c160;
  color: #fff;
  border-radius: 8rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 录音遮罩 */
.recording-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.recording-box {
  background: rgba(0, 0, 0, 0.7);
  padding: 60rpx 80rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.recording-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.mic-icon {
  font-size: 100rpx;
}

.sound-wave {
  display: flex;
  gap: 8rpx;
  align-items: flex-end;
  height: 60rpx;
}

.wave-bar {
  width: 8rpx;
  background: #fff;
  border-radius: 4rpx;
  animation: soundWave 0.8s ease-in-out infinite;
}

.wave-bar:nth-child(1) {
  animation-delay: 0s;
}

.wave-bar:nth-child(2) {
  animation-delay: 0.1s;
}

.wave-bar:nth-child(3) {
  animation-delay: 0.2s;
}

.wave-bar:nth-child(4) {
  animation-delay: 0.3s;
}

.wave-bar:nth-child(5) {
  animation-delay: 0.4s;
}

@keyframes soundWave {
  0%, 100% {
    height: 20rpx;
  }
  50% {
    height: 60rpx;
  }
}

.recording-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}

.recording-tip {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
}
</style>
