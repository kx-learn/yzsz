<template>
  <view class="balance-manager">
    <view class="header">
      <text class="title">💰 余额管理调试工具</text>
      <text class="subtitle">修改测试余额，用于测试余额支付功能</text>
    </view>

    <!-- 当前余额显示 -->
    <view class="current-balance-section">
      <text class="section-title">💎 当前余额</text>
      <view class="balance-display">
        <text class="balance-label">测试余额：</text>
        <text class="balance-value">¥{{ currentBalance.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 修改余额表单 -->
    <view class="modify-balance-section">
      <text class="section-title">✏️ 修改余额</text>
      
      <view class="form-group">
        <text class="label">操作类型</text>
        <view class="type-selector">
          <view 
            v-for="type in operationTypes" 
            :key="type.value"
            class="type-option"
            :class="{ active: operationType === type.value }"
            @tap="operationType = type.value"
          >
            <text class="type-icon">{{ type.icon }}</text>
            <text class="type-name">{{ type.name }}</text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <text class="label">金额</text>
        <input 
          v-model.number="amount" 
          class="input" 
          type="digit" 
          placeholder="请输入金额" 
        />
        <text class="hint">输入要设置、增加或减少的金额</text>
      </view>

      <button @tap="applyBalanceChange" class="apply-btn">
        {{ getOperationText() }}
      </button>
    </view>

    <!-- 快速操作 -->
    <view class="quick-actions">
      <text class="section-title">⚡ 快速操作</text>
      <view class="action-buttons">
        <button @tap="setBalance(0)" class="quick-btn">设为 0</button>
        <button @tap="setBalance(100)" class="quick-btn">设为 ¥100</button>
        <button @tap="setBalance(500)" class="quick-btn">设为 ¥500</button>
        <button @tap="setBalance(1000)" class="quick-btn">设为 ¥1000</button>
        <button @tap="setBalance(5000)" class="quick-btn">设为 ¥5000</button>
      </view>
    </view>

    <!-- 余额流水记录 -->
    <view class="balance-log-section">
      <text class="section-title">📋 余额流水记录</text>
      <scroll-view class="log-list" scroll-y>
        <view 
          v-for="(log, index) in balanceLogs" 
          :key="index"
          class="log-item"
        >
          <view class="log-header">
            <text class="log-title">{{ log.title }}</text>
            <text class="log-amount" :class="log.type">
              {{ log.type === 'income' ? '+' : '-' }}¥{{ log.amount.toFixed(2) }}
            </text>
          </view>
          <view class="log-details">
            <text class="log-time">{{ log.time }}</text>
            <text class="log-balance">余额：¥{{ log.balance.toFixed(2) }}</text>
          </view>
        </view>
        <view v-if="balanceLogs.length === 0" class="empty-log">
          <text class="empty-text">暂无流水记录</text>
        </view>
      </scroll-view>
    </view>

    <!-- 操作结果 -->
    <view class="result-section" v-if="operationResult">
      <text class="result-title">✅ 操作结果</text>
      <text class="result-content">{{ operationResult }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 余额存储键
const BALANCE_KEY = 'userBalance'
const BALANCE_LOG_KEY = 'userBalanceLogs'

// 操作类型
const operationTypes = [
  { value: 'set', name: '设置为', icon: '🎯' },
  { value: 'add', name: '增加', icon: '➕' },
  { value: 'subtract', name: '减少', icon: '➖' }
]

// 当前余额
const currentBalance = ref(0)
const operationType = ref('set')
const amount = ref('')
const operationResult = ref('')
const balanceLogs = ref([])

// 加载当前余额
const loadBalance = () => {
  currentBalance.value = Number(uni.getStorageSync(BALANCE_KEY)) || 0
  loadBalanceLogs()
}

// 加载余额流水
const loadBalanceLogs = () => {
  const logs = uni.getStorageSync(BALANCE_LOG_KEY) || []
  balanceLogs.value = logs.slice(0, 50) // 只显示最近50条
}

// 保存余额
const saveBalance = (newBalance) => {
  uni.setStorageSync(BALANCE_KEY, newBalance)
  currentBalance.value = newBalance
}

// 添加余额流水记录
const addBalanceLog = (title, amount, type, balance) => {
  const logs = uni.getStorageSync(BALANCE_LOG_KEY) || []
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  logs.unshift({
    title,
    amount: Math.abs(amount),
    type: type || (amount >= 0 ? 'income' : 'expense'),
    balance,
    time: timeStr
  })
  
  // 只保留最近100条记录
  if (logs.length > 100) {
    logs.splice(100)
  }
  
  uni.setStorageSync(BALANCE_LOG_KEY, logs)
  loadBalanceLogs()
}

// 应用余额变更
const applyBalanceChange = () => {
  if (!amount.value || Number(amount.value) < 0) {
    uni.showToast({ title: '请输入有效的金额', icon: 'none' })
    return
  }
  
  const changeAmount = Number(amount.value)
  let newBalance = currentBalance.value
  
  switch (operationType.value) {
    case 'set':
      newBalance = changeAmount
      addBalanceLog('设置余额', changeAmount - currentBalance.value, changeAmount >= currentBalance.value ? 'income' : 'expense', newBalance)
      break
    case 'add':
      newBalance = currentBalance.value + changeAmount
      addBalanceLog('增加余额', changeAmount, 'income', newBalance)
      break
    case 'subtract':
      newBalance = Math.max(0, currentBalance.value - changeAmount)
      addBalanceLog('减少余额', changeAmount, 'expense', newBalance)
      break
  }
  
  saveBalance(newBalance)
  operationResult.value = `余额已${operationType.value === 'set' ? '设置为' : operationType.value === 'add' ? '增加' : '减少'} ¥${changeAmount.toFixed(2)}，当前余额：¥${newBalance.toFixed(2)}`
  amount.value = ''
  
  uni.showToast({ 
    title: `余额已更新为 ¥${newBalance.toFixed(2)}`, 
    icon: 'success' 
  })
  
  // 3秒后清除操作结果
  setTimeout(() => {
    operationResult.value = ''
  }, 3000)
}

// 快速设置余额
const setBalance = (value) => {
  operationType.value = 'set'
  amount.value = value
  applyBalanceChange()
}

// 获取操作文本
const getOperationText = () => {
  switch (operationType.value) {
    case 'set':
      return '设置为'
    case 'add':
      return '增加'
    case 'subtract':
      return '减少'
    default:
      return '应用'
  }
}

onMounted(() => {
  loadBalance()
})

onShow(() => {
  loadBalance()
})
</script>

<style scoped>
.balance-manager {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #666;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

/* 当前余额 */
.current-balance-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.balance-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
}

.balance-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
}

.balance-value {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
}

/* 修改余额表单 */
.modify-balance-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.type-selector {
  display: flex;
  gap: 20rpx;
}

.type-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  background: #f8f9fa;
}

.type-option.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.type-icon {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.type-name {
  font-size: 24rpx;
  color: #666;
}

.input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #f8f9fa;
}

.hint {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.apply-btn {
  width: 100%;
  padding: 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
  margin-top: 20rpx;
}

/* 快速操作 */
.quick-actions {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.quick-btn {
  flex: 1;
  min-width: 140rpx;
  padding: 20rpx;
  background: #f0f4ff;
  color: #667eea;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: 2rpx solid #667eea;
}

/* 余额流水 */
.balance-log-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.log-list {
  max-height: 600rpx;
}

.log-item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.log-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
}

.log-amount {
  font-size: 28rpx;
  font-weight: bold;
}

.log-amount.income {
  color: #4caf50;
}

.log-amount.expense {
  color: #f44336;
}

.log-details {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.empty-log {
  padding: 60rpx 0;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

/* 操作结果 */
.result-section {
  background: #e8f5e9;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.result-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 8rpx;
}

.result-content {
  display: block;
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}
</style>

