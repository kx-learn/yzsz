/**
 * 商家侧本地数据中心
 * 负责维护积分、订单、库存、财务、配送配置等信息
 */

import { getPointsBalance } from '@/api/points.js'

const STORAGE_KEY = 'merchantData'

const defaultData = {
	points: 0,
	pointsLogs: [],
	notifications: [],
	orders: [],
	stats: {
		todayOrders: 0,
		todayCustomers: 0,
		lastStatsDate: ''
	},
	finance: {
		balance: 0,
		todayIncome: 0,
		monthIncome: 0,
		totalIncome: 0,
		frozen: 0,
		lastIncomeDate: '',
		lastIncomeMonth: '',
		records: []
	},
	inventory: [],
	delivery: {
		defaultFee: 0,
		minOrderAmount: 0,
		maxDistance: 0,
		freeShippingEnabled: false,
		freeShippingAmount: 0,
		freeShippingRegions: [],
		distanceBasedEnabled: false,
		distanceRules: [],
		regionBasedEnabled: false,
		regionRules: [],
		remoteAreaEnabled: false,
		remoteAreaRegions: [],
		remoteAreaFee: 0,
		disabledRegions: []
	}
}

const getTodayStr = () => {
	const now = new Date()
	return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

const getMonthStr = () => {
	const now = new Date()
	return `${now.getFullYear()}-${now.getMonth() + 1}`
}

const formatDateTime = (timestamp = Date.now()) => {
	const date = new Date(timestamp)
	const pad = (num) => String(num).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const getMerchantData = () => {
	const stored = uni.getStorageSync(STORAGE_KEY)
	if (stored) {
		return stored
	}
	uni.setStorageSync(STORAGE_KEY, defaultData)
	return { ...defaultData }
}

const saveMerchantData = (data) => {
	uni.setStorageSync(STORAGE_KEY, data)
	return data
}

export const updateMerchantData = (updater) => {
	const data = getMerchantData()
	const nextData = updater ? updater({ ...data }) : data
	return saveMerchantData(nextData)
}

// 保留函数名以兼容旧代码，但不再覆盖商家积分（商家积分只来源于卖货记录）
export const syncMerchantPointsFromApi = async () => {
	return getMerchantData()
}

export const setMerchantPoints = (points) => {
	return updateMerchantData((data) => {
		data.points = Number((points || 0).toFixed(2))
		return data
	})
}

export const ensureMerchantOrder = (orderPayload) => {
	return updateMerchantData((data) => {
		const existsIndex = data.orders.findIndex((item) => item.id === orderPayload.id)
		if (existsIndex > -1) {
			data.orders[existsIndex] = { ...data.orders[existsIndex], ...orderPayload }
		} else {
			data.orders.unshift(orderPayload)
		}
		return data
	})
}

const appendNotification = (data, message) => {
	data.notifications.unshift({
		id: Date.now(),
		message,
		time: formatDateTime()
	})
	if (data.notifications.length > 20) {
		data.notifications.pop()
	}
}

const appendFinanceRecord = (data, amount, order) => {
	data.finance.records.unshift({
		id: Date.now(),
		type: 'income',
		title: '订单收入',
		amount: Number(amount).toFixed(2),
		time: formatDateTime(),
		status: '已到账',
		orderId: order.id
	})
	if (data.finance.records.length > 100) {
		data.finance.records.pop()
	}
}

const appendPointsLog = (data, points, order) => {
	data.pointsLogs.unshift({
		id: Date.now(),
		changeAmount: Number(points).toFixed(2),
		reason: `订单 ${order.orderNo} 销售奖励（20%）`,
		relatedOrder: order.orderNo,
		createdAt: formatDateTime()
	})
	if (data.pointsLogs.length > 100) {
		data.pointsLogs.pop()
	}
}

const ensureInventoryEntry = (data, product) => {
	const idx = data.inventory.findIndex((item) => item.id === product.id)
	if (idx === -1) {
		data.inventory.push({
			id: product.id,
			name: product.name,
			sku: product.sku || `SKU-${product.id}`,
			stock: 0,
			minStock: 10,
			unit: '件',
			image: product.image || '/static/product1.jpg'
		})
	}
}

export const recordMerchantSale = (order) => {
	const amount = Number(order.actualAmount || order.totalAmount || 0)
	// 商家积分增长：商品原价的1/5（不是实付的1/5）
	// 优先使用productTotal（商品原价），如果没有则使用totalAmount（订单总价），最后才用实付金额
	const originalAmount = Number(order.productTotal || order.totalAmount || amount)
	const pointsEarned = Number((originalAmount * 0.2).toFixed(2))
	
	console.log('商家积分计算:', {
		productTotal: order.productTotal,
		totalAmount: order.totalAmount,
		actualAmount: order.actualAmount,
		originalAmount,
		pointsEarned
	})

	return updateMerchantData((data) => {
		// 积分
		data.points = Number((data.points + pointsEarned).toFixed(2))
		appendPointsLog(data, pointsEarned, order)

		// 财务
		// 今日销售应该增加商品原价的80%
		const todaySalesAmount = Number((originalAmount * 0.8).toFixed(2))
		
		data.finance.balance = Number((data.finance.balance + amount).toFixed(2))
		data.finance.totalIncome = Number((data.finance.totalIncome + amount).toFixed(2))

		const todayStr = getTodayStr()
		const monthStr = getMonthStr()

		// 今日销售使用商品原价的80%
		if (data.finance.lastIncomeDate === todayStr) {
			data.finance.todayIncome = Number((data.finance.todayIncome + todaySalesAmount).toFixed(2))
		} else {
			data.finance.todayIncome = todaySalesAmount
			data.finance.lastIncomeDate = todayStr
		}
		
		console.log('今日销售计算:', {
			originalAmount,
			todaySalesAmount,
			actualAmount: amount
		})

		if (data.finance.lastIncomeMonth === monthStr) {
			data.finance.monthIncome = Number((data.finance.monthIncome + amount).toFixed(2))
		} else {
			data.finance.monthIncome = amount
			data.finance.lastIncomeMonth = monthStr
		}

		appendFinanceRecord(data, amount, order)

		// 订单：如果订单状态是paid，则更新为paid；否则保持原状态或设为pending
		const orderIndex = data.orders.findIndex((item) => item.id === order.id)
		const baseOrder = {
			id: order.id,
			orderNo: order.orderNo,
			status: order.status || 'pending', // 使用订单传入的状态
			customerName: order.customerName || order.address?.name || '客户',
			customerPhone: order.customerPhone || order.address?.phone || '',
			totalAmount: order.totalAmount || amount,
			actualAmount: order.actualAmount || amount,
			createTime: order.createTime || formatDateTime(),
			products: order.products || [],
			address: order.address,
			distance: order.distance || order.address?.distanceKm || null
		}
		if (orderIndex > -1) {
			// 如果订单已存在，更新状态（如果新状态是paid，则更新为paid）
			const newStatus = order.status === 'paid' ? 'paid' : (data.orders[orderIndex].status === 'paid' ? 'paid' : baseOrder.status)
			data.orders[orderIndex] = { ...data.orders[orderIndex], ...baseOrder, status: newStatus }
		} else {
			data.orders.unshift(baseOrder)
		}

		// 库存
		if (Array.isArray(order.products)) {
			order.products.forEach((product) => {
				ensureInventoryEntry(data, product)
				const idx = data.inventory.findIndex((item) => item.id === product.id)
				if (idx > -1) {
					data.inventory[idx].stock = Math.max(
						0,
						Number(data.inventory[idx].stock) - Number(product.quantity || 1)
					)
				}
			})
		}

		appendNotification(data, `订单${order.orderNo}已支付，预计获得积分 +${pointsEarned}`)
		
		// 更新今日订单数和新增客户数
		if (!data.stats) {
			data.stats = {
				todayOrders: 0,
				todayCustomers: 0,
				lastStatsDate: ''
			}
		}
		
		if (data.stats.lastStatsDate === todayStr) {
			data.stats.todayOrders = (data.stats.todayOrders || 0) + 1
		} else {
			data.stats.todayOrders = 1
			data.stats.todayCustomers = 0 // 重置今日新增客户数
			data.stats.lastStatsDate = todayStr
		}
		
		// 检查是否为新客户（简单判断：如果订单中没有该客户的其他订单，则视为新客户）
		const existingCustomerOrders = data.orders.filter(o => 
			o.customerPhone === (order.customerPhone || order.address?.phone) && 
			o.id !== order.id
		)
		if (existingCustomerOrders.length === 0) {
			data.stats.todayCustomers = (data.stats.todayCustomers || 0) + 1
		}
		
		console.log('统计更新:', {
			todayOrders: data.stats.todayOrders,
			todayCustomers: data.stats.todayCustomers
		})
		
		return data
	})
}

export const getMerchantNotifications = () => {
	return getMerchantData().notifications || []
}

export const clearMerchantNotifications = () => {
	return updateMerchantData((data) => {
		data.notifications = []
		return data
	})
}

export const getMerchantOrders = () => {
	// 从本地存储获取商家订单数据（仅作为缓存）
	const merchantData = getMerchantData()
	return merchantData.orders || []
}

export const updateMerchantOrderStatus = (orderId, status) => {
	// 更新商家订单状态
	const result = updateMerchantData((data) => {
		const idx = data.orders.findIndex((item) => item.id === orderId)
		if (idx > -1) {
			data.orders[idx].status = status
			appendNotification(data, `订单${data.orders[idx].orderNo}状态更新为${status}`)
		}
		return data
	})
	
	// 订单状态更新后，数据会通过 API 同步，不再依赖本地存储
	
	return result
}

export const getMerchantFinance = () => {
	return getMerchantData().finance
}

export const getMerchantInventory = () => {
	return getMerchantData().inventory
}

export const updateMerchantInventory = (newInventory) => {
	return updateMerchantData((data) => {
		data.inventory = newInventory
		return data
	})
}

export const getMerchantPointsLogs = () => {
	return getMerchantData().pointsLogs || []
}

export const getDeliverySettings = () => {
	return getMerchantData().delivery || { ...defaultData.delivery }
}

export const saveDeliverySettings = (settings) => {
	return updateMerchantData((data) => {
		data.delivery = { ...data.delivery, ...settings }
		return data
	})
}

export const evaluateDeliveryForAddress = (address, orderAmount = 0) => {
	const settings = getDeliverySettings()
	if (!address) {
		return { allowed: false, reason: '请选择收货地址', fee: 0, distance: 0 }
	}

	const regionText = `${address.province || ''}${address.city || ''}${address.district || ''}`
	const disabled = (settings.disabledRegions || []).some((region) => regionText.includes(region))
	const distance = address.distanceKm ?? 0
	const maxDistance = Number(settings.maxDistance || 0)
	const overDistance = maxDistance > 0 && distance > maxDistance

	if (disabled) {
		return { allowed: false, reason: '该地址不在商家配送范围', fee: 0, distance }
	}
	if (overDistance) {
		return { allowed: false, reason: `超出商家配送范围（${distance}km / ${maxDistance}km）`, fee: 0, distance }
	}

	let fee = Number(settings.defaultFee || 0)

	if (settings.freeShippingEnabled && orderAmount >= settings.freeShippingAmount) {
		fee = 0
	}

	if (settings.distanceBasedEnabled) {
		const matchedRule = (settings.distanceRules || []).find(
			(rule) => distance >= Number(rule.minDistance || 0) && distance <= Number(rule.maxDistance || 0)
		)
		if (matchedRule) {
			fee = Number(matchedRule.fee || 0)
		}
	}

	if (settings.regionBasedEnabled) {
		const regionRule = (settings.regionRules || []).find((rule) =>
			regionText.includes(rule.regionName || '')
		)
		if (regionRule) {
			fee = Number(regionRule.fee || fee)
		}
	}

	if (settings.remoteAreaEnabled) {
		const remote = (settings.remoteAreaRegions || []).some((region) => regionText.includes(region))
		if (remote) {
			fee += Number(settings.remoteAreaFee || 0)
		}
	}

	return { allowed: true, reason: '', fee: Number(fee.toFixed(2)), distance }
}

export const computeMerchantSummary = () => {
	const data = getMerchantData()
	const orders = data.orders || []
	
	// 使用finance中的todayIncome（商品原价的80%）
	const todaySales = Number(data.finance?.todayIncome || 0)
	
	// 使用stats中的今日订单和新增客户数
	const todayOrders = data.stats?.todayOrders || 0
	const todayCustomers = data.stats?.todayCustomers || 0

	return {
		todaySales: Number(todaySales.toFixed(2)),
		todayOrders: todayOrders,
		todayCustomers: todayCustomers,
		recentOrders: orders.slice(0, 5).map((order) => ({
			...order,
			amount: order.actualAmount || order.totalAmount || 0
		}))
	}
}

