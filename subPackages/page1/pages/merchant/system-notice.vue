<template>
  <view class="system-notice-page">
    <view class="page-header">
      <text class="page-title">发送系统通知</text>
    </view>

    <view class="notice-content-section">
      <view v-if="currentNotice" class="notice-card">
        <view class="card-header">
          <text class="card-title">当前通知内容</text>
          <text class="card-time">{{ formatTime(currentNotice.updateTime) }}</text>
        </view>
        <view class="notice-content-wrapper">
          <view class="notice-text-wrapper">
            <text class="notice-label">通知内容：</text>
            <text class="notice-text">{{ currentNotice.content }}</text>
          </view>
        </view>
        <view class="card-actions">
          <button class="action-btn update" @tap="updateNotice">更新通知</button>
          <button class="action-btn clear" @tap="clearNotice">清空通知</button>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-icon-wrapper">
          <text class="empty-icon">📬</text>
        </view>
        <text class="empty-title">暂无系统通知</text>
        <text class="empty-desc">点击下方按钮添加系统通知</text>
        <button class="add-btn" @tap="addNotice">添加通知</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSystemSentences, updateSystemSentences } from '@/api/system.js'

const currentNotice = ref(null)
const isAdding = ref(false) // 防止重复点击

/**
 * 加载系统通知
 */
const loadNotice = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const res = await getSystemSentences()
    console.log('[系统通知] API响应:', res)
    
    // 解析响应数据
    const data = res.data || res
    const systemSentence = data.system_sentence || data.systemSentence || ''
    
    if (systemSentence && systemSentence.trim()) {
      // 系统通知直接使用内容，不再区分标题和内容
      currentNotice.value = {
        title: '系统通知',
        content: systemSentence.trim(),
        updateTime: data.updated_at || data.updateTime || Date.now(),
        type: 'system'
      }
    } else {
      currentNotice.value = null
    }
  } catch (error) {
    console.error('[系统通知] 加载失败', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
    currentNotice.value = null
  } finally {
    uni.hideLoading()
  }
}

/**
 * 保存系统通知
 */
const saveNotice = async () => {
  if (currentNotice.value) {
    try {
      uni.showLoading({ title: '保存中...' })
      // 直接使用内容，不再区分标题和内容
      const systemSentence = currentNotice.value.content
      
      // 先获取当前播报内容，避免覆盖
      let currentBannerSentence = ''
      try {
        const currentRes = await getSystemSentences()
        const currentData = currentRes.data || currentRes
        currentBannerSentence = currentData.banner_sentence || currentData.bannerSentence || ''
      } catch (e) {
        console.warn('[系统通知] 获取当前播报失败，使用空字符串', e)
      }
      
      // 调用API更新，只更新系统通知内容，保持播报不变
      await updateSystemSentences({
        banner_sentence: currentBannerSentence, // 保持播报不变
        system_sentence: systemSentence
      })
      console.log('[系统通知] 通知保存成功')
      
      // 保存成功后重新加载数据，确保显示最新内容
      await loadNotice()
    } catch (error) {
      console.error('[系统通知] 保存通知失败', error)
      uni.hideLoading()
      throw error
    }
  }
}

/**
 * 添加通知
 */
const addNotice = async () => {
  // 防止重复点击
  if (isAdding.value) {
    return
  }
  
  isAdding.value = true
  
  try {
    uni.showModal({
      title: '添加系统通知',
      editable: true,
      placeholderText: '请输入通知内容',
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          try {
            const content = res.content.trim()
            currentNotice.value = {
              title: '系统通知',
              content: content,
              updateTime: Date.now(),
              type: 'system'
            }
            await saveNotice()
            uni.showToast({ title: '添加成功', icon: 'success' })
          } catch (error) {
            console.error('[系统通知] 添加失败', error)
            uni.showToast({ title: '添加失败，请重试', icon: 'none' })
          } finally {
            isAdding.value = false
          }
        } else {
          isAdding.value = false
        }
      },
      fail: () => {
        isAdding.value = false
      }
    })
  } catch (error) {
    isAdding.value = false
  }
}

/**
 * 更新通知
 */
const updateNotice = async () => {
  // 防止重复点击
  if (isAdding.value) {
    return
  }
  
  isAdding.value = true
  
  try {
    uni.showModal({
      title: '更新系统通知',
      editable: true,
      placeholderText: '请输入新的通知内容',
      content: currentNotice.value.content,
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          try {
            currentNotice.value.content = res.content.trim()
            currentNotice.value.updateTime = Date.now()
            await saveNotice()
            uni.showToast({ title: '更新成功', icon: 'success' })
          } catch (error) {
            console.error('[系统通知] 更新失败', error)
            uni.showToast({ title: '更新失败，请重试', icon: 'none' })
          } finally {
            isAdding.value = false
          }
        } else {
          isAdding.value = false
        }
      },
      fail: () => {
        isAdding.value = false
      }
    })
  } catch (error) {
    isAdding.value = false
  }
}

/**
 * 清空通知
 */
const clearNotice = async () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空系统通知吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '清空中...' })
          // 调用API清空
          await updateSystemSentences({
            banner_sentence: '', // 保持播报不变
            system_sentence: ''
          })
          
          // 清空成功后重新加载数据
          await loadNotice()
          uni.showToast({ title: '已清空', icon: 'success' })
        } catch (error) {
          uni.hideLoading()
          uni.showToast({ title: '清空失败，请重试', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 格式化时间
 */
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onMounted(() => {
  loadNotice()
})

onShow(() => {
  loadNotice()
})
</script>

<style scoped>
.system-notice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30rpx;
}

.page-header {
  margin-bottom: 40rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.notice-content-section {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.notice-card {
  padding: 40rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.card-time {
  font-size: 24rpx;
  color: #999;
}

.notice-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.notice-title-wrapper,
.notice-text-wrapper {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
  border-left: 6rpx solid #3d6bff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.notice-label {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
  margin-right: 12rpx;
}

.notice-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.6;
}

.notice-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  word-break: break-all;
}

.card-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s;
}

.action-btn.update {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.clear {
  background: #f8f9fa;
  color: #666;
}

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-icon-wrapper {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f0ff 0%, #f0f4ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.add-btn {
  padding: 24rpx 60rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}
</style>
