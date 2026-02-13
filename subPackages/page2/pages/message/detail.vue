<template>
	<view class="detail-page">
		<!-- 消息头部 -->
		<view class="message-header">
			<view class="header-icon" :class="'type-' + message.type">
				<text class="iconfont" :class="getTypeIcon(message.type)"></text>
			</view>
			<text class="header-title">{{ message.title }}</text>
			<text class="header-time">{{ message.time }}</text>
		</view>

		<!-- 消息内容 -->
		<view class="message-content">
			<text class="content-text">{{ message.content }}</text>
		</view>

		<!-- 相关信息（仅订单通知显示） -->
		<view class="related-info" v-if="message.relatedInfo && message.type === 'order'">
			<view class="info-title">相关信息</view>
			<view class="info-list">
				<view class="info-item" v-for="(item, key) in message.relatedInfo" :key="key">
					<text class="info-label">{{ item.label }}</text>
					<text class="info-value">{{ item.value }}</text>
				</view>
			</view>
		</view>

		<!-- 操作按钮（仅订单通知显示） -->
		<view class="action-section" v-if="message.actions && message.actions.length > 0 && message.type === 'order'">
			<button
				class="action-btn"
				v-for="(action, index) in message.actions"
				:key="index"
				:class="action.type"
				@tap="handleAction(action)"
			>
				{{ action.text }}
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMessageDetail } from '@/api/message.js'

const message = ref({
	id: 0,
	type: 'system',
	title: '',
	content: '',
	time: '',
	relatedInfo: null,
	actions: []
})

/**
 * 加载消息详情
 */
const loadMessageDetail = async (id) => {
	// 先尝试从API获取消息详情
	try {
		const result = await getMessageDetail(id)
		const apiMessage = result.data || result
		
		if (apiMessage && apiMessage.id) {
			// 如果API返回了消息，使用API的数据
			if (apiMessage.type === 'order') {
				message.value = {
					id: apiMessage.id,
					type: apiMessage.type,
					title: apiMessage.title || '订单通知',
					content: apiMessage.content || apiMessage.message || `您的订单已支付成功！\n\n订单编号：${apiMessage.orderNo || '未知'}\n支付金额：¥${apiMessage.amount || 0}\n支付时间：${apiMessage.time || apiMessage.created_at}\n\n商家正在备货，预计24小时内发货。`,
					time: apiMessage.time || apiMessage.created_at || formatTime(new Date()),
					relatedInfo: {
						orderNo: { label: '订单编号', value: apiMessage.orderNo || '未知' },
						amount: { label: '支付金额', value: `¥${apiMessage.amount || 0}` },
						status: { label: '订单状态', value: '待发货' }
					},
					actions: (apiMessage.orderNo || apiMessage.orderId) ? [
						{ 
							text: '查看订单', 
							type: 'primary', 
							action: 'goOrder', 
							orderNo: apiMessage.orderNo,
							orderId: apiMessage.orderId 
						}
					] : []
				}
			} else {
				// 奖励消息、系统通知、团队通知
				let defaultContent = ''
				if (apiMessage.type === 'reward' && !apiMessage.content && !apiMessage.message) {
					defaultContent = '您有新的奖励到账！\n\n奖励已到账至您的推广费余额，可随时提现。\n\n继续购买商品和推广，获得更多奖励！'
				} else if (apiMessage.type === 'team' && !apiMessage.content && !apiMessage.message) {
					defaultContent = '您的团队有新的动态！\n\n继续邀请好友，扩大您的团队规模，获得更多收益！'
				} else if (apiMessage.type === 'system' && !apiMessage.content && !apiMessage.message) {
					defaultContent = '您有新的系统通知，请查看详情。'
				}
				
				message.value = {
					id: apiMessage.id,
					type: apiMessage.type,
					title: apiMessage.title || '消息通知',
					content: apiMessage.content || apiMessage.message || defaultContent,
					time: apiMessage.time || apiMessage.created_at || formatTime(new Date()),
					relatedInfo: null,
					actions: []
				}
			}
			return
		}
	} catch (apiError) {
		// API调用失败，继续使用本地存储的逻辑
		console.log('[消息详情] API获取失败，使用本地存储:', apiError)
	}
	
	// 尝试从本地存储的消息列表中查找
	const storedMessages = uni.getStorageSync('messageList') || []
	const storedMessage = storedMessages.find(msg => msg.id == id)
	
	if (storedMessage) {
		// 如果找到了，构建详情数据
		if (storedMessage.type === 'order') {
			// 订单通知：显示完整信息
			message.value = {
				id: storedMessage.id,
				type: storedMessage.type,
				title: storedMessage.title,
				content: storedMessage.content || `您的订单已支付成功！\n\n订单编号：${storedMessage.orderNo || '未知'}\n支付金额：¥${storedMessage.amount || 0}\n支付时间：${storedMessage.time}\n\n商家正在备货，预计24小时内发货。`,
				time: storedMessage.time,
				relatedInfo: {
					orderNo: { label: '订单编号', value: storedMessage.orderNo || '未知' },
					amount: { label: '支付金额', value: `¥${storedMessage.amount || 0}` },
					status: { label: '订单状态', value: '待发货' }
				},
				actions: (storedMessage.orderNo || storedMessage.orderId) ? [
					{ 
						text: '查看订单', 
						type: 'primary', 
						action: 'goOrder', 
						orderNo: storedMessage.orderNo,
						orderId: storedMessage.orderId 
					}
				] : []
			}
		} else {
			// 系统通知、团队通知、奖励通知：只显示内容，不显示相关信息
			// 对于奖励消息，如果没有内容，提供默认内容
			let defaultContent = ''
			if (storedMessage.type === 'reward' && !storedMessage.content) {
				defaultContent = '您有新的奖励到账！\n\n奖励已到账至您的推广费余额，可随时提现。\n\n继续购买商品和推广，获得更多奖励！'
			} else if (storedMessage.type === 'team' && !storedMessage.content) {
				defaultContent = '您的团队有新的动态！\n\n继续邀请好友，扩大您的团队规模，获得更多收益！'
			} else if (storedMessage.type === 'system' && !storedMessage.content) {
				defaultContent = '您有新的系统通知，请查看详情。'
			}
			
			message.value = {
				id: storedMessage.id,
				type: storedMessage.type,
				title: storedMessage.title || '消息通知',
				content: storedMessage.content || defaultContent,
				time: storedMessage.time || formatTime(new Date()),
				relatedInfo: null,
				actions: []
			}
		}
		return
	}
	
	// 如果本地没有，使用模拟数据
	const messages = {
		1: {
			id: 1,
			type: 'system',
			title: '系统通知',
			content: '欢迎使用会员商城小程序！\n\n我们为您提供优质的商品和完善的会员体系，购买会员商品即可升级星级，享受更多权益。\n\n推荐好友注册还可获得丰厚奖励，快来体验吧！',
			time: '2024-11-28 10:30',
			relatedInfo: null,
			actions: []
		},
		2: {
			id: 2,
			type: 'order',
			title: '订单已发货',
			content: '您的订单已发货，请注意查收。\n\n物流公司：顺丰速运\n运单号：SF1234567890\n\n预计3-5天送达，请保持手机畅通。',
			time: '2024-11-27 14:20',
			relatedInfo: {
				orderNo: { label: '订单编号', value: '202411280001' },
				amount: { label: '订单金额', value: '¥299.00' },
				logistics: { label: '物流公司', value: '顺丰速运' },
				trackingNo: { label: '运单号', value: 'SF1234567890' }
			},
			actions: [
				{ text: '查看订单', type: 'primary', action: 'goOrder', orderId: 1 },
				{ text: '查看物流', type: 'secondary', action: 'viewLogistics', orderId: 1 }
			]
		},
		3: {
			id: 3,
			type: 'team',
			title: '团队新成员',
			content: '恭喜！您的团队新增了1位成员。\n\n新成员昵称：张三\n加入时间：2024-11-27 09:15\n\n继续邀请好友，扩大您的团队规模，获得更多收益！',
			time: '2024-11-27 09:15',
			relatedInfo: null,
			actions: []
		},
		4: {
			id: 4,
			type: 'reward',
			title: '推广奖励到账',
			content: '恭喜您获得推广奖励！\n\n您推荐的好友"李四"首次购买会员商品，您获得了50%的推广奖励。\n\n奖励金额已到账至您的推广费余额，可随时提现。',
			time: '2024-11-26 16:30',
			relatedInfo: null,
			actions: []
		},
		5: {
			id: 5,
			type: 'system',
			title: '星级升级',
			content: '恭喜您升级为二星店长！\n\n您已成功购买第二份会员商品，星级已升级为二星店长。\n\n现在您可以享受更多权益：\n• 团队奖励覆盖2层\n• 更高的推广奖励比例\n• 专属客服通道\n\n继续购买会员商品，升级更高星级！',
			time: '2024-11-25 11:20',
			relatedInfo: null,
			actions: []
		},
		6: {
			id: 6,
			type: 'reward',
			title: '周补贴发放',
			content: '本周补贴已发放！\n\n根据您的积分，本周获得补贴¥88.00。\n\n补贴已到账至您的推广费余额，可随时提现。\n\n继续购买商品和推广，获得更多积分和补贴！',
			time: '2024-11-24 00:00',
			relatedInfo: null,
			actions: []
		},
		7: {
			id: 7,
			type: 'order',
			title: '订单支付成功',
			content: '您的订单支付成功！\n\n订单编号：202411230002\n支付金额：¥299.00\n支付方式：微信支付\n\n商家正在备货，预计24小时内发货。',
			time: '2024-11-23 15:30',
			relatedInfo: {
				orderNo: { label: '订单编号', value: '202411230002' },
				amount: { label: '支付金额', value: '¥299.00' },
				payType: { label: '支付方式', value: '微信支付' }
			},
			actions: [
				{ text: '查看订单', type: 'primary', action: 'goOrder', orderId: 2 }
			]
		}
	}

	message.value = messages[id] || {
		id: id,
		type: 'system',
		title: '消息详情',
		content: '消息内容加载中...',
		time: '',
		relatedInfo: null,
		actions: []
	}
}

/**
 * 格式化时间
 */
const formatTime = (date) => {
	if (!date) return ''
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	const hours = String(d.getHours()).padStart(2, '0')
	const minutes = String(d.getMinutes()).padStart(2, '0')
	return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 获取类型图标（返回图标类名）
 */
const getTypeIcon = (type) => {
	const icons = {
		system: 'icon-xitongtongzhi',
		order: 'icon-dingdanxiaoxi',
		team: 'icon-tuandui',
		reward: 'icon-hongbao'
	}
	return icons[type] || 'icon-xitongtongzhi'
}

/**
 * 判断是否为图标字体
 */
const isTypeIconFont = () => {
	return true
}

/**
 * 处理操作按钮
 */
const handleAction = (action) => {
	switch (action.action) {
		case 'goHome':
			uni.switchTab({ url: '/pages/home/home' })
			break
		case 'goOrder':
			// 优先使用订单号，如果没有订单号再使用订单ID
			const orderIdentifier = action.orderNo || action.orderId
			if (action.orderNo) {
				uni.navigateTo({ url: `/subPackages/page1/pages/order/detail?orderNo=${encodeURIComponent(action.orderNo)}` })
			} else if (action.orderId) {
				// 如果没有订单号，尝试从本地订单列表查找订单号
				const orderList = uni.getStorageSync('orderList') || []
				const foundOrder = orderList.find(order => order.id === action.orderId || order.orderId === action.orderId)
				if (foundOrder && foundOrder.orderNo) {
					uni.navigateTo({ url: `/subPackages/page1/pages/order/detail?orderNo=${encodeURIComponent(foundOrder.orderNo)}` })
				} else {
					// 如果找不到订单号，使用订单ID（订单详情页会尝试处理）
			uni.navigateTo({ url: `/subPackages/page1/pages/order/detail?id=${action.orderId}` })
				}
			} else {
				uni.showToast({ title: '订单信息不存在', icon: 'none' })
			}
			break
		case 'viewLogistics':
			uni.showToast({ title: '物流查询功能开发中', icon: 'none' })
			break
		case 'goTeam':
			uni.switchTab({ url: '/pages/team/team' })
			break
		case 'goInvite':
			uni.navigateTo({ url: '/subPackages/page1/pages/invite/invite' })
			break
		case 'goReward':
			uni.navigateTo({ url: '/subPackages/page2/pages/reward/reward' })
			break
		case 'goWithdraw':
			uni.navigateTo({ url: '/subPackages/page2/pages/withdraw/withdraw' })
			break
		default:
			uni.showToast({ title: '功能开发中', icon: 'none' })
	}
}

onLoad((options) => {
	if (options.id) {
		loadMessageDetail(options.id)
		
		// 标记消息为已读
		markMessageAsRead(options.id)
	}
})

/**
 * 标记消息为已读
 */
const markMessageAsRead = (id) => {
	const storedMessages = uni.getStorageSync('messageList') || []
	const index = storedMessages.findIndex(msg => msg.id == id)
	
	if (index !== -1 && !storedMessages[index].read) {
		// 标记为已读
		storedMessages[index].read = true
		uni.setStorageSync('messageList', storedMessages)
		
		// 更新未读数量
		const unreadCount = storedMessages.filter(msg => !msg.read).length
		uni.setStorageSync('unreadMessageCount', unreadCount)
		
		console.log('消息已标记为已读，剩余未读:', unreadCount)
		
		// 立即更新TabBar红点
		updateTabBarBadge(unreadCount)
	}
}

/**
 * 更新TabBar红点（消息红点已去掉，仅清除不显示）
 */
const updateTabBarBadge = () => {
	try {
		uni.removeTabBarBadge({ index: 2, fail: () => {} })
	} catch (error) {}
}
</script>

<style scoped>
.detail-page {
	min-height: 100vh;
	background: #f5f5f5;
}

/* 消息头部 */
.message-header {
	background: #fff;
	padding: 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.header-icon {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
}

.type-system {
	background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.type-order {
	background: linear-gradient(135deg, #fff3e0, #ffe0b2);
}

.type-team {
	background: linear-gradient(135deg, #f3e5f5, #e1bee7);
}

.type-reward {
	background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
}

.header-time {
	font-size: 24rpx;
	color: #999;
}

/* 消息内容 */
.message-content {
	background: #fff;
	margin: 20rpx 30rpx;
	border-radius: 16rpx;
	padding: 40rpx 30rpx;
}

.content-text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
	white-space: pre-wrap;
}

/* 相关信息 */
.related-info {
	background: #fff;
	margin: 0 30rpx 20rpx;
	border-radius: 16rpx;
	padding: 30rpx;
}

.info-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 24rpx;
}

.info-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.info-label {
	font-size: 26rpx;
	color: #999;
}

.info-value {
	font-size: 26rpx;
	color: #333;
	font-weight: bold;
}

/* 操作按钮 */
.action-section {
	padding: 0 30rpx 40rpx;
	display: flex;
	gap: 20rpx;
}

.action-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	font-size: 28rpx;
	border-radius: 44rpx;
	border: none;
}

.action-btn.primary {
	background: linear-gradient(135deg, #667eea, #764ba2);
	color: #fff;
}

.action-btn.secondary {
	background: #fff;
	color: #667eea;
	border: 2rpx solid #667eea;
}
</style>
