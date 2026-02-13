<template>
  <view class="withdraw-card">
    <view class="balance-info">
      <text class="label">可用余额</text>
      <text class="amount">￥{{ balanceDisplay }}</text>
    </view>
    <view class="input-section">
      <text>提现金额</text>
      <input class="input" type="digit" v-model="amount" :placeholder="`最低提现￥${minLimit}`" />
      <text class="all" @tap="allIn">全部提现</text>
    </view>
    <view class="bank-brief">提现至：{{ bankName }} ({{ cardTail }})</view>
      <button class="btn" :disabled="!canWithdraw" @tap="confirmWithdraw">提现</button>

      <view v-if="showPasswordInput" class="password-panel">
        <text>请输入支付密码以确认提现</text>
        <input password class="input" v-model="password" placeholder="支付密码 (6位)" />
        <view style="display:flex;gap:8px;margin-top:8px">
          <button class="btn" @tap="submitWithdraw" :disabled="submitting">{{ submitting ? '提交中...' : '确认提交' }}</button>
          <button class="btn" @tap="cancelPassword">取消</button>
        </view>
      </view>

      <view class="history">
        <view class="history-head">
          <text class="title">提现记录</text>
          <view style="display:flex;gap:8px">
            <picker mode="selector" :range="['全部','pending','approved','processing','completed','failed']" @change="onFilterChange">
              <button class="btn">筛选</button>
            </picker>
            <button class="btn" @tap="exportRecords">导出</button>
          </view>
        </view>
        <view v-if="loadingRecords">加载中…</view>
        <view v-else>
          <block v-for="r in records" :key="r.id">
            <view class="record">
              <text>ID: {{ r.id }} | 金额: ¥{{ formatAmount(r.amount) }} | 手续: ¥{{ formatAmount(r.fee) }} | 到账: ¥{{ formatAmount(r.final_amount) }}</text>
              <text>状态: {{ r.status }} {{ r.tx_no ? ('| 流水: ' + r.tx_no) : '' }}</text>
              <text>时间: {{ formatTime(r.created_at) }}</text>
              <text v-if="r.reason">失败原因: {{ r.reason }}</text>
              <view style="display:flex;gap:8px;margin-top:6px">
                <button v-if="r.status==='failed'" class="btn" @tap="()=>onRetry(r.id)">重试</button>
              </view>
            </view>
          </block>
          <view v-if="records.length===0">暂无提现记录</view>
        </view>
      </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { createWithdrawRequest, verifyPayPassword, listWithdrawals, retryWithdraw } from '@/api/withdraw.js'

// 可配置最低提现限额（可从配置中心读取）
const balance = ref(1234.56)
const amount = ref('')
const minLimit = ref(uni.getStorageSync('withdraw_min_limit') || 100)
const bankName = ref('中国银行')
const cardTail = ref('**** 1234')
const bankInfo = ref({ number: '6222****1234', name: bankName.value })

const password = ref('')
const showPasswordInput = ref(false)
const submitting = ref(false)

const balanceDisplay = computed(()=>Number(balance.value||0).toFixed(2))
const canWithdraw = computed(()=>{ const v = parseFloat(amount.value); return !isNaN(v) && v >= minLimit.value && v <= Number(balance.value) })

// 提现记录与筛选
const records = ref([])
const filterStatus = ref('')
const loadingRecords = ref(false)

function allIn(){ amount.value = Number(balance.value).toFixed(2) }

async function confirmWithdraw(){
  if(!canWithdraw.value){ uni.showToast({ title: `提现金额需在 ${minLimit.value} 到 ${balance.value} 之间`, icon: 'none' }); return }
  showPasswordInput.value = true
}

async function submitWithdraw(){
  if(submitting.value) return
  const pwd = password.value || ''
  if(!pwd){ uni.showToast({ title: '请输入支付密码', icon: 'none' }); return }
  submitting.value = true
  try{
    // 获取当前 user id
    const userInfo = uni.getStorageSync('userInfo') || {}
    const user_id = userInfo.user_id || userInfo.id || userInfo.userId || userInfo.uid || 'unknown'

    const ok = await verifyPayPassword(user_id, pwd)
    if(!ok){ uni.showToast({ title: '支付密码错误', icon: 'none' }); submitting.value = false; return }

    const amt = Number(amount.value)
    const payload = { user_id, amount: amt, bank: bankInfo.value, remark: '商户提现申请' }
    const rec = await createWithdrawRequest(payload)
    uni.showToast({ title: '提现申请已提交，等待审核', icon: 'success' })
    // 减少可用余额（本地模拟）
    balance.value = Number((Number(balance.value) - amt).toFixed(2))
    // 刷新记录
    await loadRecords()
    // 清理
    password.value = ''
    showPasswordInput.value = false
  }catch(err){
    console.error('提交提现失败', err)
    uni.showToast({ title: err.message || '提交失败', icon: 'none' })
  }finally{ submitting.value = false }
}

async function loadRecords(){
  loadingRecords.value = true
  try{
    const userInfo = uni.getStorageSync('userInfo') || {}
    const user_id = userInfo.user_id || userInfo.id || userInfo.userId || userInfo.uid || null
    const list = await listWithdrawals({ user_id })
    records.value = list
  }catch(err){
    console.error('加载提现记录失败', err)
    records.value = []
  }finally{ loadingRecords.value = false }
}

  // 取消密码输入
  function cancelPassword(){ showPasswordInput.value = false; password.value = '' }

  // 筛选变更
  function onFilterChange(e){
    const idx = Number(e && e.detail && e.detail.value) || 0
    const map = ['','pending','approved','processing','completed','failed']
    filterStatus.value = idx === 0 ? '' : map[idx]
    loadRecords()
  }

  // 导出记录为 CSV（复制到剪贴板）
  async function exportRecords(){
    if(!records.value || records.value.length===0){ uni.showToast({ title: '无记录可导出', icon: 'none' }); return }
    const header = ['id','amount','fee','final_amount','status','tx_no','created_at','reason']
    const lines = [header.join(',')]
    for(const r of records.value){
      lines.push([r.id, r.amount, r.fee, r.final_amount, r.status, r.tx_no || '', formatTime(r.created_at), r.reason || ''].map(v=>String(v).replace(/\n/g,' ')).join(','))
    }
    const csv = lines.join('\n')
    try{
      await uni.setClipboardData({ data: csv })
      uni.showToast({ title: '已复制记录到剪贴板（CSV）', icon: 'success' })
    }catch(err){
      uni.showToast({ title: '导出失败', icon: 'none' })
    }
  }

function formatTime(ts){ if(!ts) return '—'; const d = new Date(ts); return d.toLocaleString() }

function formatAmount(v){ return Number(v||0).toFixed(2) }

async function onRetry(id){
  try{
    const newRec = await retryWithdraw(id)
    uni.showToast({ title: '已重新发起提现申请', icon: 'success' })
    await loadRecords()
  }catch(err){
    uni.showToast({ title: err.message || '重试失败', icon: 'none' })
  }
}

// 订阅外部更新事件（API 在异步审核或打款时会触发）
function onUpdate(ev){
  // ev 为记录对象或 id
  const updated = typeof ev === 'string' || typeof ev === 'number' ? null : ev
  if(updated && updated.id){
    const idx = records.value.findIndex(r=>r.id===updated.id)
    if(idx>=0) records.value.splice(idx,1,updated)
    else records.value.unshift(updated)
  }
}

onMounted(()=>{
  loadRecords()
  loadBoundBank()
  uni.$on && uni.$on('withdraw:updated', onUpdate)
  uni.$on && uni.$on('merchant:bank:updated', onMerchantBankUpdated)
  uni.$on && uni.$on('merchant:bank:removed', onMerchantBankRemoved)
})

onBeforeUnmount(()=>{
  uni.$off && uni.$off('withdraw:updated', onUpdate)
  uni.$off && uni.$off('merchant:bank:updated', onMerchantBankUpdated)
  uni.$off && uni.$off('merchant:bank:removed', onMerchantBankRemoved)
})

// 加载本地已绑定的银行卡信息到页面
function loadBoundBank(){
  try{
    const b = uni.getStorageSync('merchant_bound_bank') || null
    if(b){
      bankName.value = b.name || bankName.value
      cardTail.value = b.number ? ('**** ' + String(b.number).slice(-4)) : cardTail.value
      bankInfo.value = b
    }
  }catch(e){ console.error('读取本地银行卡信息失败', e) }
}

function onMerchantBankUpdated(ev){
  const payload = ev || uni.getStorageSync('merchant_bound_bank') || null
  if(!payload) return
  bankName.value = payload.name || bankName.value
  cardTail.value = payload.number ? ('**** ' + String(payload.number).slice(-4)) : cardTail.value
  bankInfo.value = payload
}

function onMerchantBankRemoved(){
  bankName.value = '未绑定'
  cardTail.value = ''
  bankInfo.value = {}
}
</script>

<style scoped>
.withdraw-card{padding:16px;background:#fff;border-radius:8px}
.balance-info{display:flex;justify-content:space-between;align-items:center}
.amount{font-size:20px;font-weight:700}
.input-section{margin-top:10px}
.input-section .input{width:60%;padding:8px;border-radius:6px;border:1px solid #eee}
.all{color:#2d8cf0;margin-left:8px}
.btn{margin-top:12px;background:#42bd56;color:#fff;padding:10px;border-radius:6px}
.password-panel{margin-top:12px;padding:12px;border:1px dashed #eee;border-radius:6px}
.history{margin-top:16px}
.history-head{display:flex;justify-content:space-between;align-items:center}
.record{padding:8px;border-bottom:1px solid #f3f3f3;margin-top:8px}
.title{font-weight:600}
</style>
