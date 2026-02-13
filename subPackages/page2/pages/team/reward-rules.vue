<template>
  <view class="reward-rules-page">
    <!-- 规则概述 -->
    <view class="rules-overview">
      <view class="overview-header">
        <text class="overview-title">团队奖励规则</text>
        <text class="overview-subtitle">3.5.2 版本奖励机制详解</text>
      </view>
      
      <view class="key-points">
        <view class="point-item">
          <text class="point-icon iconfont icon-butie"></text>
          <text class="point-text">N星店长可获得其团队1-N层中所有N星店长购买会员商品金额的50%</text>
        </view>
        <view class="point-item">
          <text class="point-icon iconfont icon-xiaoshoutongji"></text>
          <text class="point-text">团队奖励最多覆盖六层，避免奖励层级无限延伸</text>
        </view>
        <view class="point-item">
          <text class="point-icon iconfont icon-chenggong"></text>
          <text class="point-text">满足奖励条件后，实时发放至对应店长的推广费余额</text>
        </view>
      </view>
    </view>

    <!-- 等级奖励表 -->
    <view class="reward-table">
      <view class="table-header">
        <text class="table-title">各等级奖励覆盖层级</text>
      </view>
      
      <view class="table-content">
        <view class="table-row header">
          <text class="col-level">店长等级</text>
          <text class="col-layers">覆盖层级</text>
          <text class="col-rate">奖励比例</text>
          <text class="col-example">示例收益</text>
        </view>
        
        <view 
          v-for="(rule, index) in rewardRules" 
          :key="index"
          class="table-row"
          :class="{ highlight: rule.level === userLevel }"
        >
          <view class="col-level">
            <text v-if="rule.level === 1" class="level-icon iconfont icon-shoucang"></text>
            <text v-else class="level-icon iconfont" :class="getLevelIcon(rule.level)"></text>
            <text class="level-text">{{ rule.name }}</text>
          </view>
          <text class="col-layers">1-{{ rule.level }}层</text>
          <text class="col-rate">{{ rule.rate }}%</text>
          <text class="col-example">¥{{ rule.example }}</text>
        </view>
      </view>
    </view>

    <!-- 奖励计算示例 */
    <view class="calculation-example">
      <view class="example-header">
        <text class="example-title">奖励计算示例</text>
        <text class="example-subtitle">以三星店长为例</text>
      </view>
      
      <view class="example-scenario">
        <view class="scenario-header">
          <text class="scenario-title">场景设定</text>
        </view>
        <view class="scenario-content">
          <text class="scenario-text">• 您是三星店长，可获得1-3层团队奖励</text>
          <text class="scenario-text">• 第1层有一位二星店长购买了价值1000元的会员商品</text>
          <text class="scenario-text">• 第2层有一位三星店长购买了价值1500元的会员商品</text>
          <text class="scenario-text">• 第3层有一位一星店长购买了价值800元的会员商品</text>
        </view>
      </view>
      
      <view class="calculation-steps">
        <view class="step-item">
          <view class="step-number">1</view>
          <view class="step-content">
            <text class="step-title">第1层奖励计算</text>
            <text class="step-desc">二星店长购买 ≥ 二星店长：1000 × 50% = 500元</text>
            <text class="step-result">获得奖励：¥500</text>
          </view>
        </view>
        
        <view class="step-item">
          <view class="step-number">2</view>
          <view class="step-content">
            <text class="step-title">第2层奖励计算</text>
            <text class="step-desc">三星店长购买 ≥ 三星店长：1500 × 50% = 750元</text>
            <text class="step-result">获得奖励：¥750</text>
          </view>
        </view>
        
        <view class="step-item">
          <view class="step-number">3</view>
          <view class="step-content">
            <text class="step-title">第3层奖励计算</text>
            <text class="step-desc">一星店长购买 < 三星店长：不符合条件</text>
            <text class="step-result">获得奖励：¥0</text>
          </view>
        </view>
        
        <view class="total-reward">
          <text class="total-label">总奖励金额：</text>
          <text class="total-amount">¥1,250</text>
        </view>
      </view>
    </view>

    <!-- 奖励条件说明 */
    <view class="reward-conditions">
      <view class="conditions-header">
        <text class="conditions-title">奖励发放条件</text>
      </view>
      
      <view class="condition-list">
        <view class="condition-item">
          <text class="condition-number">1</text>
          <view class="condition-content">
            <text class="condition-title">等级匹配</text>
            <text class="condition-desc">只有当下级会员的等级 ≥ 您的等级时，才能获得奖励</text>
          </view>
        </view>
        
        <view class="condition-item">
          <text class="condition-number">2</text>
          <view class="condition-content">
            <text class="condition-title">层级限制</text>
            <text class="condition-desc">奖励覆盖层级不超过您的星级等级，最多6层</text>
          </view>
        </view>
        
        <view class="condition-item">
          <text class="condition-number">3</text>
          <view class="condition-content">
            <text class="condition-title">商品类型</text>
            <text class="condition-desc">仅限购买会员商品时触发团队奖励</text>
          </view>
        </view>
        
        <view class="condition-item">
          <text class="condition-number">4</text>
          <view class="condition-content">
            <text class="condition-title">实时发放</text>
            <text class="condition-desc">满足条件后立即发放到推广费余额，无需等待</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 常见问题 -->
    <view class="faq-section">
      <view class="faq-header">
        <text class="faq-title">常见问题</text>
      </view>
      
      <view class="faq-list">
        <view 
          v-for="(faq, index) in faqList" 
          :key="index"
          class="faq-item"
          @tap="toggleFaq(index)"
        >
          <view class="faq-question">
            <text class="question-text">{{ faq.question }}</text>
            <text class="question-arrow" :class="{ expanded: faq.expanded }">></text>
          </view>
          <view v-if="faq.expanded" class="faq-answer">
            <text class="answer-text">{{ faq.answer }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <button class="action-btn primary" @tap="calculateReward">
        奖励计算器
      </button>
      <button class="action-btn secondary" @tap="viewHistory">
        查看奖励记录
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getLevelIcon } from '@/utils/level.js'

const userLevel = ref(3) // 当前用户等级

// 奖励规则表（icon字段已移除，使用getLevelIcon函数获取图标）
const rewardRules = ref([
  { level: 1, name: '一星店长', rate: 50, example: '500' },
  { level: 2, name: '二星店长', rate: 50, example: '1,250' },
  { level: 3, name: '三星店长', rate: 50, example: '2,100' },
  { level: 4, name: '四星店长', rate: 50, example: '3,200' },
  { level: 5, name: '五星店长', rate: 50, example: '4,500' },
  { level: 6, name: '六星店长', rate: 50, example: '6,000' }
])

// 常见问题
const faqList = ref([
  {
    question: '为什么我没有收到团队奖励？',
    answer: '请检查：1）下级会员等级是否≥您的等级；2）是否在您的奖励层级范围内；3）是否购买的是会员商品。',
    expanded: false
  },
  {
    question: '奖励什么时候到账？',
    answer: '团队奖励是实时发放的，满足条件后会立即到账至您的推广费余额。',
    expanded: false
  },
  {
    question: '如何提升我的奖励层级？',
    answer: '通过完成相应的升级任务，提升您的店长等级，即可获得更多层级的团队奖励。',
    expanded: false
  },
  {
    question: '团队奖励有上限吗？',
    answer: '单笔奖励无上限，但受到层级限制（最多6层）和等级匹配条件限制。',
    expanded: false
  }
])

/**
 * 切换FAQ展开状态
 */
const toggleFaq = (index) => {
  faqList.value[index].expanded = !faqList.value[index].expanded
}

/**
 * 奖励计算器
 */
const calculateReward = () => {
  uni.navigateTo({ url: '/subPackages/page1/pages/team/reward-calculator' })
}

/**
 * 查看奖励记录
 */
const viewHistory = () => {
  uni.navigateTo({ url: '/subPackages/page1/pages/team/reward-history' })
}

onLoad(() => {
  // 获取用户当前等级
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.level) {
    userLevel.value = userInfo.level
  }
})
</script>

<style scoped>
.reward-rules-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

/* 规则概述 */
.rules-overview {
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

.key-points {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.point-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  backdrop-filter: blur(10px);
}

.point-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.point-text {
  font-size: 26rpx;
  line-height: 1.5;
}

/* 奖励表格 */
.reward-table {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.table-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.table-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.table-content {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 16rpx;
  padding: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
  align-items: center;
}

.table-row.header {
  background: #f8f9fa;
  border-radius: 8rpx;
  font-weight: bold;
  color: #666;
  font-size: 24rpx;
}

.table-row.highlight {
  background: #f0f8ff;
  border: 2rpx solid #3d6bff;
  border-radius: 8rpx;
}

.col-level {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.level-icon {
  font-size: 20rpx;
}

.level-icon.icon-shoucang {
  color: #ff4757 !important;
}

.level-text {
  font-size: 26rpx;
  color: #333;
}

.col-layers,
.col-rate,
.col-example {
  font-size: 26rpx;
  color: #333;
  text-align: center;
}

/* 计算示例 */
.calculation-example {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.example-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.example-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.example-subtitle {
  font-size: 24rpx;
  color: #666;
}

.example-scenario {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.scenario-header {
  margin-bottom: 16rpx;
}

.scenario-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.scenario-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.scenario-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}

.calculation-steps {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.step-item {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.step-number {
  width: 48rpx;
  height: 48rpx;
  background: #3d6bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-title {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.step-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.step-result {
  font-size: 24rpx;
  color: #4caf50;
  font-weight: bold;
}

.total-reward {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border-radius: 12rpx;
  color: white;
  margin-top: 20rpx;
}

.total-label {
  font-size: 28rpx;
}

.total-amount {
  font-size: 36rpx;
  font-weight: bold;
}

/* 奖励条件 */
.reward-conditions {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.conditions-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.conditions-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.condition-item {
  display: flex;
  gap: 16rpx;
}

.condition-number {
  width: 48rpx;
  height: 48rpx;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.condition-content {
  flex: 1;
}

.condition-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.condition-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
}

/* 常见问题 */
.faq-section {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.faq-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.faq-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.faq-item {
  border: 1rpx solid #f0f0f0;
  border-radius: 12rpx;
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
}

.question-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 600;
}

.question-arrow {
  font-size: 24rpx;
  color: #666;
  transition: transform 0.3s;
}

.question-arrow.expanded {
  transform: rotate(90deg);
}

.faq-answer {
  padding: 20rpx;
  background: white;
}

.answer-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

/* 底部操作 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 30rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.action-btn.primary {
  background: #3d6bff;
  color: white;
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
  border: 2rpx solid #e0e0e0;
}
</style>