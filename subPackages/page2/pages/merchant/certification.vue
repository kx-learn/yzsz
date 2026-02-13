<template>
  <scroll-view class="cert-page" scroll-y>
    <view class="card-wrap">
      <Certification />
    </view>
  </scroll-view>
</template>

<script setup>
import Certification from '@/components/Certification.vue'
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  uni.setNavigationBarTitle({ title: '实名认证' })
})
</script>

<style scoped>
@import "@/static/999/iconfont.css";

.cert-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #f5f6f8 100%);
  padding: 24rpx 24rpx 40rpx;
}

.card-wrap {
  padding: 0;
}
</style>
