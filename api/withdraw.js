// 占位提现 API（前端模拟）
// 使用 uni.setStorageSync/uni.getStorageSync 存储提现记录，模拟审核与打款流程
const STORAGE_KEY = 'mock_withdrawals_v1'

function _loadAll(){
  try{
    return uni.getStorageSync(STORAGE_KEY) || []
  }catch(e){
    console.warn('读取提现本地存储失败', e)
    return []
  }
}

function _saveAll(list){
  try{
    uni.setStorageSync(STORAGE_KEY, list)
  }catch(e){
    console.warn('保存提现本地存储失败', e)
  }
}

function _generateId(){ return 'W' + Date.now() + Math.floor(Math.random()*900).toString() }

function _calcFee(amount){
  // 手续费策略：0.6% 最低1元（示例，可配置）
  const fee = Math.max(1, Number(amount) * 0.006)
  return Number(fee.toFixed(2))
}

export async function verifyPayPassword(user_id, password){
  // 占位：密码 '123456' 视为正确，其它视为错误
  await Promise.resolve()
  return password === '123456'
}

export async function createWithdrawRequest({ user_id, amount, bank, remark }){
  // amount 已为数字
  const list = _loadAll()
  const fee = _calcFee(amount)
  const final_amount = Number((amount - fee).toFixed(2))
  const rec = {
    id: _generateId(),
    user_id: user_id || 'unknown',
    amount: Number(amount),
    fee,
    final_amount,
    bank: bank || {},
    remark: remark || '',
    status: 'pending', // pending -> approved -> processing -> completed / failed
    reason: '',
    created_at: Date.now(),
    updated_at: Date.now(),
    tx_no: null
  }
  list.unshift(rec)
  _saveAll(list)

  // 异步模拟自动审核与打款
  setTimeout(()=>{
    // 简单规则：银行卡号长度>=8 则通过，否则失败
    const bankOk = rec.bank && (String(rec.bank.number || '').length >= 8)
    if(!bankOk){
      rec.status = 'failed'
      rec.reason = '银行卡信息校验失败'
      rec.updated_at = Date.now()
      _saveAll(list)
      uni.showToast({ title: `提现 ${rec.id} 审核失败：银行卡信息异常`, icon: 'none' })
      uni.$emit && uni.$emit('withdraw:updated', rec)
      return
    }
    // 模拟通过
    rec.status = 'approved'
    rec.updated_at = Date.now()
    _saveAll(list)
    uni.showToast({ title: `提现 ${rec.id} 审核通过，等待打款`, icon: 'success' })
    uni.$emit && uni.$emit('withdraw:updated', rec)

    // 模拟 T+0/T+1 打款延迟，随机成功或失败
    setTimeout(()=>{
      // 90% 成功
      const ok = Math.random() < 0.9
      rec.status = ok ? 'completed' : 'failed'
      rec.tx_no = ok ? ('TX' + Date.now() + Math.floor(Math.random()*900)) : null
      rec.reason = ok ? '' : '银行打款失败（示例）'
      rec.updated_at = Date.now()
      _saveAll(list)
      uni.showToast({ title: ok ? `提现 ${rec.id} 已打款` : `提现 ${rec.id} 打款失败`, icon: ok ? 'success':'none' })
      uni.$emit && uni.$emit('withdraw:updated', rec)
    }, 3000 + Math.floor(Math.random()*4000))

  }, 1500 + Math.floor(Math.random()*2000))

  return Promise.resolve(rec)
}

export async function getWithdrawById(id){
  const list = _loadAll()
  return list.find(i => i.id === id) || null
}

export async function listWithdrawals({ user_id, status, start, end } = {}){
  let list = _loadAll()
  if(user_id) list = list.filter(i => String(i.user_id) === String(user_id))
  if(status) list = list.filter(i => i.status === status)
  if(start) list = list.filter(i => i.created_at >= start)
  if(end) list = list.filter(i => i.created_at <= end)
  // 返回按时间倒序
  list.sort((a,b)=>b.created_at - a.created_at)
  return list
}

export async function retryWithdraw(id){
  const list = _loadAll()
  const rec = list.find(i => i.id === id)
  if(!rec) throw new Error('记录不存在')
  if(rec.status !== 'failed') throw new Error('只有失败记录可重试')
  // 生成新申请
  const newRec = await createWithdrawRequest({ user_id: rec.user_id, amount: rec.amount, bank: rec.bank, remark: '重试：' + (rec.remark||'') })
  return newRec
}

export default {
  verifyPayPassword,
  createWithdrawRequest,
  getWithdrawById,
  listWithdrawals,
  retryWithdraw
}
