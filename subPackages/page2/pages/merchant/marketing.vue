<template>
  <view class="marketing-page">
    <!-- 营销概览 -->
    <view class="marketing-overview">
      <view class="overview-header">
        <text class="overview-title">营销推广</text>
        <text class="overview-subtitle">提升店铺曝光和销量</text>
      </view>
      
      <view class="overview-stats">
        <view class="stat-item">
          <text class="stat-value">{{ marketingStats.activePromotions }}</text>
          <text class="stat-label">进行中活动</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ marketingStats.totalViews }}</text>
          <text class="stat-label">总曝光量</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ marketingStats.conversionRate }}%</text>
          <text class="stat-label">转化率</text>
        </view>
      </view>
    </view>

    <!-- 营销工具 -->
    <view class="marketing-tools">
      <view class="section-header">
        <text class="section-title">营销工具</text>
      </view>
      
      <view class="tools-grid">
        <view class="tool-item" @tap="goToTool('coupon')">
          <view class="tool-icon">🎫</view>
          <text class="tool-name">优惠券</text>
          <text class="tool-desc">发放优惠券吸引客户</text>
        </view>
        
        <view class="tool-item" @tap="goToTool('discount')">
          <view class="tool-icon iconfont icon-butie"></view>
          <text class="tool-name">限时折扣</text>
          <text class="tool-desc">商品限时特价促销</text>
        </view>
        
        <view class="tool-item" @tap="goToTool('group')">
          <view class="tool-icon">👥</view>
          <text class="tool-name">拼团活动</text>
          <text class="tool-desc">多人拼团享优惠</text>
        </view>
        
        <view class="tool-item" @tap="goToTool('seckill')">
          <view class="tool-icon">⚡</view>
          <text class="tool-name">秒杀活动</text>
          <text class="tool-desc">限量秒杀引流</text>
        </view>
        
        <view class="tool-item" @tap="goToTool('points')">
          <view class="tool-icon iconfont icon-shoucang"></view>
          <text class="tool-name">积分营销</text>
          <text class="tool-desc">积分兑换促活跃</text>
        </view>
        
        <view class="tool-item" @tap="goToTool('referral')">
          <view class="tool-icon iconfont icon-youhuijuan"></view>
          <text class="tool-name">推荐有礼</text>
          <text class="tool-desc">推荐好友获奖励</text>
        </view>
      </view>
    </view>

    <!-- 进行中的活动 -->
    <view class="active-promotions">
      <view class="section-header">
        <text class="section-title">进行中的活动</text>
        <text class="more-btn" @tap="goToPromotionList">查看全部</text>
      </view>
      
      <view class="promotions-list">
        <view 
          v-for="promotion in activePromotions" 
          :key="promotion.id"
          class="promotion-item"
          @tap="goToPromotionDetail(promotion.id)"
        >
          <view class="promotion-header">
            <view class="promotion-type" :class="'type-' + promotion.type">
              <text class="type-text">{{ getPromotionTypeText(promotion.type) }}</text>
            </view>
            <view class="promotion-status" :class="'status-' + promotion.status">
              <text class="status-text">{{ getPromotionStatusText(promotion.status) }}</text>
            </view>
          </view>
          
          <text class="promotion-title">{{ promotion.title }}</text>
          <text class="promotion-desc">{{ promotion.description }}</text>
          
          <view class="promotion-stats">
            <text class="stat-text">参与：{{ promotion.participants }}人</text>
            <text class="stat-text">转化：{{ promotion.conversions }}单</text>
            <text class="stat-text">销售：¥{{ promotion.sales }}</text>
          </view>
          
          <view class="promotion-time">
            <text class="time-text">{{ promotion.startTime }} - {{ promotion.endTime }}</text>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="activePromotions.length === 0" class="empty-promotions">
          <text class="empty-icon">📢</text>
          <text class="empty-text">暂无进行中的活动</text>
          <text class="empty-desc">创建营销活动提升销量</text>
        </view>
      </view>
    </view>

    <!-- 营销数据分析 -->
    <view class="marketing-analysis">
      <view class="section-header">
        <text class="section-title">营销数据分析</text>
      </view>
      
      <view class="analysis-content">
        <view class="analysis-item">
          <text class="analysis-title">本月营销效果</text>
          <view class="analysis-chart">
            <text class="chart-icon">📈</text>
            <view class="chart-data">
              <text class="data-item">曝光量：{{ marketingStats.monthlyViews }}</text>
              <text class="data-item">点击率：{{ marketingStats.clickRate }}%</text>
              <text class="data-item">转化率：{{ marketingStats.conversionRate }}%</text>
            </view>
          </view>
        </view>
        
        <view class="analysis-item">
          <text class="analysis-title">热门营销方式</text>
          <view class="popular-methods">
            <view 
              v-for="method in popularMethods" 
              :key="method.type"
              class="method-item"
            >
              <text class="method-name">{{ method.name }}</text>
              <view class="method-bar">
                <view class="bar-fill" :style="{ width: method.percentage + '%' }"></view>
              </view>
              <text class="method-percentage">{{ method.percentage }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 营销建议 -->
    <view class="marketing-suggestions">
      <view class="section-header">
        <text class="section-title">营销建议</text>
      </view>
      
      <view class="suggestions-list">
        <view 
          v-for="suggestion in marketingSuggestions" 
          :key="suggestion.id"
          class="suggestion-item"
        >
          <view class="suggestion-icon">{{ suggestion.icon }}</view>
          <view class="suggestion-content">
            <text class="suggestion-title">{{ suggestion.title }}</text>
            <text class="suggestion-desc">{{ suggestion.description }}</text>
          </view>
          <view class="suggestion-action" @tap="applySuggestion(suggestion.id)">
            <text class="action-text">去设置</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 营销统计数据
const marketingStats = ref({
  activePromotions: 3,
  totalViews: 15680,
  conversionRate: 12.5,
  monthlyViews: 45230,
  clickRate: 8.3
})

// 进行中的活动
const activePromotions = ref([
  {
    id: 1,
    type: 'discount',
    title: '新年大促销',
    description: '全场商品8折优惠，满200减50',
    status: 'active',
    participants: 156,
    conversions: 23,
    sales: 5680.50,
    startTime: '2024-01-01',
    endTime: '2024-01-31'
  },
  {
    id: 2,
    type: 'coupon',
    title: '新用户专享券',
    description: '新用户注册即送50元优惠券',
    status: 'active',
    participants: 89,
    conversions: 12,
    sales: 2340.00,
    startTime: '2024-01-10',
    endTime: '2024-02-10'
  },
  {
    id: 3,
    type: 'group',
    title: '三人拼团',
    description: '三人成团享7折优惠',
    status: 'active',
    participants: 45,
    conversions: 8,
    sales: 1580.00,
    startTime: '2024-01-15',
    endTime: '2024-01-25'
  }
])

// 热门营销方式
const popularMethods = ref([
  { type: 'discount', name: '限时折扣', percentage: 85 },
  { type: 'coupon', name: '优惠券', percentage: 72 },
  { type: 'group', name: '拼团活动', percentage: 58 },
  { type: 'seckill', name: '秒杀活动', percentage: 43 }
])

// 营销建议
const marketingSuggestions = ref([
  {
    id: 1,
    icon: '🎯',
    title: '设置新用户优惠',
    description: '为新用户提供专属优惠券，提高转化率'
  },
  {
    id: 2,
    icon: '📱',
    title: '开启推荐有礼',
    description: '鼓励老用户推荐新用户，扩大客户群体'
  },
  {
    id: 3,
    icon: '⏰',
    title: '创建限时活动',
    description: '设置限时折扣活动，营造紧迫感促进下单'
  }
])

/**
 * 获取活动类型文本
 */
const getPromotionTypeText = (type) => {
  const typeMap = {
    discount: '限时折扣',
    coupon: '优惠券',
    group: '拼团',
    seckill: '秒杀',
    points: '积分',
    referral: '推荐'
  }
  return typeMap[type] || '未知'
}

/**
 * 获取活动状态文本
 */
const getPromotionStatusText = (status) => {
  const statusMap = {
    active: '进行中',
    pending: '待开始',
    ended: '已结束',
    paused: '已暂停'
  }
  return statusMap[status] || '未知'
}

/**
 * 跳转到营销工具
 */
const goToTool = (toolType) => {
  uni.showToast({ title: `${toolType}功能开发中`, icon: 'none' })
}

/**
 * 跳转到活动列表
 */
const goToPromotionList = () => {
  // 尝试跳转到子包页面，若页面不存在则回退为“功能开发中”提示
  uni.navigateTo({
    url: '/subPackages/page2/pages/merchant/promotion-list',
    fail: () => uni.showToast({ title: '功能开发中', icon: 'none' })
  })
}

/**
 * 跳转到活动详情
 */
const goToPromotionDetail = (promotionId) => {
  uni.navigateTo({
    url: `/subPackages/page2/pages/merchant/promotion-detail?id=${promotionId}`,
    fail: () => uni.showToast({ title: '功能开发中', icon: 'none' })
  })
}

/**
 * 应用营销建议
 */
const applySuggestion = (suggestionId) => {
  uni.showToast({ title: '营销建议功能开发中', icon: 'none' })
}

onMounted(() => {
  console.log('营销推广页面加载')
})
</script>

<style scoped>
.marketing-page {
  padding: 40rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 营销概览 */
.marketing-overview {
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

.overview-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}

/* 营销工具 */
.marketing-tools {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 26rpx;
  color: #667eea;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.tool-item {
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  text-align: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.tool-item:hover {
  border-color: #667eea;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.1);
}

.tool-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.tool-icon.icon-shoucang {
  color: #ff4757 !important;
}

.tool-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.tool-desc {
  display: block;
  font-size: 22rpx;
  color: #666;
  line-height: 1.4;
}

/* 进行中的活动 */
.active-promotions {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.promotions-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.promotion-item {
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border-left: 6rpx solid #667eea;
}

.promotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.promotion-type {
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.type-discount {
  background: #ffebee;
  color: #f44336;
}

.type-coupon {
  background: #e8f5e9;
  color: #4caf50;
}

.type-group {
  background: #e3f2fd;
  color: #2196f3;
}

.promotion-status {
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.status-active {
  background: #e8f5e9;
  color: #4caf50;
}

.promotion-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.promotion-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
  line-height: 1.4;
}

.promotion-stats {
  display: flex;
  gap: 30rpx;
  margin-bottom: 16rpx;
}

.stat-text {
  font-size: 24rpx;
  color: #666;
}

.promotion-time {
  padding-top: 16rpx;
  border-top: 1rpx solid #e0e0e0;
}

.time-text {
  font-size: 22rpx;
  color: #999;
}

/* 营销数据分析 */
.marketing-analysis {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.analysis-item {
  padding: 30rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.analysis-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.analysis-chart {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.chart-icon {
  font-size: 48rpx;
}

.chart-data {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.data-item {
  font-size: 24rpx;
  color: #666;
}

.popular-methods {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.method-name {
  width: 120rpx;
  font-size: 24rpx;
  color: #333;
}

.method-bar {
  flex: 1;
  height: 16rpx;
  background: #e0e0e0;
  border-radius: 8rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 8rpx;
}

.method-percentage {
  width: 60rpx;
  text-align: right;
  font-size: 22rpx;
  color: #666;
}

/* 营销建议 */
.marketing-suggestions {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.suggestion-icon {
  width: 80rpx;
  height: 80rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.suggestion-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

.suggestion-action {
  padding: 12rpx 24rpx;
  background: #667eea;
  color: white;
  border-radius: 20rpx;
  font-size: 24rpx;
}

/* 空状态 */
.empty-promotions {
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
  margin-bottom: 12rpx;
}

.empty-desc {
  display: block;
  font-size: 24rpx;
  color: #ccc;
}
</style>