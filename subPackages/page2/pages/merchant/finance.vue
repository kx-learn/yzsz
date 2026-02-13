<template>
	<view class="finance-page">
		<view class="page-header">
			<text class="page-title">财务管理</text>
		</view>

		<scroll-view class="reports-scroll" scroll-y>
			<!-- 公益基金报表 -->
			<view class="report-section">
				<view class="section-header">
					<text class="section-title">公益基金报表</text>
				</view>
				<view class="report-list">
					<view class="report-item" @tap="viewReport('publicWelfareBalance')">
						<view class="report-icon public-welfare">💰</view>
						<view class="report-content">
							<text class="report-name">查询公益基金余额</text>
							<text class="report-desc">查看当前公益基金账户余额</text>
						</view>
						<text class="report-arrow">></text>
					</view>
					<view class="report-item" @tap="viewReport('publicWelfareFlow')">
						<view class="report-icon public-welfare">📊</view>
						<view class="report-content">
							<text class="report-name">公益基金流水明细</text>
							<text class="report-desc">查看公益基金所有交易流水记录</text>
						</view>
						<text class="report-arrow">></text>
					</view>
					<view class="report-item" @tap="viewReport('publicWelfareReport')">
						<view class="report-icon public-welfare">📈</view>
						<view class="report-content">
							<text class="report-name">公益基金交易报表</text>
							<text class="report-desc">查看公益基金交易统计报表</text>
						</view>
						<text class="report-arrow">></text>
					</view>
				</view>
			</view>

			<!-- 雨点报表 -->
			<view class="report-section">
				<view class="section-header">
					<text class="section-title">雨点报表</text>
				</view>
				<view class="report-list">
					<view class="report-item" @tap="viewReport('allPointsReport')">
						<view class="report-icon finance">💳</view>
						<view class="report-content">
							<text class="report-name">所有雨点流水报表</text>
							<text class="report-desc">查询所有雨点流水明细</text>
						</view>
						<text class="report-arrow">></text>
					</view>
				</view>
			</view>
		</scroll-view>
		
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'


/**
 * 查看报表
 */
	const viewReport = (reportType) => {
		let title = ''
		switch (reportType) {
			case 'publicWelfareBalance': title = '公益基金余额'; break
			case 'publicWelfareFlow': title = '公益基金流水明细'; break
			case 'publicWelfareReport': title = '公益基金交易报表'; break
			case 'allPointsReport': title = '所有雨点流水报表'; break
		}

		uni.navigateTo({
			url: `/subPackages/page2/pages/merchant/report-detail?type=${reportType}&title=${encodeURIComponent(title)}`
		})
	}


onLoad(() => {
	// 页面加载
})
</script>

<style scoped>
.finance-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f5f7fa 0%, #e8ecf0 100%);
}

.page-header {
	padding: 40rpx 30rpx 30rpx;
	background: #fff;
	border-bottom: 1rpx solid #f0f0f0;
}

.page-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
}

.reports-scroll {
	height: calc(100vh - 120rpx);
	padding: 30rpx;
}

.report-section {
	margin-bottom: 40rpx;
}

.section-header {
	margin-bottom: 20rpx;
	padding-left: 10rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.report-list {
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.report-item {
	display: flex;
	align-items: center;
	padding: 32rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	transition: background 0.3s;
}

.report-item:last-child {
	border-bottom: none;
}

.report-item:active {
	background: #f8f9fa;
}

.report-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	flex-shrink: 0;
	margin-right: 24rpx;
}

.report-icon.public-welfare {
	background: linear-gradient(135deg, #ff6b6b, #ff8787);
}

.report-icon.subsidy {
	background: linear-gradient(135deg, #4ecdc4, #6edcd4);
}

.report-icon.rewards {
	background: linear-gradient(135deg, #ffe66d, #fff89a);
}

.report-icon.finance {
	background: linear-gradient(135deg, #95e1d3, #b4f0e4);
}

.report-icon.points {
	background: linear-gradient(135deg, #a8e6cf, #c8f5e0);
}

.report-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.report-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
	line-height: 1.4;
}

.report-desc {
	font-size: 24rpx;
	color: #999;
	line-height: 1.3;
}

.report-arrow {
	font-size: 28rpx;
	color: #ccc;
	margin-left: 20rpx;
}

</style>
