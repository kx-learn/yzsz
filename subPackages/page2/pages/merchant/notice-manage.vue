<template>
  <view class="notice-manage-page">
    <view class="page-header">
      <text class="page-title">播报管理</text>
    </view>

    <view class="notice-content-section">
      <view v-if="currentNotice" class="notice-card">
        <view class="card-header">
          <text class="card-title">当前播报内容</text>
          <text class="card-time">{{ formatTime(currentNotice.updateTime) }}</text>
        </view>
        <view class="notice-text-wrapper">
          <text class="notice-text">{{ currentNotice.content }}</text>
        </view>
        <view class="card-actions">
          <button class="action-btn update" @tap="updateNotice">更新播报</button>
          <button class="action-btn clear" @tap="clearNotice">清空播报</button>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-icon-wrapper">
          <text class="empty-icon">📢</text>
        </view>
        <text class="empty-title">暂无播报内容</text>
        <text class="empty-desc">点击下方按钮添加播报内容</text>
        <button class="add-btn" @tap="addNotice">添加播报</button>
      </view>
    </view>

    <!-- 自定义弹窗 -->
    <view v-if="showEditModal" class="modal-mask" @tap="closeEditModal" @touchmove.stop.prevent>
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editModalTitle }}</text>
          <text class="modal-close" @tap="closeEditModal">×</text>
        </view>
        <view class="modal-body">
          <textarea 
            v-model="editContent"
            class="modal-textarea" 
            placeholder="请输入播报内容"
            placeholder-style="color: #999"
            maxlength="500"
            auto-height
          />
          <text class="char-count">{{ editContent.length }}/500</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="closeEditModal">取消</button>
          <button class="modal-btn confirm" @tap="confirmEdit">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSystemSentences, updateSystemSentences } from '@/api/system.js'
import { getPublicWelfareReport, getPublicWelfareBalance, getPublicWelfareFlow } from '@/api/reports.js'

const currentNotice = ref(null)
const showEditModal = ref(false)
const editContent = ref('')
const editModalTitle = ref('添加播报')
const isEditMode = ref(false) // true为更新模式，false为添加模式

/**
 * 加载播报内容
 */
const loadNotice = async () => {
  try {
    // 先自动更新播报内容（强制更新，覆盖旧内容）
    await autoUpdateBroadcastContent()
    
    // 然后重新加载显示
    uni.showLoading({ title: '加载中...' })
    const res = await getSystemSentences()
    console.log('[播报管理] API响应:', res)
    
    // 解析响应数据
    const data = res.data || res
    const bannerSentence = data.banner_sentence || data.bannerSentence || ''
    
    if (bannerSentence && bannerSentence.trim()) {
      currentNotice.value = {
        content: bannerSentence.trim(),
        updateTime: data.updated_at || data.updateTime || Date.now()
      }
    } else {
      currentNotice.value = null
    }
  } catch (error) {
    console.error('[播报管理] 加载播报失败', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
    currentNotice.value = null
    // 即使加载失败，也尝试自动更新
    await autoUpdateBroadcastContent()
  } finally {
    uni.hideLoading()
  }
}

/**
 * 脱敏处理姓名
 */
const maskName = (name) => {
  if (!name || name === '未知') return '未知'
  const str = String(name)
  if (str.length <= 1) return str + '*'
  return str.charAt(0) + '*'.repeat(Math.min(str.length - 1, 3))
}

/**
 * 计算时间差（几分钟前）
 * 兼容部分 iOS 不支持空格分隔日期与时间的情况，先规范化为 `yyyy-MM-ddTHH:mm:ss`
 */
const getTimeAgo = (timestamp) => {
  if (!timestamp) return '未知时间'

  let ts = timestamp
  if (typeof ts === 'string') {
    ts = ts.trim()
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(ts)) {
      ts = ts.replace(' ', 'T')
    } else if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(ts)) {
      ts = ts.replace(/\//g, '-').replace(' ', 'T')
    } else if (ts.indexOf(' ') !== -1 && ts.indexOf('T') === -1) {
      ts = ts.replace(' ', 'T')
    }
  }

  const now = Date.now()
  const time = new Date(ts).getTime()
  const diff = Math.floor((now - time) / 1000) // 秒数差

  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes}分钟前`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours}小时前`
  } else {
    const days = Math.floor(diff / 86400)
    return `${days}天前`
  }
}

/**
 * 获取公益基金流水明细
 */
const getCharityFlow = async () => {
  try {
    console.log('[播报管理] 开始获取公益基金流水明细')
    
    const res = await getPublicWelfareFlow({
      page: 1,
      pageSize: 5 // 只获取最近5条
    })
    
    console.log('[播报管理] 公益基金流水接口完整响应:', JSON.stringify(res, null, 2))
    
    // 解析响应数据
    let flowList = []
    if (res && res.data) {
      if (Array.isArray(res.data)) {
        flowList = res.data
      } else if (res.data.list && Array.isArray(res.data.list)) {
        flowList = res.data.list
      } else if (res.data.flows && Array.isArray(res.data.flows)) {
        flowList = res.data.flows
      } else if (res.data.rows && Array.isArray(res.data.rows)) {
        flowList = res.data.rows
      }
    } else if (Array.isArray(res)) {
      flowList = res
    }
    
    console.log('[播报管理] 解析后的流水明细:', flowList)
    
    // 只取收入类型的流水（贡献）
    const incomeFlows = flowList
      .filter(item => {
        const flowType = item.flow_type || item.type
        return flowType === 'income' || flowType === 'in' || item.change_amount > 0
      })
      .slice(0, 5) // 最多5条
    
    return incomeFlows
  } catch (error) {
    console.error('[播报管理] 获取公益基金流水明细失败:', error)
    return []
  }
}

/**
 * 自动更新播报内容为公益基金余额和流水明细
 */
const autoUpdateBroadcastContent = async () => {
  try {
    console.log('[播报管理] 开始自动更新播报内容（强制更新）')
    
    // 获取公益基金余额
    const balance = await getCharityBalance()
    console.log('[播报管理] 获取到的公益基金余额:', balance)
    
    // 获取最近5条流水明细
    const flows = await getCharityFlow()
    console.log('[播报管理] 获取到的流水明细:', flows)
    
    // 生成播报内容
    let contentLines = []
    
    // 第一行：总余额
    contentLines.push(`公益基金总余额：¥${balance.toFixed(2)}`)
    
    // 添加流水明细
    if (flows.length > 0) {
      flows.forEach(flow => {
        const userName = maskName(flow.user_name || flow.name || flow.customer_name || '用户')
        const timeAgo = getTimeAgo(flow.created_at || flow.create_time || flow.time)
        const amount = Math.abs(flow.change_amount || flow.amount || 0)
        contentLines.push(`${userName}${timeAgo}贡献¥${amount.toFixed(2)}`)
      })
    } else {
      contentLines.push('暂无最新贡献记录')
    }
    
    const newContent = contentLines.join('\n')
    console.log('[播报管理] 生成的新播报内容:', newContent)
    
    // 强制更新，无论内容是否变化
    // 先获取当前系统通知内容，避免覆盖
    let currentSystemSentence = ''
    try {
      const currentRes = await getSystemSentences()
      const currentData = currentRes.data || currentRes
      currentSystemSentence = currentData.system_sentence || currentData.systemSentence || ''
      console.log('[播报管理] 获取到的系统通知内容:', currentSystemSentence)
    } catch (e) {
      console.warn('[播报管理] 获取当前系统通知失败，使用空字符串', e)
    }
    
    // 强制更新播报内容（覆盖旧内容）
    console.log('[播报管理] 开始保存新播报内容到服务器...')
    await updateSystemSentences({
      banner_sentence: newContent,
      system_sentence: currentSystemSentence // 保持系统通知不变
    })
    
    console.log('[播报管理] 播报内容已强制更新为:', newContent)
    
    // 更新本地显示
    currentNotice.value = {
      content: newContent,
      updateTime: Date.now()
    }
  } catch (error) {
    console.error('[播报管理] 自动更新播报内容失败:', error)
    uni.showToast({ title: '更新播报失败: ' + (error.message || '未知错误'), icon: 'none', duration: 3000 })
  }
}

/**
 * 保存播报内容
 */
const saveNotice = async () => {
  if (currentNotice.value) {
    try {
      uni.showLoading({ title: '保存中...' })
      
      // 先获取当前系统通知内容，避免覆盖
      let currentSystemSentence = ''
      try {
        const currentRes = await getSystemSentences()
        const currentData = currentRes.data || currentRes
        currentSystemSentence = currentData.system_sentence || currentData.systemSentence || ''
      } catch (e) {
        console.warn('[播报管理] 获取当前系统通知失败，使用空字符串', e)
      }
      
      // 调用API更新，只更新播报内容，保持系统通知不变
      await updateSystemSentences({
        banner_sentence: currentNotice.value.content,
        system_sentence: currentSystemSentence // 保持系统通知不变
      })
      console.log('[播报管理] 播报保存成功')
      
      // 保存成功后重新加载数据，确保显示最新内容
      await loadNotice()
    } catch (error) {
      console.error('[播报管理] 保存播报失败', error)
      uni.hideLoading()
      throw error
    }
  }
}

/**
 * 获取公益基金余额
 */
const getCharityBalance = async () => {
  try {
    console.log('[播报管理] 开始获取公益基金余额')
    
    const res = await getPublicWelfareBalance()
    console.log('[播报管理] 公益基金余额接口完整响应:', JSON.stringify(res, null, 2))
    
    // 解析响应数据
    let balanceData = null
    if (res && res.data) {
      balanceData = res.data
    } else if (res && typeof res === 'object') {
      balanceData = res
    }
    
    if (balanceData) {
      // 获取余额字段
      const balance = balanceData.balance || balanceData.balance_amount || 0
      console.log('[播报管理] 解析后的公益基金余额:', balance)
      return balance
    }
    
    console.warn('[播报管理] 无法解析公益基金余额数据')
    return 0
  } catch (error) {
    console.error('[播报管理] 获取公益基金余额失败:', error)
    return 0
  }
}

/**
 * 打开编辑弹窗
 */
const openEditModal = async (isUpdate = false) => {
  try {
    console.log('[播报管理] 开始打开编辑弹窗，模式:', isUpdate ? '更新' : '添加')
    
    isEditMode.value = isUpdate
    editModalTitle.value = isUpdate ? '更新播报' : '添加播报'
    
    // 先获取公益基金余额和流水明细
    uni.showLoading({ title: '获取数据中...' })
    const balance = await getCharityBalance()
    const flows = await getCharityFlow()
    uni.hideLoading()
    
    // 生成默认内容
    let contentLines = []
    
    // 第一行：总余额
    contentLines.push(`公益基金总余额：¥${balance.toFixed(2)}`)
    
    // 添加流水明细
    if (flows.length > 0) {
      flows.forEach(flow => {
        const userName = maskName(flow.user_name || flow.name || flow.customer_name || '用户')
        const timeAgo = getTimeAgo(flow.created_at || flow.create_time || flow.time)
        const amount = Math.abs(flow.change_amount || flow.amount || 0)
        contentLines.push(`${userName}${timeAgo}贡献¥${amount.toFixed(2)}`)
      })
    } else {
      contentLines.push('暂无最新贡献记录')
    }
    
    const defaultContent = contentLines.join('\n')
    
    console.log('[播报管理] 打开编辑弹窗，默认内容:', defaultContent)
    
    // 设置编辑内容为默认内容
    editContent.value = defaultContent
    
    // 先关闭可能存在的弹窗，然后重新打开
    showEditModal.value = false
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // 显示弹窗
    showEditModal.value = true
    console.log('[播报管理] 弹窗状态已设置为显示，showEditModal:', showEditModal.value)
    
    // 确保弹窗显示后，输入框获得焦点（可选）
    setTimeout(() => {
      console.log('[播报管理] 弹窗应该已经显示')
    }, 100)
  } catch (error) {
    uni.hideLoading()
    console.error('[播报管理] 打开编辑弹窗失败:', error)
    // 即使出错也显示弹窗，使用默认提示
    editContent.value = '公益基金总余额：¥0.00\n暂无最新贡献记录'
    showEditModal.value = false
    setTimeout(() => {
      showEditModal.value = true
      console.log('[播报管理] 错误情况下弹窗已显示')
    }, 50)
  }
}

/**
 * 关闭编辑弹窗
 */
const closeEditModal = () => {
  showEditModal.value = false
  editContent.value = ''
}

/**
 * 确认编辑
 */
const confirmEdit = async () => {
  const content = editContent.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入播报内容', icon: 'none' })
    return
  }
  
  try {
    if (isEditMode.value) {
      // 更新模式
      currentNotice.value.content = content
      currentNotice.value.updateTime = Date.now()
    } else {
      // 添加模式
      currentNotice.value = {
        content: content,
        updateTime: Date.now()
      }
    }
    
    await saveNotice()
    closeEditModal()
    uni.showToast({ title: isEditMode.value ? '更新成功' : '添加成功', icon: 'success' })
  } catch (error) {
    console.error('[播报管理] 保存失败:', error)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

/**
 * 添加播报
 */
const addNotice = () => {
  openEditModal(false)
}

/**
 * 更新播报
 */
const updateNotice = () => {
  openEditModal(true)
}

/**
 * 清空播报
 */
const clearNotice = async () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空播报内容吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '清空中...' })
          // 调用API清空
          await updateSystemSentences({
            banner_sentence: '',
            system_sentence: '' // 保持系统通知不变
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
.notice-manage-page {
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

.notice-text-wrapper {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border-left: 6rpx solid #ff4757;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  min-height: 120rpx;
}

.notice-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  word-break: break-all;
}

.card-actions {
  display: flex;
  gap: 20rpx;
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
  background: linear-gradient(135deg, #ffe5e5 0%, #fff5f5 100%);
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

/* 自定义弹窗样式 */
.modal-mask {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 99999 !important;
  width: 100% !important;
  height: 100% !important;
}

.modal-content {
  background: #fff !important;
  border-radius: 16rpx;
  width: 90%;
  max-width: 650rpx;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative !important;
  z-index: 100000 !important;
  margin: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 30rpx;
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  width: 100%;
}

.modal-textarea {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  font-size: 28rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  background: #fff;
  resize: none;
  box-sizing: border-box;
  line-height: 1.6;
}

.char-count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 12rpx;
  display: block;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #eee;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  text-align: center;
  cursor: pointer;
  user-select: none;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #007aff;
  color: #fff;
}
</style>
