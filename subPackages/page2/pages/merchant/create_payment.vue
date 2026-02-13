<template>
  <view class="create-payment-page">
    <!-- 表单项 -->
    <view class="section-card form-card">
      <view class="section-title">
        <text class="iconfont icon-dingdanxiaoxi section-icon"></text>
        <text>创建支付单</text>
      </view>
      <view class="form-body">
        <!-- 1. 先选商铺 -->
        <view class="form-item">
          <text class="form-label">门店</text>
          <view class="form-input picker-wrap" @tap="openStorePicker">
            <text :class="{ placeholder: !form.store_name }">{{ form.store_name || '请选择门店' }}</text>
            <text class="iconfont icon-arrow-right picker-arrow"></text>
          </view>
        </view>
        <!-- 2. 再选商品（根据商户筛选） -->
        <view class="form-item">
          <text class="form-label">商品</text>
          <view
            class="form-input picker-wrap"
            :class="{ disabled: !selectedStore }"
            @tap="selectedStore ? openProductPicker() : showSelectStoreFirst()"
          >
            <text :class="{ placeholder: !form.product_name }">{{ form.product_name || '请先选门店再选商品' }}</text>
            <text class="iconfont icon-arrow-right picker-arrow"></text>
          </view>
        </view>
        <!-- 3. 金额（点击选择当前商品的款式/规格价格，不可手填） -->
        <view class="form-item">
          <text class="form-label">金额（元）</text>
          <view
            class="form-input picker-wrap"
            :class="{ disabled: !selectedProduct }"
            @tap="selectedProduct ? openAmountPicker() : showSelectProductFirst()"
          >
            <text :class="{ placeholder: !form.amount }">{{ form.amount ? '¥' + form.amount : '请先选商品再选款式价格' }}</text>
            <text class="iconfont icon-arrow-right picker-arrow"></text>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">备注（选填）</text>
          <input
            class="form-input"
            v-model="form.note"
            placeholder="选填"
            placeholder-class="placeholder"
          />
        </view>
        <button
          class="btn-primary"
          :disabled="creating"
          :class="{ disabled: creating }"
          @tap="onCreate"
        >
          {{ creating ? '生成中...' : '生成支付单并生成收款码' }}
        </button>
      </view>
    </view>

    <!-- 门店选择弹层 -->
    <view v-if="storePickerVisible" class="mask" @tap="closeStorePicker"></view>
    <view v-if="storePickerVisible" class="picker-popup store-popup">
      <view class="picker-header">
        <text class="picker-title">选择门店</text>
        <text class="picker-close iconfont" @tap="closeStorePicker">&#xe60a;</text>
      </view>
      <view class="picker-search">
        <input
          v-model="storeSearchKeyword"
          placeholder="根据门店ID搜索"
          placeholder-class="placeholder"
          class="search-input"
          @input="onStoreSearchInput"
        />
      </view>
      <scroll-view scroll-y class="picker-list" @scrolltolower="loadMoreStores">
        <view v-if="storeListLoading" class="list-loading">加载中...</view>
        <view
          v-else-if="filteredStoreList.length === 0"
          class="list-empty"
        >暂无门店</view>
        <view
          v-for="s in filteredStoreList"
          :key="s.store_id || s.id"
          class="picker-item"
          @tap="selectStore(s)"
        >
          <text class="item-main">ID {{ s.store_id || s.id }} · {{ s.store_name || '未命名' }}</text>
          <text v-if="s.user_id" class="item-sub">商户ID {{ s.user_id }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 商品选择弹层 -->
    <view v-if="productPickerVisible" class="mask" @tap="closeProductPicker"></view>
    <view v-if="productPickerVisible" class="picker-popup product-popup">
      <view class="picker-header">
        <text class="picker-title">选择商品</text>
        <text class="picker-close iconfont" @tap="closeProductPicker">&#xe60a;</text>
      </view>
      <scroll-view scroll-y class="picker-list" @scrolltolower="loadMoreProducts">
        <view v-if="productListLoading" class="list-loading">加载中...</view>
        <view
          v-else-if="productList.length === 0"
          class="list-empty"
        >该门店暂无商品</view>
        <view
          v-for="p in productList"
          :key="p.id"
          class="picker-item product-item"
          @tap="selectProduct(p)"
        >
          <text class="item-main">{{ p.name || '未命名' }}</text>
          <text class="item-sub">¥{{ formatProductPrice(p) }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 金额（款式/规格价格）选择弹层 -->
    <view v-if="amountPickerVisible" class="mask" @tap="closeAmountPicker"></view>
    <view v-if="amountPickerVisible" class="picker-popup amount-popup">
      <view class="picker-header">
        <text class="picker-title">选择款式价格</text>
        <text class="picker-close iconfont" @tap="closeAmountPicker">&#xe60a;</text>
      </view>
      <scroll-view scroll-y class="picker-list">
        <view v-if="priceOptions.length === 0" class="list-empty">暂无价格选项</view>
        <view
          v-for="(opt, idx) in priceOptions"
          :key="idx"
          class="picker-item product-item"
          @tap="selectAmount(opt)"
        >
          <text class="item-main">{{ opt.label }}</text>
          <text class="item-sub">¥{{ opt.priceText }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 收款码区域 -->
    <view v-if="qrcodeContent" class="section-card qrcode-card">
      <view class="section-title">
        <text class="iconfont icon-hongbao section-icon"></text>
        <text>收款码</text>
        <text class="expires-badge">{{ expiresText }}</text>
      </view>
      <view class="qrcode-wrap">
        <view class="qrcode-inner">
          <image
            v-if="qrcodeB64Ref"
            class="qrcode-img"
            mode="aspectFit"
            :src="'data:image/png;base64,' + qrcodeB64Ref"
            @error="onQrcodeImageError"
          />
          <tki-qrcode v-else :key="qrcodeContent" :text="qrcodeContent" :size="220" />
        </view>
      </view>
      <view class="payment-info-list">
        <view class="info-row">
          <text class="info-label">支付单号</text>
          <text class="info-value mono">{{ (paymentInfo && paymentInfo.order_no) ? paymentInfo.order_no : '—' }}</text>
        </view>
        <view class="info-row highlight">
          <text class="info-label">金额</text>
          <text class="info-value amount">¥{{ formatAmount(paymentInfo && paymentInfo.amount) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">商品</text>
          <text class="info-value">{{ (paymentInfo && paymentInfo.product_name) ? paymentInfo.product_name : '—' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">门店</text>
          <text class="info-value">{{ (paymentInfo && paymentInfo.store_name) ? paymentInfo.store_name : '—' }}</text>
        </view>
      </view>
      <view class="qrcode-actions">
        <button class="btn-secondary" @tap="onRefreshCode" :disabled="refreshingCode">
          {{ refreshingCode ? '刷新中...' : '刷新收款码' }}
        </button>
        <button class="btn-secondary" @tap="copyQr">复制内容</button>
        <button class="btn-secondary" @tap="regenerate">重新生成</button>
      </view>
    </view>

    <view v-else class="empty-tip">
      <text class="iconfont icon-dingdanxiaoxi empty-icon"></text>
      <text>填写上方信息并点击「生成支付单」后，将显示收款码</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import TkiQrcode from '@/components/tki-qrcode/tki-qrcode.vue'
import { createOfflinePaymentOrder, refreshCollectionCode } from '../../api/payment.js'
import { getStoreList } from '@/api/store.js'
import { getProductList } from '@/api/product.js'

const form = ref({ amount: '', product_name: '', store_name: '', note: '' })
const selectedStore = ref(null) // { store_id, store_name, user_id }
const selectedProduct = ref(null) // 当前选中的商品（含 skus），用于金额选款式
const qrcodeContent = ref('')
const qrcodeB64Ref = ref('') // 后端返回的 base64 二维码图，有则优先展示
const expiresAt = ref(0)
const creating = ref(false)
const refreshingCode = ref(false)
const paymentInfo = ref({})
let timer = null

// 门店选择
const storePickerVisible = ref(false)
const storeListAll = ref([])
const storeSearchKeyword = ref('')
const storeListLoading = ref(false)
const storePage = ref(1)
const storePageSize = 20
const hasMoreStores = ref(true)
const filteredStoreList = computed(() => {
  const kw = (storeSearchKeyword.value || '').trim()
  if (!kw) return storeListAll.value
  const id = parseInt(kw, 10)
  if (Number.isNaN(id)) return storeListAll.value
  return storeListAll.value.filter(
    (s) => (s.store_id != null && s.store_id === id) || (s.id != null && s.id === id) || (s.user_id != null && s.user_id === id)
  )
})

// 商品选择
const productPickerVisible = ref(false)
const productList = ref([])
const productListLoading = ref(false)
const productPage = ref(1)
const productPageSize = 20
const hasMoreProducts = ref(true)

// 金额选择（当前商品的各款式/规格价格，不可手填）
const amountPickerVisible = ref(false)
const priceOptions = computed(() => {
  const p = selectedProduct.value
  if (!p) return []
  const options = []
  if (p.skus && Array.isArray(p.skus) && p.skus.length > 0) {
    p.skus.forEach((sku, i) => {
      const price = parseFloat(sku.price)
      if (Number.isNaN(price)) return
      const spec = sku.specifications && typeof sku.specifications === 'object'
        ? Object.entries(sku.specifications).map(([k, v]) => `${k}: ${v}`).join(' ')
        : ''
      const label = spec || `规格${i + 1}`
      options.push({
        label,
        price,
        priceText: (price || 0).toFixed(2)
      })
    })
  } else {
    const price = parseFloat(p.price)
    if (!Number.isNaN(price) && price >= 0) {
      options.push({
        label: '默认',
        price,
        priceText: (price || 0).toFixed(2)
      })
    }
  }
  return options
})

const expiresText = computed(() => {
  if (!expiresAt.value) return '已过期'
  const sec = Math.max(0, Math.floor((expiresAt.value - Date.now()) / 1000))
  if (sec <= 0) return '已过期'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m} 分 ${s} 秒`
})

function formatAmount(v) {
  return (Number(v || 0)).toFixed(2)
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (!expiresAt.value || Date.now() >= expiresAt.value) {
      stopTimer()
    }
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function getMerchantId() {
  const userInfo = uni.getStorageSync('userInfo') || {}
  return userInfo.user_id ?? userInfo.id ?? userInfo.userId ?? userInfo.uid ?? 0
}

function formatProductPrice(p) {
  if (p.skus && p.skus.length > 0 && (p.skus[0].price != null && p.skus[0].price !== '')) {
    return (parseFloat(p.skus[0].price) || 0).toFixed(2)
  }
  return (parseFloat(p.price) || 0).toFixed(2)
}

function showSelectStoreFirst() {
  if (!selectedStore.value) {
    uni.showToast({ title: '请先选择门店', icon: 'none' })
  }
}

async function loadStores(append = false) {
  if (storeListLoading.value) return
  storeListLoading.value = true
  try {
    if (!append) {
      storePage.value = 1
      hasMoreStores.value = true
    }
    const page = storePage.value
    const res = await getStoreList(page, storePageSize)
    let list = []
    if (res.items && Array.isArray(res.items)) list = res.items
    else if (res.data && Array.isArray(res.data)) list = res.data
    else if (res.data?.items && Array.isArray(res.data.items)) list = res.data.items
    else if (res.data?.list && Array.isArray(res.data.list)) list = res.data.list
    else if (Array.isArray(res.list)) list = res.list
    list = list.map((s) => ({
      ...s,
      store_id: s.store_id ?? s.id,
      user_id: s.user_id != null ? s.user_id : (s.store_id ?? s.id)
    }))
    if (append) {
      storeListAll.value = [...storeListAll.value, ...list]
    } else {
      storeListAll.value = list
    }
    hasMoreStores.value = list.length >= storePageSize
    if (list.length >= storePageSize) storePage.value = page + 1
  } catch (e) {
    console.error('[创建支付单] 加载门店列表失败', e)
    uni.showToast({ title: e?.message || '加载门店失败', icon: 'none' })
  } finally {
    storeListLoading.value = false
  }
}

function loadMoreStores() {
  if (!hasMoreStores.value || storeListLoading.value || storeSearchKeyword.value.trim()) return
  loadStores(true)
}

function onStoreSearchInput() {
  // 仅前端过滤，filteredStoreList 已根据 storeSearchKeyword 计算
  // 若需要按 ID 搜后端，可在此调接口，这里用前端过滤
}

function openStorePicker() {
  storePickerVisible.value = true
  storeSearchKeyword.value = ''
  if (storeListAll.value.length === 0) loadStores()
}

function closeStorePicker() {
  storePickerVisible.value = false
}

function selectStore(s) {
  selectedStore.value = {
    store_id: s.store_id ?? s.id,
    store_name: s.store_name || '未命名',
    user_id: s.user_id
  }
  form.value.store_name = selectedStore.value.store_name
  form.value.product_name = ''
  form.value.amount = ''
  selectedProduct.value = null
  closeStorePicker()
}

function openProductPicker() {
  if (!selectedStore.value) return
  productPickerVisible.value = true
  productList.value = []
  productPage.value = 1
  hasMoreProducts.value = true
  loadProducts()
}

function closeProductPicker() {
  productPickerVisible.value = false
}

async function loadProducts(append = false) {
  if (productListLoading.value || !selectedStore.value) return
  const uid = selectedStore.value.user_id
  if (uid == null || uid === '') {
    uni.showToast({ title: '该门店暂无商户ID，无法加载商品', icon: 'none' })
    return
  }
  productListLoading.value = true
  try {
    if (!append) {
      productPage.value = 1
      hasMoreProducts.value = true
    }
    const page = productPage.value
    const res = await getProductList({
      user_id: uid,
      page,
      pageSize: productPageSize
    })
    let list = []
    const raw = res.data?.list ?? res.data ?? res.list ?? res.items ?? (Array.isArray(res) ? res : [])
    list = Array.isArray(raw) ? raw : []
    if (append) {
      productList.value = [...productList.value, ...list]
    } else {
      productList.value = list
    }
    hasMoreProducts.value = list.length >= productPageSize
    if (list.length >= productPageSize) productPage.value = page + 1
  } catch (e) {
    console.error('[创建支付单] 加载商品列表失败', e)
    uni.showToast({ title: e?.message || '加载商品失败', icon: 'none' })
  } finally {
    productListLoading.value = false
  }
}

function loadMoreProducts() {
  if (!hasMoreProducts.value || productListLoading.value) return
  loadProducts(true)
}

function selectProduct(p) {
  selectedProduct.value = p
  form.value.product_name = p.name || ''
  form.value.amount = ''
  closeProductPicker()
  // 只有一个价格选项时自动选中
  nextTick(() => {
    const opts = priceOptions.value
    if (opts.length === 1 && opts[0].price >= 0) {
      form.value.amount = opts[0].priceText
    }
  })
}

function showSelectProductFirst() {
  if (!selectedProduct.value) {
    uni.showToast({ title: '请先选择商品', icon: 'none' })
  }
}

function openAmountPicker() {
  if (!selectedProduct.value) return
  if (priceOptions.value.length === 0) {
    uni.showToast({ title: '该商品暂无价格选项', icon: 'none' })
    return
  }
  amountPickerVisible.value = true
}

function closeAmountPicker() {
  amountPickerVisible.value = false
}

function selectAmount(opt) {
  form.value.amount = opt.priceText
  closeAmountPicker()
}

async function onCreate() {
  if (creating.value) return
  const product_name = (form.value.product_name || '').trim()
  if (!product_name) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  const amount = Number(form.value.amount)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请选择款式价格', icon: 'none' })
    return
  }
  creating.value = true
  try {
    // merchant_id 应为商户 id：选了门店用该门店的 user_id，否则用当前用户 id
    const merchantId = selectedStore.value?.user_id ?? getMerchantId()
    const res = await createOfflinePaymentOrder({
      merchant_id: merchantId,
      store_name: (form.value.store_name || '').trim() || '门店',
      amount,
      product_name,
      remark: (form.value.note || '').trim()
    })
    console.log('[创建支付单] 后端返回', res)
    // 兼容多种响应：{ code:0, data:{ order_no, qrcode_b64 } } 或 { order_no, code_token, ... } 或 string
    const data = res && typeof res === 'object' && res.data != null ? res.data : res
    let order_no = ''
    let code_token = ''
    let expires_in = 15 * 60
    let qrcodeB64 = ''
    if (typeof data === 'string') {
      order_no = data.trim()
    } else if (data && typeof data === 'object') {
      order_no = data.order_no || data.order_number || data.orderNo || ''
      code_token = data.code_token || data.code || data.qrcode_content || ''
      expires_in = data.expires_in ?? 15 * 60
      let rawB64 = data.qrcode_b64 || data.qrcodeB64 || ''
      if (typeof rawB64 === 'string') {
        rawB64 = rawB64.trim()
        // 若后端返回的是 data URL，去掉前缀只留 base64 内容
        if (rawB64.indexOf('base64,') !== -1) {
          rawB64 = rawB64.split('base64,')[1] || ''
        }
        if (rawB64.length > 100 && /^[A-Za-z0-9+/=]+$/.test(rawB64)) {
          qrcodeB64 = rawB64
        }
      }
    }
    if (res && typeof res === 'object' && res.data == null) {
      order_no = order_no || res.order_no || res.order_number || res.orderNo || ''
      code_token = code_token || res.code_token || res.code || res.qrcode_content || ''
    }
    if (!order_no) {
      order_no = 'P' + Date.now()
    }
    paymentInfo.value = {
      order_no: String(order_no),
      amount: Number(amount),
      product_name: String(product_name),
      store_name: String((form.value.store_name || '').trim() || '门店')
    }
    expiresAt.value = Date.now() + expires_in * 1000
    // 收款码优先使用「带订单号」的 pay:// 链接，用户扫码即可进入支付页；后端 qrcode_b64 仅在没有订单号时作为备用
    const payUrl = `pay://${order_no}`
    qrcodeContent.value = code_token || payUrl
    qrcodeB64Ref.value = order_no ? '' : qrcodeB64  // 有订单号则用前端根据订单号生成的二维码，保证是带订单号的码
    console.log('[创建支付单] paymentInfo 已设置', paymentInfo.value)
    console.log('[创建支付单] 收款码展示: 带订单号 pay://', order_no)
    uni.showToast({ title: '收款码已生成', icon: 'success' })
    startTimer()
  } catch (err) {
    console.error('创建支付单失败', err)
    uni.showToast({
      title: err?.message || err?.msg || '创建失败',
      icon: 'none',
      duration: 2500
    })
  } finally {
    creating.value = false
  }
}

async function onRefreshCode() {
  const order_no = paymentInfo.value?.order_no
  if (!order_no) {
    uni.showToast({ title: '请先生成支付单', icon: 'none' })
    return
  }
  if (refreshingCode.value) return
  refreshingCode.value = true
  try {
    const res = await refreshCollectionCode(order_no)
    if (res != null && typeof res === 'string' && res.trim()) {
      qrcodeContent.value = res.trim()
      uni.showToast({ title: '收款码已刷新', icon: 'success' })
    } else if (res && typeof res === 'object' && (res.qrcode_content || res.code)) {
      qrcodeContent.value = res.qrcode_content || res.code
      uni.showToast({ title: '收款码已刷新', icon: 'success' })
    } else {
      uni.showToast({ title: '刷新成功', icon: 'success' })
    }
  } catch (err) {
    console.error('刷新收款码失败', err)
    const msg = err?.errorMsg || err?.message || err?.msg || err?.detail || '订单不存在或状态异常'
    uni.showToast({
      title: String(msg).trim() || '刷新失败',
      icon: 'none',
      duration: 2500
    })
  } finally {
    refreshingCode.value = false
  }
}

async function regenerate() {
  await onCreate()
}

/** 后端 base64 图片加载失败时改用本地生成二维码 */
function onQrcodeImageError() {
  console.warn('[创建支付单] 后端二维码图加载失败，改用 pay:// 生成')
  qrcodeB64Ref.value = ''
}

function copyQr() {
  if (!qrcodeContent.value) return
  uni.setClipboardData({
    data: qrcodeContent.value,
    success() {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.create-payment-page {
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

.expires-badge {
  margin-left: auto;
  font-size: 24rpx;
  font-weight: normal;
  color: #999;
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

.picker-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.picker-wrap.disabled {
  color: #999;
}
.picker-arrow {
  font-size: 28rpx;
  color: #999;
}

.placeholder {
  color: #bbb;
}

.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 900;
}
.picker-popup {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 70vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 901;
  display: flex;
  flex-direction: column;
}
.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #eee;
}
.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}
.picker-close {
  font-size: 40rpx;
  color: #999;
  padding: 8rpx;
}
.picker-search {
  padding: 20rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.search-input {
  height: 72rpx;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}
.picker-list {
  flex: 1;
  height: 400rpx;
  min-height: 300rpx;
}
.list-loading,
.list-empty {
  padding: 48rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
.picker-item {
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.picker-item .item-main {
  font-size: 30rpx;
  color: #333;
}
.picker-item .item-sub {
  font-size: 24rpx;
  color: #999;
}
.picker-item.product-item {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.picker-item.product-item .item-sub {
  color: #ff9000;
  font-size: 28rpx;
}

.btn-primary {
  margin-top: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #ff9000, #ff5000);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border-radius: 16rpx;
  border: none;
}

.btn-primary.disabled,
.btn-primary[disabled] {
  opacity: 0.7;
}

.qrcode-wrap {
  display: flex;
  justify-content: center;
  padding: 32rpx 0;
  background: #fafafa;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.qrcode-inner {
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  min-width: 280rpx;
  min-height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-img {
  width: 220rpx;
  height: 220rpx;
  display: block;
}

.payment-info-list {
  margin-bottom: 28rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.highlight {
  background: #fffbf0;
  margin: 0 -32rpx;
  padding: 20rpx 32rpx;
  border-radius: 12rpx;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  max-width: 60%;
  text-align: right;
  word-break: break-all;
}

.info-value.mono {
  font-family: monospace;
  font-size: 26rpx;
}

.info-value.amount {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff9000;
}

.qrcode-actions {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.btn-secondary {
  flex: 1;
  min-width: 180rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #f5f5f5;
  color: #333;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.btn-secondary[disabled] {
  opacity: 0.6;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.empty-icon {
  font-size: 96rpx;
  color: #ddd;
  margin-bottom: 24rpx;
}
</style>
