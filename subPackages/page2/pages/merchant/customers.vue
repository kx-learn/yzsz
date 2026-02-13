<template>
  <view class="customers-page">
    <!-- 客户统计 -->
    <view class="stats-section">
      <view class="stats-item">
        <text class="stats-value">{{ customerStats.total }}</text>
        <text class="stats-label">总客户数</text>
      </view>
      <view class="stats-item">
        <text class="stats-value">{{ customerStats.newToday }}</text>
        <text class="stats-label">今日新增</text>
      </view>
      <view class="stats-item">
        <text class="stats-value">{{ customerStats.active }}</text>
        <text class="stats-label">活跃客户</text>
      </view>
      <view class="stats-item">
        <text class="stats-value">{{ customerStats.vip }}</text>
        <text class="stats-label">VIP客户</text>
      </view>
    </view>

    <!-- 筛选器 -->
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
      
      <view class="search-box">
        <input 
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索客户姓名或手机号"
          @input="searchCustomers"
        />
        <text class="search-icon iconfont icon-sousuo"></text>
      </view>
    </view>

    <!-- 客户列表 -->
    <view class="customers-list">
      <view 
        v-for="customer in filteredCustomers" 
        :key="customer.id"
        class="customer-item"
        @tap="goToCustomerDetail(customer.id)"
      >
        <image :src="customer.avatar" class="customer-avatar" mode="aspectFill" />
        
        <view class="customer-info">
          <view class="customer-header">
            <text class="customer-name">{{ customer.name }}</text>
            <view v-if="customer.isVip" class="vip-badge">
              <text class="badge-text">VIP</text>
            </view>
          </view>
          
          <text class="customer-phone">{{ customer.phone }}</text>
          <text class="customer-address">{{ customer.address }}</text>
          
          <view class="customer-stats">
            <text class="stat-item">订单：{{ customer.orderCount }}单</text>
            <text class="stat-item">消费：¥{{ customer.totalAmount }}</text>
            <text class="stat-item">最近：{{ customer.lastOrderTime }}</text>
          </view>
        </view>
        
        <view class="customer-actions">
          <view class="action-btn" @tap.stop="callCustomer(customer.phone)">
            <text class="action-icon iconfont icon-kefu"></text>
          </view>
          <view class="action-btn" @tap.stop="messageCustomer(customer.id)">
            <text class="action-icon iconfont icon-xiaoxi"></text>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="filteredCustomers.length === 0" class="empty-state">
        <text class="empty-icon iconfont icon-tuandui"></text>
        <text class="empty-text">暂无客户数据</text>
      </view>
    </view>

    <!-- 客户分析 -->
    <view class="analysis-section">
      <view class="section-header">
        <text class="section-title">客户分析</text>
      </view>
      
      <view class="analysis-charts">
        <view class="chart-item">
          <text class="chart-title">客户等级分布</text>
          <view class="chart-placeholder">
            <text class="chart-text">📊</text>
            <text class="chart-desc">VIP客户占比 {{ ((customerStats.vip / customerStats.total) * 100).toFixed(1) }}%</text>
          </view>
        </view>
        
        <view class="chart-item">
          <text class="chart-title">消费能力分析</text>
          <view class="chart-placeholder">
            <text class="chart-text iconfont icon-butie"></text>
            <text class="chart-desc">人均消费 ¥{{ avgConsumption }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentFilter = ref('all')
const searchKeyword = ref('')

// 客户统计
const customerStats = ref({
  total: 156,
  newToday: 8,
  active: 89,
  vip: 23
})

// 筛选标签
const filterTabs = [
  { label: '全部', value: 'all' },
  { label: 'VIP客户', value: 'vip' },
  { label: '活跃客户', value: 'active' },
  { label: '新客户', value: 'new' },
  { label: '沉睡客户', value: 'inactive' }
]

// 客户列表
const customers = ref([
  {
    id: 1,
    name: '张三',
    phone: '138****8888',
    avatar: '/static/avatar1.jpg',
    address: '北京市朝阳区',
    isVip: true,
    orderCount: 15,
    totalAmount: 2580.50,
    lastOrderTime: '2024-01-15',
    status: 'active'
  },
  {
    id: 2,
    name: '李四',
    phone: '139****9999',
    avatar: '/static/avatar2.jpg',
    address: '上海市浦东新区',
    isVip: false,
    orderCount: 8,
    totalAmount: 1256.00,
    lastOrderTime: '2024-01-10',
    status: 'active'
  },
  {
    id: 3,
    name: '王五',
    phone: '137****7777',
    avatar: '/static/avatar3.jpg',
    address: '广州市天河区',
    isVip: true,
    orderCount: 25,
    totalAmount: 4580.00,
    lastOrderTime: '2024-01-14',
    status: 'active'
  },
  {
    id: 4,
    name: '赵六',
    phone: '136****6666',
    avatar: '/static/avatar4.jpg',
    address: '深圳市南山区',
    isVip: false,
    orderCount: 3,
    totalAmount: 456.00,
    lastOrderTime: '2023-12-20',
    status: 'inactive'
  }
])

// 过滤后的客户列表
const filteredCustomers = computed(() => {
  let result = customers.value
  
  // 按筛选条件筛选
  if (currentFilter.value !== 'all') {
    if (currentFilter.value === 'vip') {
      result = result.filter(customer => customer.isVip)
    } else if (currentFilter.value === 'active') {
      result = result.filter(customer => customer.status === 'active')
    } else if (currentFilter.value === 'new') {
      // 模拟新客户（最近7天有订单的）
      result = result.filter(customer => {
        const lastOrder = new Date(customer.lastOrderTime)
        const now = new Date()
        const diffDays = (now - lastOrder) / (1000 * 60 * 60 * 24)
        return diffDays <= 7
      })
    } else if (currentFilter.value === 'inactive') {
      result = result.filter(customer => customer.status === 'inactive')
    }
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(customer => 
      customer.name.toLowerCase().includes(keyword) ||
      customer.phone.includes(keyword)
    )
  }
  
  return result
})

// 人均消费
const avgConsumption = computed(() => {
  if (customers.value.length === 0) return 0
  const total = customers.value.reduce((sum, customer) => sum + customer.totalAmount, 0)
  return (total / customers.value.length).toFixed(2)
})

/**
 * 切换筛选条件
 */
const switchFilter = (filter) => {
  currentFilter.value = filter
}

/**
 * 搜索客户
 */
const searchCustomers = () => {
  // 搜索逻辑已在计算属性中实现
}

/**
 * 拨打客户电话
 */
const callCustomer = (phone) => {
  uni.makePhoneCall({
    phoneNumber: phone.replace(/\*/g, '1'),
    success: () => {
      console.log('拨打电话成功')
    },
    fail: () => {
      uni.showToast({ title: '拨打失败', icon: 'none' })
    }
  })
}

/**
 * 给客户发消息
 */
const messageCustomer = (customerId) => {
  uni.showToast({ title: '消息功能开发中', icon: 'none' })
}

/**
 * 跳转到客户详情
 */
const goToCustomerDetail = (customerId) => {
  // customer-detail 页面不存在，暂时显示提示
  uni.showToast({ title: '功能开发中', icon: 'none' })
  // uni.navigateTo({ url: `/page2/merchant/customer-detail?id=${customerId}` })
}

onMounted(() => {
  console.log('客户管理页面加载')
})
</script>

<style scoped>
.customers-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 客户统计 */
.stats-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  justify-content: space-between;
}

.stats-item {
  text-align: center;
  flex: 1;
}

.stats-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 8rpx;
}

.stats-label {
  display: block;
  font-size: 24rpx;
  color: #666;
}

/* 筛选器 */
.filter-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.filter-tabs {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  font-size: 24rpx;
  color: #666;
}

.filter-tab.active {
  background: #ff9800;
  color: white;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 20rpx 60rpx 20rpx 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 25rpx;
  font-size: 28rpx;
}

.search-icon {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28rpx;
  color: #999;
}

/* 客户列表 */
.customers-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.customer-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.customer-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
}

.customer-info {
  flex: 1;
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.customer-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.vip-badge {
  padding: 4rpx 12rpx;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: bold;
}

.customer-phone {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.customer-address {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.customer-stats {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 22rpx;
  color: #666;
  background: #f8f9fa;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.customer-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn {
  width: 80rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

/* 客户分析 */
.analysis-section {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.analysis-charts {
  display: flex;
  gap: 20rpx;
}

.chart-item {
  flex: 1;
  text-align: center;
}

.chart-title {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.chart-placeholder {
  height: 200rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.chart-text {
  font-size: 48rpx;
}

.chart-desc {
  font-size: 24rpx;
  color: #666;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  display: block;
  font-size: 100rpx;
  margin-bottom: 20rpx;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 28rpx;
  color: #999;
}
</style>