<template>
  <view class="coupon-manager">
    <view class="header">
      <text class="title">🎫 优惠券管理调试工具</text>
      <text class="subtitle">添加、编辑、删除优惠券，用于测试优惠券功能</text>
    </view>

    <!-- 添加优惠券表单 -->
    <view class="add-coupon-section">
      <text class="section-title">➕ 添加新优惠券</text>
      
      <view class="form-group">
        <text class="label">优惠券名称</text>
        <input v-model="newCoupon.name" class="input" placeholder="例如：新用户专享券" />
      </view>

      <view class="form-group">
        <text class="label">优惠券类型</text>
        <view class="type-selector">
          <view 
            v-for="type in couponTypes" 
            :key="type.value"
            class="type-option"
            :class="{ active: newCoupon.type === type.value }"
            @tap="newCoupon.type = type.value"
          >
            <text class="type-icon">{{ type.icon }}</text>
            <text class="type-name">{{ type.name }}</text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <text class="label">优惠券面值</text>
        <input v-model="newCoupon.value" class="input" type="digit" placeholder="例如：10" />
        <text class="hint">{{ getValueHint() }}</text>
      </view>

      <view class="form-group">
        <text class="label">最低消费金额</text>
        <input v-model="newCoupon.minSpend" class="input" type="digit" placeholder="0表示无限制" />
      </view>

      <view class="form-group">
        <text class="label">使用范围</text>
        <view class="scope-selector">
          <view 
            v-for="scope in useScopes" 
            :key="scope.value"
            class="scope-option"
            :class="{ active: newCoupon.useScope === scope.value }"
            @tap="newCoupon.useScope = scope.value"
          >
            <text class="scope-name">{{ scope.name }}</text>
          </view>
        </view>
      </view>

      <view class="form-group" v-if="newCoupon.type === 'percentage'">
        <text class="label">最大折扣金额</text>
        <input v-model="newCoupon.maxDiscount" class="input" type="digit" placeholder="折扣券的最大优惠金额" />
      </view>

      <view class="form-group">
        <text class="label">有效期（天）</text>
        <input v-model="newCoupon.expireDays" class="input" type="number" placeholder="例如：30" value="30" />
      </view>

      <view class="form-actions">
        <button @tap="resetForm" class="btn secondary">重置</button>
        <button @tap="addCoupon" class="btn primary">添加优惠券</button>
      </view>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupon-list-section">
      <text class="section-title">📋 优惠券列表</text>
      
      <view v-if="coupons.length === 0" class="empty-state">
        <text class="empty-text">暂无优惠券，请先添加</text>
      </view>

      <scroll-view class="coupon-list" scroll-y v-else>
        <view 
          v-for="coupon in coupons" 
          :key="coupon.id"
          class="coupon-item"
          :class="{ 
            fixed: coupon.type === 'fixed',
            percentage: coupon.type === 'percentage',
            shipping: coupon.type === 'shipping'
          }"
        >
          <view class="coupon-header">
            <text class="coupon-name">{{ coupon.name }}</text>
            <view class="coupon-actions">
              <button @tap="editCoupon(coupon)" class="action-btn edit">编辑</button>
              <button @tap="deleteCoupon(coupon.id)" class="action-btn delete">删除</button>
            </view>
          </view>
          
          <view class="coupon-details">
            <text class="detail-item">
              <text class="detail-label">类型：</text>
              <text class="detail-value">{{ getTypeName(coupon.type) }}</text>
            </text>
            <text class="detail-item">
              <text class="detail-label">面值：</text>
              <text class="detail-value">{{ getValueDisplay(coupon) }}</text>
            </text>
            <text class="detail-item">
              <text class="detail-label">最低消费：</text>
              <text class="detail-value">{{ coupon.minSpend > 0 ? `¥${coupon.minSpend}` : '无限制' }}</text>
            </text>
            <text class="detail-item">
              <text class="detail-label">使用范围：</text>
              <text class="detail-value">{{ getScopeName(coupon.useScope) }}</text>
            </text>
            <text class="detail-item">
              <text class="detail-label">有效期：</text>
              <text class="detail-value">{{ new Date(coupon.expireTime).toLocaleDateString() }}</text>
            </text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 操作结果 -->
    <view class="result-section" v-if="operationResult">
      <text class="result-title">✅ 操作结果</text>
      <text class="result-content">{{ operationResult }}</text>
    </view>

    <!-- 快速操作 -->
    <view class="quick-actions">
      <text class="section-title">⚡ 快速操作</text>
      <view class="action-buttons">
        <button @tap="addTestCoupons" class="quick-btn">添加测试优惠券</button>
        <button @tap="clearAllCoupons" class="quick-btn secondary">清空所有优惠券</button>
        <button @tap="copyToClipboard" class="quick-btn">复制到剪贴板</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 优惠券类型定义
const couponTypes = [
  { value: 'fixed', name: '固定金额', icon: '💰' },
  { value: 'percentage', name: '折扣券', icon: '📉' },
  { value: 'shipping', name: '运费券', icon: '🚚' }
]

// 使用范围定义
const useScopes = [
  { value: 'all', name: '全场通用' },
  { value: 'vip_only', name: '仅会员商品' },
  { value: 'normal_only', name: '仅非会员商品' }
]

// 新优惠券表单数据
const newCoupon = ref({
  name: '',
  type: 'fixed',
  value: '',
  minSpend: '',
  useScope: 'all',
  maxDiscount: '',
  expireDays: '30'
})

// 优惠券列表
const coupons = ref([])
const operationResult = ref('')

// 获取类型名称
const getTypeName = (type) => {
  const found = couponTypes.find(t => t.value === type)
  return found ? found.name : '未知类型'
}

// 获取使用范围名称
const getScopeName = (scope) => {
  const found = useScopes.find(s => s.value === scope)
  return found ? found.name : '未知范围'
}

// 获取面值提示
const getValueHint = () => {
  switch (newCoupon.value.type) {
    case 'percentage':
      return '请输入折扣比例（如：0.1 表示 9 折）'
    case 'shipping':
      return '运费券面值通常为 0'
    default:
      return '请输入优惠金额'
  }
}

// 获取优惠券面值显示
const getValueDisplay = (coupon) => {
  switch (coupon.type) {
    case 'percentage':
      return `${(coupon.value * 100).toFixed(0)}% 折扣`
    case 'shipping':
      return '免运费'
    default:
      return `¥${coupon.value}`
  }
}

// 添加优惠券
const addCoupon = () => {
  if (!newCoupon.value.name.trim()) {
    uni.showToast({ title: '请输入优惠券名称', icon: 'none' })
    return
  }

  if (!newCoupon.value.value) {
    uni.showToast({ title: '请输入优惠券面值', icon: 'none' })
    return
  }

  const coupon = {
    id: Date.now().toString(),
    name: newCoupon.value.name.trim(),
    type: newCoupon.value.type,
    value: parseFloat(newCoupon.value.value),
    minSpend: parseFloat(newCoupon.value.minSpend) || 0,
    useScope: newCoupon.value.useScope,
    maxDiscount: newCoupon.value.maxDiscount ? parseFloat(newCoupon.value.maxDiscount) : null,
    expireTime: new Date(Date.now() + parseInt(newCoupon.value.expireDays) * 24 * 60 * 60 * 1000).toISOString()
  }

  coupons.value.push(coupon)
  saveCoupons()
  
  operationResult.value = `✅ 成功添加优惠券：${coupon.name}`
  uni.showToast({ title: '添加成功', icon: 'success' })
  
  resetForm()
}

// 重置表单
const resetForm = () => {
  newCoupon.value = {
    name: '',
    type: 'fixed',
    value: '',
    minSpend: '',
    useScope: 'all',
    maxDiscount: '',
    expireDays: '30'
  }
}

// 编辑优惠券
const editCoupon = (coupon) => {
  newCoupon.value = {
    name: coupon.name,
    type: coupon.type,
    value: coupon.value.toString(),
    minSpend: coupon.minSpend.toString(),
    useScope: coupon.useScope,
    maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : '',
    expireDays: Math.ceil((new Date(coupon.expireTime) - Date.now()) / (24 * 60 * 60 * 1000)).toString()
  }
  
  // 删除原优惠券
  deleteCoupon(coupon.id)
  
  uni.showToast({ title: '已加载到编辑表单', icon: 'success' })
}

// 删除优惠券
const deleteCoupon = (id) => {
  coupons.value = coupons.value.filter(coupon => coupon.id !== id)
  saveCoupons()
  operationResult.value = '✅ 优惠券已删除'
}

// 保存优惠券到本地存储
const saveCoupons = () => {
  uni.setStorageSync('debugCoupons', coupons.value)
}

// 加载优惠券
const loadCoupons = () => {
  const stored = uni.getStorageSync('debugCoupons')
  if (stored && Array.isArray(stored)) {
    coupons.value = stored
  }
}

// 添加测试优惠券
const addTestCoupons = () => {
  const testCoupons = [
    {
      id: 'test1',
      name: '新用户专享券',
      type: 'fixed',
      value: 10,
      minSpend: 0,
      useScope: 'all',
      expireTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'test2',
      name: '会员专享9折券',
      type: 'percentage',
      value: 0.1,
      minSpend: 50,
      useScope: 'vip_only',
      maxDiscount: 20,
      expireTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'test3',
      name: '免运费券',
      type: 'shipping',
      value: 0,
      minSpend: 0,
      useScope: 'all',
      expireTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  coupons.value.push(...testCoupons)
  saveCoupons()
  operationResult.value = '✅ 已添加测试优惠券'
  uni.showToast({ title: '测试优惠券添加成功', icon: 'success' })
}

// 清空所有优惠券
const clearAllCoupons = () => {
  coupons.value = []
  saveCoupons()
  operationResult.value = '✅ 已清空所有优惠券'
  uni.showToast({ title: '优惠券已清空', icon: 'success' })
}

// 复制到剪贴板
const copyToClipboard = () => {
  const couponData = JSON.stringify(coupons.value, null, 2)
  uni.setClipboardData({
    data: couponData,
    success: () => {
      operationResult.value = '✅ 优惠券数据已复制到剪贴板'
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.coupon-manager {
  padding: 30rpx;
  background: #f8f9fa;
  min-height: 100vh;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #666;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.add-coupon-section {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 30rpx;
}

.label {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  display: block;
  margin-bottom: 10rpx;
}

.input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 8rpx;
  font-size: 28rpx;
  background: #f8f9fa;
}

.hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.type-selector, .scope-selector {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.type-option, .scope-option {
  flex: 1;
  min-width: 200rpx;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 8rpx;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.type-option.active, .scope-option.active {
  border-color: #ff4757;
  background: #fff5f5;
  color: #ff4757;
}

.type-icon {
  font-size: 32rpx;
  display: block;
  margin-bottom: 8rpx;
}

.type-name, .scope-name {
  font-size: 26rpx;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}

.btn {
  flex: 1;
  padding: 24rpx;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: #ff4757;
  color: white;
}

.btn.secondary {
  background: #f0f0f0;
  color: #666;
}

.coupon-list-section {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.coupon-list {
  max-height: 600rpx;
}

.coupon-item {
  border-left: 8rpx solid #ff4757;
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
}

.coupon-item.fixed {
  border-left-color: #4caf50;
}

.coupon-item.percentage {
  border-left-color: #2196f3;
}

.coupon-item.shipping {
  border-left-color: #ff9800;
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.coupon-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.coupon-actions {
  display: flex;
  gap: 10rpx;
}

.action-btn {
  padding: 8rpx 16rpx;
  border: none;
  border-radius: 4rpx;
  font-size: 22rpx;
  cursor: pointer;
}

.action-btn.edit {
  background: #2196f3;
  color: white;
}

.action-btn.delete {
  background: #ff4757;
  color: white;
}

.coupon-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-item {
  font-size: 24rpx;
}

.detail-label {
  color: #666;
}

.detail-value {
  color: #333;
  font-weight: 600;
}

.result-section {
  background: #e8f5e8;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-bottom: 30rpx;
}

.result-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #4caf50;
  display: block;
  margin-bottom: 8rpx;
}

.result-content {
  font-size: 26rpx;
  color: #333;
}

.quick-actions {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.quick-btn {
  padding: 24rpx;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  background: #ff4757;
  color: white;
  cursor: pointer;
}

.quick-btn.secondary {
  background: #f0f0f0;
  color: #666;
}
</style>