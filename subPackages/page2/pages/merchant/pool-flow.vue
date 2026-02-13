<template>
  <view class="pool-flow-page">
    <!-- 日期选择 -->
    <view class="date-section">
      <view class="date-item">
        <text class="date-label">开始日期</text>
        <picker mode="date" :value="startDate" @change="onStartDateChange">
          <view class="date-picker">
            <text>{{ startDate || '请选择' }}</text>
            <text class="picker-arrow">></text>
          </view>
        </picker>
      </view>
      <view class="date-item">
        <text class="date-label">结束日期</text>
        <picker mode="date" :value="endDate" :start="startDate" @change="onEndDateChange">
          <view class="date-picker">
            <text>{{ endDate || '请选择' }}</text>
            <text class="picker-arrow">></text>
          </view>
        </picker>
      </view>
      <button class="btn-query" @tap="loadFlowList">查询</button>
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
          v-for="(item, index) in flowList" 
          :key="item.id || index"
          class="flow-item"
        >
          <view class="flow-header">
            <view class="flow-left">
              <text class="flow-type" :class="getFlowTypeClass(item)">
                {{ getFlowTypeText(item) }}
              </text>
              <text class="flow-time">{{ formatTime(item.created_at || item.create_time || item.time) }}</text>
            </view>
            <view class="flow-right">
              <text class="flow-amount" :class="getAmountClass(item)">
                {{ getAmountSign(item) }}¥{{ formatNumber(Math.abs(item.change_amount || 0)) }}
              </text>
            </view>
          </view>
          <view class="flow-body">
            <text class="flow-remark">{{ formatRemark(item.remark || item.description || '无备注') }}</text>
            <text class="flow-balance">余额：¥{{ formatNumber(item.balance_after || item.balance || item.ending_balance || 0) }}</text>
          </view>
        </view>
        
        <view v-if="flowList.length === 0 && !loading" class="empty-state">
          <text class="empty-icon">📊</text>
          <text class="empty-text">暂无流水记录</text>
        </view>
        
        <view v-if="loading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        
        <view v-if="!hasMore && flowList.length > 0" class="no-more">
          <text class="no-more-text">已显示全部</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getPoolFlow } from '@/api/reports.js'

const accountType = ref('')
const pageTitle = ref('资金池流水')
const startDate = ref('')
const endDate = ref('')
const flowList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

// 初始化默认日期（最近30天）
const initDefaultDate = () => {
  const today = new Date()
  const end = new Date(today)
  const start = new Date(today)
  start.setDate(start.getDate() - 30)
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  endDate.value = formatDate(end)
  startDate.value = formatDate(start)
}

/**
 * 开始日期变化
 */
const onStartDateChange = (e) => {
  startDate.value = e.detail.value
}

/**
 * 结束日期变化
 */
const onEndDateChange = (e) => {
  endDate.value = e.detail.value
}

/**
 * 加载流水列表
 */
const loadFlowList = async (append = false) => {
  if (loading.value) return
  
  if (!accountType.value) {
    uni.showToast({ title: '资金池类型未指定', icon: 'none' })
    return
  }
  
  if (!startDate.value || !endDate.value) {
    uni.showToast({ title: '请选择日期范围', icon: 'none' })
    return
  }
  
  try {
    loading.value = true
    
    if (!append) {
      currentPage.value = 1
      flowList.value = []
    }
    
    const res = await getPoolFlow({
      account_type: accountType.value,
      start_date: startDate.value,
      end_date: endDate.value,
      page: currentPage.value,
      page_size: 20
    })
    
    console.log('[资金池流水] API响应:', res)
    
    // 解析响应数据 - 根据API文档，数据在 res.data.records 中
    let newList = []
    let pagination = null
    
    if (res && res.data) {
      // 优先从 records 字段获取
      if (res.data.records && Array.isArray(res.data.records)) {
        newList = res.data.records
        pagination = res.data.pagination
        console.log('[资金池流水] 从 records 字段解析到', newList.length, '条记录')
      } else if (Array.isArray(res.data)) {
        newList = res.data
      } else if (res.data.list && Array.isArray(res.data.list)) {
        newList = res.data.list
      } else if (res.data.flows && Array.isArray(res.data.flows)) {
        newList = res.data.flows
      } else if (res.data.rows && Array.isArray(res.data.rows)) {
        newList = res.data.rows
      }
    } else if (Array.isArray(res)) {
      newList = res
    }
    
    if (append) {
      flowList.value = [...flowList.value, ...newList]
    } else {
      flowList.value = newList
    }
    
    // 根据分页信息判断是否还有更多数据
    if (pagination) {
      hasMore.value = currentPage.value < pagination.total_pages
      console.log('[资金池流水] 分页信息:', {
        当前页: currentPage.value,
        总页数: pagination.total_pages,
        每页条数: pagination.page_size,
        总记录数: pagination.total,
        还有更多: hasMore.value
      })
    } else {
      // 如果没有分页信息，根据返回数量判断
      hasMore.value = newList.length >= 20
    }
    
    // 如果还有更多数据，页码加1，准备加载下一页
    if (hasMore.value) {
      currentPage.value++
    }
    
    console.log('[资金池流水] 加载完成，当前共', flowList.value.length, '条记录，还有更多:', hasMore.value)
  } catch (error) {
    console.error('[资金池流水] 加载失败:', error)
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 加载更多
 */
const loadMore = () => {
  console.log('[资金池流水] 滚动到底部，触发加载更多', {
    loading: loading.value,
    hasMore: hasMore.value,
    currentPage: currentPage.value
  })
  
  if (!loading.value && hasMore.value) {
    loadFlowList(true)
  }
}

/**
 * 获取流水类型文本
 */
const getFlowTypeText = (item) => {
  // 如果item是对象，尝试从flow_type字段获取
  if (typeof item === 'object' && item.flow_type) {
    const typeMap = {
      'income': '收入',
      'expense': '支出',
      'in': '收入',
      'out': '支出',
      'deposit': '存入',
      'withdraw': '提取',
      'transfer': '转账',
      'adjust': '调整'
    }
    return typeMap[item.flow_type] || '其他'
  }
  
  // 如果没有flow_type，根据change_amount判断
  const amount = item.change_amount || 0
  if (amount > 0) {
    return '收入'
  } else if (amount < 0) {
    return '支出'
  }
  return '其他'
}

/**
 * 获取流水类型样式类
 */
const getFlowTypeClass = (item) => {
  // 如果item是对象，尝试从flow_type字段获取
  if (typeof item === 'object' && item.flow_type) {
    const type = item.flow_type
    if (type === 'income' || type === 'in' || type === 'deposit') {
      return 'type-income'
    } else if (type === 'expense' || type === 'out' || type === 'withdraw') {
      return 'type-expense'
    }
  }
  
  // 如果没有flow_type，根据change_amount判断
  const amount = item.change_amount || 0
  if (amount > 0) {
    return 'type-income'
  } else if (amount < 0) {
    return 'type-expense'
  }
  return 'type-other'
}

/**
 * 获取金额样式类
 */
const getAmountClass = (item) => {
  const amount = item.change_amount || 0
  if (amount > 0) {
    return 'amount-income'
  } else if (amount < 0) {
    return 'amount-expense'
  }
  return 'amount-zero'
}

/**
 * 获取金额符号
 */
const getAmountSign = (item) => {
  const amount = item.change_amount || 0
  if (amount > 0) {
    return '+'
  } else if (amount < 0) {
    return '-'
  }
  return ''
}

/**
 * 格式化数字
 */
const formatNumber = (num) => {
  return Number(num || 0).toFixed(4)
}

/**
 * 格式化备注
 */
const formatRemark = (remark) => {
  if (!remark || remark === '无备注') return '无备注'
  
  let formatted = String(remark)
  
  // 替换英文为中文
  formatted = formatted.replace(/subsidy_pool/gi, '补贴池')
  formatted = formatted.replace(/director_pool/gi, '分红池')
  formatted = formatted.replace(/public_welfare/gi, '公益基金')
  formatted = formatted.replace(/company_points/gi, '平台积分')
  formatted = formatted.replace(/platform_revenue_pool/gi, '平台收入池')
  formatted = formatted.replace(/honor_director/gi, '荣誉董事')
  
  // 替换订单号格式：订单#123 -> 订单123
  formatted = formatted.replace(/订单#(\d+)/g, '订单$1')
  formatted = formatted.replace(/order[#\s]*(\d+)/gi, '订单$1')
  
  // 替换池字：subsidy_pool池 -> 补贴池
  formatted = formatted.replace(/(补贴池|分红池|公益基金|平台积分|平台收入池|荣誉董事)池/g, '$1')
  
  // 替换金额格式：¥237.60 -> ¥237.60（保持原样，但确保格式统一）
  formatted = formatted.replace(/¥\s*(\d+\.?\d*)/g, '¥$1')
  
  return formatted
}

/**
 * 本地时区偏移，格式 +HH:mm 或 -HH:mm
 */
const getLocalTZOffset = () => {
  const offsetMin = -new Date().getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

let _dateFormatWarningShown = false

/**
 * 将可能的非标准字符串（如 "yyyy-MM-dd HH:mm:ss"）规范化为
 * "yyyy-MM-ddTHH:mm:ss+HH:mm" 或保留原样以便 Date 能正确解析。
 */
const normalizeToISO = (time) => {
  if (!time) return time
  if (time instanceof Date) return time.toISOString()
  if (typeof time === 'number') return new Date(time).toISOString()
  let s = String(time).trim()

  // 如果已经是 ISO 带时区或带 T，直接返回或补全秒
  if (/T/.test(s) && /[Zz]|[+\-]\d{2}:?\d{2}$/.test(s)) {
    // ensure seconds exist
    if (/T\d{2}:\d{2}$/.test(s)) s = s.replace(/T(\d{2}:\d{2})$/, 'T$1:00')
    // ensure timezone has ':' between hours and minutes
    s = s.replace(/([+\-]\d{2})(\d{2})$/, '$1:$2')
    return s
  }

  // 常见不被 iOS 支持但其他环境常见的格式："yyyy-MM-dd HH:mm:ss" 或 "yyyy/MM/dd HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s) || /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) {
    // 一次性提示（仅在未设置不再提醒时显示一次）
    try {
      const suppressed = uni.getStorageSync && uni.getStorageSync('suppressDateFormatWarning')
      if (!suppressed && !_dateFormatWarningShown) {
        _dateFormatWarningShown = true
        uni.showModal({
          title: '时间格式兼容提示',
          content: '检测到后端返回的时间字符串格式可能在部分 iOS 环境下无法解析（例如 "yyyy-MM-dd HH:mm:ss"）。客户端已自动转换为兼容的 ISO 时间字符串（例如 yyyy-MM-ddTHH:mm:ss+08:00）。如果不想再看到此提示，请点击“不再提醒”，变更将在下次编译后生效。',
          showCancel: true,
          cancelText: '不再提醒',
          confirmText: '知道了',
          success: (res) => {
            if (!res.confirm) {
              try {
                uni.setStorageSync && uni.setStorageSync('suppressDateFormatWarning', '1')
                uni.showToast && uni.showToast({ title: '已设置，不再提醒（下次编译后生效）', icon: 'none' })
              } catch (e) {
                console.warn('[时间提示] 无法写入本地存储', e)
              }
            }
          }
        })
      }
    } catch (e) {
      console.warn('[时间提示] 检查不再提醒失败', e)
    }

    // 将空格替换为 T, 并添加本地时区偏移
    s = s.replace(' ', 'T')
    // 将斜杠转为短横以统一格式
    s = s.replace(/\//g, '-')
    // 如果没有时区信息，追加本地时区
    if (!/[Zz]|[+\-]\d{2}:?\d{2}$/.test(s)) {
      s = s + getLocalTZOffset()
    } else {
      s = s.replace(/([+\-]\d{2})(\d{2})$/, '$1:$2')
    }
    return s
  }

  // 其他可能只包含日期或不含时区的情况，尽量补全
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // 补全为当天的 00:00:00 +TZ
    s = s + 'T00:00:00' + getLocalTZOffset()
    return s
  }

  return s
}

/**
 * 格式化时间为 yyyy-MM-ddTHH:mm:ss+HH:mm（保证在 iOS 上解析可靠）
 */
const formatTime = (time) => {
  if (!time) return ''
  const normalized = normalizeToISO(time)
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return String(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const tz = getLocalTZOffset()
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${tz}`
}

onLoad((options) => {
  if (options.account_type) {
    accountType.value = options.account_type
  }
  if (options.title) {
    pageTitle.value = decodeURIComponent(options.title)
    uni.setNavigationBarTitle({
      title: pageTitle.value
    })
  }
  
  initDefaultDate()
  loadFlowList()
})
</script>

<style scoped>
.pool-flow-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.date-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.date-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-label {
  font-size: 28rpx;
  color: #333;
  min-width: 120rpx;
}

.date-picker {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
}

.btn-query {
  padding: 24rpx;
  background: #3d6bff;
  color: white;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  margin-top: 10rpx;
}

.flow-scroll {
  height: calc(100vh - 300rpx);
}

.flow-list {
  padding: 0 30rpx 30rpx;
}

.flow-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.flow-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.flow-type {
  font-size: 28rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
  display: inline-block;
}

.flow-type.type-income {
  background: #e8f5e9;
  color: #2e7d32;
}

.flow-type.type-expense {
  background: #ffebee;
  color: #c62828;
}

.flow-type.type-other {
  background: #f5f5f5;
  color: #666;
}

.flow-time {
  font-size: 24rpx;
  color: #999;
}

.flow-right {
  display: flex;
  align-items: center;
}

.flow-amount {
  font-size: 32rpx;
  font-weight: bold;
}

.flow-amount.amount-income {
  color: #2e7d32;
}

.flow-amount.amount-expense {
  color: #c62828;
}

.flow-amount.amount-zero {
  color: #666;
}

.flow-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.flow-remark {
  font-size: 26rpx;
  color: #666;
}

.flow-balance {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-state {
  text-align: center;
  padding: 40rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.no-more {
  text-align: center;
  padding: 40rpx 0;
}

.no-more-text {
  font-size: 24rpx;
  color: #ccc;
}
</style>

