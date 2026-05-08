/**
 * 公益相关配置
 */

export const CHARITY_CONFIG = {
  // 公益比例；基数为 (券前总价 - 积分抵扣)
  contributionRate: 0.01,
  
  // 播报消息刷新间隔（毫秒）
  noticeInterval: 3000,
  
  // 会员商品最低购买等级（1星及以上）
  minBuyLevel: 1,
  
  // 公益播报消息模板
  noticeTemplates: [
    '本月已有 ¥{amount} 用于公益事业',
    '感谢您的贡献，已帮助 {count} 个家庭',
    '最新公益项目：{project}',
    '您的每一笔订单都在为公益事业贡献力量',
    '累计公益捐赠：¥{total}，让爱心传递'
  ]
}

/**
 * 计算订单公益贡献金额（直接对传入基数按比例）
 */
export const calculateCharityAmount = (orderAmount) => {
  return (parseFloat(orderAmount) * CHARITY_CONFIG.contributionRate).toFixed(4)
}

/**
 * 公益金额 = (总价 - 积分抵扣) × contributionRate
 * @param {number|string} totalAmount 总价（元），券前含运费
 * @param {number|string} [pointsDiscount=0] 积分抵扣金额（元）
 */
export const calculateCharityFromTotalMinusPoints = (totalAmount, pointsDiscount = 0) => {
  const total = parseFloat(totalAmount) || 0
  const points = parseFloat(pointsDiscount) || 0
  const base = Math.max(0, total - points)
  return (base * CHARITY_CONFIG.contributionRate).toFixed(4)
}

/**
 * 获取公益播报消息
 * @param {Number} balance 公益基金余额（可选）
 */
export const getCharityNotices = async (balance = null) => {
  // 从API获取实时数据
  try {
    const notices = []
    
    // 如果有余额，添加余额相关的播报
    if (balance !== null && balance !== undefined) {
      const balanceNum = Number(balance)
      if (!isNaN(balanceNum) && balanceNum > 0) {
        notices.push(`累计公益基金余额：¥${balanceNum.toFixed(4)}`)
      }
    }
    
    // 从本地存储读取管理员设置的播报
    const stored = uni.getStorageSync('charityNotices') || []
    if (stored.length > 0) {
      notices.push(...stored)
    }
    
    // 如果没有其他播报，添加默认播报
    if (notices.length === 0) {
      notices.push('您的每一笔订单都在为公益事业贡献力量')
    }
    
    return notices
  } catch (error) {
    console.error('获取公益播报失败:', error)
    return ['您的每一笔订单都在为公益事业贡献力量']
  }
}
