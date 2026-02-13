<template>
  <scroll-view class="bindcard-page" scroll-y>
    <view class="card">
      <text class="card-title">微信进件 & 银行卡绑定</text>
      <WxSubMerchant />
    </view>
  </scroll-view>
</template>

<script setup>
import WxSubMerchant from '@/components/WxSubMerchant.vue'
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  uni.setNavigationBarTitle({ title: '银行卡绑定' })
})
</script>

<style scoped>
@import "@/static/999/iconfont.css";
.bindcard-page{padding:12px}
.card{background:#fff;border-radius:8px;padding:12px;margin-top:12px}
.card-title{font-weight:600;margin-bottom:8px}
</style>
