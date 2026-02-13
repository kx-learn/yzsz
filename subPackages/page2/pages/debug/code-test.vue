<template>
	<view class="debug-page">
		<view class="debug-card">
			<text class="title">微信 Code 获取测试</text>
			
			<view class="info-section">
				<text class="label">当前状态：</text>
				<text class="status" :class="status.type">{{ status.text }}</text>
			</view>
			
			<view v-if="codeInfo.code" class="code-section">
				<text class="label">获取到的 Code：</text>
				<text class="code-text">{{ codeInfo.code }}</text>
				<text class="time">获取时间：{{ codeInfo.time }}</text>
			</view>
			
			<view v-if="errorInfo" class="error-section">
				<text class="label">错误信息：</text>
				<text class="error-text">{{ errorInfo }}</text>
			</view>
			
			<button class="test-btn" @tap="testGetCode">
				🔍 测试获取微信 Code
			</button>
			
			<button v-if="codeInfo.code" class="login-btn" @tap="testLogin">
				🚀 使用此 Code 测试登录
			</button>
			
			<view class="tips">
				<text class="tip-title">说明：</text>
				<text class="tip-text">• 此页面用于测试微信 Code 获取是否正常</text>
				<text class="tip-text">• Code 是微信登录的第一步，必须先获取成功</text>
				<text class="tip-text">• 如果获取失败，请检查微信开发者工具设置</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { wechatLogin } from '@/api/auth.js'
import { saveAuth } from '@/utils/auth.js'

const status = ref({ type: 'waiting', text: '等待测试' })
const codeInfo = ref({ code: '', time: '' })
const errorInfo = ref('')

/**
 * 测试获取微信 Code
 */
const testGetCode = () => {
	status.value = { type: 'loading', text: '正在获取...' }
	errorInfo.value = ''
	codeInfo.value = { code: '', time: '' }
	
	uni.getProvider({
		service: 'oauth',
		success: ({ provider }) => {
			console.log('支持的登录方式：', provider)
			
			if (!provider.includes('weixin')) {
				status.value = { type: 'error', text: '不支持微信登录' }
				errorInfo.value = '当前环境不支持微信登录，请在微信开发者工具中运行'
				return
			}
			
			// 获取微信登录凭证
			uni.login({
				provider: 'weixin',
				success: ({ code }) => {
					console.log('获取到微信 Code：', code)
					
					if (code) {
						status.value = { type: 'success', text: 'Code 获取成功' }
						codeInfo.value = {
							code: code,
							time: new Date().toLocaleString()
						}
					} else {
						status.value = { type: 'error', text: 'Code 获取失败' }
						errorInfo.value = '微信返回的 Code 为空'
					}
				},
				fail: (error) => {
					console.error('获取微信 Code 失败：', error)
					status.value = { type: 'error', text: 'Code 获取失败' }
					errorInfo.value = error.errMsg || '获取微信登录凭证失败'
				}
			})
		},
		fail: (error) => {
			console.error('获取登录渠道失败：', error)
			status.value = { type: 'error', text: '获取登录渠道失败' }
			errorInfo.value = error.errMsg || '无法获取登录渠道'
		}
	})
}

/**
 * 使用获取到的 Code 测试登录
 */
const testLogin = async () => {
	if (!codeInfo.value.code) {
		uni.showToast({ title: '请先获取 Code', icon: 'none' })
		return
	}
	
	uni.showLoading({ title: '测试登录中...' })
	
	try {
		console.log('使用 Code 测试登录：', codeInfo.value.code)
		const res = await wechatLogin(codeInfo.value.code)
			
			uni.hideLoading()
			uni.showToast({ title: '登录测试成功', icon: 'success' })
			
			console.log('登录测试结果：', res)
			
			// 如果后端返回 token，则使用统一保存逻辑
			if (res && res.token) {
				try {
					saveAuth(res)
					// 测试页面仍保存 userInfo 以供展示
					uni.setStorageSync('userInfo', res.user || {})
					console.log('[Code-Test] 已使用 saveAuth 保存 token，长度:', String(res.token).length)
				} catch (saveErr) {
					console.error('[Code-Test] 保存 token/userInfo 失败:', saveErr)
				}
			}
			
			// 显示登录结果
			uni.showModal({
				title: '登录测试成功',
				content: `Token: ${res.token}\n用户: ${res.user?.nickname || '未知'}`,
				showCancel: false
			})
		
	} catch (error) {
		uni.hideLoading()
		console.error('登录测试失败：', error)
		
		uni.showModal({
			title: '登录测试失败',
			content: error.message || error.msg || '登录接口调用失败',
			showCancel: false
		})
	}
}
</script>

<style scoped>
.debug-page {
	padding: 40rpx;
	background: #f5f5f5;
	min-height: 100vh;
}

.debug-card {
	background: white;
	border-radius: 20rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.title {
	display: block;
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	margin-bottom: 40rpx;
}

.info-section, .code-section, .error-section {
	margin-bottom: 30rpx;
	padding: 20rpx;
	border-radius: 12rpx;
}

.info-section {
	background: #f8f9fa;
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.code-section {
	background: #e8f5e8;
	border: 2rpx solid #4caf50;
}

.error-section {
	background: #ffeaea;
	border: 2rpx solid #f44336;
}

.label {
	font-size: 28rpx;
	font-weight: bold;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}

.status {
	font-size: 28rpx;
	font-weight: bold;
}

.status.waiting { color: #666; }
.status.loading { color: #2196f3; }
.status.success { color: #4caf50; }
.status.error { color: #f44336; }

.code-text {
	font-size: 24rpx;
	color: #2e7d32;
	background: rgba(76, 175, 80, 0.1);
	padding: 10rpx;
	border-radius: 8rpx;
	word-break: break-all;
	display: block;
	margin-bottom: 10rpx;
}

.time {
	font-size: 22rpx;
	color: #666;
	display: block;
}

.error-text {
	font-size: 26rpx;
	color: #d32f2f;
	display: block;
}

.test-btn, .login-btn {
	width: 100%;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
}

.test-btn {
	background: #2196f3;
	color: white;
}

.login-btn {
	background: #4caf50;
	color: white;
}

.tips {
	margin-top: 40rpx;
	padding: 20rpx;
	background: #fff3cd;
	border-radius: 12rpx;
	border: 2rpx solid #ffc107;
}

.tip-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #856404;
	display: block;
	margin-bottom: 10rpx;
}

.tip-text {
	font-size: 24rpx;
	color: #856404;
	display: block;
	margin-bottom: 8rpx;
}
</style>