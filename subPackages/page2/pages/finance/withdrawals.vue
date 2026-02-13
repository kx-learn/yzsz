<template>
  <view class="withdrawals-page">
    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ totalWithdrawn }}</text>
        <text class="stat-label">累计提现（元）</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ pendingCount }}</text>
        <text class="stat-label">待审核</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ successCount }}</text>
        <text class="stat-label">已到账</text>
      </view>
    </view>

    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          v-for="tab in statusTabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: currentStatus === tab.value }"
          @tap="switchStatus(tab.value)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 提现记录列表 -->
    <scroll-view 
      class="records-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
    <view class="records-list">
      <view 
        v-for="record in recordsList" 
        :key="record.id"
        class="record-card"
        @tap="viewDetail(record)"
      >
        <view class="record-header">
          <view class="record-amount">
            <text class="amount-text">¥{{ record.amount }}</text>
            <text class="actual-text">实际到账 ¥{{ record.actual_amount }}</text>
          </view>
          <view class="record-status" :class="getStatusClass(record.status)">
            <text class="status-text">{{ getStatusText(record.status) }}</text>
          </view>
        </view>
        
        <view class="record-info">
          <view class="info-item">
            <text class="info-label">申请时间：</text>
            <text class="info-value">{{ formatTime(record.created_at) }}</text>
          </view>
          <view v-if="record.processed_at" class="info-item">
            <text class="info-label">处理时间：</text>
            <text class="info-value">{{ formatTime(record.processed_at) }}</text>
          </view>
          <view v-if="record.audit_remark" class="info-item">
            <text class="info-label">备注：</text>
            <text class="info-value">{{ record.audit_remark }}</text>
          </view>
        </view>
        
        <view class="record-actions">
          <text class="view-detail">查看详情 ></text>
        </view>
      </view>
      
      <!-- 加载中 -->
      <view v-if="loading && recordsList.length > 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 已加载完 -->
      <view v-if="!hasMore && recordsList.length > 0" class="no-more">
        <text class="no-more-text">已显示全部</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="recordsList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">🏦</text>
        <text class="empty-text">暂无提现记录</text>
        <button class="go-withdraw-btn" @tap="goToWithdraw">
          立即提现
        </button>
      </view>
    </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentStatus = ref('all')
const recordsList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const refreshing = ref(false)

const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '审核中', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

// 统计数据
const totalWithdrawn = computed(() => {
  return recordsList.value
    .filter(item => item.status === 'approved')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2)
})

const pendingCount = computed(() => {
  return recordsList.value.filter(item => item.status === 'pending').length
})

const successCount = computed(() => {
  return recordsList.value.filter(item => item.status === 'approved').length
})

/**
 * 切换状态筛选
 */
const switchStatus = (status) => {
  if (currentStatus.value === status) return
  
  currentStatus.value = status
  currentPage.value = 1
  recordsList.value = []
  hasMore.value = true
  loadRecords()
}

/**
 * 加载提现记录（已禁用）
 */
const loadRecords = async (append = false) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    if (!append) {
      currentPage.value = 1
      recordsList.value = []
    }
    
    // 提现功能已暂停
    const newList = []
    
    if (append) {
      recordsList.value = [...recordsList.value, ...newList]
    } else {
      recordsList.value = newList
    }
    
    hasMore.value = newList.length >= 20
    
    // 如果还有更多数据，页码加1，准备加载下一页
    if (hasMore.value) {
      currentPage.value++
    }
    
  } catch (error) {
    console.error('加载提现记录失败:', error)
    
    // 不再使用模拟数据，返回空数组
    if (!append) {
      recordsList.value = []
    }
    
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

/**
 * 加载更多（下滑到底部触发）
 */
const loadMore = () => {
  if (!hasMore.value || loading.value) return
  loadRecords(true)
}

/**
 * 下拉刷新（加载下一页）
 */
const onRefresh = () => {
  if (!hasMore.value || loading.value) {
    refreshing.value = false
    return
  }
  refreshing.value = true
  loadRecords(true)
}

/**
 * 查看详情
 */
const viewDetail = (record) => {
  const statusText = getStatusText(record.status)
  const content = `申请金额：¥${record.amount}\n实际到账：¥${record.actual_amount}\n申请时间：${formatTime(record.created_at)}\n状态：${statusText}${record.audit_remark ? '\n备注：' + record.audit_remark : ''}`
  
  uni.showModal({
    title: '提现详情',
    content: content,
    showCancel: false,
    confirmText: '知道了'
  })
}

/**
 * 跳转到提现页面
 */
const goToWithdraw = () => {
  uni.navigateTo({
    url: '/subPackages/page2/pages/withdraw/withdraw'
  })
}

/**
 * 获取状态样式类
 */
const getStatusClass = (status) => {
  const classMap = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected'
  }
  return classMap[status] || 'status-pending'
}

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
  const textMap = {
    pending: '审核中',
    approved: '已到账',
    rejected: '已拒绝'
  }
  return textMap[status] || '未知'
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.withdrawals-page {
  background: #f5f5f5;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-card {
  background: white;
  padding: 40rpx;
  display: flex;
  align-items: center;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #f0f0f0;
}

/* 筛选条件 */
.filter-section {
  background: white;
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #f0f0f0;
  margin-bottom: 20rpx;
}

.filter-tabs {
  display: flex;
  gap: 30rpx;
}

.filter-tab {
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  background: #f8f9fa;
  transition: all 0.3s;
}

.filter-tab.active {
  background: #4caf50;
}

.tab-text {
  font-size: 26rpx;
  color: #666;
}

.filter-tab.active .tab-text {
  color: white;
  font-weight: 600;
}

/* 滚动容器 */
.records-scroll {
  height: calc(100vh - 300rpx);
}

/* 记录列表 */
.records-list {
  padding: 0 40rpx;
}

/* 加载中 */
.loading-state {
  text-align: center;
  padding: 40rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 已加载完 */
.no-more {
  text-align: center;
  padding: 40rpx 0;
}

.no-more-text {
  font-size: 24rpx;
  color: #ccc;
}

.record-card {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.record-amount {
  flex: 1;
}

.amount-text {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.actual-text {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.record-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.record-info {
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  margin-bottom: 8rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  min-width: 140rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.record-actions {
  text-align: right;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.view-detail {
  font-size: 26rpx;
  color: #4caf50;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-text {
  font-size: 28rpx;
  color: #4caf50;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 32rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.go-withdraw-btn {
  width: 300rpx;
  height: 80rpx;
  background: #4caf50;
  color: white;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
}
</style>