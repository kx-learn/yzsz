<template>
	<view class="tree-node">
		<!-- 当前成员 -->
		<view class="member-item">
			<view class="member-expand" @tap.stop="handleToggle">
				<text class="expand-icon" v-if="member.teamSize > 0">
					{{ member.expanded ? '▼' : '▶' }}
				</text>
				<text class="expand-icon placeholder" v-else>·</text>
			</view>
			
			<image :src="member.avatar || '/static/default-avatar.png'" class="member-avatar" mode="aspectFill" />
			
			<view class="member-info" @tap="handleViewDetail">
				<view class="member-header">
					<text class="member-name">{{ member.nickname || member.name || '未设置昵称' }}</text>
					<view class="level-tag" v-if="member.level !== undefined && member.level !== null">
						<text class="level-text">{{ getLevelText(member.level) }}</text>
					</view>
				</view>
				
				<view class="member-sub">
					<text class="sub-text">团队 {{ member.teamSize }}</text>
					<text class="sub-divider">|</text>
					<text class="sub-text">雨点 {{ member.monthlyReward }}</text>
					<text class="sub-divider">|</text>
					<text class="sub-text">活跃 {{ member.activity }}%</text>
				</view>
			</view>
			
		</view>
		
		<!-- 子成员列表 (缩进) -->
		<view v-if="member.expanded && member.children && member.children.length > 0" class="children-list" :style="{ paddingLeft: '20rpx' }">
			<tree-member-item 
				v-for="child in member.children" 
				:key="child.id"
				:member="child"
				:level="level + 1"
				@toggle="handleChildToggle"
				@view-detail="handleChildViewDetail"
				@contact="handleChildContact"
			/>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	member: {
		type: Object,
		required: true
	},
	level: {
		type: Number,
		default: 1
	}
})

const emit = defineEmits(['toggle', 'view-detail', 'contact'])

const handleToggle = () => {
	emit('toggle', props.member)
}

const handleViewDetail = () => {
	emit('view-detail', props.member)
}

const handleChildToggle = (child) => {
	emit('toggle', child)
}

const handleChildViewDetail = (child) => {
	emit('view-detail', child)
}

const handleContact = () => {
	emit('contact', props.member)
}

const handleChildContact = (child) => {
	emit('contact', child)
}

const getLevelText = (level) => {
	const texts = ['普通用户', '一星店长', '二星店长', '三星店长', '四星店长', '五星店长', '六星店长', '荣誉董事']
	return texts[level] || '普通用户'
}
</script>

<style scoped>
.tree-node {
	width: 100%;
}

.member-item {
	display: flex;
	align-items: center; /* 保持垂直居中 */
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
	background: #fff;
	width: 100%;
	box-sizing: border-box;
}

.member-item:active {
	background-color: #fafafa;
}

.member-expand {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 8rpx;
	flex-shrink: 0;
}

.expand-icon {
	font-size: 20rpx;
	color: #999;
}

.placeholder {
	color: #eee;
}

.member-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	background: #f0f0f0;
	flex-shrink: 0;
}

.member-info {
	flex: 1;
	min-width: 0; /* 允许压缩 */
	overflow: hidden;
}

.member-header {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
}

.member-name {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	margin-right: 12rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.level-tag {
	background: #fff0f6;
	padding: 2rpx 10rpx;
	border-radius: 6rpx;
	flex-shrink: 0;
}

.level-text {
	font-size: 20rpx;
	color: #eb2f96;
}

.member-sub {
	display: flex;
	align-items: center;
	flex-wrap: wrap; /* 关键：允许换行 */
	row-gap: 6rpx; /* 行间距 */
}

.sub-text {
	font-size: 22rpx;
	color: #999;
	white-space: nowrap;
}

.sub-divider {
	font-size: 20rpx;
	color: #eee;
	margin: 0 10rpx;
}

.children-list {
	width: 100%;
	box-sizing: border-box;
}
</style>
