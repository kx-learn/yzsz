<template>
	<view class="member-item">
		<!-- 成员信息行 -->
		<view class="member-row">
			<view class="member-content" @tap.stop="viewDetail">
				<view class="member-avatar-wrapper">
					<image 
						:src="getMemberAvatarUrl(member)" 
						mode="aspectFill" 
						class="member-avatar"
						@tap.stop="viewDetail"
						@error="handleAvatarError"
					/>
					<!-- 层级数字徽章（depth > 0 时显示） -->
					<view class="layer-badge" v-if="depth > 0">
						<text class="layer-badge-text">{{ depth }}级</text>
					</view>
					<!-- 联创等级徽章 -->
					<view class="uni-level-badge" v-if="member.unilevel > 0" :class="'uni-level-' + member.unilevel">
						<text class="uni-level-text">{{ member.unilevel }}</text>
					</view>
				</view>
				
				<view class="member-info">
					<view class="member-header">
						<text class="member-name">{{ member.name || member.mobile || '未设置昵称' }}</text>
						<view class="member-level-badge" :class="'level-' + (member.member_level || 0)">
							<text class="level-icon iconfont" :class="getLevelIcon(member.member_level || 0)"></text>
							<text class="level-text">{{ getLevelText(member.member_level || 0) }}</text>
						</view>
					</view>
					<view class="member-stats">
						<text class="stat-item">直推: {{ member.directCount || 0 }}人</text>
						<text class="stat-divider">|</text>
						<text class="stat-item">团队: {{ member.teamSize || 0 }}人</text>
					</view>
				</view>
			</view>
			
			<!-- 操作按钮组 -->
			<view class="action-buttons">
				<!-- 查看下级按钮 -->
				<view v-if="member.directCount > 0" class="action-btn view-children-btn" @tap.stop="viewChildren">
					<text class="action-btn-text">下级</text>
				</view>
				<!-- 查看详情按钮 -->
				<view class="action-btn detail-btn" @tap.stop="viewDetail">
					<text class="action-btn-text">详情</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { getLevelIcon, getLevelText } from '@/utils/level.js'
import { getAvatarUrl } from '@/utils/avatar.js'
import MemberRecursiveItem from './member-recursive-item.vue'

const props = defineProps({
	member: {
		type: Object,
		required: true
	},
	depth: {
		type: Number,
		default: 0
	}
})

const emit = defineEmits(['toggle-expand', 'view-detail', 'view-children'])

/**
 * 获取成员头像URL
 */
const getMemberAvatarUrl = (member) => {
	if (!member) {
		return '/static/logo.png'
	}
	
	// 优先使用 avatar_path
	if (member.avatar_path && member.avatar_path !== 'null' && member.avatar_path.trim() !== '') {
		return getAvatarUrl(member.avatar_path)
	}
	
	// 其次使用 avatar
	if (member.avatar && member.avatar !== 'null' && member.avatar.trim() !== '') {
		return getAvatarUrl(member.avatar)
	}
	
	// 默认头像
	return '/static/logo.png'
}

/**
 * 处理头像加载错误
 */
const handleAvatarError = (e) => {
	console.log('[MemberRecursiveItem] 头像加载失败，使用默认头像')
	if (e && e.target) {
		e.target.src = '/static/logo.png'
	}
}

const viewDetail = (e) => {
	if (e) {
		e.stopPropagation()
	}
	console.log('[MemberRecursiveItem] 点击查看详情:', props.member)
	emit('view-detail', props.member)
}

const viewChildren = (e) => {
	if (e) {
		e.stopPropagation()
	}
	console.log('[MemberRecursiveItem] 点击查看下级:', props.member)
	emit('view-children', props.member)
}

// 保留这些方法以兼容旧代码
const toggleExpand = () => {
	emit('toggle-expand', props.member)
}

const handleToggleExpand = (member) => {
	emit('toggle-expand', member)
}

const handleViewDetail = (member) => {
	emit('view-detail', member)
}
</script>

<style scoped>
.member-item {
	width: 100%;
}

.member-row {
	display: flex;
	align-items: center;
	padding: 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
	background: #fff;
	transition: background-color 0.2s;
}

.member-row:active {
	background-color: #f8f9fa;
}

.member-content {
	flex: 1;
	display: flex;
	align-items: center;
	min-width: 0;
	cursor: pointer;
}

.member-avatar-wrapper {
	position: relative;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.member-avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: #f0f0f0;
}

/* 层级数字徽章（左上角） */
.layer-badge {
	position: absolute;
	top: -4rpx;
	left: -4rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
	z-index: 10;
}

.layer-badge-text {
	font-size: 18rpx;
	color: #fff;
	font-weight: bold;
}

.member-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	min-width: 0;
}

.member-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.member-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	line-height: 1.4;
}

.member-mobile {
	font-size: 24rpx;
	color: #999;
	line-height: 1.3;
}

.member-stats {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 4rpx;
}

.stat-item {
	font-size: 24rpx;
	color: #666;
}

.stat-divider {
	font-size: 24rpx;
	color: #ddd;
}

.member-level-badge {
	display: inline-flex;
	align-items: center;
	gap: 4rpx;
	padding: 4rpx 12rpx;
	border-radius: 12rpx;
	font-size: 20rpx;
	align-self: flex-start;
}

.level-icon {
	font-size: 18rpx;
}

.level-text {
	color: #fff;
	font-weight: bold;
}

/* 操作按钮组 */
.action-buttons {
	display: flex;
	gap: 12rpx;
	flex-shrink: 0;
	margin-left: 16rpx;
	z-index: 10;
	position: relative;
}

.action-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8rpx 16rpx;
	border-radius: 8rpx;
	transition: all 0.2s;
	min-width: 60rpx;
	white-space: nowrap;
	cursor: pointer;
	-webkit-tap-highlight-color: transparent;
	user-select: none;
}

.view-children-btn {
	background: #3d6bff;
	color: #fff;
}

.view-children-btn:active {
	transform: scale(0.95);
	opacity: 0.8;
}

.detail-btn {
	background: #f5f5f5;
	border: 1rpx solid #e0e0e0;
}

.detail-btn:active {
	background: #e0e0e0;
}

.action-btn-text {
	font-size: 26rpx;
	font-weight: 500;
	line-height: 1.2;
}


.loading-state,
.empty-state {
	padding: 30rpx;
	text-align: center;
	background: #fafbfc;
	border-bottom: 1rpx solid #f0f0f0;
}

.loading-text,
.empty-text {
	font-size: 24rpx;
	color: #999;
}

.uni-level-badge {
	position: absolute;
	bottom: -4rpx;
	right: -4rpx;
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

.uni-level-badge.uni-level-1 {
	background: linear-gradient(135deg, #ffd700, #ffed4e);
}

.uni-level-badge.uni-level-2 {
	background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
}

.uni-level-badge.uni-level-3 {
	background: linear-gradient(135deg, #ff6b6b, #ff8787);
}

.uni-level-text {
	font-size: 18rpx;
	font-weight: bold;
	color: #333;
}
</style>

