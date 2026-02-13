<template>
  <scroll-view class="withdraw-page" scroll-y>
    <view class="card">
      <text class="card-title">提现</text>
      <Withdraw />
    </view>
  </scroll-view>
</template>

<script setup>
import Withdraw from '@/components/Withdraw.vue'
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  uni.setNavigationBarTitle({ title: '提现' })
})
</script>

<style scoped>
@import "@/static/999/iconfont.css";
.withdraw-page{padding:12px}
.card{background:#fff;border-radius:8px;padding:12px;margin-top:12px}
.card-title{font-weight:600;margin-bottom:8px}
</style>
