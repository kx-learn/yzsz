<template>
  <scroll-view class="merchant-page" scroll-y>
    <view class="card">
      <text class="card-title">实名认证</text>
      <Certification />
    </view>

    <view class="card">
      <text class="card-title">微信进件 & 银行卡</text>
      <WxSubMerchant />
    </view>

    <view class="card">
      <text class="card-title">提现</text>
      <Withdraw />
    </view>

    <view class="footer-actions">
      <button class="btn" @tap="openPos">打开收银台</button>
    </view>
  </scroll-view>
</template>

<script setup>
import Certification from '@/components/Certification.vue'
import WxSubMerchant from '@/components/WxSubMerchant.vue'
import Withdraw from '@/components/Withdraw.vue'
import { onLoad } from '@dcloudio/uni-app'

function openPos(){
  console.log('api代码为调用，打开线下收银台，前端运行正常')
}

onLoad((options) => {
  if (options && options.tab) {
    console.log('商户页接收到 tab 参数：', options.tab)
    // 可根据 options.tab 做滚动或高亮处理，当前仅记录日志
  }
})
</script>

<style scoped>
@import "@/static/999/iconfont.css";
.merchant-page{padding:12px}
.merchant-header{padding:12px 0}
.title{font-size:18px;font-weight:700}
.subtitle{color:#888;margin-top:6px}
.card{background:#fff;border-radius:8px;padding:12px;margin-top:12px}
.card-title{font-weight:600;margin-bottom:8px}
.footer-actions{margin-top:20px;display:flex;justify-content:center}
.footer-actions .btn{background:#2d8cf0;color:#fff;padding:10px 20px;border-radius:8px}
</style>
