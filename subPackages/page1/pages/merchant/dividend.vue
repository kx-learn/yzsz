<template>
  <view class="dividend-page">
    <!-- 头部统计 -->
    <view class="stats-section">
      <view class="stats-card">
        <text class="stats-label">本周统一积分池</text>
        <text class="stats-value">{{ totalPoints }}</text>
        <text class="stats-desc">用户消费产生 · 平台按销售额分红</text>
      </view>
      
      <view class="stats-row">
        <view class="stats-item">
          <text class="item-value">{{ merchantCount }}</text>
          <text class="item-label">参与平台数</text>
        </view>
        <view class="stats-item">
          <text class="item-value">{{ avgPoints }}</text>
          <text class="item-label">平均分配</text>
        </view>
      </view>
    </view>

    <!-- 分配规则说明 -->
    <view class="rule-section">
      <view class="rule-header">
        <text class="rule-title">💡 分配规则</text>
      </view>
      <view class="rule-content">
        <text class="rule-text">• 用户和平台共用统一积分池</text>
        <text class="rule-text">• 每周一统计上周用户消费积分总和</text>
        <text class="rule-text">• 按平台销售额占比分配积分</text>
        <text class="rule-text">• 平台积分仅用于分红提现，不可购物</text>
        <text class="rule-text">• 积分可提现，1积分=1元</text>
      </view>
    </view>

    <!-- 本周分配明细 -->
    <view class="detail-section">
      <view class="section-header">
        <text class="section-title">本周分配明细</text>
        <text class="section-time">{{ currentWeek }}</text>
      </view>
      
      <view class="merchant-list">
        <view 
          v-for="item in dividendList" 
          :key="item.id"
          class="merchant-item"
        >
          <view class="merchant-info">
            <image :src="item.avatar" class="merchant-avatar" />
            <view class="merchant-detail">
              <text class="merchant-name">{{ item.name }}</text>
              <text class="merchant-sales">销售额: ¥{{ item.sales }}</text>
            </view>
          </view>
          <view class="merchant-dividend">
            <text class="dividend-points">+{{ item.points }}</text>
            <text class="dividend-ratio">{{ item.ratio }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="history-section">
      <view class="section-header">
        <text class="section-title">历史分配记录</text>
      </view>
      
      <view class="history-list">
        <view 
          v-for="record in historyList" 
          :key="record.id"
          class="history-item"
          @click="viewDetail(record)"
        >
          <view class="history-left">
            <text class="history-week">{{ record.week }}</text>
            <text class="history-date">{{ record.date }}</text>
          </view>
          <view class="history-right">
            <text class="history-points">{{ record.points }}积分</text>
            <text class="history-arrow">></text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const totalPoints = ref(15680)
const merchantCount = ref(8)
const currentWeek = ref('2024年第48周')

const avgPoints = computed(() => {
  return Math.floor(totalPoints.value / merchantCount.value)
})

// 本周分配明细
const dividendList = ref([
  {
    id: 1,
    name: '张三的店铺',
    avatar: '/static/photo/1.png',
    sales: 28500,
    points: 3200,
    ratio: 20.4
  },
  {
    id: 2,
    name: '李四商店',
    avatar: '/static/photo/2.png',
    sales: 25600,
    points: 2880,
    ratio: 18.4
  },
  {
    id: 3,
    name: '王五超市',
    avatar: '/static/photo/3.png',
    sales: 22300,
    points: 2510,
    ratio: 16.0
  },
  {
    id: 4,
    name: '赵六便利店',
    avatar: '/static/photo/4.png',
    sales: 19800,
    points: 2230,
    ratio: 14.2
  },
  {
    id: 5,
    name: '孙七小店',
    avatar: '/static/photo/5.png',
    sales: 16500,
    points: 1860,
    ratio: 11.9
  }
])

// 历史记录
const historyList = ref([
  {
    id: 1,
    week: '第47周',
    date: '2024.11.18-11.24',
    points: 2880
  },
  {
    id: 2,
    week: '第46周',
    date: '2024.11.11-11.17',
    points: 3120
  },
  {
    id: 3,
    week: '第45周',
    date: '2024.11.04-11.10',
    points: 2650
  },
  {
    id: 4,
    week: '第44周',
    date: '2024.10.28-11.03',
    points: 2980
  }
])

const viewDetail = (record) => {
  uni.showToast({
    title: `查看${record.week}详情`,
    icon: 'none'
  })
}

onLoad(() => {
  uni.setNavigationBarTitle({ title: '平台积分分红' })
})
</script>

<style scoped>
.dividend-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

/* 头部统计 */
.stats-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  color: white;
}

.stats-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  backdrop-filter: blur(10rpx);
  margin-bottom: 30rpx;
}

.stats-label {
  display: block;
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 20rpx;
}

.stats-value {
  display: block;
  font-size: 72rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.stats-desc {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
}

.stats-row {
  display: flex;
  gap: 20rpx;
}

.stats-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 30rpx;
  text-align: center;
  backdrop-filter: blur(10rpx);
}

.item-value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.item-label {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}

/* 规则说明 */
.rule-section {
  background: white;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.rule-header {
  margin-bottom: 20rpx;
}

.rule-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rule-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

/* 分配明细 */
.detail-section {
  background: white;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
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

.section-time {
  font-size: 24rpx;
  color: #999;
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.merchant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
}

.merchant-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
}

.merchant-detail {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.merchant-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.merchant-sales {
  font-size: 24rpx;
  color: #999;
}

.merchant-dividend {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.dividend-points {
  font-size: 32rpx;
  color: #667eea;
  font-weight: bold;
}

.dividend-ratio {
  font-size: 24rpx;
  color: #999;
}

/* 历史记录 */
.history-section {
  background: white;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.history-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-week {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.history-date {
  font-size: 24rpx;
  color: #999;
}

.history-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.history-points {
  font-size: 28rpx;
  color: #667eea;
  font-weight: bold;
}

.history-arrow {
  font-size: 24rpx;
  color: #ccc;
}
</style>
