/**
 * 微信进件（wechat-applyment）接口 - 调用真实后端 API
 * 对应图2、图3中的接口：draft、submit、status、media/upload、core-info/modify、resubmit
 */

// 一次性清除旧版模拟实现的本地缓存（升级后首次加载时执行）
try {
  if (!uni.getStorageSync('wechat_applyment_migrated_v1')) {
    uni.removeStorageSync('wx_applyment_records_v1')
    uni.removeStorageSync('wx_applyment_media_v1')
    uni.setStorageSync('wechat_applyment_migrated_v1', '1')
  }
} catch (e) { /* ignore */ }

import config from '@/utils/config.js'
import request from '@/utils/request.js'

// 将后端返回的进件数据规范化为组件期望的格式
function _normalizeApplyment(raw) {
  if (!raw) return null
  const id = raw.id || raw.applyment_id
  return {
    id,
    applyment_id: raw.applyment_id || id,
    business_code: raw.business_code,
    sub_mchid: raw.sub_mchid,
    subject_type: raw.subject_type,
    subject_info: raw.subject_info || {},
    contact_info: raw.contact_info || {},
    bank_account_info: raw.bank_account_info || {},
    applyment_state: raw.applyment_state || raw.status,
    applyment_state_msg: raw.applyment_state_msg || raw.reject_reason,
    is_draft: raw.is_draft ?? (raw.applyment_state === 'APPLYMENT_STATE_EDITTING' ? 1 : 0),
    submitted_at: raw.submitted_at,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    ...raw
  }
}

// 创建草稿 -> POST /wechat-applyment/draft
// 请求体结构：applyment_id(新建为0)、subject_type、subject_info、contact_info、bank_account_info、business_category_locked
export async function createDraft({
  user_id,
  applyment_id = 0,
  subject_type,
  subject_info = {},
  contact_info = {},
  bank_account_info = {},
  business_category_locked = false
} = {}) {
  const payload = {
    applyment_id: applyment_id || 0,
    subject_type: subject_type || 'SUBJECT_TYPE_INDIVIDUAL',
    subject_info: subject_info || {},
    contact_info: contact_info || {},
    bank_account_info: bank_account_info || {},
    business_category_locked: !!business_category_locked
  }
  if (user_id) payload.user_id = user_id
  // 与 submit 一致：显式 JSON.stringify，确保微信小程序中嵌套对象不丢失
  const res = await request.post('/wechat-applyment/draft', JSON.stringify(payload), {
    header: { 'Content-Type': 'application/json' }
  })
  return _normalizeApplyment(res?.data || res)
}

// 更新草稿（核心信息）-> POST /wechat-applyment/core-info/modify
export async function updateDraft(id, payload = {}) {
  if (!id) throw Object.assign(new Error('id required'), { status: 422 })
  const data = {
    applyment_id: id,
    ...payload
  }
  if (payload.bank_account_info) data.bank_account_info = payload.bank_account_info
  if (payload.contact_info) data.contact_info = payload.contact_info
  if (payload.subject_info) data.subject_info = payload.subject_info
  const res = await request.post('/wechat-applyment/core-info/modify', JSON.stringify(data), {
    header: { 'Content-Type': 'application/json' }
  })
  return _normalizeApplyment(res?.data || res)
}

// 查询进件详情 -> GET /wechat-applyment/status
export async function getApplymentById(id) {
  if (!id) return null
  const res = await request.get(`/wechat-applyment/status?applyment_id=${id}`)
  const raw = res?.data || res
  return _normalizeApplyment(raw)
}

// 获取进件配置（结算规则等）-> GET /wechat-applyment/config，后端可返回 { settle_rule_id } 供提交使用
export async function getApplymentConfig() {
  try {
    const res = await request.get('/wechat-applyment/config')
    return res?.data || res || null
  } catch {
    return null
  }
}

// 列举进件（草稿/已提交）-> 尝试 GET /wechat-applyment/list，若无则通过 status 回退
export async function listApplyments({ user_id = null, is_draft = null, applyment_state = null } = {}) {
  try {
    const params = {}
    if (is_draft !== null) params.is_draft = is_draft
    if (applyment_state) params.applyment_state = applyment_state
    if (user_id) params.user_id = user_id
    const res = await request.get('/wechat-applyment/list', params)
    const list = res?.data || res?.list || (Array.isArray(res) ? res : [])
    return (Array.isArray(list) ? list : []).map(_normalizeApplyment)
  } catch (e) {
    if (e?.code === 404 || e?.statusCode === 404) return []
    throw e
  }
}

// 提交进件 -> POST /wechat-applyment/submit
// 后端需完整结构：applyment_id、subject_type、subject_info、contact_info、bank_account_info、settlement_info、business_category_locked
export async function submitApplyment({
  id,
  applyment_id = null,
  subject_type = null,
  subject_info = {},
  contact_info = {},
  bank_account_info = {},
  business_info = null,
  settlement_info = null,
  business_category_locked = false
} = {}) {
  const aid = id || applyment_id
  if (!aid) throw Object.assign(new Error('id required'), { status: 422 })
  const payload = {
    applyment_id: aid,
    subject_type: subject_type || 'SUBJECT_TYPE_INDIVIDUAL',
    subject_info: subject_info || {},
    contact_info: contact_info || {},
    bank_account_info: bank_account_info || {},
    business_category_locked: !!business_category_locked
  }
  if (business_info && typeof business_info === 'object') payload.business_info = business_info
  // 结算规则：前端有则传 settlement_info；未传时由后端在转发微信前填充 settle_rule_id
  if (settlement_info && typeof settlement_info === 'object' && settlement_info.settle_rule_id) payload.settlement_info = settlement_info
  // 微信小程序需传 JSON 字符串，否则嵌套对象可能丢失
  const res = await request.post('/wechat-applyment/submit', JSON.stringify(payload), {
    header: { 'Content-Type': 'application/json' }
  })
  return _normalizeApplyment(res?.data || res)
}

// 上传材料 -> POST /wechat-applyment/media/upload（使用 uni.uploadFile 上传文件）
export async function uploadMedia({ file, media_type, applyment_id = null } = {}) {
  if (!file || !media_type) throw Object.assign(new Error('file or media_type required'), { status: 422 })
  const aid = applyment_id
  if (!aid) throw Object.assign(new Error('applyment_id required'), { status: 422 })

  const filePath = typeof file === 'string' ? file : (file?.url || file?.path || file)
  if (typeof filePath !== 'string') throw Object.assign(new Error('file path required'), { status: 422 })

  const baseURL = config.baseURL || ''
  const token = uni.getStorageSync('token') || ''

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${baseURL}/wechat-applyment/media/upload`,
      filePath,
      name: 'file',
      formData: {
        media_type,
        applyment_id: String(aid)
      },
      header: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            let data = res.data
            if (typeof res.data === 'string') {
              try {
                data = JSON.parse(res.data)
              } catch {
                data = { raw: res.data }
              }
            }
            const err = data?.error || (data?.code && data.code !== 0 && data.code !== 200 ? data : null)
            if (err) {
              reject(new Error(data?.message || data?.msg || '上传失败'))
            } else {
              resolve(data?.data || data)
            }
          } catch (e) {
            resolve(res.data)
          }
        } else {
          reject(new Error(`上传失败[${res.statusCode}]`))
        }
      },
      fail: (err) => reject(err || new Error('上传失败'))
    })
  })
}

// 列举已上传材料 -> 尝试 GET /wechat-applyment/media/list，若无则从 status 中取 media
export async function listMedia({ applyment_id = null } = {}) {
  if (!applyment_id) return []
  try {
    const res = await request.get('/wechat-applyment/media/list', { applyment_id })
    const list = res?.data || res?.list || (Array.isArray(res) ? res : [])
    return Array.isArray(list) ? list : []
  } catch (e) {
    if (e?.code === 404 || e?.statusCode === 404) return []
    try {
      const statusRes = await request.get(`/wechat-applyment/status?applyment_id=${applyment_id}`)
      const raw = statusRes?.data || statusRes
      const mediaList = raw?.media_list || raw?.media || []
      return Array.isArray(mediaList) ? mediaList : []
    } catch {
      return []
    }
  }
}

// 修改核心信息（需重新进件）
export async function modifyCoreInfo({ applyment_id, bank_account_info, reason = '', contact_info = null } = {}) {
  if (!bank_account_info) throw Object.assign(new Error('bank_account_info required'), { status: 422 })
  const data = { applyment_id, bank_account_info, reason }
  if (contact_info) data.contact_info = contact_info
  const res = await request.post('/wechat-applyment/core-info/modify', data)
  return _normalizeApplyment(res?.data || res)
}

// 重新提交被驳回的进件
export async function resubmit({ applyment_id } = {}) {
  if (!applyment_id) throw Object.assign(new Error('applyment_id required'), { status: 422 })
  const payload = { applyment_id }
  const res = await request.post('/wechat-applyment/resubmit', JSON.stringify(payload), {
    header: { 'Content-Type': 'application/json' }
  })
  return _normalizeApplyment(res?.data || res)
}

export async function getMerchantInfo({ user_id = null } = {}) {
  try {
    const list = await listApplyments({ user_id, applyment_state: 'APPLYMENT_STATE_FINISHED' })
    const rec = list && list[0] ? list[0] : null
    if (!rec) return null
    return {
      merchant_no: rec.sub_mchid,
      applyment_id: rec.applyment_id,
      subject_type: rec.subject_type,
      subject_info: rec.subject_info,
      bank_account_info: rec.bank_account_info
    }
  } catch {
    return null
  }
}

// 获取已审核通过的商户号列表 -> GET /wechat-applyment/merchant-info
export async function getMerchantInfoList() {
  const res = await request.get('/wechat-applyment/merchant-info')
  const raw = res?.data ?? res
  if (Array.isArray(raw)) return raw
  return raw?.list ?? raw?.data ?? []
}

export default {
  createDraft,
  updateDraft,
  getApplymentById,
  getApplymentConfig,
  listApplyments,
  submitApplyment,
  uploadMedia,
  listMedia,
  modifyCoreInfo,
  resubmit,
  getMerchantInfo,
  getMerchantInfoList
}
