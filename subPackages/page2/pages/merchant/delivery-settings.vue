<template>
	<view class="delivery-settings-page">
		<!-- 基础配送设置 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">基础配送设置</text>
			</view>
			
			<view class="settings-card">
				<view class="setting-item">
					<text class="setting-label">默认配送费</text>
					<view class="setting-input">
						<text class="currency">¥</text>
						<input 
							v-model.number="deliveryConfig.defaultFee" 
							type="digit" 
							class="input-field"
							placeholder="0.00"
						/>
					</view>
				</view>
				
				<view class="setting-item">
					<text class="setting-label">起送金额</text>
					<view class="setting-input">
						<text class="currency">¥</text>
						<input 
							v-model.number="deliveryConfig.minOrderAmount" 
							type="digit" 
							class="input-field"
							placeholder="0.00"
						/>
					</view>
				</view>
				
				<view class="setting-item">
					<text class="setting-label">配送范围</text>
					<view class="setting-input">
						<input 
							v-model.number="deliveryConfig.maxDistance" 
							type="number" 
							class="input-field"
							placeholder="0"
						/>
						<text class="unit">公里</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 包邮设置 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">包邮设置</text>
				<switch 
					:checked="deliveryConfig.freeShippingEnabled" 
					@change="toggleFreeShipping"
					color="#ff9800"
				/>
			</view>
			
			<view v-if="deliveryConfig.freeShippingEnabled" class="settings-card">
				<view class="setting-item">
					<text class="setting-label">满额包邮</text>
					<view class="setting-input">
						<text class="currency">¥</text>
						<input 
							v-model.number="deliveryConfig.freeShippingAmount" 
							type="digit" 
							class="input-field"
							placeholder="0.00"
						/>
					</view>
				</view>
				
				<view class="setting-item">
					<text class="setting-label">包邮地区</text>
					<button class="select-btn" @tap="selectFreeRegions">
						<text class="btn-text">{{ freeRegionsText }}</text>
						<text class="arrow">></text>
					</button>
				</view>
			</view>
		</view>

		<!-- 按距离计费 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">按距离计费</text>
				<switch 
					:checked="deliveryConfig.distanceBasedEnabled" 
					@change="toggleDistanceBased"
					color="#ff9800"
				/>
			</view>
			
			<view v-if="deliveryConfig.distanceBasedEnabled" class="settings-card">
				<view class="distance-rules">
					<view 
						v-for="(rule, index) in deliveryConfig.distanceRules" 
						:key="index"
						class="rule-item"
					>
						<view class="rule-content">
							<view class="rule-row">
								<text class="rule-label">距离范围</text>
								<view class="range-inputs">
									<input 
										v-model.number="rule.minDistance" 
										type="number" 
										class="range-input"
										placeholder="0"
									/>
									<text class="separator">-</text>
									<input 
										v-model.number="rule.maxDistance" 
										type="number" 
										class="range-input"
										placeholder="999"
									/>
									<text class="unit">公里</text>
								</view>
							</view>
							<view class="rule-row">
								<text class="rule-label">配送费</text>
								<view class="fee-input">
									<text class="currency">¥</text>
									<input 
										v-model.number="rule.fee" 
										type="digit" 
										class="input-field"
										placeholder="0.00"
									/>
								</view>
							</view>
						</view>
						<view class="rule-actions">
							<text class="delete-btn" @tap="deleteDistanceRule(index)">删除</text>
						</view>
					</view>
				</view>
				
				<button class="add-rule-btn" @tap="addDistanceRule">
					<text class="add-icon">+</text>
					<text class="add-text">添加距离规则</text>
				</button>
			</view>
		</view>

		<!-- 按地区计费 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">按地区计费</text>
				<switch 
					:checked="deliveryConfig.regionBasedEnabled" 
					@change="toggleRegionBased"
					color="#ff9800"
				/>
			</view>
			
			<view v-if="deliveryConfig.regionBasedEnabled" class="settings-card">
				<view class="region-rules">
					<view 
						v-for="(rule, index) in deliveryConfig.regionRules" 
						:key="index"
						class="rule-item"
					>
						<view class="rule-content">
							<view class="rule-row">
								<text class="rule-label">地区</text>
								<button class="select-btn small" @tap="selectRegion(index)">
									<text class="btn-text">{{ rule.regionName || '选择地区' }}</text>
									<text class="arrow">></text>
								</button>
							</view>
							<view class="rule-row">
								<text class="rule-label">配送费</text>
								<view class="fee-input">
									<text class="currency">¥</text>
									<input 
										v-model.number="rule.fee" 
										type="digit" 
										class="input-field"
										placeholder="0.00"
									/>
								</view>
							</view>
						</view>
						<view class="rule-actions">
							<text class="delete-btn" @tap="deleteRegionRule(index)">删除</text>
						</view>
					</view>
				</view>
				
				<button class="add-rule-btn" @tap="addRegionRule">
					<text class="add-icon">+</text>
					<text class="add-text">添加地区规则</text>
				</button>
			</view>
		</view>

		<!-- 偏远地区加价 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">偏远地区加价</text>
				<switch 
					:checked="deliveryConfig.remoteAreaEnabled" 
					@change="toggleRemoteArea"
					color="#ff9800"
				/>
			</view>
			
			<view v-if="deliveryConfig.remoteAreaEnabled" class="settings-card">
				<view class="setting-item">
					<text class="setting-label">偏远地区</text>
					<button class="select-btn" @tap="selectRemoteRegions">
						<text class="btn-text">{{ remoteRegionsText }}</text>
						<text class="arrow">></text>
					</button>
				</view>
				
				<view class="setting-item">
					<text class="setting-label">额外加价</text>
					<view class="setting-input">
						<text class="currency">¥</text>
						<input 
							v-model.number="deliveryConfig.remoteAreaFee" 
							type="digit" 
							class="input-field"
							placeholder="0.00"
						/>
					</view>
				</view>
			</view>
		</view>

		<!-- 不可配送地区 -->
		<view class="settings-section">
			<view class="section-header">
				<text class="section-title">不可配送地区</text>
			</view>
			
			<view class="settings-card">
				<view v-if="deliveryConfig.disabledRegions && deliveryConfig.disabledRegions.length" class="disabled-list">
					<view 
						v-for="(region, index) in deliveryConfig.disabledRegions"
						:key="region + index"
						class="disabled-chip"
					>
						<text class="chip-text">{{ region }}</text>
						<text class="chip-remove" @tap="removeDisabledRegion(index)">×</text>
					</view>
				</view>
				<view v-else class="empty-disabled">暂无不可配送地区</view>
				
				<button class="add-rule-btn" @tap="addDisabledRegion">
					<text class="add-icon">+</text>
					<text class="add-text">添加不可配送地区</text>
				</button>
			</view>
		</view>

		<!-- 保存按钮 -->
		<view class="save-section">
			<button class="save-btn" @tap="saveSettings">保存设置</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getDeliverySettings, saveDeliverySettings } from '../../utils/merchant.js'

const deliveryConfig = ref(getDeliverySettings())

const freeRegionsText = computed(() => {
	const regions = deliveryConfig.value.freeShippingRegions
	if (regions.length === 0) return '未选择'
	if (regions.length <= 3) return regions.join('、')
	return `${regions.slice(0, 3).join('、')} 等${regions.length}个地区`
})

const remoteRegionsText = computed(() => {
	const regions = deliveryConfig.value.remoteAreaRegions
	if (regions.length === 0) return '未选择'
	if (regions.length <= 3) return regions.join('、')
	return `${regions.slice(0, 3).join('、')} 等${regions.length}个地区`
})

const disabledRegionsText = computed(() => {
	const regions = deliveryConfig.value.disabledRegions || []
	if (regions.length === 0) return '未设置'
	if (regions.length <= 3) return regions.join('、')
	return `${regions.slice(0, 3).join('、')} 等${regions.length}个地区`
})

const toggleFreeShipping = (e) => {
	deliveryConfig.value.freeShippingEnabled = e.detail.value
}

const toggleDistanceBased = (e) => {
	deliveryConfig.value.distanceBasedEnabled = e.detail.value
}

const toggleRegionBased = (e) => {
	deliveryConfig.value.regionBasedEnabled = e.detail.value
}

const toggleRemoteArea = (e) => {
	deliveryConfig.value.remoteAreaEnabled = e.detail.value
}

const selectFreeRegions = () => {
	uni.showToast({ title: '选择包邮地区', icon: 'none' })
	// TODO: 打开地区选择器
}

const selectRemoteRegions = () => {
	uni.showToast({ title: '选择偏远地区', icon: 'none' })
	// TODO: 打开地区选择器
}

const addDistanceRule = () => {
	deliveryConfig.value.distanceRules.push({
		minDistance: 0,
		maxDistance: 0,
		fee: 0
	})
}

const deleteDistanceRule = (index) => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除这条规则吗？',
		success: (res) => {
			if (res.confirm) {
				deliveryConfig.value.distanceRules.splice(index, 1)
			}
		}
	})
}

const addRegionRule = () => {
	deliveryConfig.value.regionRules.push({
		regionName: '',
		regionCode: '',
		fee: 0
	})
}

const deleteRegionRule = (index) => {
	uni.showModal({
		title: '确认删除',
		content: '确定要删除这条规则吗？',
		success: (res) => {
			if (res.confirm) {
				deliveryConfig.value.regionRules.splice(index, 1)
			}
		}
	})
}

const selectRegion = (index) => {
	uni.showToast({ title: '选择地区', icon: 'none' })
	// TODO: 打开地区选择器
}

const saveSettings = () => {
	// 验证数据
	if (deliveryConfig.value.defaultFee < 0) {
		uni.showToast({ title: '配送费不能为负数', icon: 'none' })
		return
	}
	
	if (deliveryConfig.value.minOrderAmount < 0) {
		uni.showToast({ title: '起送金额不能为负数', icon: 'none' })
		return
	}
	
	uni.showLoading({ title: '保存中...' })
	saveDeliverySettings(deliveryConfig.value)
	uni.hideLoading()
	uni.showToast({ title: '保存成功', icon: 'success' })
	setTimeout(() => {
		uni.navigateBack()
	}, 800)
}

const addDisabledRegion = () => {
	uni.showModal({
		title: '添加不可配送地区',
		editable: true,
		placeholderText: '例如：北京市昌平区',
		success: (res) => {
			if (res.confirm && res.content) {
				deliveryConfig.value.disabledRegions = deliveryConfig.value.disabledRegions || []
				deliveryConfig.value.disabledRegions.push(res.content)
			}
		}
	})
}

const removeDisabledRegion = (index) => {
	deliveryConfig.value.disabledRegions.splice(index, 1)
}
</script>

<style scoped>
.delivery-settings-page {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 30rpx;
	padding-bottom: 40rpx;
}

.settings-section {
	margin-bottom: 30rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 30rpx 20rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.settings-card {
	background: white;
	border-radius: 16rpx;
	padding: 30rpx;
}

.disabled-list {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.disabled-chip {
	display: flex;
	align-items: center;
	gap: 8rpx;
	background: #f5f5f5;
	border-radius: 20rpx;
	padding: 8rpx 16rpx;
	font-size: 24rpx;
	color: #555;
}

.chip-text {
	max-width: 320rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.chip-remove {
	color: #ff4757;
	font-size: 26rpx;
}

.empty-disabled {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 16rpx;
}

.setting-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}

.setting-item:last-child {
	border-bottom: none;
}

.setting-label {
	font-size: 28rpx;
	color: #333;
	flex-shrink: 0;
}

.setting-input {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.currency {
	font-size: 26rpx;
	color: #666;
}

.input-field {
	flex: 1;
	text-align: right;
	font-size: 28rpx;
	color: #333;
	min-width: 120rpx;
}

.unit {
	font-size: 24rpx;
	color: #999;
}

.select-btn {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 16rpx 24rpx;
	background: #f8f9fa;
	border-radius: 8rpx;
	border: none;
	height: auto;
	line-height: 1;
}

.select-btn.small {
	padding: 12rpx 20rpx;
}

.btn-text {
	font-size: 26rpx;
	color: #666;
	max-width: 300rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.arrow {
	font-size: 20rpx;
	color: #ccc;
}

/* 距离规则 */
.distance-rules,
.region-rules {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-bottom: 20rpx;
}

.rule-item {
	padding: 24rpx;
	background: #f8f9fa;
	border-radius: 12rpx;
}

.rule-content {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 16rpx;
}

.rule-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.rule-label {
	font-size: 26rpx;
	color: #666;
	flex-shrink: 0;
}

.range-inputs {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.range-input {
	width: 100rpx;
	text-align: center;
	font-size: 26rpx;
	color: #333;
	padding: 8rpx;
	background: white;
	border-radius: 6rpx;
}

.separator {
	font-size: 24rpx;
	color: #999;
}

.fee-input {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.rule-actions {
	display: flex;
	justify-content: flex-end;
	padding-top: 16rpx;
	border-top: 1rpx solid #e0e0e0;
}

.delete-btn {
	font-size: 24rpx;
	color: #f44336;
	padding: 8rpx 16rpx;
}

.add-rule-btn {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 24rpx;
	background: #f8f9fa;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	color: #ff9800;
	font-size: 26rpx;
	height: auto;
	line-height: 1;
}

.add-icon {
	font-size: 32rpx;
	font-weight: bold;
}

.save-section {
	margin-top: 40rpx;
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #ff9800, #ffb74d);
	color: white;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 16rpx;
	border: none;
}
</style>
