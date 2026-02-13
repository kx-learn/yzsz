<template>
	<view class="category-list-page">
		<view class="message-list">
			<view 
				class="message-item" 
				v-for="item in filteredMessages" 
				:key="item.id" 
				@tap="viewMessageDetail(item)"
			>
				<view class="message-icon" :class="'type-' + item.type">
					<text class="iconfont" :class="getTypeIcon(item.type)"></text>
				</view>
				<view class="message-content">
					<view class="message-top">
						<text class="message-title">{{ item.title }}</text>
						<text class="message-time">{{ item.time }}</text>
					</view>
					<text class="message-desc">{{ item.content }}</text>
				</view>
				<view class="message-badge" v-if="!item.read"></view>
			</view>

			<!-- 空状态 -->
			<view class="empty-state" v-if="filteredMessages.length === 0">
				<text class="empty-icon iconfont icon-xiaoxi"></text>
				<text class="empty-text">暂无{{ categoryTitle }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { markAsRead, getUnreadCount, getMessageList } from '@/api/message.js'
import { getSystemSentences } from '@/api/system.js'
import { getAllPointsFlows } from '@/api/reports.js'

const messageType = ref('')
const categoryTitle = ref('')
const messageList = ref([])

/**
 * 筛选当前类型的消息
 */
const filteredMessages = computed(() => {
	return messageList.value.filter(msg => msg.type === messageType.value)
})

/**
 * 获取类型图标（返回图标类名）
 */
const getTypeIcon = (type) => {
	const icons = {
		system: 'icon-xitongtongzhi',
		order: 'icon-dingdanxiaoxi',
		team: 'icon-tuanduixiaoxi_24',
		reward: 'icon-jianglixiaoxi'
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
 * 查看消息详情
 */
const viewMessageDetail = async (item) => {
	// 如果消息未读，标记为已读
	if (!item.read) {
		try {
			// 调用后端 API 标记已读
			await markAsRead(item.id)
			
		// 更新本地状态
		item.read = true
		
		// 获取最新的未读数量
		try {
			const res = await getUnreadCount()
			const unreadCount = res.data?.count || 0
			updateTabBarBadge(unreadCount)
		} catch (err) {
			console.error('获取未读数量失败', err)
		}
		} catch (error) {
			console.error('标记已读失败', error)
			// 即使 API 失败也更新本地状态（仅用于 UI 显示）
			item.read = true
		}
	}
	
	// 如果是系统通知，直接显示内容，不跳转详情页
	if (item.type === 'system') {
		// 系统通知直接显示内容，不跳转
		return
	}
	
	// 如果是商家消息（isChat为true），跳转到客服页面
	if (item.isChat) {
		uni.navigateTo({ 
			url: '/page1/service/service' 
		})
	} else {
		// 否则跳转到消息详情页
			uni.navigateTo({ 
				url: `/subPackages/page2/pages/message/detail?id=${item.id}` 
			})
	}
}

/**
 * 更新TabBar红点（消息红点已去掉，仅清除不显示）
 */
const updateTabBarBadge = (count) => {
	try {
		uni.removeTabBarBadge({
			index: 2,
			fail: () => {}
		})
	} catch (error) {}
}

/**
 * 格式化时间
 */
const formatTime = (datetime) => {
	if (!datetime) return ''
	
	const now = new Date()
	const time = new Date(datetime)
	const diff = now - time
	
	// 1分钟内
	if (diff < 60000) {
		return '刚刚'
	}
	// 1小时内
	if (diff < 3600000) {
		return Math.floor(diff / 60000) + '分钟前'
	}
	// 今天
	if (now.toDateString() === time.toDateString()) {
		return time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0')
	}
	// 昨天
	const yesterday = new Date(now)
	yesterday.setDate(yesterday.getDate() - 1)
	if (yesterday.toDateString() === time.toDateString()) {
		return '昨天'
	}
	// 一周内
	if (diff < 7 * 24 * 3600000) {
		return Math.floor(diff / (24 * 3600000)) + '天前'
	}
	// 更早
	return time.getMonth() + 1 + '-' + time.getDate()
}

/**
 * 加载系统通知（从API）
 */
const loadSystemNotice = async () => {
	try {
		const res = await getSystemSentences()
		console.log('[分类列表] 系统通知API响应:', res)
		
		// 解析响应数据
		const data = res.data || res
		const systemSentence = data.system_sentence || data.systemSentence || ''
		
		if (systemSentence && systemSentence.trim()) {
			// 创建系统通知消息
			messageList.value = [{
				id: 'system-notice-' + Date.now(),
				type: 'system',
				title: '系统通知',
				content: systemSentence.trim(),
				time: formatTime(new Date()),
				read: false,
				created_at: new Date().toISOString()
			}]
			console.log('[分类列表] 从API加载系统通知成功')
		} else {
			messageList.value = []
			console.log('[分类列表] 系统通知为空')
		}
	} catch (error) {
		console.error('[分类列表] 加载系统通知失败', error)
		messageList.value = []
	}
}

/**
 * 加载奖励消息（从点数流水接口）
 */
const loadRewardMessages = async () => {
	try {
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userId = userInfo.id || userInfo.user_id
		
		if (!userId) {
			console.warn('[分类列表] 无法获取用户ID，无法加载奖励消息')
			messageList.value = []
			return
		}
		
		console.log('[分类列表] 开始加载奖励消息，用户ID:', userId)
		
		// 调用点数流水接口
		const res = await getAllPointsFlows({
			user_id: userId,
			page: 1,
			page_size: 50 // 获取最近50条流水
		})
		
		console.log('[分类列表] 点数流水API响应:', res)
		
		// 解析响应数据
		let records = []
		if (res.data?.records && Array.isArray(res.data.records)) {
			records = res.data.records
		} else if (res.data?.list && Array.isArray(res.data.list)) {
			records = res.data.list
		} else if (res.data?.data && Array.isArray(res.data.data)) {
			records = res.data.data
		} else if (Array.isArray(res.data)) {
			records = res.data
		} else if (Array.isArray(res.records)) {
			records = res.records
		}
		
		console.log('[分类列表] 解析出的流水记录，数量:', records.length)
		
		// 根据流水类型生成消息
		const messages = records.map((record, index) => {
			// 获取流水类型和金额
			const flowType = record.flow_type || record.type || ''
			const points = record.points || record.amount || record.change_amount || record.flow_amount || record.income_amount || 0
			const reason = record.reason || record.description || ''
			const flowTime = record.created_at || record.create_time || record.time || record.flow_time || new Date().toISOString()
			
			// 根据流水类型生成标题和内容
			let title = '雨点变动'
			let content = ''
			
			if (flowType.includes('subsidy') || flowType.includes('补贴')) {
				title = '周补贴发放'
				content = `本周补贴已发放！\n\n根据您的雨点，本周获得补贴¥${Math.abs(points).toFixed(2)}。\n\n补贴已到账至您的推广费余额，可随时提现。\n\n继续购买商品和推广，获得更多雨点和补贴！`
			} else if (flowType.includes('referral') || flowType.includes('推荐') || flowType.includes('推广')) {
				title = '推广奖励到账'
				content = `恭喜您获得推广奖励！\n\n您推荐的好友首次购买会员商品，您获得了推广奖励。\n\n奖励金额：${points > 0 ? '+' : ''}${points}雨点\n\n奖励金额已到账，可随时查看。`
			} else if (flowType.includes('team') || flowType.includes('团队')) {
				title = '团队奖励到账'
				content = `恭喜您获得团队奖励！\n\n您的团队成员产生了新的消费，您获得了团队奖励。\n\n奖励金额：${points > 0 ? '+' : ''}${points}雨点\n\n奖励金额已到账，可随时查看。`
			} else if (flowType.includes('unilevel') || flowType.includes('联创')) {
				title = '联创奖励到账'
				content = `恭喜您获得联创奖励！\n\n您的联创等级产生了新的奖励。\n\n奖励金额：${points > 0 ? '+' : ''}${points}雨点\n\n奖励金额已到账，可随时查看。`
			} else {
				// 通用雨点变动消息
				title = '雨点变动'
				const pointsText = points > 0 ? `+${points}` : `${points}`
				content = `您的雨点发生了变动。\n\n变动金额：${pointsText}雨点\n\n${reason ? `原因：${reason}\n\n` : ''}请及时查看您的雨点余额。`
			}
			
			return {
				id: `reward-${record.id || index}-${Date.now()}`,
				type: 'reward',
				title: title,
				content: content,
				time: formatTime(flowTime),
				read: false,
				amount: Math.abs(points),
				created_at: flowTime
			}
		})
		
		// 按时间倒序排序（最新的在前）
		messages.sort((a, b) => {
			const timeA = new Date(a.created_at).getTime()
			const timeB = new Date(b.created_at).getTime()
			return timeB - timeA
		})
		
		messageList.value = messages
		
		console.log('[分类列表] 从点数流水接口加载奖励消息成功，共', messages.length, '条')
	} catch (error) {
		console.error('[分类列表] 加载奖励消息失败', error)
		messageList.value = []
	}
}

/**
 * 加载消息列表（从本地存储）
 */
const loadMessages = async () => {
	// 如果是系统通知类型，从API获取
	if (messageType.value === 'system') {
		await loadSystemNotice()
		return
	}
	
	// 如果是奖励消息类型，从点数流水接口获取
	if (messageType.value === 'reward') {
		await loadRewardMessages()
		return
	}
	
	try {
		const res = await getMessageList({ 
			type: messageType.value, 
			page: 1, 
			pageSize: 100 
		})
		
		// 将本地数据转换为前端格式
		const messages = (res.data?.list || []).map(msg => ({
			id: msg.id,
			type: msg.type,
			title: msg.title,
			content: msg.content,
			time: msg.time || formatTime(msg.created_at),
			read: msg.read === true || msg.read === 1,
			orderId: msg.orderId || msg.order_id,
			orderNo: msg.orderNo || msg.order_no,
			amount: msg.amount,
			created_at: msg.created_at
		}))
		
		messageList.value = messages
		
		console.log('[分类列表] 从本地存储加载消息，类型:', messageType.value, '共', messages.length, '条')
	} catch (error) {
		console.error('获取消息列表失败，尝试从本地存储读取', error)
		// 如果获取失败，尝试直接从本地存储读取
		const localMessages = uni.getStorageSync('messageList') || []
		const filteredMessages = localMessages.filter(msg => msg.type === messageType.value)
		messageList.value = filteredMessages.map(msg => ({
			id: msg.id,
			type: msg.type,
			title: msg.title,
			content: msg.content,
			time: msg.time || formatTime(msg.created_at),
			read: msg.read === true || msg.read === 1,
			orderId: msg.orderId || msg.order_id,
			orderNo: msg.orderNo || msg.order_no,
			amount: msg.amount,
			created_at: msg.created_at
		}))
	}
	
	// 如果是订单消息类型，添加商家消息入口
	if (messageType.value === 'order') {
		// 检查是否已经有商家消息
		const hasMerchantChat = messageList.value.some(msg => msg.isChat && msg.type === 'order')
		if (!hasMerchantChat) {
			// 添加商家消息入口到列表开头
			messageList.value.unshift({
				id: 'merchant-chat',
				type: 'order',
				title: '商家消息',
				content: '与商家沟通订单问题',
				time: '',
				read: true,
				isChat: true // 标记为聊天类型
			})
		}
	}
}

onLoad((options) => {
	if (options.type) {
		messageType.value = options.type
	}
	if (options.title) {
		categoryTitle.value = decodeURIComponent(options.title)
		uni.setNavigationBarTitle({
			title: categoryTitle.value
		})
	}
	
	loadMessages()
})
</script>

<style scoped>
.category-list-page {
	min-height: 100vh;
	background: #f5f5f5;
}

.message-list {
	padding: 20rpx 30rpx;
}

.message-item {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	gap: 20rpx;
	position: relative;
	transition: background 0.3s;
}

.message-item:active {
	background: #f5f5f5;
}

.message-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	flex-shrink: 0;
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

.message-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.message-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.message-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.message-time {
	font-size: 22rpx;
	color: #999;
}

.message-desc {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.message-badge {
	position: absolute;
	top: 30rpx;
	right: 30rpx;
	width: 16rpx;
	height: 16rpx;
	background: #ff5252;
	border-radius: 50%;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
	padding: 120rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	opacity: 0.3;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>
