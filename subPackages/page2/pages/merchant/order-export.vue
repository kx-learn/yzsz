<template>
  <view class="export-page">
    <view class="page-title">按时间范围导出订单</view>
    <view class="form-card">
      <view class="form-item">
        <text class="form-label">开始时间</text>
        <picker mode="date" :value="startDate" @change="onStartDateChange">
          <view class="form-picker">{{ startDate }}</view>
        </picker>
        <picker mode="time" :value="startTime" @change="onStartTimeChange">
          <view class="form-picker time">{{ startTime }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">结束时间</text>
        <picker mode="date" :value="endDate" @change="onEndDateChange">
          <view class="form-picker">{{ endDate }}</view>
        </picker>
        <picker mode="time" :value="endTime" @change="onEndTimeChange">
          <view class="form-picker time">{{ endTime }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">订单状态</text>
        <picker mode="selector" :range="statusOptions" range-key="label" :value="statusIndex" @change="onStatusChange">
          <view class="form-picker">{{ statusOptions[statusIndex].label }}</view>
        </picker>
      </view>
    </view>
    <view class="tip-text">不选状态则导出该时间范围内所有状态的订单</view>
    <button class="export-btn" @tap="doExport" :loading="exporting">导出订单</button>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { exportOrdersByTime } from '@/api/order.js'

const startDate = ref('')
const startTime = ref('00:00')
const endDate = ref('')
const endTime = ref('23:59')
// 默认选中「待发货」
const statusIndex = ref(2)
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'completed', label: '已完成' },
  { value: 'pending_ship', label: '待发货' },
  { value: 'pending_recv', label: '待收货' },
  { value: 'pending_pay', label: '待付款' },
  { value: 'cancelled', label: '已取消' }
]
const exporting = ref(false)

const formatDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDateTimeForApi = (dateStr, timeStr) => {
  return `${dateStr} ${timeStr}:00`
}

const initDates = () => {
  const today = new Date()
  startDate.value = formatDate(today)
  endDate.value = formatDate(today)
}

const onStartDateChange = (e) => { startDate.value = e.detail.value }
const onStartTimeChange = (e) => { startTime.value = e.detail.value }
const onEndDateChange = (e) => { endDate.value = e.detail.value }
const onEndTimeChange = (e) => { endTime.value = e.detail.value }
const onStatusChange = (e) => { statusIndex.value = Number(e.detail.value) }

const doExport = async () => {
  const start_time = formatDateTimeForApi(startDate.value, startTime.value)
  const end_time = formatDateTimeForApi(endDate.value, endTime.value)
  if (start_time > end_time) {
    uni.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' })
    return
  }
  const status = statusOptions[statusIndex.value].value || undefined
  exporting.value = true
  try {
    const exportRes = await exportOrdersByTime({ start_time, end_time, status })
    if (!exportRes || !exportRes.data) {
      uni.showToast({ title: '未获取到文件', icon: 'none' })
      return
    }
    const fs = uni.getFileSystemManager && uni.getFileSystemManager()
    const userDataPath = (typeof wx !== 'undefined' && wx.env && wx.env.USER_DATA_PATH) ? wx.env.USER_DATA_PATH : ''
    if (!fs || !userDataPath) {
      uni.showToast({ title: '当前环境暂不支持打开文件', icon: 'none' })
      return
    }
    const filePath = `${userDataPath}/orders_export_${Date.now()}.xlsx`
    await new Promise((resolve, reject) => {
      fs.writeFile({ filePath, data: exportRes.data, success: resolve, fail: reject })
    })
    uni.openDocument({
      filePath,
      fileType: 'xlsx',
      showMenu: true,
      success: () => {
        uni.showToast({ title: '已打开，可转发或保存到手机', icon: 'none' })
      },
      fail: (err) => {
        console.error('[下载订单] openDocument 失败:', err)
        uni.showToast({ title: '打开失败', icon: 'none' })
      }
    })
  } catch (err) {
    console.error('[下载订单] 导出失败:', err)
    uni.showModal({
      title: '导出失败',
      content: (err && (err.message || err.detail)) || '网络异常，请稍后重试',
      showCancel: false,
      confirmText: '知道了'
    })
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  initDates()
})
</script>

<style scoped>
.export-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}
.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}
.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}
.form-item {
  margin-bottom: 28rpx;
}
.form-item:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}
.form-picker {
  min-height: 80rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
}
.form-picker.time {
  margin-top: 12rpx;
}
.tip-text {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 40rpx;
}
.export-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #1989fa;
  color: #fff;
  font-size: 32rpx;
  border-radius: 16rpx;
  border: none;
}
.export-btn[loading] {
  opacity: 0.8;
}
</style>
