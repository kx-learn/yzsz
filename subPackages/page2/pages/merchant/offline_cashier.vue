<template>
  <view class="cashier-page">
    <!-- 识别区 -->
    <view class="section-card">
      <view class="section-title">
        <text class="iconfont icon-saoyisao section-icon"></text>
        <text>扫码或输入</text>
      </view>
      <view class="form-body">
        <view class="form-item">
          <text class="form-label">用户付款码 / 用户ID</text>
          <input
            class="form-input input-full"
            v-model="scannedCode"
            placeholder="输入付款码或用户ID"
            placeholder-class="placeholder"
          />
          <view class="scan-link" @tap="onScanCode">
            <text class="iconfont icon-saoyisao scan-link-icon"></text>
            <text class="scan-link-text">扫一扫填入</text>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">交易金额（元）</text>
          <input
            class="form-input amount-input"
            :value="orderAmount"
            placeholder="0.00"
            type="digit"
            placeholder-class="placeholder"
            @input="onAmountInput"
          />
        </view>
        <button
          class="btn-primary"
          :disabled="identifying"
          :class="identifying ? 'btn-primary-disabled' : ''"
          @tap="onIdentify"
        >
          {{ identifying ? '识别中...' : '识别并匹配优惠' }}
        </button>
      </view>
    </view>

    <!-- 匹配结果 -->
    <view v-if="couponResult" class="section-card result-card">
      <view class="section-title">
        <text class="iconfont icon-youhuijuan section-icon"></text>
        <text>优惠结果</text>
      </view>
      <view v-if="couponResult.applied && couponResult.applied.length > 0" class="coupon-list">
        <view
          v-for="c in couponResult.applied"
          :key="c.id || c.name"
          class="coupon-item"
        >
          <text class="coupon-name">{{ c.name }}</text>
          <text class="coupon-deduct">-¥{{ formatAmount(c.deduct) }}</text>
        </view>
      </view>
      <view v-else class="no-coupon">
        <text>暂无可用优惠</text>
      </view>
      <view class="summary-row">
        <text class="summary-label">原价</text>
        <text class="summary-value">¥{{ formatAmount(orderAmount) }}</text>
      </view>
      <view class="summary-row deduct">
        <text class="summary-label">优惠抵扣</text>
        <text class="summary-value">-¥{{ formatAmount(couponResult.totalDeduct || 0) }}</text>
      </view>
      <view class="summary-row total">
        <text class="summary-label">应付金额</text>
        <text class="summary-value amount">¥{{ formatAmount(couponResult.finalAmount ?? orderAmount) }}</text>
      </view>
      <view class="result-actions">
        <button
          class="btn-primary confirm-btn"
          :disabled="confirming"
          :class="confirming ? 'btn-primary-disabled' : ''"
          @tap="confirmFlow"
        >
          {{ confirming ? '处理中...' : '确认收款' }}
        </button>
        <button class="btn-secondary" @tap="printReceipt">打印小票</button>
        <button class="btn-secondary" @tap="notifyUser">通知用户</button>
      </view>
    </view>

    <view v-else class="empty-tip">
      <text class="iconfont icon-saoyisao empty-icon"></text>
      <text class="empty-desc">输入付款码或用户ID、交易金额后，点击「识别并匹配优惠」</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { applyBestCoupons, confirmPayment, notifyMerchant } from '../../api/payment.js'

const scannedCode = ref('')
const orderAmount = ref('')
const couponResult = ref(null)
const identifying = ref(false)
const confirming = ref(false)

function formatAmount(v) {
  return (Number(v || 0)).toFixed(2)
}

/** 金额输入：只允许数字和一个小数点，避免 type="digit" 下出现 e 等 */
function onAmountInput(e) {
  const raw = (e.detail && e.detail.value) || ''
  const filtered = raw.replace(/[^\d.]/g, '').replace(/^(\d*\.)(.*)/, (_, a, b) => a + b.replace(/\./g, ''))
  orderAmount.value = filtered
}

/** 是否在微信开发者工具环境（模拟器无法真正扫码） */
function isWxDevTools() {
  try {
    const sys = uni.getSystemInfoSync()
    const name = sys && sys.host && sys.host.name
    return name === 'developer' || name === 'ide'
  } catch {
    return false
  }
}

/** 扫一扫：若为订单号则直接跳转订单详情支付页，否则填入付款码/用户ID */
function onScanCode() {
  if (isWxDevTools()) {
    uni.showModal({
      title: '请在真机上操作',
      content: '扫一扫需在真机微信中使用，开发者工具暂不支持。请用手机扫码预览或真机调试后再使用「扫一扫填入」。',
      showCancel: false
    })
    return
  }
  uni.scanCode({
    success: (res) => {
      const raw = (res.result || res.scanResult || '').trim()
      if (!raw) {
        uni.showToast({ title: '未识别到内容', icon: 'none' })
        return
      }
      const orderNo = parseOrderNoFromScan(raw)
      if (orderNo) {
        uni.navigateTo({ url: `/pages/offline/pay?order_no=${encodeURIComponent(orderNo)}` })
        return
      }
      scannedCode.value = raw
      uni.showToast({ title: '已填入', icon: 'success' })
    },
    fail: (err) => {
      const errMsg = (err && err.errMsg) ? String(err.errMsg) : ''
      if (errMsg.includes('cancel')) return
      // 开发者工具无法调起真实扫码，给出与订单页一致的提示
      const isDevToolsOnly = /开发者工具|暂不支持此 API|请使用真机|scanCode/i.test(errMsg)
      if (isDevToolsOnly) {
        uni.showModal({
          title: '请在真机上操作',
          content: '扫一扫需在真机微信中使用，开发者工具暂不支持。请用手机扫码预览或真机调试后再使用「扫一扫填入」。',
          showCancel: false
        })
        return
      }
      uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
    }
  })
}

/** 从扫码结果解析订单号：支持 pay://订单号、或 P 开头的订单号 */
function parseOrderNoFromScan(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const s = raw.trim()
  if (s.startsWith('pay://')) return s.slice(6).trim()
  if (/^P\d+$/i.test(s) || /^\d{10,}$/.test(s)) return s
  return ''
}

async function onIdentify() {
  if (identifying.value) return
  const code = (scannedCode.value || '').trim()
  if (!code) {
    uni.showToast({ title: '请输入付款码或用户ID', icon: 'none' })
    return
  }
  const amount = Number(orderAmount.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入交易金额', icon: 'none' })
    return
  }
  identifying.value = true
  try {
    const res = await applyBestCoupons({ user_id: code, order_amount: amount })
    // 兼容多种返回格式
    const applied = res.applied || res.coupons || []
    const totalDeduct = Number(res.totalDeduct ?? res.total_deduct ?? 0)
    const finalAmount = Number(res.finalAmount ?? res.final_amount ?? (amount - totalDeduct))
    couponResult.value = {
      applied: Array.isArray(applied) ? applied : [],
      totalDeduct,
      finalAmount: finalAmount > 0 ? finalAmount : 0
    }
    uni.showToast({ title: '已匹配优惠', icon: 'success' })
  } catch (err) {
    console.error('匹配优惠失败', err)
    uni.showToast({ title: err?.message || err?.msg || '匹配优惠失败', icon: 'none' })
  } finally {
    identifying.value = false
  }
}

async function confirmFlow() {
  if (confirming.value) return
  if (!couponResult.value) {
    uni.showToast({ title: '请先识别并匹配优惠', icon: 'none' })
    return
  }
  confirming.value = true
  try {
    const order_id = 'offline_' + Date.now()
    const finalAmount = couponResult.value.finalAmount ?? Number(orderAmount.value)
    const res = await confirmPayment({
      order_id,
      user_id: scannedCode.value,
      paid_amount: finalAmount
    })
    await notifyMerchant({
      merchant_id: 'LOCAL_POS',
      order_id,
      message: '到账通知：¥' + formatAmount(res.paid_amount ?? finalAmount)
    })
    uni.showToast({ title: '收款成功', icon: 'success' })
    scannedCode.value = ''
    orderAmount.value = ''
    couponResult.value = null
  } catch (err) {
    console.error('确认支付失败', err)
    uni.showToast({ title: err?.message || err?.msg || '支付失败', icon: 'none' })
  } finally {
    confirming.value = false
  }
}

function printReceipt() {
  console.log('打印小票（占位）', { user: scannedCode.value, amount: orderAmount.value, couponResult: couponResult.value })
  uni.showToast({ title: '打印已触发（占位）', icon: 'none' })
}

function notifyUser() {
  console.log('通知用户（占位）', scannedCode.value)
  uni.showToast({ title: '已通知用户（占位）', icon: 'none' })
}
</script>

<style scoped>
.cashier-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

.section-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 28rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.section-icon {
  margin-right: 12rpx;
  color: #ff9000;
  font-size: 36rpx;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
}

.form-input {
  height: 80rpx;
  padding: 0 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 30rpx;
  color: #333;
}

.amount-input {
  font-size: 36rpx;
  font-weight: 500;
  color: #ff9000;
}

.placeholder {
  color: #bbb;
}

.input-full {
  width: 100%;
  box-sizing: border-box;
}

.scan-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 12rpx;
  padding: 16rpx 0;
  color: #ff9000;
  font-size: 28rpx;
}

.scan-link-icon {
  font-size: 32rpx;
}

.scan-link-text {
  font-size: 28rpx;
}

.btn-primary {
  margin-top: 8rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #ff9000, #ff5000);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
}

.btn-primary-disabled {
  opacity: 0.7;
}

/* 结果卡片 */
.result-card .section-title {
  margin-bottom: 20rpx;
}

.coupon-list {
  margin-bottom: 20rpx;
}

.coupon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.coupon-name {
  color: #333;
}

.coupon-deduct {
  color: #ff9000;
  font-weight: 500;
}

.no-coupon {
  padding: 24rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  font-size: 28rpx;
}

.summary-row.deduct {
  color: #ff9000;
}

.summary-row.total {
  margin-top: 8rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #eee;
  font-size: 30rpx;
  font-weight: 600;
}

.summary-row.total .amount {
  font-size: 36rpx;
  color: #ff9000;
}

.summary-label {
  color: #666;
}

.summary-value {
  color: #333;
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 24rpx;
}

.confirm-btn {
  flex: 1;
  min-width: 200rpx;
}

.btn-secondary {
  flex: 1;
  min-width: 160rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f5f5f5;
  color: #333;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx 120rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.empty-icon {
  font-size: 96rpx;
  color: #ddd;
  margin-bottom: 24rpx;
}

.empty-desc {
  line-height: 1.5;
  padding: 0 20rpx;
}
</style>
