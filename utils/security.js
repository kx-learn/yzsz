/**
 * 内容安全检测工具
 *
 * 调用后端 /api/security/msg-sec-check 接口，
 * 后端代理微信 msgSecCheck API 对用户生成内容进行安全检测。
 *
 * 场景（scene）说明：
 *   1 - 资料（昵称、简介等个人资料）
 *   2 - 评论（商品评价、留言等）
 *   3 - 论坛（社区帖子等）
 *   4 - 社交日志（聊天消息等）
 */

import request from '@/utils/request.js'

/**
 * 检测文本内容是否合规
 *
 * @param {string} content - 待检测的文本内容
 * @param {object} options - 可选配置
 * @param {number} options.scene - 场景值：1=资料, 2=评论, 3=论坛, 4=社交日志
 * @param {string} options.openid - 用户 openid（通常由后端从 token 解析，可不传）
 * @param {boolean} options.silent - 是否静默处理（true 时不弹 toast，由调用方自行处理）
 * @returns {Promise<{pass: boolean, message: string}>}
 *
 * @example
 * // 检测昵称
 * const result = await checkContentSecurity(newNickname, { scene: 1 })
 * if (!result.pass) {
 *   uni.showToast({ title: result.message, icon: 'none' })
 *   return
 * }
 *
 * @example
 * // 静默检测，自行处理
 * const result = await checkContentSecurity(message, { scene: 4, silent: true })
 * if (!result.pass) {
 *   return false
 * }
 */
export async function checkContentSecurity(content, options = {}) {
  // 空内容直接放行
  if (!content || (typeof content === 'string' && !content.trim())) {
    return { pass: true, message: '空内容无需检测' }
  }

  const { scene = 1, openid = undefined, silent = false } = options

  try {
    const res = await request.post('/api/security/msg-sec-check', {
      content: content.trim(),
      scene: scene,
      openid: openid
    })

    // 解析响应（兼容多种格式）
    const data = (res && (res.data || res)) || {}
    const pass = data.pass !== false  // 默认放行（兼容旧接口）
    const message = data.message || (pass ? '内容合规' : '内容含有违规信息，请修改后重试')

    if (!pass && !silent) {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2500
      })
    }

    return { pass, message }
  } catch (error) {
    console.error('[内容安全检测] 接口调用失败，降级放行:', error)
    // 检测接口失败时降级放行，避免阻塞正常业务流程
    // 生产环境应监控此降级行为
    return { pass: true, message: '检测服务不可用，降级放行' }
  }
}

/**
 * 快速检测并提示（一步完成检测+提示）
 *
 * @param {string} content - 待检测的文本内容
 * @param {object} options - 可选配置（同 checkContentSecurity）
 * @returns {Promise<boolean>} 是否通过检测
 *
 * @example
 * // 在提交前检测
 * const ok = await quickCheck(message, { scene: 4 })
 * if (!ok) return  // 不通过时已自动提示用户
 * // 继续提交逻辑...
 */
export async function quickCheck(content, options = {}) {
  // 空内容直接放行
  if (!content || (typeof content === 'string' && !content.trim())) {
    return true
  }
  const result = await checkContentSecurity(content, { ...options, silent: false })
  return result.pass
}

/**
 * 场景常量
 */
export const SECURITY_SCENE = {
  PROFILE: 1,    // 资料（昵称、简介）
  COMMENT: 2,    // 评论（评价、留言）
  FORUM: 3,      // 论坛（帖子）
  SOCIAL: 4,     // 社交日志（聊天消息）
}

export default {
  checkContentSecurity,
  quickCheck,
  SECURITY_SCENE
}
