<template>
	<view class="report-detail-page">
		<view class="page-header">
			<view class="header-main">
				<text class="page-title">{{ reportTitle }}</text>
				<view v-if="datePickerType !== 'none'" class="date-selector" @tap="openDatePicker">
					<text class="current-date-text">{{ dateDisplayText }}</text>
					<text class="picker-trigger">更改</text>
				</view>
			</view>
		</view>

		<scroll-view class="content-scroll" scroll-y>
			<!-- 公益基金余额 -->
			<view v-if="reportType === 'publicWelfareBalance'" class="report-content">
				<view class="balance-card">
					<view class="balance-header">
						<text class="balance-label">账户名称</text>
						<text class="balance-value">{{ reportData.account_name || '公益基金' }}</text>
					</view>
					<view class="balance-header">
						<text class="balance-label">账户类型</text>
						<text class="balance-value">{{ reportData.account_type || 'public_welfare' }}</text>
					</view>
					<view class="balance-amount">
						<text class="amount-label">账户余额</text>
						<text class="amount-value">¥{{ formatNumber(reportData.balance || 0) }}</text>
					</view>
					<view class="balance-header">
						<text class="balance-label">预留金额</text>
						<text class="balance-value">¥{{ formatNumber(reportData.reserved || 0) }}</text>
					</view>
					<view v-if="reportData.remark" class="balance-remark">
						<text class="remark-label">备注</text>
						<text class="remark-text">{{ reportData.remark }}</text>
					</view>
				</view>
			</view>

			<!-- 流水明细列表 -->
			<view v-else-if="reportType === 'publicWelfareFlow'" class="report-content">
				<view class="flow-list">
					<view 
						v-for="(item, index) in flowList" 
						:key="item.id || index"
						class="flow-item"
					>
						<view class="flow-header">
							<view class="flow-left">
								<text class="flow-type" :class="item.flow_type">{{ getFlowTypeText(item.flow_type) }}</text>
								<text class="flow-time">{{ formatTime(item.created_at) }}</text>
							</view>
							<view class="flow-right">
								<text class="flow-amount" :class="item.flow_type">
									{{ item.flow_type === 'income' ? '+' : '-' }}¥{{ formatNumber(item.change_amount || 0) }}
								</text>
							</view>
						</view>
						<view class="flow-body">
							<text class="flow-remark">{{ item.remark || '无备注' }}</text>
							<text class="flow-balance">余额：¥{{ formatNumber(item.balance_after || 0) }}</text>
						</view>
					</view>
					<view v-if="flowList.length === 0" class="empty-state">
						<text class="empty-icon">📊</text>
						<text class="empty-text">暂无流水记录</text>
					</view>
				</view>
			</view>

			<!-- 公益基金交易报表 - 可视化表格 -->
			<view v-else-if="reportType === 'publicWelfareReport'" class="report-content">
				<!-- 汇总信息 -->
				<view class="welfare-summary">
					<view class="summary-header">
						<text class="summary-title">交易汇总</text>
					</view>
					<view class="summary-cards">
						<view class="summary-card">
							<text class="card-label">交易笔数</text>
							<text class="card-value">{{ reportData.summary?.total_transactions || 0 }}</text>
						</view>
						<view class="summary-card income">
							<text class="card-label">总收入</text>
							<text class="card-value">¥{{ formatNumber(reportData.summary?.total_income || 0) }}</text>
						</view>
						<view class="summary-card expense">
							<text class="card-label">总支出</text>
							<text class="card-value">¥{{ formatNumber(reportData.summary?.total_expense || 0) }}</text>
						</view>
						<view class="summary-card net">
							<text class="card-label">净余额</text>
							<text class="card-value">¥{{ formatNumber(reportData.summary?.net_balance || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 明细表格 -->
				<view class="welfare-table-container">
					<view class="table-header">
						<view class="table-header-cell">时间</view>
						<view class="table-header-cell">类型</view>
						<view class="table-header-cell">金额</view>
						<view class="table-header-cell">余额</view>
					</view>
					<view class="table-body">
						<view 
							v-for="(item, index) in welfareDetails" 
							:key="item.id || index"
							class="table-row"
						>
							<view class="table-cell time-cell">{{ formatTime(item.created_at) }}</view>
							<view class="table-cell type-cell">
								<text class="type-badge" :class="item.flow_type || 'other'">
									{{ getFlowTypeText(item.flow_type) }}
								</text>
							</view>
							<view class="table-cell amount-cell" :class="item.flow_type || 'other'">
								{{ (item.change_amount > 0 ? '+' : '') }}¥{{ formatNumber(item.change_amount || 0) }}
							</view>
							<view class="table-cell balance-cell">¥{{ formatNumber(item.balance_after || 0) }}</view>
						</view>
						<view v-if="welfareDetails.length === 0" class="empty-state">
							<text class="empty-icon">📊</text>
							<text class="empty-text">暂无交易记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 财务总览报告 - 可视化显示 -->
			<view v-else-if="reportType === 'financeReport'" class="report-content">
				<!-- 用户资产 -->
				<view class="finance-section">
					<view class="section-title">用户资产</view>
					<view class="finance-cards">
						<view class="finance-card">
							<text class="card-label">会员积分总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.user_assets?.total_member_points || 0) }}</text>
						</view>
						<view class="finance-card">
							<text class="card-label">积分总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.user_assets?.total_points || 0) }}</text>
						</view>
						<view class="finance-card">
							<text class="card-label">账户余额总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.user_assets?.total_balance || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 商家资产 -->
				<view class="finance-section">
					<view class="section-title">商家资产</view>
					<view class="finance-cards">
						<view class="finance-card">
							<text class="card-label">商家积分总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.merchant_assets?.total_merchant_points || 0) }}</text>
						</view>
						<view class="finance-card">
							<text class="card-label">账户余额总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.merchant_assets?.total_balance || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 平台资金池 -->
				<view class="finance-section">
					<view class="section-title">平台资金池</view>
					<view class="pool-list">
						<view 
							v-for="(pool, index) in poolList" 
							:key="pool.name || index"
							class="pool-item"
						>
							<view class="pool-header">
								<text class="pool-name">{{ getPoolName(pool.name) }}</text>
								<text class="pool-type">{{ getPoolType(pool.type) }}</text>
							</view>
							<view class="pool-balance">
								<text class="balance-label">余额</text>
								<text class="balance-value">¥{{ formatNumber(pool.balance || 0) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 资金流水报告 - 可视化表格 -->
			<view v-else-if="reportType === 'accountFlow'" class="report-content">
				<view class="flow-table-container">
					<view class="table-header">
						<view class="table-header-cell">时间</view>
						<view class="table-header-cell">类型</view>
						<view class="table-header-cell">金额</view>
						<view class="table-header-cell">余额</view>
					</view>
					<view class="table-body">
						<view 
							v-for="(item, index) in accountFlowList" 
							:key="item.id || index"
							class="table-row"
						>
							<view class="table-cell time-cell">{{ formatTime(item.created_at) }}</view>
							<view class="table-cell type-cell">
								<text class="type-badge" :class="item.flow_type || 'other'">
									{{ getFlowTypeText(item.flow_type) }}
								</text>
							</view>
							<view class="table-cell amount-cell" :class="item.flow_type || 'other'">
								{{ (item.change_amount > 0 ? '+' : '') + formatNumber(item.change_amount || 0) }}
							</view>
							<view class="table-cell balance-cell">¥{{ formatNumber(item.balance_after || item.balance || 0) }}</view>
						</view>
						<view v-if="accountFlowList.length === 0" class="empty-state">
							<text class="empty-icon">💳</text>
							<text class="empty-text">暂无流水记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 周补贴明细报表 -->
			<view v-else-if="reportType === 'weeklySubsidy'" class="report-content">
				<!-- 汇总信息 -->
				<view class="subsidy-summary">
					<view class="summary-header">
						<text class="summary-title">周补贴汇总</text>
						<text class="summary-week">{{ reportData.summary?.query_week || '' }}</text>
					</view>
					<view class="summary-info">
						<view class="summary-item">
							<text class="summary-label">周期范围</text>
							<text class="summary-value">{{ reportData.summary?.week_start || '' }} 至 {{ reportData.summary?.week_end || '' }}</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">补贴用户数</text>
							<text class="summary-value">{{ reportData.summary?.total_users || 0 }} 人</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">补贴总额</text>
							<text class="summary-value amount">¥{{ formatNumber(reportData.summary?.total_subsidy_amount || 0) }}</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">积分抵扣总额</text>
							<text class="summary-value">¥{{ formatNumber(reportData.summary?.total_points_deducted || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 明细列表 -->
				<view class="subsidy-records">
					<view class="records-header">
						<text class="records-title">补贴明细</text>
						<text class="records-count" v-if="reportData.pagination">共 {{ reportData.pagination.total || 0 }} 条</text>
					</view>
					<view class="records-list">
						<view 
							v-for="(item, index) in subsidyRecords" 
							:key="item.id || index"
							class="record-item"
						>
							<view class="record-header">
								<view class="record-left">
									<text class="record-user">{{ item.user_name || item.name || `用户${item.user_id || ''}` }}</text>
									<text class="record-time">{{ formatTime(item.created_at || item.distributed_at) }}</text>
								</view>
								<view class="record-amount">
									<text class="amount-text">+¥{{ formatNumber(item.subsidy_amount || item.amount || 0) }}</text>
								</view>
							</view>
							<view class="record-body">
								<view class="record-detail">
									<text class="detail-label">用户ID：</text>
									<text class="detail-value">{{ item.user_id || '-' }}</text>
								</view>
								<view class="record-detail">
									<text class="detail-label">使用积分：</text>
									<text class="detail-value">{{ formatNumber(item.points_used || item.points_deducted || 0) }}</text>
								</view>
								<view class="record-detail">
									<text class="detail-label">积分值：</text>
									<text class="detail-value">{{ formatNumber(item.point_value || 0) }}%</text>
								</view>
							</view>
						</view>
						<view v-if="subsidyRecords.length === 0" class="empty-state">
							<text class="empty-icon">📊</text>
							<text class="empty-text">暂无补贴记录</text>
						</view>
					</view>
					<!-- 分页信息 -->
					<view v-if="reportData.pagination && reportData.pagination.total_pages > 1" class="pagination-info">
						<text class="pagination-text">第 {{ reportData.pagination.page || 1 }} / {{ reportData.pagination.total_pages || 1 }} 页</text>
					</view>
				</view>
			</view>

			<!-- 月补贴明细报表 -->
			<view v-else-if="reportType === 'monthlySubsidy'" class="report-content">
				<!-- 汇总信息 -->
				<view class="subsidy-summary">
					<view class="summary-header">
						<text class="summary-title">月补贴汇总</text>
						<text class="summary-week">{{ reportData.summary?.query_month || '' }}</text>
					</view>
					<view class="summary-info">
						<view class="summary-item">
							<text class="summary-label">周期范围</text>
							<text class="summary-value">{{ reportData.summary?.month_start || '' }} 至 {{ reportData.summary?.month_end || '' }}</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">补贴用户数</text>
							<text class="summary-value">{{ reportData.summary?.total_users || 0 }} 人</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">补贴总额</text>
							<text class="summary-value amount">¥{{ formatNumber(reportData.summary?.total_subsidy_amount || 0) }}</text>
						</view>
						<view class="summary-item">
							<text class="summary-label">积分抵扣总额</text>
							<text class="summary-value">¥{{ formatNumber(reportData.summary?.total_points_deducted || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 明细列表 -->
				<view class="subsidy-records">
					<view class="records-header">
						<text class="records-title">补贴明细</text>
						<text class="records-count" v-if="reportData.pagination">共 {{ reportData.pagination.total || 0 }} 条</text>
					</view>
					<view class="records-list">
						<view 
							v-for="(item, index) in subsidyRecords" 
							:key="item.id || index"
							class="record-item"
						>
							<view class="record-header">
								<view class="record-left">
									<text class="record-user">{{ item.user_name || item.name || `用户${item.user_id || ''}` }}</text>
									<text class="record-time">{{ formatTime(item.created_at || item.distributed_at) }}</text>
								</view>
								<view class="record-amount">
									<text class="amount-text">+¥{{ formatNumber(item.subsidy_amount || item.amount || 0) }}</text>
								</view>
							</view>
							<view class="record-body">
								<view class="record-detail">
									<text class="detail-label">用户ID：</text>
									<text class="detail-value">{{ item.user_id || '-' }}</text>
								</view>
								<view class="record-detail">
									<text class="detail-label">使用积分：</text>
									<text class="detail-value">{{ formatNumber(item.points_used || item.points_deducted || 0) }}</text>
								</view>
								<view class="record-detail">
									<text class="detail-label">积分值：</text>
									<text class="detail-value">{{ formatNumber(item.point_value || 0) }}%</text>
								</view>
							</view>
						</view>
						<view v-if="subsidyRecords.length === 0" class="empty-state">
							<text class="empty-icon">📊</text>
							<text class="empty-text">暂无补贴记录</text>
						</view>
					</view>
					<!-- 分页信息 -->
					<view v-if="reportData.pagination && reportData.pagination.total_pages > 1" class="pagination-info">
						<text class="pagination-text">第 {{ reportData.pagination.page || 1 }} / {{ reportData.pagination.total_pages || 1 }} 页</text>
					</view>
				</view>
			</view>

			<!-- 奖励列表 - 可视化表格 -->
			<view v-else-if="reportType === 'rewardsPending'" class="report-content">
				<!-- 汇总信息 -->
				<view class="rewards-summary">
					<view class="summary-header">
						<text class="summary-title">奖励列表</text>
						<text class="summary-count" v-if="rewardList.length > 0">共 {{ rewardList.length }} 条</text>
					</view>
				</view>

				<!-- 奖励列表 -->
				<view class="rewards-list">
					<view 
						v-for="(item, index) in rewardList" 
						:key="item.id || index"
						class="reward-item"
					>
						<view class="reward-header">
							<view class="reward-left">
								<text class="reward-type" :class="item.reward_type || 'other'">
									{{ getRewardTypeText(item.reward_type) }}
								</text>
								<text class="reward-time">{{ formatTime(item.created_at || item.create_time) }}</text>
							</view>
							<view class="reward-amount" :class="item.status || 'pending'">
								<text class="amount-text">+¥{{ formatNumber(item.amount || item.reward_amount || 0) }}</text>
							</view>
						</view>
						<view class="reward-body">
							<view class="reward-info">
								<text class="info-label">用户：</text>
								<text class="info-value">{{ item.user_name || item.name || `用户${item.user_id || ''}` }}</text>
							</view>
							<view class="reward-info">
								<text class="info-label">状态：</text>
								<text class="info-value status-badge" :class="'status-' + (item.status || 'pending')">
									{{ getRewardStatusText(item.status) }}
								</text>
							</view>
							<view v-if="item.remark || item.description" class="reward-remark">
								<text class="remark-text">{{ item.remark || item.description || '' }}</text>
							</view>
						</view>
					</view>
					<view v-if="rewardList.length === 0" class="empty-state">
						<text class="empty-icon">🎁</text>
						<text class="empty-text">暂无奖励记录</text>
					</view>
				</view>
			</view>

			<!-- 积分抵扣明细报表 -->
			<view v-else-if="reportType === 'pointsDeduction'" class="report-content">
				<!-- 汇总信息 -->
				<view class="points-summary">
					<view class="summary-header">
						<text class="summary-title">抵扣汇总</text>
					</view>
					<view class="summary-cards">
						<view class="summary-card">
							<text class="card-label">订单总数</text>
							<text class="card-value">{{ reportData.summary?.total_orders || 0 }}</text>
						</view>
						<view class="summary-card points">
							<text class="card-label">积分使用总额</text>
							<text class="card-value">{{ formatNumber(reportData.summary?.total_points_used || 0) }}</text>
						</view>
						<view class="summary-card discount">
							<text class="card-label">抵扣金额总额</text>
							<text class="card-value">¥{{ formatNumber(reportData.summary?.total_discount_amount || 0) }}</text>
						</view>
					</view>
				</view>

				<!-- 明细表格 -->
				<view class="points-table-container">
					<view class="table-header">
						<view class="table-header-cell">时间</view>
						<view class="table-header-cell">订单号</view>
						<view class="table-header-cell">使用积分</view>
						<view class="table-header-cell">抵扣金额</view>
					</view>
					<view class="table-body">
						<view 
							v-for="(item, index) in pointsDeductionRecords" 
							:key="item.id || index"
							class="table-row"
						>
							<view class="table-cell time-cell">{{ formatTime(item.created_at || item.order_time) }}</view>
							<view class="table-cell order-cell">{{ item.order_no || item.order_id || '-' }}</view>
							<view class="table-cell points-cell">{{ formatNumber(item.points_used || item.points || 0) }}</view>
							<view class="table-cell amount-cell">¥{{ formatNumber(item.discount_amount || item.amount || 0) }}</view>
						</view>
						<view v-if="pointsDeductionRecords.length === 0" class="empty-state">
							<text class="empty-icon">💳</text>
							<text class="empty-text">暂无抵扣记录</text>
						</view>
					</view>
					<!-- 分页信息 -->
					<view v-if="reportData.pagination && reportData.pagination.total_pages > 1" class="pagination-info">
						<text class="pagination-text">第 {{ reportData.pagination.page || 1 }} / {{ reportData.pagination.total_pages || 1 }} 页</text>
					</view>
				</view>
			</view>

			<!-- 周积分报表 -->
			<view v-else-if="reportType === 'weeklyPoints'" class="report-content">
				<view class="points-list">
					<view class="points-header">
						<text class="points-title">周积分明细</text>
						<text class="points-count" v-if="weeklyPointsList.length > 0">共 {{ weeklyPointsList.length }} 条</text>
					</view>
					<view class="points-records">
						<view 
							v-for="(item, index) in weeklyPointsList" 
							:key="item.id || index"
							class="points-item"
						>
							<view class="points-header-row">
								<view class="points-left">
									<text class="points-user">{{ item.user_name || item.name || item.mobile || `用户${item.user_id || ''}` }}</text>
									<text class="points-time">{{ formatTime(item.created_at || item.time) }}</text>
								</view>
								<view class="points-amount">
									<text class="amount-text" :class="item.change_amount >= 0 ? 'income' : 'expense'">
										{{ item.change_amount >= 0 ? '+' : '' }}{{ formatNumber(item.change_amount || item.points || 0) }}
									</text>
								</view>
							</view>
							<view class="points-body">
								<text class="points-reason">{{ item.reason || item.description || '积分变动' }}</text>
								<text v-if="item.order_no || item.related_order" class="points-order">订单号：{{ item.order_no || item.related_order }}</text>
							</view>
						</view>
						<view v-if="weeklyPointsList.length === 0" class="empty-state">
							<text class="empty-icon">⭐</text>
							<text class="empty-text">暂无周积分记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 联创积分报表 -->
			<view v-else-if="reportType === 'unilevelPoints'" class="report-content">
				<view class="points-list">
					<view class="points-header">
						<text class="points-title">联创积分明细</text>
						<text class="points-count" v-if="unilevelPointsList.length > 0">共 {{ unilevelPointsList.length }} 条</text>
					</view>
					<view class="points-records">
						<view 
							v-for="(item, index) in unilevelPointsList" 
							:key="item.id || index"
							class="points-item"
						>
							<view class="points-header-row">
								<view class="points-left">
									<text class="points-user">{{ item.user_name || item.name || item.mobile || `用户${item.user_id || ''}` }}</text>
									<text class="points-time">{{ formatTime(item.created_at || item.time) }}</text>
								</view>
								<view class="points-amount">
									<text class="amount-text" :class="item.change_amount >= 0 ? 'income' : 'expense'">
										{{ item.change_amount >= 0 ? '+' : '' }}{{ formatNumber(item.change_amount || item.points || 0) }}
									</text>
								</view>
							</view>
							<view class="points-body">
								<text class="points-reason">{{ item.reason || item.description || '积分变动' }}</text>
								<text v-if="item.unilevel" class="points-unilevel">联创等级：{{ item.unilevel }}</text>
							</view>
						</view>
						<view v-if="unilevelPointsList.length === 0" class="empty-state">
							<text class="empty-icon">🌟</text>
							<text class="empty-text">暂无联创积分记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 推荐奖励报表 -->
			<view v-else-if="reportType === 'referralReward'" class="report-content">
				<view class="rewards-list">
					<view class="rewards-header">
						<text class="rewards-title">推荐奖励明细</text>
						<text class="rewards-count" v-if="referralRewardList.length > 0">共 {{ referralRewardList.length }} 条</text>
					</view>
					<view class="rewards-records">
						<view 
							v-for="(item, index) in referralRewardList" 
							:key="item.id || index"
							class="reward-item"
						>
							<view class="reward-header-row">
								<view class="reward-left">
									<text class="reward-user">{{ item.user_name || item.name || `用户${item.user_id || ''}` }}</text>
									<text class="reward-time">{{ formatTime(item.created_at || item.time) }}</text>
								</view>
								<view class="reward-amount" :class="item.status || 'pending'">
									<text class="amount-text">+¥{{ formatNumber(item.amount || item.reward_amount || item.points || 0) }}</text>
								</view>
							</view>
							<view class="reward-body">
								<text class="reward-reason">{{ item.reason || item.description || '推荐奖励' }}</text>
								<view class="reward-info-row">
									<text class="info-label">状态：</text>
									<text class="info-value status-badge" :class="'status-' + (item.status || 'pending')">
										{{ getRewardStatusText(item.status) }}
									</text>
									<text v-if="item.referred_user_id" class="info-label">被推荐人ID：{{ item.referred_user_id }}</text>
								</view>
							</view>
						</view>
						<view v-if="referralRewardList.length === 0" class="empty-state">
							<text class="empty-icon">🎁</text>
							<text class="empty-text">暂无推荐奖励记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 团队奖励报表 -->
			<view v-else-if="reportType === 'teamReward'" class="report-content">
				<view class="rewards-list">
					<view class="rewards-header">
						<text class="rewards-title">团队奖励明细</text>
						<text class="rewards-count" v-if="teamRewardList.length > 0">共 {{ teamRewardList.length }} 条</text>
					</view>
					<view class="rewards-records">
						<view 
							v-for="(item, index) in teamRewardList" 
							:key="item.id || index"
							class="reward-item"
						>
							<view class="reward-header-row">
								<view class="reward-left">
									<text class="reward-user">{{ item.user_name || item.name || `用户${item.user_id || ''}` }}</text>
									<text class="reward-time">{{ formatTime(item.created_at || item.time) }}</text>
								</view>
								<view class="reward-amount" :class="item.status || 'pending'">
									<text class="amount-text">+¥{{ formatNumber(item.amount || item.reward_amount || item.points || 0) }}</text>
								</view>
							</view>
							<view class="reward-body">
								<text class="reward-reason">{{ item.reason || item.description || '团队奖励' }}</text>
								<view class="reward-info-row">
									<text class="info-label">层级：</text>
									<text class="info-value">{{ item.layer || item.level || '-' }}层</text>
									<text v-if="item.team_member_id" class="info-label">团队成员ID：{{ item.team_member_id }}</text>
								</view>
							</view>
						</view>
						<view v-if="teamRewardList.length === 0" class="empty-state">
							<text class="empty-icon">👥</text>
							<text class="empty-text">暂无团队奖励记录</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 周补贴用户雨点报表 -->
			<view v-else-if="reportType === 'subsidyPointsReport'" class="report-content">
				<view class="points-list">
					<view class="points-header">
						<text class="points-title">周补贴用户雨点报表</text>
						<text class="points-count" v-if="reportData.summary">共 {{ reportData.summary.total_users || pointsReportList.length }} 个用户</text>
					</view>
					<view class="points-records">
						<view 
							v-for="(item, index) in pointsReportList" 
							:key="item.user_id || index"
							class="points-item"
						>
							<view class="points-header-row">
								<view class="points-left">
									<text class="points-user">{{ item.user_name || `用户${item.user_id || ''}` }}</text>
									<text class="points-time">用户ID：{{ item.user_id }}</text>
								</view>
							</view>
							<view class="points-body">
								<view class="points-info-row">
									<text class="info-label">当前余额：</text>
									<text class="info-value">{{ formatNumber(item.current_balance || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">累计获得：</text>
									<text class="info-value">{{ formatNumber(item.total_earned || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">累计使用：</text>
									<text class="info-value">{{ formatNumber(item.total_used || 0) }}</text>
								</view>
								<text class="points-reason" v-if="item.remark">{{ item.remark }}</text>
							</view>
						</view>
						<view v-if="pointsReportList.length === 0" class="empty-state">
							<text class="empty-icon">📊</text>
							<text class="empty-text">暂无数据</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 联创星级用户雨点报表 -->
			<view v-else-if="reportType === 'unilevelPointsReport'" class="report-content">
				<view class="points-list">
					<view class="points-header">
						<text class="points-title">联创星级用户雨点报表</text>
						<text class="points-count" v-if="reportData.summary">共 {{ reportData.summary.total_users || pointsReportList.length }} 个用户</text>
					</view>
					<view class="points-records">
						<view 
							v-for="(item, index) in pointsReportList" 
							:key="item.user_id || index"
							class="points-item"
						>
							<view class="points-header-row">
								<view class="points-left">
									<text class="points-user">{{ item.user_name || `用户${item.user_id || ''}` }}</text>
									<text class="points-time">用户ID：{{ item.user_id }}</text>
								</view>
							</view>
							<view class="points-body">
								<view class="points-info-row">
									<text class="info-label">当前余额：</text>
									<text class="info-value">{{ formatNumber(item.current_balance || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">累计获得：</text>
									<text class="info-value">{{ formatNumber(item.total_earned || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">累计使用：</text>
									<text class="info-value">{{ formatNumber(item.total_used || 0) }}</text>
								</view>
								<text class="points-reason" v-if="item.remark">{{ item.remark }}</text>
							</view>
						</view>
						<view v-if="pointsReportList.length === 0" class="empty-state">
							<text class="empty-icon">🌟</text>
							<text class="empty-text">暂无数据</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 推荐+团队合并用户雨点报表 -->
			<view v-else-if="reportType === 'referralTeamPointsReport'" class="report-content">
				<view class="points-list">
					<view class="points-header">
						<text class="points-title">推荐+团队合并用户雨点报表</text>
						<text class="points-count" v-if="reportData.summary">共 {{ reportData.summary.total_users || pointsReportList.length }} 个用户</text>
					</view>
					<view class="points-records">
						<view 
							v-for="(item, index) in pointsReportList" 
							:key="item.user_id || index"
							class="points-item"
						>
							<view class="points-header-row">
								<view class="points-left">
									<text class="points-user">{{ item.user_name || `用户${item.user_id || ''}` }}</text>
									<text class="points-time">用户ID：{{ item.user_id }}</text>
								</view>
							</view>
							<view class="points-body">
								<text class="points-reason" style="font-weight: 600; margin-bottom: 12rpx;">推荐雨点：</text>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">当前余额：</text>
									<text class="info-value">{{ formatNumber(item.referral_points?.current_balance || 0) }}</text>
								</view>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">累计获得：</text>
									<text class="info-value">{{ formatNumber(item.referral_points?.total_earned || 0) }}</text>
								</view>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">累计使用：</text>
									<text class="info-value">{{ formatNumber(item.referral_points?.total_used || 0) }}</text>
								</view>
								
								<text class="points-reason" style="font-weight: 600; margin-top: 16rpx; margin-bottom: 12rpx;">团队雨点：</text>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">当前余额：</text>
									<text class="info-value">{{ formatNumber(item.team_points?.current_balance || 0) }}</text>
								</view>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">累计获得：</text>
									<text class="info-value">{{ formatNumber(item.team_points?.total_earned || 0) }}</text>
								</view>
								<view class="points-info-row" style="margin-left: 20rpx;">
									<text class="info-label">累计使用：</text>
									<text class="info-value">{{ formatNumber(item.team_points?.total_used || 0) }}</text>
								</view>
								
								<view class="points-info-row" style="margin-top: 16rpx; font-weight: 600;">
									<text class="info-label">合计余额：</text>
									<text class="info-value amount-text income">{{ formatNumber(item.combined_total?.total_balance || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">合计获得：</text>
									<text class="info-value">{{ formatNumber(item.combined_total?.total_earned || 0) }}</text>
								</view>
								<view class="points-info-row">
									<text class="info-label">合计使用：</text>
									<text class="info-value">{{ formatNumber(item.combined_total?.total_used || 0) }}</text>
								</view>
							</view>
						</view>
						<view v-if="pointsReportList.length === 0" class="empty-state">
							<text class="empty-icon">🎁</text>
							<text class="empty-text">暂无数据</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 所有雨点流水报表 -->
			<view v-else-if="reportType === 'allPointsReport'" class="report-content">
				<view class="all-points-report">
					<!-- 报表头部 -->
					<view class="report-header-card">
						<view class="header-title-row">
							<text class="report-main-title">所有雨点流水报表</text>
							<view class="user-count-badge" v-if="reportData.summary || pointsReportList.length > 0">
								<text class="user-count-text">共 {{ reportData.summary?.total_users || pointsReportList.length }} 个用户</text>
							</view>
						</view>
					</view>
					
					<!-- 用户列表 -->
					<view class="users-list">
						<view 
							v-for="(item, index) in pointsReportList" 
							:key="item.user_id || index"
							class="user-card"
						>
							<!-- 用户头部 -->
							<view class="user-card-header">
								<view class="user-avatar-placeholder">
									<text class="user-avatar-text">{{ (item.user_name || '用户').charAt(0) }}</text>
								</view>
								<view class="user-info">
									<text class="user-name">{{ item.user_name || `用户${item.user_id || ''}` }}</text>
									<text class="user-id">用户ID：{{ item.user_id }}</text>
								</view>
							</view>
							
							<!-- 总计 -->
							<view class="points-details">
								<view class="point-total-card">
									<view class="total-header">
										<text class="total-title">总计</text>
									</view>
									<view class="total-body">
										<view class="total-stat-item">
											<text class="total-label">剩余雨水</text>
											<text class="total-value highlight">{{ formatNumber(item.grand_total?.total_balance || 0) }}</text>
										</view>
										<view class="total-stat-item">
											<text class="total-label">累计雨水</text>
											<text class="total-value income">{{ formatNumber(item.grand_total?.total_earned || 0) }}</text>
										</view>
										<view class="total-stat-item">
											<text class="total-label">已用雨水</text>
											<text class="total-value expense">{{ formatNumber(item.grand_total?.total_used || 0) }}</text>
										</view>
									</view>
								</view>
							</view>
						</view>
						
						<!-- 空状态 -->
						<view v-if="pointsReportList.length === 0" class="empty-state-card">
							<text class="empty-icon">💳</text>
							<text class="empty-text">暂无数据</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 其他报表类型 - 通用表格显示 -->
			<view v-else class="report-content">
				<view class="data-table">
					<view class="table-item" v-for="(value, key) in reportData" :key="key">
						<text class="table-label">{{ formatKey(key) }}</text>
						<text class="table-value">{{ formatValue(value) }}</text>
					</view>
					<view v-if="Object.keys(reportData).length === 0" class="empty-state">
						<text class="empty-icon">📋</text>
						<text class="empty-text">暂无数据</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 日期选择弹窗 (同 finance.vue) -->
		<view v-if="showDatePicker" class="date-picker-modal" @tap="closeDatePicker">
			<view class="date-picker-content" @tap.stop>
				<view class="date-picker-header">
					<text class="date-picker-title">选择查询范围</text>
					<text class="date-picker-close" @tap="closeDatePicker">×</text>
				</view>
				
				<!-- 周查询模式 -->
				<view v-if="datePickerType === 'week'" class="date-picker-body">
					<view class="date-picker-item">
						<text class="date-picker-label">选择周</text>
						<picker mode="date" :value="pickerDate" @change="onWeekChange">
							<view class="date-picker-value">
								<text>{{ weekDisplayText }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
						<text class="date-tip">点击选择日期，系统将自动识别该日期所在的周</text>
					</view>
				</view>
				
				<!-- 月查询模式 -->
				<view v-else-if="datePickerType === 'month'" class="date-picker-body">
					<view class="date-picker-item">
						<text class="date-picker-label">选择月份</text>
						<picker mode="date" fields="month" :value="pickerDate" @change="onMonthChange">
							<view class="date-picker-value">
								<text>{{ monthDisplayText }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
				</view>
				
				<!-- 日期范围查询模式 -->
				<view v-else-if="datePickerType === 'range'" class="date-picker-body">
					<view class="date-picker-item">
						<text class="date-picker-label">开始日期</text>
						<picker mode="date" :value="startDate" @change="onStartDateChange">
							<view class="date-picker-value">
								<text>{{ startDate || '请选择' }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					<view class="date-picker-item">
						<text class="date-picker-label">结束日期</text>
						<picker mode="date" :value="endDate" :start="startDate" @change="onEndDateChange">
							<view class="date-picker-value">
								<text>{{ endDate || '请选择' }}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
				</view>

				<view class="date-picker-footer">
					<button class="date-picker-btn cancel-btn" @tap="closeDatePicker">取消</button>
					<button class="date-picker-btn confirm-btn" @tap="confirmDateSelection">确定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
	getPublicWelfareBalance,
	getPublicWelfareFlow,
	getPublicWelfareReport,
	getWeeklySubsidyReport,
	getMonthlySubsidyReport,
	getRewardsPending,
	getFinanceReport,
	getAccountFlowReport,
	getPointsDeductionReport
} from '@/api/reports.js'
import { getSubsidyReport, getUniLevelReport, getReferralTeamReport, getAllPointsReport } from '../../api/reward.js'

const reportType = ref('')
const reportTitle = ref('')
const reportData = ref({})
const flowList = ref([])
const poolList = ref([])
const accountFlowList = ref([])
const subsidyRecords = ref([])
const welfareDetails = ref([])
const rewardList = ref([])
const pointsDeductionRecords = ref([])
const weeklyPointsList = ref([])
const unilevelPointsList = ref([])
const referralRewardList = ref([])
const teamRewardList = ref([])
const pointsReportList = ref([]) // 用于存储4个新报表的数据列表

// 日期选择相关
const showDatePicker = ref(false)
const startDate = ref('')
const endDate = ref('')
const pickerDate = ref('') // 用于周和月的 picker 绑定
const selectedYear = ref(0)
const selectedWeek = ref(0)
const selectedMonth = ref(0)

// 报表需要的日期类型
const datePickerType = computed(() => {
	switch (reportType.value) {
		case 'weeklySubsidy': return 'week'
		case 'monthlySubsidy': return 'month'
		case 'publicWelfareReport':
			return 'range'
		case 'subsidyPointsReport':
		case 'unilevelPointsReport':
		case 'referralTeamPointsReport':
		case 'allPointsReport':
			// 这4个报表不需要参数，不显示日期选择器
			return 'none'
		default:
			return 'none'
	}
})

// 格式化日期
const formatDate = (date) => {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

/**
 * 获取日期所在的年份和周数（ISO 8601 标准）
 */
const getYearWeek = (dateStr) => {
	const date = new Date(dateStr + 'T00:00:00')
	const year = date.getFullYear()
	const jan4 = new Date(year, 0, 4)
	const jan4Day = jan4.getDay() || 7
	const weekStart = new Date(jan4)
	weekStart.setDate(jan4.getDate() - jan4Day + 1)
	
	if (date < weekStart) {
		const prevYear = year - 1
		const prevJan4 = new Date(prevYear, 0, 4)
		const prevJan4Day = prevJan4.getDay() || 7
		const prevWeekStart = new Date(prevJan4)
		prevWeekStart.setDate(prevJan4.getDate() - prevJan4Day + 1)
		const diffTime = date - prevWeekStart
		const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
		const week = Math.floor(diffDays / 7) + 1
		return { year: prevYear, week }
	}
	
	const diffTime = date - weekStart
	const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
	const week = Math.floor(diffDays / 7) + 1
	return { year, week }
}

const dateDisplayText = computed(() => {
	if (datePickerType.value === 'week') {
		return `${selectedYear.value}年 第${selectedWeek.value}周`
	} else if (datePickerType.value === 'month') {
		return `${selectedYear.value}年 ${selectedMonth.value}月`
	} else if (datePickerType.value === 'range') {
		return `${startDate.value} 至 ${endDate.value}`
	}
	return ''
})

const weekDisplayText = computed(() => {
	if (!pickerDate.value) return '请选择日期'
	const { year, week } = getYearWeek(pickerDate.value)
	return `${year}年 第${week}周`
})

const monthDisplayText = computed(() => {
	if (!pickerDate.value) return '请选择月份'
	const date = new Date(pickerDate.value + '-01T00:00:00')
	return `${date.getFullYear()}年 ${date.getMonth() + 1}月`
})

// 初始化默认日期
const initDefaultDate = () => {
	const today = new Date()
	const todayStr = formatDate(today)
	
	if (datePickerType.value === 'week') {
		const { year, week } = getYearWeek(todayStr)
		selectedYear.value = year
		selectedWeek.value = week
		pickerDate.value = todayStr
	} else if (datePickerType.value === 'month') {
		selectedYear.value = today.getFullYear()
		selectedMonth.value = today.getMonth() + 1
		pickerDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
	} else if (datePickerType.value === 'range') {
		const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
		startDate.value = formatDate(firstDay)
		endDate.value = todayStr
	}
}

const openDatePicker = () => {
	showDatePicker.value = true
}

const closeDatePicker = () => {
	showDatePicker.value = false
}

const onWeekChange = (e) => {
	pickerDate.value = e.detail.value
}

const onMonthChange = (e) => {
	pickerDate.value = e.detail.value
}

const onStartDateChange = (e) => {
	startDate.value = e.detail.value
}

const onEndDateChange = (e) => {
	endDate.value = e.detail.value
}

const confirmDateSelection = () => {
	if (datePickerType.value === 'week') {
		const { year, week } = getYearWeek(pickerDate.value)
		selectedYear.value = year
		selectedWeek.value = week
	} else if (datePickerType.value === 'month') {
		const date = new Date(pickerDate.value + '-01T00:00:00')
		selectedYear.value = date.getFullYear()
		selectedMonth.value = date.getMonth() + 1
	} else if (datePickerType.value === 'range') {
		if (!startDate.value || !endDate.value) {
			uni.showToast({ title: '请选择日期范围', icon: 'none' })
			return
		}
	}
	
	showDatePicker.value = false
	fetchReportData()
}

/**
 * 加载报表数据
 */
const fetchReportData = async () => {
	uni.showLoading({ title: '加载中...' })
	try {
		let params = {}
		const userInfo = uni.getStorageSync('userInfo') || {}
		const userId = userInfo.user_id || userInfo.id || userInfo.userId || userInfo.uid

		if (datePickerType.value === 'week') {
			params = { year: selectedYear.value, week: selectedWeek.value, page: 1, page_size: 100 }
			if (userId) params.user_id = userId
		} else if (datePickerType.value === 'month') {
			params = { year: selectedYear.value, month: selectedMonth.value, page: 1, page_size: 100 }
			if (userId) params.user_id = userId
		} else if (datePickerType.value === 'range') {
			params = { start_date: startDate.value, end_date: endDate.value, page: 1, page_size: 100 }
		}

		let res = null
		switch (reportType.value) {
			case 'publicWelfareBalance':
				res = await getPublicWelfareBalance()
				break
			case 'publicWelfareFlow':
				res = await getPublicWelfareFlow({ page: 1, pageSize: 100 })
				break
			case 'publicWelfareReport':
				res = await getPublicWelfareReport(params)
				break
			case 'weeklySubsidy':
				res = await getWeeklySubsidyReport(params)
				break
			case 'monthlySubsidy':
				res = await getMonthlySubsidyReport(params)
				break
			case 'subsidyPointsReport':
				// 周补贴用户雨点报表 - 不需要参数
				res = await getSubsidyReport()
				break
			case 'unilevelPointsReport':
				// 联创星级用户雨点报表 - 不需要参数
				res = await getUniLevelReport()
				break
			case 'referralTeamPointsReport':
				// 推荐+团队合并用户雨点报表 - 不需要参数
				res = await getReferralTeamReport()
				break
			case 'allPointsReport':
				// 所有雨点流水报表 - 不需要参数
				res = await getAllPointsReport()
				break
		}

		if (res) {
			processReportData(res.data || res)
		} else {
			processReportData({})
			uni.showToast({ title: '暂无数据', icon: 'none' })
		}
	} catch (error) {
		console.error('加载报表数据失败', error)
		uni.showToast({ title: error.message || '加载失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

/**
 * 处理报表数据 (原 onload 里的解析逻辑)
 */
const processReportData = (data) => {
	console.log('[报表详情] 处理数据:', data)
	
	// 重置现有列表
	flowList.value = []
	poolList.value = []
	accountFlowList.value = []
	subsidyRecords.value = []
	welfareDetails.value = []
	rewardList.value = []
	pointsDeductionRecords.value = []
	pointsReportList.value = []
	
	if (data.flows && Array.isArray(data.flows)) {
		flowList.value = data.flows
		reportData.value = { ...data }
	} else if (data.platform_pools && Array.isArray(data.platform_pools)) {
		poolList.value = data.platform_pools
		reportData.value = data
	} else if (reportType.value === 'accountFlow' && Array.isArray(data)) {
		accountFlowList.value = data
		reportData.value = {}
	} else if (reportType.value === 'accountFlow' && data.data && Array.isArray(data.data)) {
		accountFlowList.value = data.data
		reportData.value = data
	} else if (reportType.value === 'accountFlow' && data.list && Array.isArray(data.list)) {
		accountFlowList.value = data.list
		reportData.value = data
	} else if (reportType.value === 'weeklySubsidy') {
		reportData.value = data
		subsidyRecords.value = data.records || data.data?.records || []
	} else if (reportType.value === 'monthlySubsidy') {
		reportData.value = data
		subsidyRecords.value = data.records || data.data?.records || []
	} else if (reportType.value === 'publicWelfareReport') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		welfareDetails.value = reportDataObj.details || []
	} else if (reportType.value === 'rewardsPending') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		rewardList.value = reportDataObj.rewards || []
	} else if (reportType.value === 'pointsDeduction') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		pointsDeductionRecords.value = reportDataObj.records || []
	} else if (reportType.value === 'weeklyPoints') {
		// 周积分使用积分流水接口，数据格式为 { rows: [] } 或 { data: { rows: [] } } 或 { list: [] }
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		if (Array.isArray(reportDataObj.rows)) {
			weeklyPointsList.value = reportDataObj.rows
		} else if (Array.isArray(reportDataObj.list)) {
			weeklyPointsList.value = reportDataObj.list
		} else if (Array.isArray(reportDataObj)) {
			weeklyPointsList.value = reportDataObj
		} else {
			weeklyPointsList.value = []
		}
	} else if (reportType.value === 'unilevelPoints') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		unilevelPointsList.value = reportDataObj.list || reportDataObj.records || reportDataObj.data || []
	} else if (reportType.value === 'referralReward') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		referralRewardList.value = reportDataObj.rewards || reportDataObj.list || reportDataObj.data || []
	} else if (reportType.value === 'teamReward') {
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		teamRewardList.value = reportDataObj.rewards || reportDataObj.list || reportDataObj.data || []
	} else if (reportType.value === 'subsidyPointsReport' || 
	           reportType.value === 'unilevelPointsReport' || 
	           reportType.value === 'referralTeamPointsReport' || 
	           reportType.value === 'allPointsReport') {
		// 处理4个新的雨点报表 - 数据格式为 { data: { users: [], summary: {} } }
		const reportDataObj = data.data || data
		reportData.value = reportDataObj
		// 从 data.users 中获取用户列表
		if (reportDataObj && Array.isArray(reportDataObj.users)) {
			pointsReportList.value = reportDataObj.users
		} else if (Array.isArray(reportDataObj)) {
			pointsReportList.value = reportDataObj
		} else {
			pointsReportList.value = []
		}
	} else {
		reportData.value = data
	}
}

/**
 * 格式化数字（添加千分位）
 */
const formatNumber = (num) => {
	if (!num && num !== 0) return '0'
	const numStr = String(num)
	if (numStr.includes('.')) {
		const parts = numStr.split('.')
		const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		return `${intPart}.${parts[1]}`
	}
	if (numStr.length <= 3) return numStr
	return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 格式化时间
 */
const formatTime = (timeStr) => {
	if (!timeStr) return ''
	return timeStr.replace('T', ' ').substring(0, 19)
}

/**
 * 获取流水类型文本
 */
const getFlowTypeText = (type) => {
	return type === 'income' ? '收入' : type === 'expense' ? '支出' : '其他'
}

/**
 * 获取奖励类型文本
 */
const getRewardTypeText = (type) => {
	const typeMap = {
		'referral': '推荐奖励',
		'team': '团队奖励',
		'promotion': '推广费',
		'weekly': '周补贴',
		'director': '董事分红'
	}
	return typeMap[type] || '其他奖励'
}

/**
 * 获取奖励状态文本
 */
const getRewardStatusText = (status) => {
	const statusMap = {
		'pending': '待审核',
		'approved': '已通过',
		'rejected': '已拒绝',
		'completed': '已完成'
	}
	return statusMap[status] || '未知'
}

/**
 * 格式化键名
 */
const formatKey = (key) => {
	const keyMap = {
		account_name: '账户名称',
		account_type: '账户类型',
		balance: '余额',
		reserved: '预留金额',
		remark: '备注',
		flows: '流水列表',
		total: '总计',
		count: '数量'
	}
	return keyMap[key] || key
}

/**
 * 格式化值
 */
const formatValue = (value) => {
	if (value === null || value === undefined) return '-'
	if (typeof value === 'object') {
		return JSON.stringify(value, null, 2)
	}
	if (typeof value === 'number' && value.toString().includes('.')) {
		return formatNumber(value)
	}
	return String(value)
}

/**
 * 获取资金池名称
 */
const getPoolName = (name) => {
	const nameMap = {
		'subsidy': '补贴资金池',
		'public': '公益基金',
		'maintain': '维护资金池',
		'director': '董事资金池',
		'shop': '店铺资金池'
	}
	return nameMap[name] || name
}

/**
 * 获取资金池类型
 */
const getPoolType = (type) => {
	const typeMap = {
		'subsidy_pool': '补贴池',
		'public_welfare': '公益',
		'maintain_pool': '维护池',
		'director_pool': '联创奖励池',
		'shop_pool': '店铺池'
	}
	return typeMap[type] || type
}

onLoad((options) => {
	if (options.type) {
		reportType.value = options.type
	}
	if (options.title) {
		reportTitle.value = decodeURIComponent(options.title)
		uni.setNavigationBarTitle({
			title: reportTitle.value
		})
	}

	// 初始化默认日期并加载数据
	initDefaultDate()
	
	if (options.data) {
		// 如果是从外部传来的初始数据，优先展示
		try {
			const data = JSON.parse(decodeURIComponent(options.data))
			processReportData(data)
		} catch (e) {
			console.error('解析预传数据失败', e)
			fetchReportData()
		}
	} else {
		// 否则根据默认日期加载
		fetchReportData()
	}
})
</script>

<style scoped>
.report-detail-page {
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

.content-scroll {
	height: calc(100vh - 120rpx);
	padding: 30rpx 30rpx 30rpx 30rpx;
	box-sizing: border-box;
}

.report-content {
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
	margin: 0;
	box-sizing: border-box;
}

/* 余额卡片 */
.balance-card {
	padding: 40rpx;
}

.balance-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}

.balance-header:last-of-type {
	border-bottom: none;
}

.balance-label {
	font-size: 28rpx;
	color: #666;
}

.balance-value {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.balance-amount {
	padding: 40rpx 0;
	text-align: center;
	border-top: 2rpx solid #f0f0f0;
	border-bottom: 2rpx solid #f0f0f0;
	margin: 30rpx 0;
}

.amount-label {
	display: block;
	font-size: 26rpx;
	color: #999;
	margin-bottom: 16rpx;
}

.amount-value {
	display: block;
	font-size: 56rpx;
	font-weight: bold;
	color: #ff6b6b;
}

.balance-remark {
	margin-top: 30rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid #f5f5f5;
}

.remark-label {
	display: block;
	font-size: 26rpx;
	color: #999;
	margin-bottom: 12rpx;
}

.remark-text {
	display: block;
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
}

/* 流水列表 */
.flow-list {
	padding: 0;
}

.flow-item {
	padding: 32rpx 30rpx 32rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	box-sizing: border-box;
}

.flow-item:last-child {
	border-bottom: none;
}

.flow-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.flow-left {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	min-width: 0;
	padding-right: 20rpx;
}

.flow-type {
	font-size: 24rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
	width: fit-content;
}

.flow-type.income {
	background: #e8f5e9;
	color: #4caf50;
}

.flow-type.expense {
	background: #ffebee;
	color: #f44336;
}

.flow-time {
	font-size: 24rpx;
	color: #999;
}

.flow-right {
	text-align: right;
	padding-right: 0;
	margin-left: 20rpx;
}

.flow-amount {
	font-size: 32rpx;
	font-weight: bold;
}

.flow-amount.income {
	color: #4caf50;
}

.flow-amount.expense {
	color: #f44336;
}

.flow-body {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 12rpx;
	padding-right: 0;
}

.flow-remark {
	font-size: 26rpx;
	color: #666;
	flex: 1;
	padding-right: 20rpx;
	word-break: break-all;
}

.flow-balance {
	font-size: 24rpx;
	color: #999;
	white-space: nowrap;
	flex-shrink: 0;
}

/* 通用表格 */
.data-table {
	padding: 0;
}

.table-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 32rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}

.table-item:last-child {
	border-bottom: none;
}

.table-label {
	font-size: 28rpx;
	color: #666;
	font-weight: 500;
}

.table-value {
	font-size: 28rpx;
	color: #333;
	flex: 1;
	text-align: right;
	margin-left: 20rpx;
	word-break: break-all;
}

/* 空状态 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 0;
}

.empty-icon {
	font-size: 120rpx;
	opacity: 0.3;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

/* 财务总览样式 */
.finance-section {
	margin-bottom: 40rpx;
	padding: 30rpx;
}

.finance-section:first-child {
	padding-top: 40rpx;
}

.finance-section:last-child {
	padding-bottom: 40rpx;
	margin-bottom: 0;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 24rpx;
	padding-bottom: 16rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.finance-cards {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
	padding-right: 0;
	box-sizing: border-box;
}

.finance-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16rpx;
	padding: 32rpx;
	text-align: center;
	color: white;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.finance-card:nth-child(2) {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	box-shadow: 0 4rpx 12rpx rgba(245, 87, 108, 0.3);
}

.finance-card:nth-child(3) {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.3);
}

.card-label {
	display: block;
	font-size: 24rpx;
	opacity: 0.9;
	margin-bottom: 12rpx;
}

.card-value {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
}

/* 资金池列表 */
.pool-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.pool-item {
	background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%);
	border-radius: 16rpx;
	padding: 32rpx;
	border-left: 6rpx solid #667eea;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.pool-item:nth-child(2) {
	border-left-color: #4ecdc4;
}

.pool-item:nth-child(3) {
	border-left-color: #ffe66d;
}

.pool-item:nth-child(4) {
	border-left-color: #95e1d3;
}

.pool-item:nth-child(5) {
	border-left-color: #a8e6cf;
}

.pool-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.pool-name {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
}

.pool-type {
	font-size: 24rpx;
	color: #999;
	background: #fff;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
}

.pool-balance {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 20rpx;
	border-top: 1rpx solid #e0e0e0;
}

.balance-label {
	font-size: 26rpx;
	color: #666;
}

.balance-value {
	font-size: 36rpx;
	font-weight: bold;
	color: #667eea;
}

/* 资金流水表格 */
.flow-table-container {
	overflow-x: auto;
}

.table-header {
	display: flex;
	background: #f8f9fa;
	border-bottom: 2rpx solid #e0e0e0;
	position: sticky;
	top: 0;
	z-index: 10;
}

.table-header-cell {
	flex: 1;
	padding: 24rpx 16rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: #333;
	text-align: center;
	min-width: 0;
}

.table-header-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
}

.table-header-cell:last-child {
	padding-right: 30rpx;
}

.table-body {
	display: flex;
	flex-direction: column;
}

.table-row {
	display: flex;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.2s;
}

.table-row:active {
	background: #f8f9fa;
}

.table-cell {
	flex: 1;
	padding: 28rpx 16rpx;
	font-size: 26rpx;
	color: #333;
	text-align: center;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.table-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
	justify-content: flex-start;
}

.table-cell:last-child {
	padding-right: 30rpx;
}

.time-cell {
	font-size: 24rpx;
	color: #666;
}

.type-cell {
	justify-content: center;
}

.type-badge {
	display: inline-block;
	padding: 6rpx 16rpx;
	border-radius: 12rpx;
	font-size: 22rpx;
	font-weight: 500;
}

.type-badge.income {
	background: #e8f5e9;
	color: #4caf50;
}

.type-badge.expense {
	background: #ffebee;
	color: #f44336;
}

.type-badge.other {
	background: #f5f5f5;
	color: #666;
}

.amount-cell {
	font-weight: 600;
	font-size: 28rpx;
}

.amount-cell.income {
	color: #4caf50;
}

.amount-cell.expense {
	color: #f44336;
}

.amount-cell.other {
	color: #666;
}

.balance-cell {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

/* 周补贴报表样式 */
.subsidy-summary {
	padding: 40rpx 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.summary-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.summary-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.summary-week {
	font-size: 28rpx;
	color: #667eea;
	font-weight: 500;
	background: #f0f4ff;
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
}

.summary-info {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.summary-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}

.summary-item:last-child {
	border-bottom: none;
}

.summary-label {
	font-size: 28rpx;
	color: #666;
}

.summary-value {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
}

.summary-value.amount {
	font-size: 32rpx;
	color: #ff6b6b;
	font-weight: bold;
}

.subsidy-records {
	padding: 30rpx;
}

.records-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 16rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.records-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333;
}

.records-count {
	font-size: 24rpx;
	color: #999;
}

.records-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.record-item {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 24rpx;
	border-left: 4rpx solid #667eea;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.record-left {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.record-user {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
}

.record-time {
	font-size: 24rpx;
	color: #999;
}

.record-amount {
	text-align: right;
}

.amount-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #4caf50;
}

.record-body {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #e0e0e0;
}

.record-detail {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.detail-label {
	font-size: 24rpx;
	color: #666;
}

.detail-value {
	font-size: 24rpx;
	color: #333;
	font-weight: 500;
}

.pagination-info {
	text-align: center;
	padding: 30rpx 0;
	margin-top: 20rpx;
	border-top: 1rpx solid #f0f0f0;
}

.pagination-text {
	font-size: 24rpx;
	color: #999;
}

/* 公益基金交易报表样式 */
.welfare-summary {
	padding: 40rpx 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.welfare-summary .summary-header {
	margin-bottom: 24rpx;
}

.welfare-summary .summary-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.summary-cards {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20rpx;
}

.welfare-summary .summary-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	text-align: center;
	color: white;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.welfare-summary .summary-card.income {
	background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
	box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.welfare-summary .summary-card.expense {
	background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
	box-shadow: 0 4rpx 12rpx rgba(244, 67, 54, 0.3);
}

.welfare-summary .summary-card.net {
	background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
	box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.3);
}

.welfare-summary .card-label {
	display: block;
	font-size: 24rpx;
	opacity: 0.9;
	margin-bottom: 12rpx;
}

.welfare-summary .card-value {
	display: block;
	font-size: 32rpx;
	font-weight: bold;
}

.welfare-table-container {
	overflow-x: auto;
	padding: 0;
}

.welfare-table-container .table-header {
	display: flex;
	background: #f8f9fa;
	border-bottom: 2rpx solid #e0e0e0;
	position: sticky;
	top: 0;
	z-index: 10;
}

.welfare-table-container .table-header-cell {
	flex: 1;
	padding: 24rpx 16rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: #333;
	text-align: center;
	min-width: 0;
}

.welfare-table-container .table-header-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
}

.welfare-table-container .table-header-cell:last-child {
	padding-right: 30rpx;
}

.welfare-table-container .table-body {
	display: flex;
	flex-direction: column;
}

.welfare-table-container .table-row {
	display: flex;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.2s;
}

.welfare-table-container .table-row:active {
	background: #f8f9fa;
}

.welfare-table-container .table-cell {
	flex: 1;
	padding: 28rpx 16rpx;
	font-size: 26rpx;
	color: #333;
	text-align: center;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.welfare-table-container .table-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
	justify-content: flex-start;
}

.welfare-table-container .table-cell:last-child {
	padding-right: 30rpx;
}

.welfare-table-container .time-cell {
	font-size: 24rpx;
	color: #666;
}

.welfare-table-container .type-cell {
	justify-content: center;
}

.welfare-table-container .amount-cell {
	font-weight: 600;
	font-size: 28rpx;
}

.welfare-table-container .amount-cell.income {
	color: #4caf50;
}

.welfare-table-container .amount-cell.expense {
	color: #f44336;
}

.welfare-table-container .amount-cell.other {
	color: #666;
}

.welfare-table-container .balance-cell {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

/* 奖励列表样式 */
.rewards-summary {
	padding: 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.rewards-summary .summary-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.rewards-summary .summary-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.rewards-summary .summary-count {
	font-size: 24rpx;
	color: #999;
}

.rewards-list {
	padding: 0;
}

.reward-item {
	padding: 32rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	background: #fff;
}

.reward-item:last-child {
	border-bottom: none;
}

.reward-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.reward-left {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.reward-type {
	font-size: 24rpx;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
	width: fit-content;
	background: #e3f2fd;
	color: #1976d2;
}

.reward-type.referral {
	background: #e8f5e9;
	color: #4caf50;
}

.reward-type.team {
	background: #fff3e0;
	color: #ff9800;
}

.reward-type.other {
	background: #f5f5f5;
	color: #666;
}

.reward-time {
	font-size: 24rpx;
	color: #999;
}

.reward-amount {
	text-align: right;
}

.reward-amount .amount-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #4caf50;
}

.reward-amount.pending .amount-text {
	color: #ff9800;
}

.reward-amount.approved .amount-text {
	color: #4caf50;
}

.reward-amount.rejected .amount-text {
	color: #f44336;
}

.reward-body {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #f0f0f0;
}

.reward-info {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.info-label {
	font-size: 24rpx;
	color: #666;
}

.info-value {
	font-size: 24rpx;
	color: #333;
	font-weight: 500;
}

.status-badge {
	display: inline-block;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 22rpx;
}

.status-badge.status-pending {
	background: #fff3e0;
	color: #ff9800;
}

.status-badge.status-approved {
	background: #e8f5e9;
	color: #4caf50;
}

.status-badge.status-rejected {
	background: #ffebee;
	color: #f44336;
}

.status-badge.status-completed {
	background: #e3f2fd;
	color: #1976d2;
}

.reward-remark {
	margin-top: 8rpx;
	padding-top: 12rpx;
	border-top: 1rpx solid #f5f5f5;
}

.remark-text {
	font-size: 24rpx;
	color: #666;
	line-height: 1.5;
}

/* 积分抵扣明细报表样式 */
.points-summary {
	padding: 40rpx 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.points-summary .summary-header {
	margin-bottom: 24rpx;
}

.points-summary .summary-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.points-summary .summary-cards {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 20rpx;
}

.points-summary .summary-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	text-align: center;
	color: white;
	box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.points-summary .summary-card.points {
	background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
	box-shadow: 0 4rpx 12rpx rgba(255, 152, 0, 0.3);
}

.points-summary .summary-card.discount {
	background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
	box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.points-summary .card-label {
	display: block;
	font-size: 24rpx;
	opacity: 0.9;
	margin-bottom: 12rpx;
}

.points-summary .card-value {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
}

.points-table-container {
	overflow-x: auto;
	padding: 0;
}

.points-table-container .table-header {
	display: flex;
	background: #f8f9fa;
	border-bottom: 2rpx solid #e0e0e0;
	position: sticky;
	top: 0;
	z-index: 10;
}

.points-table-container .table-header-cell {
	flex: 1;
	padding: 24rpx 16rpx;
	font-size: 26rpx;
	font-weight: 600;
	color: #333;
	text-align: center;
	min-width: 0;
}

.points-table-container .table-header-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
}

.points-table-container .table-header-cell:last-child {
	padding-right: 30rpx;
}

.points-table-container .table-body {
	display: flex;
	flex-direction: column;
}

.points-table-container .table-row {
	display: flex;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.2s;
}

.points-table-container .table-row:active {
	background: #f8f9fa;
}

.points-table-container .table-cell {
	flex: 1;
	padding: 28rpx 16rpx;
	font-size: 26rpx;
	color: #333;
	text-align: center;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.points-table-container .table-cell:first-child {
	flex: 1.2;
	text-align: left;
	padding-left: 30rpx;
	justify-content: flex-start;
}

.points-table-container .table-cell:last-child {
	padding-right: 30rpx;
}

.points-table-container .time-cell {
	font-size: 24rpx;
	color: #666;
}

.points-table-container .order-cell {
	font-size: 24rpx;
	color: #333;
	font-weight: 500;
}

.points-table-container .points-cell {
	font-size: 26rpx;
}

/* 周积分和联创积分报表样式 */
.points-list {
	padding: 0;
}

.points-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.points-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.points-count {
	font-size: 24rpx;
	color: #999;
}

.points-records {
	padding: 0;
}

.points-item {
	padding: 32rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
	background: #fff;
}

.points-item:last-child {
	border-bottom: none;
}

.points-header-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.points-left {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.points-user {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
}

.points-time {
	font-size: 24rpx;
	color: #999;
}

.points-amount {
	display: flex;
	align-items: center;
}

.points-amount .amount-text {
	font-size: 32rpx;
	font-weight: 600;
}

.points-amount .amount-text.income {
	color: #4caf50;
}

.points-amount .amount-text.expense {
	color: #f44336;
}

.points-body {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	margin-top: 12rpx;
}

/* 所有雨点流水报表美化样式 */
.all-points-report {
	padding: 0;
}

.report-header-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 40rpx 30rpx;
	border-radius: 16rpx 16rpx 0 0;
}

.header-title-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.report-main-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
}

.user-count-badge {
	background: rgba(255, 255, 255, 0.2);
	padding: 8rpx 20rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(10rpx);
}

.user-count-text {
	font-size: 24rpx;
	color: #fff;
	font-weight: 500;
}

.users-list {
	padding: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.user-card {
	background: #fff;
	border-radius: 16rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.user-card-header {
	display: flex;
	align-items: center;
	padding: 30rpx;
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	border-bottom: 1rpx solid #e9ecef;
}

.user-avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.user-avatar-text {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.user-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.user-id {
	font-size: 24rpx;
	color: #999;
}

.points-details {
	padding: 30rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.point-type-card {
	background: #f8f9fa;
	border-radius: 12rpx;
	padding: 24rpx;
	border-left: 4rpx solid;
}

.point-type-card.subsidy {
	border-left-color: #4ecdc4;
	background: linear-gradient(135deg, #f0fdfc 0%, #e8faf8 100%);
}

.point-type-card.referral {
	border-left-color: #ffd93d;
	background: linear-gradient(135deg, #fffef0 0%, #fffce8 100%);
}

.point-type-card.team {
	border-left-color: #6c5ce7;
	background: linear-gradient(135deg, #f5f4ff 0%, #ede9ff 100%);
}

.point-type-card.unilevel {
	border-left-color: #ff6b6b;
	background: linear-gradient(135deg, #fff0f0 0%, #ffe8e8 100%);
}

.point-type-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.point-type-icon {
	font-size: 32rpx;
	margin-right: 12rpx;
}

.point-type-name {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
}

.point-type-body {
	display: flex;
	gap: 40rpx;
}

.point-stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.stat-label {
	font-size: 24rpx;
	color: #999;
}

.stat-value {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.stat-value.income {
	color: #4ecdc4;
}

.point-total-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12rpx;
	padding: 24rpx;
	margin-top: 8rpx;
}

.total-header {
	margin-bottom: 16rpx;
}

.total-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.total-body {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.total-stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.total-stat-item:last-child {
	border-bottom: none;
}

.total-label {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

.total-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
}

.total-value.highlight {
	font-size: 36rpx;
}

.total-value.income {
	color: #4ecdc4;
}

.total-value.expense {
	color: #ff6b6b;
}

.empty-state-card {
	padding: 100rpx 30rpx;
	text-align: center;
	background: #fff;
	border-radius: 16rpx;
}

.empty-icon {
	font-size: 80rpx;
	display: block;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.points-reason {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
}

.points-order,
.points-unilevel {
	font-size: 24rpx;
	color: #999;
}

.points-info-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-top: 8rpx;
}

.points-info-row .info-label {
	font-size: 26rpx;
	color: #666;
}

.points-info-row .info-value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}

/* 推荐奖励和团队奖励报表样式 */
.rewards-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 30rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.rewards-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.rewards-count {
	font-size: 24rpx;
	color: #999;
}

.rewards-records {
	padding: 0;
}

.reward-header-row {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16rpx;
}

.reward-info-row {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-top: 12rpx;
	flex-wrap: wrap;
}

.reward-info-row .info-label {
	font-size: 24rpx;
	color: #999;
}

.reward-info-row .info-value {
	font-size: 24rpx;
	color: #333;
}

.reward-reason {
	font-size: 26rpx;
	color: #666;
	line-height: 1.5;
	margin-top: 8rpx;
}

.points-table-container .points-cell {
	font-size: 26rpx;
	color: #ff9800;
	font-weight: 600;
}

.points-table-container .amount-cell {
	font-size: 28rpx;
	color: #4caf50;
	font-weight: 600;
}

.header-main {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.date-selector {
	display: flex;
	align-items: center;
	background: #f0f4ff;
	padding: 12rpx 24rpx;
	border-radius: 30rpx;
	transition: opacity 0.2s;
}

.date-selector:active {
	opacity: 0.7;
}

.current-date-text {
	font-size: 26rpx;
	color: #3d6bff;
	font-weight: 600;
	margin-right: 12rpx;
}

.picker-trigger {
	font-size: 24rpx;
	color: #3d6bff;
	background: #dee7ff;
	padding: 4rpx 16rpx;
	border-radius: 20rpx;
}

/* 日期选择弹窗 */
.date-picker-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.date-picker-content {
	background: #fff;
	border-radius: 24rpx;
	width: 90%;
	max-width: 600rpx;
	overflow: hidden;
}

.date-picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 40rpx 30rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.date-picker-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.date-picker-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.date-picker-body {
	padding: 40rpx 30rpx;
}

.date-picker-item {
	margin-bottom: 40rpx;
}

.date-picker-item:last-child {
	margin-bottom: 0;
}

.date-picker-label {
	display: block;
	font-size: 28rpx;
	color: #666;
	margin-bottom: 20rpx;
}

.date-picker-value {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 30rpx;
	background: #f7f8fa;
	border-radius: 16rpx;
	font-size: 30rpx;
	color: #333;
}

.date-picker-value text:first-child {
	flex: 1;
}

.picker-arrow {
	font-size: 24rpx;
	color: #999;
	margin-left: 20rpx;
}

.date-tip {
	display: block;
	font-size: 22rpx;
	color: #999;
	margin-top: 12rpx;
	padding-left: 10rpx;
}

.date-picker-footer {
	display: flex;
	border-top: 1rpx solid #f0f0f0;
}

.date-picker-btn {
	flex: 1;
	height: 100rpx;
	line-height: 100rpx;
	text-align: center;
	font-size: 30rpx;
	border: none;
	background: transparent;
	margin: 0;
	border-radius: 0;
}

.date-picker-btn::after {
	border: none;
}

.date-picker-btn.cancel-btn {
	color: #666;
	border-right: 1rpx solid #f0f0f0;
}

.date-picker-btn.confirm-btn {
	color: #3d6bff;
	font-weight: 600;
}
</style>

