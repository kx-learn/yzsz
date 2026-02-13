<template>
  <view class="allocation-page">
    <!-- 资金分配概览 -->
    <view class="allocation-overview">
      <view class="overview-header">
        <text class="overview-title">资金分配透明</text>
        <text class="overview-subtitle">销售额20%分配明细</text>
      </view>
      
      <view class="allocation-chart">
        <view class="chart-center">
          <text class="chart-title">本月销售额</text>
          <text class="chart-amount">¥{{ monthlyStats.totalSales || '0.00' }}</text>
          <text class="chart-subtitle">分配资金 ¥{{ monthlyStats.allocatedFunds || '0.00' }}</text>
        </view>
      </view>
    </view>

    <!-- 分配比例详情 -->
    <view class="allocation-details">
      <view class="details-header">
        <text class="details-title">分配比例详情</text>
        <text class="details-subtitle">基于销售额的20%</text>
      </view>
      
      <view class="allocation-list">
        <view v-if="allocationItems.length === 0 && !loading" class="empty-state">
          <text class="empty-text">暂无分配数据</text>
        </view>
        <view 
          v-for="item in allocationItems" 
          :key="item.type"
          class="allocation-item"
        >
          <view class="item-icon" style="background: #ff4757; background-color: #ff4757;">
            <text v-if="item.iconClass" class="icon-text iconfont" :class="item.iconClass" style="color: white;"></text>
            <text v-else class="icon-text" style="color: white;">{{ item.icon }}</text>
          </view>
          
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-desc">{{ item.description }}</text>
          </view>
          
          <view class="item-stats">
            <text class="item-percentage">{{ item.percentage }}%</text>
            <text class="item-amount">¥{{ calculateAmount(item.percentage) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分配历史记录 -->
    <view class="allocation-history">
      <view class="history-header">
        <text class="history-title">分配历史记录</text>
        <view class="period-selector">
          <view 
            v-for="period in periodOptions" 
            :key="period.value"
            class="period-item"
            :class="{ active: currentPeriod === period.value }"
            @tap="switchPeriod(period.value)"
          >
            <text class="period-text">{{ period.label }}</text>
          </view>
        </view>
      </view>
      
      <view class="history-list">
        <view 
          v-for="record in historyRecords" 
          :key="record.id"
          class="history-item"
        >
          <view class="record-header">
            <text class="record-period">{{ record.period }}</text>
            <text class="record-total">总分配：¥{{ record.totalAmount }}</text>
          </view>
          
          <view class="record-details">
            <view 
              v-for="detail in record.details" 
              :key="detail.type"
              class="detail-item"
            >
              <text class="detail-name">{{ detail.name }}</text>
              <text class="detail-amount">¥{{ detail.amount }}</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="historyRecords.length === 0 && !loading" class="empty-state">
          <text class="empty-icon iconfont icon-sousuo"></text>
          <text class="empty-text">暂无分配记录</text>
        </view>
        
        <!-- 加载中 -->
        <view v-if="loading" class="empty-state">
          <text class="empty-text">加载中...</text>
        </view>
      </view>
    </view>

    <!-- 透明承诺 -->
    <view class="transparency-promise">
      <view class="promise-header">
        <text class="promise-title">透明承诺</text>
      </view>
      
      <view class="promise-content">
        <view class="promise-item">
          <view class="promise-icon iconfont icon-sousuo" style="background: #00d2ff; background-color: #00d2ff; color: white;"></view>
          <view class="promise-text">
            <text class="promise-title-text">公开透明</text>
            <text class="promise-desc">所有资金分配比例和去向完全公开，接受用户监督</text>
          </view>
        </view>
        
        <view class="promise-item">
          <view class="promise-icon iconfont icon-shezhi" style="background: #00d2ff; background-color: #00d2ff; color: white;"></view>
          <view class="promise-text">
            <text class="promise-title-text">固定比例</text>
            <text class="promise-desc">分配比例固定不变，确保资金使用的公平性和可预期性</text>
          </view>
        </view>
        
        <view class="promise-item">
          <view class="promise-icon iconfont icon-qidong" style="background: #00d2ff; background-color: #00d2ff; color: white;"></view>
          <view class="promise-text">
            <text class="promise-title-text">持续发展</text>
            <text class="promise-desc">合理的资金分配确保平台可持续发展，保障用户长期利益</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentPeriod = ref('month')
const loading = ref(false)

// 月度统计数据（从API获取）
const monthlyStats = ref({
  totalSales: 0,
  allocatedFunds: 0
})

// 分配项目（从API获取）
const allocationItems = ref([])

// 周期选项
const periodOptions = [
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' }
]

// 历史记录（从API获取）
const historyRecords = ref([])

/**
 * 加载资金分配数据
 */
const loadAllocationData = async () => {
	loading.value = true
	try {
		// TODO: 调用API获取资金分配数据
		// const res = await getAllocationData({ period: currentPeriod.value })
		// if (res && res.data) {
		//   monthlyStats.value = res.data.monthlyStats || {}
		//   allocationItems.value = res.data.allocationItems || []
		//   historyRecords.value = res.data.historyRecords || []
		// }
		
		// 暂时使用测试数据，等待API对接
		// 注意：这些是测试数据，实际应从API获取
		monthlyStats.value = {
			totalSales: 128560.50,
			allocatedFunds: 25712.10
		}
		allocationItems.value = [
			{
				type: 'charity',
				name: '公益基金',
				description: '用于社会公益事业，回馈社会',
				percentage: 1,
				icon: '',
				iconClass: 'icon-gongyi'
			},
			{
				type: 'maintenance',
				name: '平台维护',
				description: '平台技术维护和系统升级',
				percentage: 1,
				icon: '',
				iconClass: 'icon-shezhi'
			},
			{
				type: 'subsidy',
				name: '周补贴池',
				description: '消费者及商家周补贴分配',
				percentage: 12,
				icon: '',
				iconClass: 'icon-butie'
			},
			{
				type: 'community',
				name: '社区店',
				description: '社区合作伙伴分成',
				percentage: 1,
				icon: '',
				iconClass: 'icon-shouye'
			},
			{
				type: 'city',
				name: '城市运营中心',
				description: '城市级运营中心分成',
				percentage: 1,
				icon: '',
				iconClass: 'icon-dingwei'
			}
		]
		historyRecords.value = []
	} catch (error) {
		console.error('加载资金分配数据失败:', error)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

/**
 * 计算分配金额
 * 说明：percentage 是占销售额的百分比，allocatedFunds 是销售额的20%
 * 所以实际金额 = 销售额 * percentage / 100
 */
const calculateAmount = (percentage) => {
  return (monthlyStats.value.totalSales * percentage / 100).toFixed(2)
}

/**
 * 切换周期
 */
const switchPeriod = (period) => {
  currentPeriod.value = period
  loadAllocationData() // 重新加载数据
}

onMounted(() => {
  console.log('资金分配页面加载')
  loadAllocationData()
})
</script>

<style scoped>
.allocation-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 分配概览 */
.allocation-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 50rpx;
  margin-bottom: 30rpx;
  color: white;
  text-align: center;
}

.overview-header {
  margin-bottom: 40rpx;
}

.overview-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.overview-subtitle {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
}

.allocation-chart {
  position: relative;
}

.chart-center {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 40rpx;
  backdrop-filter: blur(10px);
}

.chart-title {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.chart-amount {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.chart-subtitle {
  display: block;
  font-size: 22rpx;
  opacity: 0.8;
}

/* 分配详情 */
.allocation-details {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.details-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.details-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.details-subtitle {
  display: block;
  font-size: 24rpx;
  color: #999;
}

.allocation-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.allocation-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #f0f0f0;
  transition: all 0.3s;
}

.allocation-item .item-icon {
  width: 60rpx !important;
  height: 60rpx !important;
  background: #ff4757 !important;
  background-color: #ff4757 !important;
  border-radius: 30rpx !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.4) !important;
  flex-shrink: 0 !important;
}

.item-icon {
  width: 60rpx !important;
  height: 60rpx !important;
  background: #ff4757 !important;
  background-color: #ff4757 !important;
  border-radius: 30rpx !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.4) !important;
  flex-shrink: 0 !important;
}

.icon-text {
  font-size: 32rpx !important;
  color: white !important;
  font-weight: bold !important;
  line-height: 1 !important;
}

.icon-text.iconfont {
  color: white !important;
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.item-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.item-stats {
  text-align: right;
}

.item-percentage {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4rpx;
}

.item-amount {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 历史记录 */
.allocation-history {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.history-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.period-selector {
  display: flex;
  gap: 8rpx;
}

.period-item {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  font-size: 24rpx;
  color: #666;
}

.period-item.active {
  background: #667eea;
  color: white;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.history-item {
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.record-period {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.record-total {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}

.record-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.detail-name {
  font-size: 24rpx;
  color: #666;
}

.detail-amount {
  font-size: 24rpx;
  color: #333;
  font-weight: 600;
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
  font-size: 28rpx;
  color: #999;
}

/* 透明承诺 */
.transparency-promise {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
}

.promise-header {
  margin-bottom: 30rpx;
}

.promise-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.promise-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.promise-item {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.promise-icon {
  width: 60rpx !important;
  height: 60rpx !important;
  background: #00d2ff !important;
  border-radius: 30rpx !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 32rpx !important;
  flex-shrink: 0 !important;
  color: white !important;
  box-shadow: 0 4rpx 12rpx rgba(0, 210, 255, 0.4) !important;
}

.promise-icon.iconfont {
  color: white !important;
}

.promise-text {
  flex: 1;
}

.promise-title-text {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.promise-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>