<template>
  <view class="coupon-page">
    <!-- 顶部筛选 -->
    <view class="filter-tabs">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        {{ tab.label }}
      </text>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list">
      <view
        v-for="item in displayCoupons"
        :key="item.id"
        class="coupon-card"
        :class="[itemStatusClass(item)]"
      >
        <view class="card-left">
          <text class="coupon-amount">
            <text v-if="item.template?.type === 'full_reduction'">¥{{ formatAmount(item.template?.amount) }} (满 {{ formatAmount(item.template?.minSpend) }})</text>
            <text v-else>¥{{ formatAmount(item.template?.amount) }} 无门槛</text>
          </text>
          <text class="coupon-name">{{ item.template?.name || '优惠券' }}</text>
          <text class="coupon-scope">
            {{ getScopeText(item.template?.useScope) }}
          </text>
        </view>
        <view class="card-right">
          <text class="time-text">{{ getValidText(item) }}</text>
          <button
            v-if="item.status === 'pending'"
            class="action-btn"
            @tap.stop="handleClaim(item)"
          >
            领取
          </button>
        </view>
      </view>

      <view v-if="displayCoupons.length === 0" class="empty-state">
        <text class="empty-icon iconfont icon-youhuijuan"></text>
        <text class="empty-text">暂无优惠券</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import {
  mapCouponWithTemplate,
  claimUserCoupon,
  getCouponStatusText
} from '../../utils/coupon.js'
import { getMyCoupons } from '@/api/coupon.js'

const tabs = [
  { label: '未使用', value: 'unused' },
  { label: '已使用', value: 'used' },
  { label: '已失效', value: 'expired' }
]

const currentTab = ref('unused')
const couponList = ref([])
const loading = ref(false)

const getCurrentUserId = () => {
  const info = uni.getStorageSync('userInfo') || {}
  return info.id || info.user_id
}

/**
 * 将前端tab状态映射为API的status参数
 */
const getStatusForApi = (tab) => {
  // 根据tab值返回对应的status
  // unused -> 查询所有，然后前端过滤未使用的
  // used -> 'used'
  // expired -> 'expired'
  if (tab === 'used') return 'used'
  if (tab === 'expired') return 'expired'
  return 'all' // unused 和 all 都返回 all，然后前端过滤
}

const loadCoupons = async () => {
  const userId = getCurrentUserId()
  if (!userId || userId === 'guest') {
    console.error('用户未登录')
    couponList.value = []
    return
  }
  
  try {
    loading.value = true
    const status = getStatusForApi(currentTab.value)
    
    // 调用API获取优惠券列表
    const res = await getMyCoupons({
      user_id: userId,
      status: status,
      page: 1,
      page_size: 100 // 获取足够多的数据
    })
    
    // 处理返回的数据
    // API返回的数据结构: { coupons: [...], total: 3, page: 1, page_size: 100 }
    const list = res.data?.coupons || res.coupons || res.data?.rows || res.data?.list || res.rows || res.list || []
    
    console.log('API返回的数据:', res)
    console.log('解析出的优惠券列表:', list)
    
    couponList.value = list.map(item => {
      // 如果返回的数据已经包含template信息，直接使用
      if (item.template) {
        return item
      }
      // 根据API返回的字段构建template
      // API返回的字段: id, coupon_type, amount, status, valid_from, valid_to, used_at, created_at
      return {
        ...item,
        id: item.id,
        status: item.status || 'unused',
        validFrom: item.valid_from || item.validFrom,
        validTo: item.valid_to || item.validTo,
        template: {
          name: item.name || item.template_name || `优惠券`,
          amount: item.amount || 0,
          minSpend: item.min_spend || item.minSpend || 0,
          type: item.type || item.coupon_type || 'full_reduction',
          useScope: item.use_scope || item.useScope || 'all'
        }
      }
    })
    
    console.log('处理后的优惠券列表:', couponList.value)
    console.log('加载优惠券成功，数量:', couponList.value.length)
  } catch (error) {
    console.error('加载优惠券失败', error)
    uni.showToast({
      title: error.message || '加载优惠券失败',
      icon: 'none'
    })
    couponList.value = []
  } finally {
    loading.value = false
  }
}

const displayCoupons = computed(() => {
  const now = Date.now()
  return couponList.value.filter((c) => {
    // 根据优惠券的实际状态和有效期来判断
    const status = c.status || 'unused'
    // 支持多种字段名格式
    const validTo = c.validTo || c.valid_to || c.expire_time || c.expireTime
    
    // 判断是否过期
    let isExpired = false
    if (validTo) {
      const validToTime = new Date(validTo).getTime()
      isExpired = validToTime < now
    }
    
    if (currentTab.value === 'unused') {
      // 未使用：状态是unused，且未过期
      return status === 'unused' && !isExpired
    }
    if (currentTab.value === 'used') {
      // 已使用：状态是used
      return status === 'used'
    }
    if (currentTab.value === 'expired') {
      // 已失效：已过期或状态是expired
      return isExpired || status === 'expired'
    }
    return true
  })
})

const switchTab = (val) => {
  currentTab.value = val
  // 切换tab时重新加载数据
  loadCoupons()
}

const handleClaim = (coupon) => {
  try {
    const userId = getCurrentUserId()
    claimUserCoupon(coupon.id, userId)
    uni.showToast({ title: '领取成功', icon: 'success' })
    loadCoupons()
  } catch (e) {
    uni.showToast({ title: e.message || '领取失败', icon: 'none' })
  }
}

const getScopeText = (scope) => {
  if (scope === 'vip_only') return '仅会员商品可用'
  if (scope === 'normal_only') return '仅普通商品可用'
  return '全场通用'
}

const getStatusText = (coupon) => {
  return getCouponStatusText(coupon)
}

const getValidText = (coupon) => {
  // 支持多种字段名格式
  const validFrom = coupon.validFrom || coupon.valid_from
  const validTo = coupon.validTo || coupon.valid_to
  
  if (!validFrom || !validTo) {
    return '领取后 1 年内有效'
  }
  const fmt = (ts) => {
    const d = new Date(ts)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return `${fmt(validFrom)} 至 ${fmt(validTo)}`
}

const formatAmount = (val) => {
  return Number(val || 0).toFixed(4)
}

const itemStatusClass = (coupon) => {
  const text = getCouponStatusText(coupon)
  if (text === '已失效') return 'expired'
  if (text === '已使用') return 'used'
  return 'unused'
}

// 页面加载时获取优惠券
onLoad(() => {
  loadCoupons()
})

// 页面显示时刷新优惠券列表
onShow(() => {
loadCoupons()
})
</script>

<style scoped>
.coupon-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

.filter-tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.tab-item {
  font-size: 26rpx;
  color: #666;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
}

.tab-item.active {
  background: #ff4757;
  color: #fff;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.coupon-card {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  border-radius: 16rpx;
  background: #fff;
}

.coupon-card.unused {
  border-left: 6rpx solid #ff4757;
}

.coupon-card.used {
  border-left: 6rpx solid #9e9e9e;
  opacity: 0.8;
}

.coupon-card.expired {
  border-left: 6rpx solid #e0e0e0;
  opacity: 0.7;
}

.card-left {
  flex: 1;
}

.coupon-amount {
  display: block;
  font-size: 28rpx;
  color: #ff4757;
  margin-bottom: 6rpx;
}

.coupon-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 6rpx;
}

.coupon-scope {
  font-size: 22rpx;
  color: #999;
}

.card-right {
  width: 220rpx;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: flex-end;
}

.status-text {
  font-size: 24rpx;
  color: #666;
}

.time-text {
  font-size: 20rpx;
  color: #999;
  white-space: nowrap;
  word-break: keep-all;
}

.action-btn {
  margin-top: 6rpx;
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  background: #ff4757;
  color: #fff;
  border: none;
}

.action-btn.use-btn {
  background: #4caf50;
}

.empty-state {
  text-align: center;
  padding: 80rpx 0;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 12rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>


