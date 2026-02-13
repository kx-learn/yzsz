/**
 * 用户等级/称号统一管理工具
 * 确保个人中心和团队页面称号显示一致
 */

/**
 * 获取等级图标
 * @param {Number} level 等级 0-7
 * @returns {String} 图标
 */
export const getLevelIcon = (level) => {
	// 使用999图标字体，返回图标类名
	const iconClasses = ['icon-wode', 'icon-huangguan', 'icon-huangguan', 'icon-huangguan', 'icon-huangguan', 'icon-huangguan', 'icon-huangguan', 'icon-huangguan']
	return iconClasses[level] || 'icon-wode'
}

/**
 * 获取等级图标是否为图标字体（用于判断是否需要添加iconfont类）
 */
export const isLevelIconFont = () => {
	return true
}

/**
 * 获取等级文本（称号）
 * @param {Number} level 等级 0-7
 * @returns {String} 称号文本
 */
export const getLevelText = (level) => {
	const texts = ['普通用户', '一星店长', '二星店长', '三星店长', '四星店长', '五星店长', '六星店长', '荣誉董事']
	return texts[level] || '普通用户'
}

/**
 * 获取等级名称数组
 */
export const getLevelNames = () => {
	return ['普通用户', '一星店长', '二星店长', '三星店长', '四星店长', '五星店长', '六星店长', '荣誉董事']
}

/**
 * 根据等级获取奖励比例
 * @param {Number} level 等级
 * @returns {Number} 奖励比例（百分比）
 */
export const getRewardRateByLevel = (level) => {
	// 所有等级统一保持50%奖励比例
	return 50
}

/**
 * 获取用户等级信息对象
 * @param {Number} level 等级
 * @returns {Object} 等级信息对象
 */
export const getUserLevelInfo = (level) => {
	return {
		level: level || 0,
		name: getLevelText(level || 0),
		icon: getLevelIcon(level || 0),
		rewardRate: getRewardRateByLevel(level || 0)
	}
}

