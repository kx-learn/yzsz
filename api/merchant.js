/**
 * 模拟商户实名认证相关后端接口（占位）
 * 全部使用 console.log 占位输出："api代码为调用，...前端运行正常"
 */

import request from '@/utils/request.js'

// 模拟文件上传（前端占位）
export const uploadImage = async (filePath) => {
  console.log('api代码为调用，上传图片，前端运行正常', filePath)
  // 占位：在真实场景这里会上传到对象存储并返回 URL
  return new Promise((resolve) => {
    setTimeout(() => resolve({ url: filePath }), 300)
  })
}

// 人脸活体检测占位（对接权威人脸识别接口）
export const faceVerify = async (faceImagePath) => {
  console.log('api代码为调用，进行人脸活体检测，前端运行正常', faceImagePath)
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), 800)
  })
}

// 个人实名校验：对接公安库（占位实现）
export const verifyPersonal = async (data) => {
  console.log('api代码为调用，校验个人身份证，前端运行正常', JSON.parse(JSON.stringify(data)))
  return new Promise((resolve) => {
    setTimeout(() => {
      // 简单规则：姓名包含“测试”或证件号长度不为15/18视为无效
      if (!data.name || !data.id) {
        resolve({ valid: false, reason: '姓名或证件号不能为空' })
        return
      }
      const id = String(data.id || '')
      if (!(id.length === 15 || id.length === 18)) {
        resolve({ valid: false, reason: '证件号格式不正确' })
        return
      }
      if (/测试|fake|虚假/.test(data.name)) {
        resolve({ valid: false, reason: '疑似虚假姓名，请核对后重试' })
        return
      }
      // 通过
      resolve({ valid: true })
    }, 600)
  })
}

// 企业实名认证校验（对接工商API，占位实现）
export const verifyEnterprise = async (data) => {
  console.log('api代码为调用，校验企业营业执照，前端运行正常', JSON.parse(JSON.stringify(data)))
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!data.company_name || !data.credit_code) {
        resolve({ valid: false, reason: '企业名称或统一社会信用代码不能为空' })
        return
      }
      const code = String(data.credit_code || '')
      if (code.length !== 18) {
        resolve({ valid: false, reason: '统一社会信用代码格式不正确' })
        return
      }
      if (/测试|fake|虚假/.test(data.company_name)) {
        resolve({ valid: false, reason: '疑似虚假企业名称，请核对后重试' })
        return
      }
      // 通过
      resolve({ valid: true })
    }, 800)
  })
}

// 创建或提交微信进件草稿（对接后端 /wechat-applyment/draft）
// data 结构：applyment_id(新建为0)、subject_type、subject_info、contact_info、bank_account_info、business_category_locked
// token: 可选，若传入则会覆盖本地存储的 token（便于调试或使用临时 token）
export const createWechatApplymentDraft = async (data, token) => {
  const options = {}
  if (token) {
    options.header = { Authorization: 'Bearer ' + token }
  }
  const payload = {
    applyment_id: data?.applyment_id ?? 0,
    subject_type: data?.subject_type || 'SUBJECT_TYPE_INDIVIDUAL',
    subject_info: data?.subject_info ?? {},
    contact_info: data?.contact_info ?? {},
    bank_account_info: data?.bank_account_info ?? {},
    business_category_locked: data?.business_category_locked ?? false,
    ...data
  }
  options.header = { 'Content-Type': 'application/json', ...options.header }
  return request.post('/wechat-applyment/draft', JSON.stringify(payload), options)
}

// 提交进件申请（对接后端 /wechat-applyment/submit）
export const submitWechatApplyment = async (data, token) => {
  const options = { header: { 'Content-Type': 'application/json' } }
  if (token) {
    options.header.Authorization = 'Bearer ' + token
  }
  const payload = typeof data === 'object' && data !== null ? data : {}
  return request.post('/wechat-applyment/submit', JSON.stringify(payload), options)
}

// 查询进件状态（对接后端 /wechat-applyment/status）
export const getWechatApplymentStatus = async (applymentId, token) => {
  const options = {}
  if (token) {
    options.header = { Authorization: 'Bearer ' + token }
  }
  return request.get(`/wechat-applyment/status?applyment_id=${applymentId}`, {}, options)
}

// 上传进件材料（对接后端 /wechat-applyment/media/upload）
export const uploadWechatApplymentMedia = async (file, mediaType, applymentId, token) => {
  const options = {}
  if (token) {
    options.header = { Authorization: 'Bearer ' + token }
  }
  // 如果是文件路径，需要先上传到服务器获取URL
  const formData = {
    file: file.url || file,
    media_type: mediaType,
    applyment_id: applymentId
  }
  return request.post('/wechat-applyment/media/upload', formData, options)
}

// 修改核心信息（对接后端 /wechat-applyment/core-info/modify）
export const modifyWechatApplymentCoreInfo = async (data, token) => {
  const options = { header: { 'Content-Type': 'application/json' } }
  if (token) {
    options.header.Authorization = 'Bearer ' + token
  }
  const payload = typeof data === 'object' && data !== null ? data : {}
  return request.post('/wechat-applyment/core-info/modify', JSON.stringify(payload), options)
}

// 重新提交被驳回的进件（对接后端 /wechat-applyment/resubmit）
export const resubmitWechatApplyment = async (applymentId, token) => {
  const options = { header: { 'Content-Type': 'application/json' } }
  if (token) {
    options.header.Authorization = 'Bearer ' + token
  }
  return request.post('/wechat-applyment/resubmit', JSON.stringify({ applyment_id: applymentId }), options)
}

export default {
  uploadImage,
  faceVerify,
  verifyPersonal,
  verifyEnterprise,
  createWechatApplymentDraft,
  submitWechatApplyment,
  getWechatApplymentStatus,
  uploadWechatApplymentMedia,
  modifyWechatApplymentCoreInfo,
  resubmitWechatApplyment
}
