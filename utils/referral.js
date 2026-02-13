// 推荐关系与收款码本地辅助工具
// 说明：
// - 这里只做前端本地模拟绑定，真正的绑定关系以后由后端根据这些信息落库

const PENDING_REFERRER_KEY = 'pendingReferrer'   // 通过扫码等方式暂存的推荐人

/**
 * 保存扫码进入小程序时携带的推荐信息
 * @param {{ referrerId?: string|number, referralCode?: string, source?: 'qrcode'|'code' }} payload
 */
export const savePendingReferrer = (payload = {}) => {
	try {
		const data = {
			referrerId: payload.referrerId || null,
			referralCode: payload.referralCode || '',
			source: payload.source || 'qrcode',
			createdAt: Date.now()
		}
		uni.setStorageSync(PENDING_REFERRER_KEY, data)
	} catch (e) {
		console.error('保存待绑定推荐人失败', e)
	}
}

export const getPendingReferrer = () => {
	try {
		return uni.getStorageSync(PENDING_REFERRER_KEY) || null
	} catch (e) {
		return null
	}
}

export const clearPendingReferrer = () => {
	try {
		uni.removeStorageSync(PENDING_REFERRER_KEY)
	} catch (e) {
		console.error('清理待绑定推荐人失败', e)
	}
}

/**
 * 为当前用户生成或读取本地推荐码
 * 真正的推荐码以后可以由后端下发，这里先做前端占位
 */
export const getOrCreateLocalReferralCode = (userId) => {
	if (!userId) return ''
	const key = `referralCode_${userId}`
	try {
		let code = uni.getStorageSync(key)
		if (!code) {
			const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
			let tmp = ''
			for (let i = 0; i < 6; i++) {
				tmp += chars.charAt(Math.floor(Math.random() * chars.length))
			}
			code = tmp
			uni.setStorageSync(key, code)
		}
		return code
	} catch (e) {
		console.error('获取本地推荐码失败', e)
		return ''
	}
}

/**
 * 在拿到用户信息后尝试做一次本地推荐关系绑定
 * 规则：
 * 1. 若 user 已经有 referrer_id，直接跳过；
 * 2. 优先使用扫码得到的 referrerId 进行绑定；
 * 3. 其次使用登录时填写的邀请码（inviteCode），这里只记录在本地字段，不反推具体上级ID；
 */
export const bindReferrerIfNeeded = (user) => {
	if (!user) return user

	// 已经有上级则不再处理（后端真实绑定优先）
	if (user.referrer_id) {
		return user
	}

	let updated = { ...user }
	let bound = false

	// 1. 先看是否有扫码得到的推荐人
	const pending = getPendingReferrer()
	if (pending && pending.referrerId && String(pending.referrerId) !== String(user.id)) {
		updated.referrer_id = pending.referrerId
		updated.referrer_source = pending.source || 'qrcode'
		updated.referrer_bind_time = Date.now()
		bound = true
		clearPendingReferrer()
	}

	// 2. 若还未绑定，再看登录时保存的邀请码
	if (!bound) {
		try {
			const inviteCode = uni.getStorageSync('inviteCode') || ''
			if (inviteCode) {
				updated.referrer_code = inviteCode
				updated.referrer_source = 'code'
				updated.referrer_bind_time = Date.now()
				bound = true
			}
		} catch (e) {
			console.error('读取本地邀请码失败', e)
		}
	}

	// 同步回本地 userInfo，供后续页面展示
	if (bound) {
		try {
			uni.setStorageSync('userInfo', updated)
		} catch (e) {
			console.error('保存绑定后的用户信息失败', e)
		}
	}

	return updated
}

/**
 * 生成收款码 / 推荐码跳转用的 query 字符串
 * 约定：
 * - referrerId 用于 1 级直推绑定（扫码支付场景）
 * - referralCode 用于推荐码注册场景
 */
export const buildReferralQuery = (userId) => {
	const referralCode = getOrCreateLocalReferralCode(userId)
	return {
		referrerId: userId,
		referralCode
	}
}


