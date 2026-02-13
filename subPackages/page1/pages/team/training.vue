<template>
  <view class="training-page">
    <!-- 培训概览 -->
    <view class="training-overview">
      <view class="overview-header">
        <text class="overview-title">团队培训中心</text>
        <text class="overview-subtitle">提升团队管理能力，实现共同成长</text>
      </view>
      
      <view class="progress-card">
        <view class="progress-info">
          <text class="progress-title">学习进度</text>
          <text class="progress-desc">已完成 {{ completedCourses }}/{{ totalCourses }} 门课程</text>
        </view>
        <view class="progress-circle">
          <text class="progress-percent">{{ Math.round(completedCourses / totalCourses * 100) }}%</text>
        </view>
      </view>
    </view>

    <!-- 课程分类 -->
    <view class="course-categories">
      <view class="categories-header">
        <text class="categories-title">课程分类</text>
      </view>
      
      <view class="categories-list">
        <view 
          v-for="(category, index) in courseCategories" 
          :key="index"
          class="category-item"
          :class="{ active: currentCategory === category.id }"
          @tap="switchCategory(category.id)"
        >
          <text class="category-icon iconfont" :class="getCategoryIcon(category.id)"></text>
          <text class="category-name">{{ category.name }}</text>
          <text class="category-count">{{ category.count }}</text>
        </view>
      </view>
    </view>

    <!-- 推荐课程 -->
    <view class="recommended-courses">
      <view class="courses-header">
        <text class="courses-title">推荐课程</text>
        <text class="courses-subtitle">根据您的等级推荐</text>
      </view>
      
      <view class="courses-list">
        <view 
          v-for="course in recommendedCourses" 
          :key="course.id"
          class="course-card featured"
          @tap="viewCourse(course)"
        >
          <image :src="course.cover" class="course-cover" mode="aspectFill" />
          <view class="course-info">
            <text class="course-title">{{ course.title }}</text>
            <text class="course-desc">{{ course.description }}</text>
            <view class="course-meta">
              <text class="course-duration">{{ course.duration }}</text>
              <text class="course-level">{{ course.level }}</text>
              <view class="course-rating">
                <text class="rating-text">{{ course.rating }}</text>
                <text class="rating-icon iconfont icon-huangguan"></text>
              </view>
            </view>
          </view>
          <view class="course-status" :class="'status-' + course.status">
            <text class="status-text">{{ getStatusText(course.status) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 课程列表 -->
    <view class="course-list">
      <view class="list-header">
        <text class="list-title">全部课程</text>
        <view class="list-filter">
          <text class="filter-btn" @tap="showFilterOptions">筛选</text>
          <text class="sort-btn" @tap="showSortOptions">排序</text>
        </view>
      </view>
      
      <view class="courses-grid">
        <view 
          v-for="course in filteredCourses" 
          :key="course.id"
          class="course-card"
          @tap="viewCourse(course)"
        >
          <image :src="course.cover" class="course-cover" mode="aspectFill" />
          <view class="course-info">
            <text class="course-title">{{ course.title }}</text>
            <text class="course-instructor">{{ course.instructor }}</text>
            <view class="course-meta">
              <text class="course-duration">{{ course.duration }}</text>
              <text class="course-students">{{ course.students }}人学习</text>
            </view>
            <view class="course-tags">
              <text 
                v-for="tag in course.tags" 
                :key="tag"
                class="course-tag"
              >
                {{ tag }}
              </text>
            </view>
          </view>
          <view class="course-progress" v-if="course.progress > 0">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: course.progress + '%' }"></view>
            </view>
            <text class="progress-text">{{ course.progress }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 学习统计 -->
    <view class="learning-stats">
      <view class="stats-header">
        <text class="stats-title">学习统计</text>
      </view>
      
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ learningStats.totalHours }}</text>
          <text class="stat-label">累计学时</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ learningStats.certificates }}</text>
          <text class="stat-label">获得证书</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ learningStats.streak }}</text>
          <text class="stat-label">连续学习天数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ learningStats.rank }}</text>
          <text class="stat-label">团队排名</text>
        </view>
      </view>
    </view>

    <!-- 学习计划 -->
    <view class="learning-plan">
      <view class="plan-header">
        <text class="plan-title">本周学习计划</text>
        <text class="plan-subtitle">坚持学习，持续成长</text>
      </view>
      
      <view class="plan-list">
        <view 
          v-for="(plan, index) in weeklyPlan" 
          :key="index"
          class="plan-item"
          :class="{ completed: plan.completed }"
        >
          <view class="plan-day">
            <text class="day-text">{{ plan.day }}</text>
          </view>
          <view class="plan-content">
            <text class="plan-course">{{ plan.course }}</text>
            <text class="plan-time">{{ plan.time }}</text>
          </view>
          <view class="plan-status">
            <text class="status-icon">{{ plan.completed ? '✓' : '○' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 课程统计
const totalCourses = ref(24)
const completedCourses = ref(8)

// 当前分类
const currentCategory = ref('all')

// 课程分类（icon字段已移除，使用getCategoryIcon函数获取图标）
const courseCategories = ref([
  { id: 'all', name: '全部', count: 24 },
  { id: 'management', name: '团队管理', count: 8 },
  { id: 'sales', name: '销售技巧', count: 6 },
  { id: 'communication', name: '沟通技巧', count: 5 },
  { id: 'leadership', name: '领导力', count: 5 }
])

/**
 * 获取分类图标
 */
const getCategoryIcon = (categoryId) => {
  const iconMap = {
    all: 'icon-shouye',
    management: 'icon-tuandui',
    sales: 'icon-xiaoshoutongji',
    communication: 'icon-kefu',
    leadership: 'icon-huangguan'
  }
  return iconMap[categoryId] || 'icon-shouye'
}

// 推荐课程
const recommendedCourses = ref([
  {
    id: 1,
    title: '三星店长进阶指南',
    description: '专为三星店长设计的进阶课程，提升团队管理能力',
    cover: '/static/course1.jpg',
    duration: '2小时30分',
    level: '中级',
    rating: 4.8,
    status: 'new',
    instructor: '张导师',
    students: 1250,
    tags: ['团队管理', '进阶'],
    progress: 0
  },
  {
    id: 2,
    title: '团队奖励机制解析',
    description: '深度解析3.5.2版本团队奖励规则，最大化收益',
    cover: '/static/course2.jpg',
    duration: '1小时45分',
    level: '初级',
    rating: 4.9,
    status: 'hot',
    instructor: '李老师',
    students: 2100,
    tags: ['奖励规则', '收益优化'],
    progress: 60
  }
])

// 全部课程
const allCourses = ref([
  {
    id: 3,
    title: '高效团队沟通技巧',
    cover: '/static/course3.jpg',
    duration: '1小时20分',
    instructor: '王老师',
    students: 890,
    tags: ['沟通', '团队'],
    progress: 100,
    category: 'communication'
  },
  {
    id: 4,
    title: '销售心理学基础',
    cover: '/static/course4.jpg',
    duration: '2小时10分',
    instructor: '赵导师',
    students: 1560,
    tags: ['销售', '心理学'],
    progress: 30,
    category: 'sales'
  },
  {
    id: 5,
    title: '领导力提升训练',
    cover: '/static/course5.jpg',
    duration: '3小时00分',
    instructor: '刘专家',
    students: 750,
    tags: ['领导力', '管理'],
    progress: 0,
    category: 'leadership'
  },
  {
    id: 6,
    title: '团队激励与管理',
    cover: '/static/course6.jpg',
    duration: '1小时50分',
    instructor: '陈老师',
    students: 1200,
    tags: ['激励', '管理'],
    progress: 80,
    category: 'management'
  }
])

// 学习统计
const learningStats = ref({
  totalHours: 45.5,
  certificates: 3,
  streak: 12,
  rank: 8
})

// 本周学习计划
const weeklyPlan = ref([
  { day: '周一', course: '团队沟通技巧', time: '30分钟', completed: true },
  { day: '周二', course: '销售心理学', time: '45分钟', completed: true },
  { day: '周三', course: '领导力训练', time: '60分钟', completed: false },
  { day: '周四', course: '激励管理', time: '40分钟', completed: false },
  { day: '周五', course: '奖励机制', time: '35分钟', completed: false }
])

// 筛选后的课程
const filteredCourses = computed(() => {
  if (currentCategory.value === 'all') {
    return allCourses.value
  }
  return allCourses.value.filter(course => course.category === currentCategory.value)
})

/**
 * 切换分类
 */
const switchCategory = (categoryId) => {
  currentCategory.value = categoryId
}

/**
 * 查看课程
 */
const viewCourse = (course) => {
  // course-detail 页面不存在，暂时显示提示
  uni.showToast({ title: '功能开发中', icon: 'none' })
  // uni.navigateTo({ url: `/page1/team/course-detail?id=${course.id}` })
}

/**
 * 获取状态文本
 */
const getStatusText = (status) => {
  const statusMap = {
    new: '新课程',
    hot: '热门',
    completed: '已完成'
  }
  return statusMap[status] || ''
}

/**
 * 显示筛选选项
 */
const showFilterOptions = () => {
  uni.showActionSheet({
    itemList: ['全部课程', '未开始', '学习中', '已完成'],
    success: (res) => {
      // 这里可以添加筛选逻辑
      uni.showToast({ title: '筛选功能开发中', icon: 'none' })
    }
  })
}

/**
 * 显示排序选项
 */
const showSortOptions = () => {
  uni.showActionSheet({
    itemList: ['按热度排序', '按时长排序', '按评分排序', '按更新时间排序'],
    success: (res) => {
      // 这里可以添加排序逻辑
      uni.showToast({ title: '排序功能开发中', icon: 'none' })
    }
  })
}

onLoad(() => {
  console.log('培训页面加载')
})
</script>

<style scoped>
.training-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
  padding-bottom: 40rpx;
}

/* 培训概览 */
.training-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  color: white;
}

.overview-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.overview-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.overview-subtitle {
  font-size: 24rpx;
  opacity: 0.8;
}

.progress-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
}

.progress-info {
  flex: 1;
}

.progress-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.progress-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

.progress-circle {
  width: 80rpx;
  height: 80rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-percent {
  font-size: 24rpx;
  font-weight: bold;
}

/* 课程分类 */
.course-categories {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.categories-header {
  margin-bottom: 24rpx;
}

.categories-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.categories-list {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
  min-width: 120rpx;
  flex-shrink: 0;
}

.category-item.active {
  background: #3d6bff;
  color: white;
}

.category-icon {
  font-size: 32rpx;
}

.category-name {
  font-size: 24rpx;
  font-weight: 600;
}

.category-count {
  font-size: 20rpx;
  opacity: 0.7;
}

/* 推荐课程 */
.recommended-courses {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.courses-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.courses-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.courses-subtitle {
  font-size: 24rpx;
  color: #666;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.course-card {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  position: relative;
}

.course-card.featured {
  background: linear-gradient(135deg, #fff5f5, #f0f8ff);
  border: 2rpx solid #3d6bff;
}

.course-cover {
  width: 120rpx;
  height: 90rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.course-info {
  flex: 1;
}

.course-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.course-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.course-instructor {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.course-meta {
  display: flex;
  gap: 16rpx;
  align-items: center;
  margin-bottom: 8rpx;
}

.course-duration,
.course-level,
.course-students {
  font-size: 22rpx;
  color: #999;
}

.course-rating {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.rating-text {
  font-size: 22rpx;
  color: #ff6b35;
  font-weight: bold;
}

.rating-icon {
  font-size: 20rpx;
}

.course-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.course-tag {
  padding: 4rpx 12rpx;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 20rpx;
  border-radius: 12rpx;
}

.course-status {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
}

.status-new {
  background: #4caf50;
  color: white;
}

.status-hot {
  background: #ff5722;
  color: white;
}

.course-progress {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.progress-bar {
  flex: 1;
  height: 6rpx;
  background: #f0f0f0;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  border-radius: 3rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 20rpx;
  color: #4caf50;
  font-weight: bold;
}

/* 课程列表 */
.course-list {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.list-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.list-filter {
  display: flex;
  gap: 16rpx;
}

.filter-btn,
.sort-btn {
  padding: 8rpx 16rpx;
  font-size: 24rpx;
  color: #3d6bff;
  background: #f0f4ff;
  border-radius: 16rpx;
}

.courses-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

/* 学习统计 */
.learning-stats {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.stats-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.stats-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-item {
  text-align: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.stat-value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #3d6bff;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

/* 学习计划 */
.learning-plan {
  background: white;
  border-radius: 20rpx;
  padding: 30rpx;
}

.plan-header {
  text-align: center;
  margin-bottom: 24rpx;
}

.plan-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.plan-subtitle {
  font-size: 24rpx;
  color: #666;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.plan-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.plan-item.completed {
  background: #e8f5e9;
}

.plan-day {
  width: 80rpx;
  text-align: center;
  flex-shrink: 0;
}

.day-text {
  font-size: 24rpx;
  font-weight: bold;
  color: #666;
}

.plan-content {
  flex: 1;
}

.plan-course {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 4rpx;
}

.plan-time {
  font-size: 22rpx;
  color: #999;
}

.plan-status {
  width: 40rpx;
  text-align: center;
}

.status-icon {
  font-size: 24rpx;
  color: #4caf50;
}
</style>

<style>
@import "@/static/999/iconfont.css";
</style>