/**
 * 模拟商户实名认证相关后端接口（子包拷贝，占位）
 * 全部使用 console.log 占位输出："api代码为调用，...前端运行正常"
 */

import request from '@/utils/request.js'

// 模拟文件上传（前端占位）
export const uploadImage = async (filePath) => {
  console.log('api代码为调用，上传图片，前端运行正常', filePath)
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
      resolve({ valid: true })
    }, 800)
  })
}

export default {
  uploadImage,
  faceVerify,
  verifyPersonal,
  verifyEnterprise
}
