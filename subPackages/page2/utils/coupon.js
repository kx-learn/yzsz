// 优惠券本地模拟工具（不含后台发放）

const TEMPLATE_KEY = 'couponTemplates'
const USER_COUPON_KEY = 'userCoupons'

const nowTs = () => Date.now()

const oneYearMs = 365 * 24 * 60 * 60 * 1000

const loadTemplates = () => {
  try {
    const stored = uni.getStorageSync(TEMPLATE_KEY)
    if (stored && Array.isArray(stored)) return stored
  } catch (e) { }
  const defaults = [
    {
      id: 1,
      type: 'full_reduction',          // 满减型
      name: '会员商品满 199 减 50',
      url: '',
      useScope: 'vip_only',            // all / vip_only / normal_only
      amount: 50,                      // 减免金额
      minSpend: 199,                   // 满 199 可用
      status: 'active',
      totalBudget: 1000,               // 预算总量
      usedBudget: 0,
      userLimit: 3                     // 单用户最多领取 3 张
    },
    {
      id: 2,
      type: 'no_threshold',            // 无门槛型
      name: '全场无门槛 20 元券',
      url: '',
      useScope: 'all',
      amount: 20,
      minSpend: 0,
      status: 'active',
      totalBudget: 500,
      usedBudget: 0,
      userLimit: 1
    },
    {
      id: 3,
      type: 'full_reduction',
      name: '普通商品满 99 减 10',
      url: '',
      useScope: 'normal_only',
      amount: 10,
      minSpend: 99,
      status: 'active',
      totalBudget: 2000,
      usedBudget: 0,
      userLimit: 5
    },
    {
      id: 4,
      type: 'full_reduction',
      name: '普通商品满 199 减 30',
      url: '',
      useScope: 'normal_only',
      amount: 30,
      minSpend: 199,
      status: 'active',
      totalBudget: 1500,
      usedBudget: 0,
      userLimit: 5
    },
    {
      id: 5,
      type: 'no_threshold',
      name: '会员专享无门槛 30 元券',
      url: '',
      useScope: 'vip_only',
      amount: 30,
      minSpend: 0,
      status: 'active',
      totalBudget: 800,
      usedBudget: 0,
      userLimit: 2
    }
  ]
  uni.setStorageSync(TEMPLATE_KEY, defaults)
  return defaults
}

const saveTemplates = (templates) => {
  uni.setStorageSync(TEMPLATE_KEY, templates)
}

export const loadUserCoupons = () => {
  try {
    const stored = uni.getStorageSync(USER_COUPON_KEY)
    if (stored && Array.isArray(stored)) return stored
  } catch (e) { }
  return []
}

const saveUserCoupons = (list) => {
  uni.setStorageSync(USER_COUPON_KEY, list)
}

export const getCouponTemplates = () => {
  return loadTemplates()
}

export const getUserCouponsByUser = (userId) => {
  const all = loadUserCoupons()
  return all.filter((c) => String(c.userId || '') === String(userId || ''))
}

/**
 * 为当前用户生成几张演示用的「待领取」优惠券
 * 仅在该用户还没有任何优惠券时调用一次
 */
export const ensureDemoCouponsForUser = (userId) => {
  if (!userId) return
  const all = loadUserCoupons()
  const exists = all.some((c) => String(c.userId || '') === String(userId))
  if (exists) return

  const templates = loadTemplates().filter(t => t.status === 'active')
  const now = nowTs()

  const newCoupons = templates.map((tpl) => ({
    id: `${userId}_${tpl.id}_${now}`,
    templateId: tpl.id,
    userId,
    status: 'pending', // 待领取
    issuedAt: now,
    claimedAt: null,
    validFrom: null,
    validTo: null
  }))

  const next = [...all, ...newCoupons]
  saveUserCoupons(next)
}

/**
 * 用户领取某张优惠券实例（状态从 pending -> claimed，设置 1 年有效期）
 */
export const claimUserCoupon = (couponId, userId) => {
  const all = loadUserCoupons()
  const idx = all.findIndex((c) => c.id === couponId && String(c.userId || '') === String(userId || ''))
  if (idx === -1) {
    throw new Error('优惠券不存在')
  }
  const coupon = all[idx]
  if (coupon.status !== 'pending') {
    throw new Error('该优惠券已领取或已失效')
  }

  // 限制：模板预算 & 单用户领取上限
  const templates = loadTemplates()
  const tIndex = templates.findIndex((t) => t.id === coupon.templateId)
  if (tIndex === -1) {
    throw new Error('优惠券模板不存在')
  }
  const tpl = templates[tIndex]

  if (tpl.totalBudget && tpl.usedBudget >= tpl.totalBudget) {
    throw new Error('该优惠券已发放完毕')
  }

  const userCouponsOfTpl = all.filter(
    (c) => c.templateId === coupon.templateId && String(c.userId || '') === String(userId || '')
  )
  if (tpl.userLimit && userCouponsOfTpl.length >= tpl.userLimit) {
    throw new Error('已达到该券单用户领取上限')
  }

  const now = nowTs()
  coupon.status = 'claimed'
  coupon.claimedAt = now
  coupon.validFrom = now
  coupon.validTo = now + oneYearMs

  all[idx] = coupon
  saveUserCoupons(all)

  // 同时更新模板预算使用量（仅本地）
  tpl.usedBudget = (tpl.usedBudget || 0) + 1
  templates[tIndex] = tpl
  saveTemplates(templates)

  return coupon
}

export const mapCouponWithTemplate = (coupon) => {
  // 如果优惠券自带了模板快照（管理员发放的），直接使用快照
  if (coupon.snapshot) {
    return {
      ...coupon,
      template: coupon.snapshot
    }
  }
  const templates = loadTemplates()
  const tpl = templates.find((t) => t.id === coupon.templateId)
  return {
    ...coupon,
    template: tpl || null
  }
}

export const getCouponStatusText = (coupon) => {
  const now = nowTs()
  if (coupon.status === 'used') return '已使用'
  if (coupon.status === 'expired' || (coupon.validTo && now > coupon.validTo)) return '已失效'
  if (coupon.status === 'pending') return '待领取'
  if (coupon.status === 'claimed') return '已领取'
  return '未知'
}

/**
 * 管理员发放优惠券给指定用户
 * @param {string} userId - 用户ID
 * @param {Object} config - 优惠券配置 { type, name, amount, minSpend, useScope }
 */
export const distributeCouponToUser = (userId, config) => {
  if (!userId) throw new Error('请输入用户ID')

  const all = loadUserCoupons()
  const now = nowTs()

  // 创建一个临时的模板ID用于关联（或者直接作为独立优惠券）
  const tempTemplateId = `DIST_${now}`

  // 构造优惠券对象
  const newCoupon = {
    id: `COUPON_${userId}_${now}`,
    templateId: tempTemplateId,
    userId: String(userId),
    status: 'claimed', // 直接发放即为已领取
    issuedAt: now,
    claimedAt: now,
    validFrom: now,
    validTo: now + oneYearMs, // 1年有效期
    snapshot: {
      id: tempTemplateId,
      type: config.type, // 'full_reduction' | 'no_threshold'
      name: config.name,
      useScope: config.useScope, // 'vip_only' | 'normal_only' | 'all'
      amount: Number(config.amount),
      minSpend: Number(config.minSpend || 0)
    }
  }

  const next = [...all, newCoupon]
  saveUserCoupons(next)
  return newCoupon
}


