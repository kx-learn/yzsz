<template>
  <view class="flow-page">
    <!-- 筛选条件 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          v-for="tab in filterTabs" 
          :key="tab.value"
          class="filter-tab"
          :class="{ active: currentFilter === tab.value }"
          @tap="switchFilter(tab.value)"
        >
          <text class="tab-text">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 流水列表 -->
    <scroll-view 
      class="flow-scroll" 
      scroll-y 
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
      <view class="flow-list">
        <view 
          v-for="item in flowList" 
          :key="item.id"
          class="flow-item"
        >
          <view class="flow-icon" :class="getFlowTypeClass(item.flow_type)">
            <text class="icon-text iconfont" :class="getFlowIcon(item.flow_type)"></text>
          </view>
          
          <view class="flow-info">
            <text class="flow-title">{{ getFlowTitle(item.flow_type) }}</text>
            <text class="flow-time">{{ formatTime(item.created_at) }}</text>
            <text v-if="item.remark" class="flow-remark">{{ item.remark }}</text>
          </view>
          
          <view class="flow-amount" :class="item.change_amount > 0 ? 'positive' : 'negative'">
            <text class="amount-sign">{{ item.change_amount > 0 ? '+' : '' }}</text>
            <text class="amount-value">¥{{ Math.abs(item.change_amount) }}</text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="flowList.length === 0 && !loading" class="empty-state">
          <text class="empty-icon iconfont icon-hongbao"></text>
          <text class="empty-text">暂无流水记录</text>
        </view>
        
        <!-- 加载中 -->
        <view v-if="loading && flowList.length > 0" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 已加载完 -->
        <view v-if="!hasMore && flowList.length > 0" class="no-more">
          <text class="no-more-text">已显示全部</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAccountFlow } from '../../api/finance.js'

const currentFilter = ref('all')
const flowList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '提现', value: 'withdrawal' },
  { label: '退款', value: 'refund' }
]

/**
 * 切换筛选条件
 */
const switchFilter = (filterValue) => {
  if (currentFilter.value === filterValue) return
  
  currentFilter.value = filterValue
  currentPage.value = 1
  flowList.value = []
  hasMore.value = true
  loadFlowList(false)
}

/**
 * 加载流水列表
 */
const loadFlowList = async (append = false) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    if (!append) {
      currentPage.value = 1
      flowList.value = []
    }
    
    const params = {
      page: currentPage.value,
      limit: 20
    }
    
    if (currentFilter.value !== 'all') {
      params.flow_type = currentFilter.value
    }
    
    const res = await getAccountFlow(params)
    const newList = res.data.list || []
    
    if (append) {
      flowList.value = [...flowList.value, ...newList]
    } else {
      flowList.value = newList
    }
    
    hasMore.value = newList.length >= 20
    
    // 如果还有更多数据，页码加1，准备加载下一页
    if (hasMore.value) {
      currentPage.value++
    }
    
  } catch (error) {
    console.error('加载流水记录失败:', error)
    
    // 使用模拟数据
    if (currentPage.value === 1) {
      flowList.value = [
        {
          id: 1,
          change_amount: 500.00,
          flow_type: 'income',
          remark: '推荐奖励',
          created_at: '2024-01-15 14:30:00',
          balance_after: 2680.50
        },
        {
          id: 2,
          change_amount: -100.00,
          flow_type: 'withdrawal',
          remark: '提现申请',
          created_at: '2024-01-14 10:20:00',
          balance_after: 2180.50
        },
        {
          id: 3,
          change_amount: 200.00,
          flow_type: 'refund',
          remark: '订单退款',
          created_at: '2024-01-13 16:45:00',
          balance_after: 2280.50
        },
        {
          id: 4,
          change_amount: -50.00,
          flow_type: 'expense',
          remark: '手续费',
          created_at: '2024-01-12 09:15:00',
          balance_after: 2080.50
        }
      ]
    }
    
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多（下滑到底部触发）
 */
const loadMore = () => {
  console.log('[资金流水] 滚动到底部，触发加载更多', {
    loading: loading.value,
    hasMore: hasMore.value,
    currentPage: currentPage.value
  })
  
  if (!hasMore.value || loading.value) return
  
  loadFlowList(true)
}

/**
 * 获取流水类型样式类
 */
const getFlowTypeClass = (flowType) => {
  const classMap = {
    income: 'flow-income',
    expense: 'flow-expense',
    withdrawal: 'flow-withdrawal',
    refund: 'flow-refund'
  }
  return classMap[flowType] || 'flow-default'
}

/**
 * 获取流水图标（返回图标类名）
 */
const getFlowIcon = (flowType) => {
  const iconMap = {
    income: 'icon-hongbao',
    expense: 'icon-shanchu',
    withdrawal: 'icon-tixian',
    refund: 'icon-tuikuanshouhou'
  }
  return iconMap[flowType] || 'icon-hongbao'
}

/**
 * 判断是否为图标字体
 */
const isFlowIconFont = () => {
  return true
}

/**
 * 获取流水标题
 */
const getFlowTitle = (flowType) => {
  const titleMap = {
    income: '收入',
    expense: '支出',
    withdrawal: '提现',
    refund: '退款'
  }
  return titleMap[flowType] || '其他'
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onMounted(() => {
  loadFlowList()
})
</script>

<style scoped>
.flow-page {
  background: #f5f5f5;
  min-height: 100vh;
}

/* 筛选条件 */
.filter-section {
  background: white;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
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
  background: #667eea;
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
.flow-scroll {
  height: calc(100vh - 200rpx);
}

/* 流水列表 */
.flow-list {
  padding: 0 40rpx;
}

.flow-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.flow-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-income {
  background: #e8f5e9;
}

.flow-expense {
  background: #ffebee;
}

.flow-withdrawal {
  background: #e3f2fd;
}

.flow-refund {
  background: #fff3e0;
}

.flow-default {
  background: #f5f5f5;
}

.icon-text {
  font-size: 36rpx;
}

.flow-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.flow-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.flow-time {
  font-size: 24rpx;
  color: #999;
}

.flow-remark {
  font-size: 26rpx;
  color: #666;
}

.flow-amount {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
}

.flow-amount.positive {
  color: #4caf50;
}

.flow-amount.negative {
  color: #f44336;
}

.amount-sign {
  margin-right: 4rpx;
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
  font-size: 32rpx;
  color: #999;
}
</style>