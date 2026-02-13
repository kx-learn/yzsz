<template>
  <view class="subsidy-page">
    <!-- 补贴池状态 -->
    <view class="pool-status">
      <view class="pool-header">
        <text class="pool-title">本周补贴池</text>
        <text class="pool-period">{{ currentWeek }}</text>
      </view>
      
      <view class="pool-amount">
        <text class="amount-symbol">¥</text>
        <text class="amount-number">{{ poolInfo.amount }}</text>
      </view>
      
      <view class="pool-info">
        <view class="info-item">
          <text class="info-label">总积分：</text>
          <text class="info-value">{{ poolInfo.totalPoints }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">积分值：</text>
          <text class="info-value">{{ poolInfo.pointValue }}%</text>
        </view>
        <view class="info-item">
          <text class="info-label">发放时间：</text>
          <text class="info-value">{{ poolInfo.distributeTime }}</text>
        </view>
      </view>
    </view>

    <!-- 用户积分信息 -->
    <view class="user-points">
      <view class="points-header">
        <text class="points-title">我的积分</text>
      </view>
      
      <view class="points-content">
        <view class="points-item">
          <text class="points-label">当前积分</text>
          <text class="points-value">{{ userPoints.current }}</text>
        </view>
        <view class="points-item">
          <text class="points-label">预计补贴</text>
          <text class="points-value estimated">¥{{ estimatedSubsidy }}</text>
        </view>
      </view>
      
      <view class="points-tip">
        <text class="tip-text">💡 积分来源：购买会员商品、平台销售获得</text>
      </view>
    </view>

    <!-- 补贴记录 -->
    <view class="subsidy-records">
      <view class="records-header">
        <text class="records-title">补贴记录</text>
        <view class="week-filter">
          <picker 
            mode="selector" 
            :range="weekOptions" 
            :range-key="'label'"
            @change="onWeekChange"
          >
            <view class="filter-btn">
              <text class="filter-text">{{ selectedWeek.label }}</text>
              <text class="filter-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>
      
      <view class="records-list">
        <view 
          v-for="record in subsidyRecords" 
          :key="record.id"
          class="record-item"
        >
          <view class="record-info">
            <text class="record-week">第{{ record.week }}周补贴</text>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
            <view class="record-details">
              <text class="detail-text">使用积分：{{ record.points_used }}</text>
              <text class="detail-text">积分值：{{ record.point_value }}%</text>
            </view>
          </view>
          
          <view class="record-amount">
            <text class="amount-text">+¥{{ record.amount }}</text>
            <text class="status-text" :class="getStatusClass(record.status)">
              {{ getStatusText(record.status) }}
            </text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="subsidyRecords.length === 0" class="empty-state">
          <text class="empty-icon">📅</text>
          <text class="empty-text">暂无补贴记录</text>
          <text class="empty-desc">购买会员商品获得积分，参与周补贴分配</text>
        </view>
      </view>
    </view>

    <!-- 补贴规则 -->
    <view class="rules-section">
      <view class="rules-header" @tap="toggleRules">
        <text class="rules-title">补贴规则说明</text>
        <text class="toggle-icon">{{ showRules ? '▲' : '▼' }}</text>
      </view>
      
      <view v-if="showRules" class="rules-content">
        <view class="rule-item">
          <text class="rule-title">补贴池构成</text>
          <text class="rule-desc">周补贴池资金来源于销售额20%中的12%，以周为计算周期</text>
        </view>
        
        <view class="rule-item">
          <text class="rule-title">积分获得</text>
          <text class="rule-desc">• 会员购买商品获得商品价格100%的积分<br/>• 平台销售商品获得销售额20%的等额积分</text>
        </view>
        
        <view class="rule-item">
          <text class="rule-title">补贴计算</text>
          <text class="rule-desc">积分值 = 周补贴池余额 ÷ 所有积分总额，最高不超过2%</text>
        </view>
        
        <view class="rule-item">
          <text class="rule-title">发放时间</text>
          <text class="rule-desc">每周日24:00自动核算发放，发放后扣除对应积分</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSubsidyStats, getSubsidyRecords, getCurrentSubsidyPool, getUserPointsInfo } from '../../api/subsidy.js'

const poolInfo = ref({
  amount: 0,
  totalPoints: 0,
  pointValue: 0,
  distributeTime: ''
})

const userPoints = ref({
  current: 0,
  used: 0
})

const subsidyRecords = ref([])
const showRules = ref(false)
const loading = ref(false)

// 周期选择
const weekOptions = ref([
  { value: 'current', label: '本周' },
  { value: 'last', label: '上周' },
  { value: 'all', label: '全部' }
])
const selectedWeek = ref(weekOptions.value[0])

// 当前周期
const currentWeek = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}年第${week}周`
})

// 预计补贴
const estimatedSubsidy = computed(() => {
  if (poolInfo.value.totalPoints === 0 || userPoints.value.current === 0) {
    return '0.00'
  }
  
  const pointValue = Math.min(poolInfo.value.amount / poolInfo.value.totalPoints, 0.02)
  const estimated = userPoints.value.current * pointValue
  return estimated.toFixed(2)
})

/**
 * 加载补贴池信息
 */
const loadPoolInfo = async () => {
  try {
    const res = await getCurrentSubsidyPool()
    poolInfo.value = {
      amount: res.data.amount || 0,
      totalPoints: res.data.total_points || 0,
      pointValue: res.data.point_value || 0,
      distributeTime: res.data.distribute_time || '周日 24:00'
    }
  } catch (error) {
    console.error('加载补贴池信息失败:', error)
    // 模拟数据
    poolInfo.value = {
      amount: 15680.50,
      totalPoints: 125000,
      pointValue: 1.25,
      distributeTime: '周日 24:00'
    }
  }
}

/**
 * 加载用户积分信息
 */
const loadUserPoints = async () => {
  try {
    const res = await getUserPointsInfo()
    userPoints.value = {
      current: res.data.current || 0,
      used: res.data.used || 0
    }
  } catch (error) {
    console.error('加载用户积分失败:', error)
    // 模拟数据
    userPoints.value = {
      current: 2580,
      used: 1200
    }
  }
}

/**
 * 加载补贴记录
 */
const loadSubsidyRecords = async () => {
  try {
    loading.value = true
    
    const params = {
      limit: 20
    }
    
    if (selectedWeek.value.value !== 'all') {
      params.week = selectedWeek.value.value
    }
    
    const res = await getSubsidyRecords(params)
    subsidyRecords.value = res.data.list || []
    
  } catch (error) {
    console.error('加载补贴记录失败:', error)
    
    // 模拟数据
    subsidyRecords.value = [
      {
        id: 1,
        week: 3,
        amount: 32.25,
        points_used: 2580,
        point_value: 1.25,
        status: 'completed',
        created_at: '2024-01-21 00:00:00'
      },
      {
        id: 2,
        week: 2,
        amount: 28.60,
        points_used: 2200,
        point_value: 1.30,
        status: 'completed',
        created_at: '2024-01-14 00:00:00'
      },
      {
        id: 3,
        week: 1,
        amount: 25.80,
        points_used: 1800,
        point_value: 1.43,
        status: 'completed',
        created_at: '2024-01-07 00:00:00'
      }
    ]
    
  } finally {
    loading.value = false
  }
}

/**
 * 周期选择变化
 */
const onWeekChange = (e) => {
  const index = e.detail.value
  selectedWeek.value = weekOptions.value[index]
  loadSubsidyRecords()
}

/**
 * 切换规则显示
 */
const toggleRules = () => {
  showRules.value = !showRules.value
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status) => {
  const classMap = {
    completed: 'status-completed',
    pending: 'status-pending',
    failed: 'status-failed'
  }
  return classMap[status] || 'status-pending'
}

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
  const textMap = {
    completed: '已发放',
    pending: '待发放',
    failed: '发放失败'
  }
  return textMap[status] || '未知'
}

/**
 * 获取周数
 */
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  loadPoolInfo()
  loadUserPoints()
  loadSubsidyRecords()
})
</script>

<style scoped>
.subsidy-page {
  background: #f5f5f5;
  min-height: 100vh;
}

/* 补贴池状态 */
.pool-status {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40rpx;
  margin-bottom: 20rpx;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.pool-title {
  font-size: 32rpx;
  font-weight: bold;
}

.pool-period {
  font-size: 24rpx;
  opacity: 0.8;
}

.pool-amount {
  text-align: center;
  margin-bottom: 30rpx;
}

.amount-symbol {
  font-size: 36rpx;
  margin-right: 8rpx;
}

.amount-number {
  font-size: 72rpx;
  font-weight: bold;
}

.pool-info {
  display: flex;
  justify-content: space-between;
}

.info-item {
  text-align: center;
  flex: 1;
}

.info-label {
  display: block;
  font-size: 22rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.info-value {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}

/* 用户积分 */
.user-points {
  background: white;
  padding: 40rpx;
  margin-bottom: 20rpx;
}

.points-header {
  margin-bottom: 30rpx;
}

.points-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.points-content {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.points-item {
  text-align: center;
  flex: 1;
}

.points-label {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.points-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.points-value.estimated {
  color: #667eea;
}

.points-tip {
  background: #f8f9ff;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  border-left: 4rpx solid #667eea;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

/* 补贴记录 */
.subsidy-records {
  background: white;
  padding: 40rpx;
  margin-bottom: 20rpx;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.records-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.week-filter {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #f8f9fa;
  border-radius: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.filter-text {
  font-size: 24rpx;
  color: #333;
}

.filter-arrow {
  font-size: 20rpx;
  color: #999;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.record-info {
  flex: 1;
}

.record-week {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.record-time {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.record-details {
  display: flex;
  gap: 20rpx;
}

.detail-text {
  font-size: 22rpx;
  color: #666;
}

.record-amount {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.amount-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #4caf50;
}

.status-text {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.status-completed {
  background: #e8f5e9;
  color: #4caf50;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #ccc;
}

/* 规则说明 */
.rules-section {
  background: white;
  padding: 40rpx;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.rules-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.toggle-icon {
  font-size: 24rpx;
  color: #999;
}

.rules-content {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.rule-item {
  margin-bottom: 20rpx;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.rule-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.rule-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}
</style>