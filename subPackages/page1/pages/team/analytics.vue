<template>
  <view class="analytics-page">
    <!-- 数据概览 -->
    <view class="data-overview">
      <view class="overview-header">
        <text class="overview-title">团队数据分析</text>
        <text class="overview-subtitle">深度洞察团队发展趋势</text>
      </view>
      
      <view class="time-selector">
        <text 
          v-for="(period, index) in timePeriods" 
          :key="index"
          class="time-item"
          :class="{ active: currentPeriod === period.value }"
          @tap="switchPeriod(period.value)"
        >
          {{ period.label }}
        </text>
      </view>
    </view>

    <!-- 核心指标 -->
    <view class="key-metrics">
      <view class="metrics-header">
        <text class="metrics-title">核心指标</text>
        <text class="metrics-subtitle">{{ currentPeriodLabel }}数据表现</text>
      </view>
      
      <view class="metrics-grid">
        <view 
          v-for="(metric, index) in keyMetrics" 
          :key="index"
          class="metric-card"
          :class="'metric-' + metric.type"
        >
          <view class="metric-icon">
            <text v-if="metric.iconClass" class="icon-text iconfont" :class="metric.iconClass"></text>
            <text v-else class="icon-text">{{ metric.icon }}</text>
          </view>
          <view class="metric-info">
            <text class="metric-value">{{ metric.value }}</text>
            <text class="metric-label">{{ metric.label }}</text>
            <view class="metric-trend" :class="metric.trend > 0 ? 'up' : 'down'">
              <text class="trend-icon">{{ metric.trend > 0 ? '↗' : '↘' }}</text>
              <text class="trend-text">{{ Math.abs(metric.trend) }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 团队增长趋势 -->
    <view class="growth-trend">
      <view class="trend-header">
        <text class="trend-title">团队增长趋势</text>
        <view class="trend-legend">
          <view class="legend-item">
            <view class="legend-color team"></view>
            <text class="legend-text">团队人数</text>
          </view>
          <view class="legend-item">
            <view class="legend-color reward"></view>
            <text class="legend-text">奖励金额</text>
          </view>
        </view>
      </view>
      
      <view class="chart-container">
        <view class="chart-area">
          <view class="y-axis">
            <text v-for="(label, index) in yAxisLabels" :key="index" class="y-label">{{ label }}</text>
          </view>
          <view class="chart-content">
            <view class="chart-bars">
              <view 
                v-for="(data, index) in chartData" 
                :key="index"
                class="bar-group"
              >
                <view class="bar team-bar" :style="{ height: data.teamPercent + '%' }"></view>
                <view class="bar reward-bar" :style="{ height: data.rewardPercent + '%' }"></view>
                <text class="bar-label">{{ data.month }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 层级分析 -->
    <view class="layer-analysis">
      <view class="analysis-header">
        <text class="analysis-title">层级贡献分析</text>
        <text class="analysis-subtitle">各层级对总收益的贡献占比</text>
      </view>
      
      <view class="layer-chart">
        <view class="pie-chart">
          <view class="pie-center">
            <text class="center-value">¥{{ totalLayerReward }}</text>
            <text class="center-label">总奖励</text>
          </view>
        </view>
        
        <view class="layer-legend">
          <view 
            v-for="(layer, index) in layerData" 
            :key="index"
            class="legend-item"
          >
            <view class="legend-color" :style="{ background: layer.color }"></view>
            <view class="legend-info">
              <text class="legend-name">第{{ index + 1 }}层</text>
              <text class="legend-value">¥{{ layer.amount }} ({{ layer.percent }}%)</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 会员活跃度分析 -->
    <view class="activity-analysis">
      <view class="activity-header">
        <text class="activity-title">会员活跃度分析</text>
      </view>
      
      <view class="activity-stats">
        <view class="activity-item">
          <text class="activity-label">高活跃度</text>
          <view class="activity-bar">
            <view class="bar-fill high" :style="{ width: activityData.high + '%' }"></view>
          </view>
          <text class="activity-value">{{ activityData.high }}%</text>
        </view>
        
        <view class="activity-item">
          <text class="activity-label">中活跃度</text>
          <view class="activity-bar">
            <view class="bar-fill medium" :style="{ width: activityData.medium + '%' }"></view>
          </view>
          <text class="activity-value">{{ activityData.medium }}%</text>
        </view>
        
        <view class="activity-item">
          <text class="activity-label">低活跃度</text>
          <view class="activity-bar">
            <view class="bar-fill low" :style="{ width: activityData.low + '%' }"></view>
          </view>
          <text class="activity-value">{{ activityData.low }}%</text>
        </view>
      </view>
    </view>

    <!-- 收益预测 -->
    <view class="revenue-forecast">
      <view class="forecast-header">
        <text class="forecast-title">收益预测</text>
        <text class="forecast-subtitle">基于历史数据的智能预测</text>
      </view>
      
      <view class="forecast-cards">
        <view class="forecast-card">
          <text class="forecast-period">下月预测</text>
          <text class="forecast-value">¥{{ forecast.nextMonth }}</text>
          <text class="forecast-confidence">置信度: {{ forecast.confidence }}%</text>
        </view>
        
        <view class="forecast-card">
          <text class="forecast-period">季度预测</text>
          <text class="forecast-value">¥{{ forecast.quarter }}</text>
          <text class="forecast-growth">预计增长: {{ forecast.growth }}%</text>
        </view>
      </view>
    </view>

    <!-- 优化建议 -->
    <view class="optimization-suggestions">
      <view class="suggestions-header">
        <text class="suggestions-title">优化建议</text>
        <text class="suggestions-subtitle">基于数据分析的改进建议</text>
      </view>
      
      <view class="suggestions-list">
        <view 
          v-for="(suggestion, index) in suggestions" 
          :key="index"
          class="suggestion-item"
          :class="'priority-' + suggestion.priority"
        >
          <view class="suggestion-icon">
            <text class="icon-text">{{ suggestion.icon }}</text>
          </view>
          <view class="suggestion-content">
            <text class="suggestion-title">{{ suggestion.title }}</text>
            <text class="suggestion-desc">{{ suggestion.description }}</text>
            <text class="suggestion-impact">预期提升: {{ suggestion.impact }}</text>
          </view>
          <view class="suggestion-priority">
            <text class="priority-text">{{ getPriorityText(suggestion.priority) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导出报告 -->
    <view class="export-section">
      <button class="export-btn" @tap="exportReport">
        <text class="btn-icon">📊</text>
        <text class="btn-text">导出分析报告</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 时间周期
const timePeriods = ref([
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' }
])

const currentPeriod = ref('month')

// 当前周期标签
const currentPeriodLabel = computed(() => {
  const period = timePeriods.value.find(p => p.value === currentPeriod.value)
  return period ? period.label : '本月'
})

// 核心指标
const keyMetrics = ref([
  {
    icon: '👥',
    iconClass: 'icon-tuandui',
    label: '团队人数',
    value: '167',
    trend: 8.5,
    type: 'team'
  },
  {
    icon: '💰',
    iconClass: 'icon-butie',
    label: '团队奖励',
    value: '¥15,680',
    trend: 12.3,
    type: 'reward'
  },
  {
    icon: '⭐',
    iconClass: 'icon-shoucang',
    label: '星级店长',
    value: '15',
    trend: 25.0,
    type: 'star'
  },
  {
    icon: '📈',
    label: '活跃度',
    value: '78%',
    trend: -2.1,
    type: 'activity'
  }
])

// Y轴标签
const yAxisLabels = ref(['200', '150', '100', '50', '0'])

// 图表数据
const chartData = ref([
  { month: '7月', teamCount: 120, rewardAmount: 8500, teamPercent: 60, rewardPercent: 45 },
  { month: '8月', teamCount: 135, rewardAmount: 11200, teamPercent: 67, rewardPercent: 60 },
  { month: '9月', teamCount: 148, rewardAmount: 13800, teamPercent: 74, rewardPercent: 74 },
  { month: '10月', teamCount: 156, rewardAmount: 14500, teamPercent: 78, rewardPercent: 78 },
  { month: '11月', teamCount: 167, rewardAmount: 15680, teamPercent: 83, rewardPercent: 84 },
  { month: '12月', teamCount: 180, rewardAmount: 18200, teamPercent: 90, rewardPercent: 98 }
])

// 层级数据
const layerData = ref([
  { amount: 6800, percent: 43, color: '#3d6bff' },
  { amount: 4200, percent: 27, color: '#6ca4ff' },
  { amount: 2680, percent: 17, color: '#9cc5ff' },
  { amount: 1500, percent: 10, color: '#c2e0ff' },
  { amount: 500, percent: 3, color: '#e8f4ff' }
])

const totalLayerReward = computed(() => {
  return layerData.value.reduce((total, layer) => total + layer.amount, 0)
})

// 活跃度数据
const activityData = ref({
  high: 35,
  medium: 43,
  low: 22
})

// 收益预测
const forecast = ref({
  nextMonth: '18,500',
  confidence: 85,
  quarter: '52,000',
  growth: 15.2
})

// 优化建议
const suggestions = ref([
  {
    icon: '🎯',
    title: '提升低活跃度会员参与度',
    description: '通过个性化激励方案，提升22%低活跃度会员的参与度',
    impact: '预计增收15%',
    priority: 'high'
  },
  {
    icon: '📚',
    title: '加强团队培训',
    description: '针对新晋升的星级店长提供专业培训，提升管理能力',
    impact: '预计增收8%',
    priority: 'medium'
  },
  {
    icon: '🤝',
    title: '优化沟通机制',
    description: '建立更高效的团队沟通渠道，提升协作效率',
    impact: '预计增收5%',
    priority: 'low'
  }
])

/**
 * 切换时间周期
 */
const switchPeriod = (period) => {
  currentPeriod.value = period
  // 这里可以重新加载对应周期的数据
  loadAnalyticsData()
}

/**
 * 获取优先级文本
 */
const getPriorityText = (priority) => {
  const priorityMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return priorityMap[priority] || '中'
}

/**
 * 加载分析数据
 */
const loadAnalyticsData = () => {
  // 模拟数据加载
  console.log('加载分析数据:', currentPeriod.value)
}

/**
 * 导出报告
 */
const exportReport = () => {
  uni.showLoading({ title: '生成报告中...' })
  
  setTimeout(() => {
    uni.hideLoading()
    uni.showToast({ title: '报告已生成', icon: 'success' })
    
    // 这里可以实现实际的导出功能
    // 比如生成PDF或者分享链接
  }, 2000)
}

onLoad(() => {
  loadAnalyticsData()
})
</script>

<style scoped>
.analytics-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 40rpx;
}

/* 数据概览 */
.data-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  color: white;
}

.overview-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.overview-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.overview-subtitle {
  font-size: 24rpx;
  opacity: 0.8;
}

.time-selector {
  display: flex;
  justify-content: center;
  gap: 16rpx;
}

.time-item {
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: 24rpx;
  backdrop-filter: blur(10px);
}

.time-item.active {
  background: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}

/* 核心指标 */
.key-metrics {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.metrics-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.metrics-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.metrics-subtitle {
  font-size: 24rpx;
  color: #666;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
}

.metric-team { border-left: 4rpx solid #3d6bff; }
.metric-reward { border-left: 4rpx solid #4caf50; }
.metric-star { border-left: 4rpx solid #ff9800; }
.metric-activity { border-left: 4rpx solid #9c27b0; }

.metric-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(61, 107, 255, 0.1);
  border-radius: 50%;
  flex-shrink: 0;
}

.icon-text {
  font-size: 24rpx;
}

.metric-info {
  flex: 1;
}

.metric-value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 4rpx;
}

.metric-label {
  display: block;
  font-size: 22rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 20rpx;
}

.metric-trend.up {
  color: #4caf50;
}

.metric-trend.down {
  color: #f44336;
}

/* 增长趋势 */
.growth-trend {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.trend-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.trend-legend {
  display: flex;
  gap: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-color {
  width: 16rpx;
  height: 16rpx;
  border-radius: 2rpx;
}

.legend-color.team {
  background: #3d6bff;
}

.legend-color.reward {
  background: #4caf50;
}

.legend-text {
  font-size: 22rpx;
  color: #666;
}

.chart-container {
  height: 300rpx;
}

.chart-area {
  display: flex;
  height: 100%;
}

.y-axis {
  width: 60rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 16rpx;
}

.y-label {
  font-size: 20rpx;
  color: #999;
  text-align: right;
}

.chart-content {
  flex: 1;
  position: relative;
  padding-right: 20rpx;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 240rpx;
  padding-bottom: 40rpx;
  padding-right: 0;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex: 1;
}

.bar {
  width: 16rpx;
  border-radius: 2rpx;
  transition: height 0.3s;
}

.team-bar {
  background: #3d6bff;
}

.reward-bar {
  background: #4caf50;
}

.bar-label {
  font-size: 20rpx;
  color: #666;
  margin-top: 8rpx;
}

/* 层级分析 */
.layer-analysis {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.analysis-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.analysis-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.analysis-subtitle {
  font-size: 24rpx;
  color: #666;
}

.layer-chart {
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.pie-chart {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: conic-gradient(
    #3d6bff 0deg 155deg,
    #6ca4ff 155deg 252deg,
    #9cc5ff 252deg 313deg,
    #c2e0ff 313deg 349deg,
    #e8f4ff 349deg 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pie-center {
  width: 120rpx;
  height: 120rpx;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.center-value {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}

.center-label {
  font-size: 20rpx;
  color: #666;
}

.layer-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.legend-info {
  flex: 1;
}

.legend-name {
  display: block;
  font-size: 24rpx;
  color: #333;
  font-weight: 600;
}

.legend-value {
  font-size: 22rpx;
  color: #666;
}

/* 活跃度分析 */
.activity-analysis {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.activity-header {
  margin-bottom: 24rpx;
}

.activity-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.activity-stats {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.activity-label {
  width: 120rpx;
  font-size: 24rpx;
  color: #666;
  flex-shrink: 0;
}

.activity-bar {
  flex: 1;
  height: 20rpx;
  background: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 10rpx;
  transition: width 0.3s;
}

.bar-fill.high {
  background: #4caf50;
}

.bar-fill.medium {
  background: #ff9800;
}

.bar-fill.low {
  background: #f44336;
}

.activity-value {
  width: 60rpx;
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  text-align: right;
}

/* 收益预测 */
.revenue-forecast {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.forecast-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.forecast-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.forecast-subtitle {
  font-size: 24rpx;
  color: #666;
}

.forecast-cards {
  display: flex;
  gap: 16rpx;
}

.forecast-card {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-radius: 12rpx;
  color: white;
}

.forecast-period {
  display: block;
  font-size: 24rpx;
  margin-bottom: 12rpx;
  opacity: 0.9;
}

.forecast-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.forecast-confidence,
.forecast-growth {
  font-size: 22rpx;
  opacity: 0.8;
}

/* 优化建议 */
.optimization-suggestions {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.suggestions-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.suggestions-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.suggestions-subtitle {
  font-size: 24rpx;
  color: #666;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 4rpx solid #ddd;
}

.priority-high {
  border-left-color: #f44336;
}

.priority-medium {
  border-left-color: #ff9800;
}

.priority-low {
  border-left-color: #4caf50;
}

.suggestion-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(61, 107, 255, 0.1);
  border-radius: 50%;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.suggestion-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8rpx;
}

.suggestion-impact {
  font-size: 22rpx;
  color: #4caf50;
  font-weight: bold;
}

.suggestion-priority {
  text-align: center;
}

.priority-text {
  padding: 4rpx 12rpx;
  background: #e0e0e0;
  color: #666;
  font-size: 20rpx;
  border-radius: 12rpx;
}

/* 导出报告 */
.export-section {
  text-align: center;
}

.export-btn {
  width: 300rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #3d6bff, #6ca4ff);
  color: white;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 40rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.btn-icon {
  font-size: 32rpx;
}
</style>