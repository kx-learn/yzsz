<template>
  <view class="banner-manage-page">
    <view class="page-header">
      <text class="page-title">首页轮播图管理</text>
      <button class="batch-add-btn" @tap="batchAddBanners">批量添加</button>
    </view>

    <view class="banner-list">
      <view 
        v-for="(banner, index) in bannerList" 
        :key="banner.id || index"
        class="banner-item"
      >
        <view class="banner-image-wrapper">
        <image :src="banner.image" mode="aspectFill" class="banner-image" />
          <view class="banner-index">{{ index + 1 }}</view>
        </view>
        <view class="banner-info">
          <view class="info-row">
            <text class="info-label">跳转链接：</text>
            <text class="info-value" v-if="banner.link">{{ banner.link }}</text>
            <text class="info-value empty" v-else>无链接</text>
          </view>
        </view>
        <view class="banner-actions">
          <button class="action-btn edit" @tap="editBanner(banner, index)">编辑</button>
          <button class="action-btn delete" @tap="deleteBanner(index)">删除</button>
        </view>
      </view>

      <view v-if="bannerList.length === 0" class="empty-state">
        <view class="empty-icon-wrapper">
        <text class="empty-icon">🖼️</text>
        </view>
        <text class="empty-title">暂无轮播图</text>
        <text class="empty-desc">点击上方"批量添加"按钮上传轮播图</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getBannerList, getProductList, createProduct, updateProduct, deleteProduct, uploadProductImages, updateProductImages, deleteProductImages, getProductDetail } from '@/api/product.js'
import config from '@/utils/config.js'

const bannerList = ref([])
const bannerProductId = ref(null) // 轮播图商品的ID

/**
 * 获取或创建轮播图商品
 */
const getOrCreateBannerProduct = async () => {
  try {
    // 1. 先查找是否已存在轮播图商品（name='首页轮播图'）
    const productListRes = await getProductList({ page: 1, pageSize: 100 })
    const products = productListRes.data?.list || productListRes.data || productListRes.list || []
    
    let bannerProduct = products.find(p => p.name === '首页轮播图' && p.category === '其他')
    
    if (bannerProduct) {
      bannerProductId.value = bannerProduct.id
      console.log('[轮播图管理] 找到已存在的轮播图商品，ID:', bannerProductId.value)
      return bannerProduct.id
    }
    
    // 2. 如果不存在，创建一个新的轮播图商品
    console.log('[轮播图管理] 未找到轮播图商品，创建新商品')
    const productData = {
      name: '首页轮播图',
      description: '首页轮播图管理商品',
      category: '其他',
      status: 1, // 上架状态
      is_member_product: false,
      skus: [{
        sku_code: `BANNER-MAIN-${Date.now()}`,
        price: 0,
        stock: 0,
        specifications: {}
      }]
    }
    
    const createRes = await createProduct(productData)
    const productId = createRes.data?.id || createRes.id || createRes.data?.product_id
    
    if (!productId) {
      throw new Error('创建轮播图商品失败，未返回商品ID')
    }
    
    bannerProductId.value = productId
    console.log('[轮播图管理] 轮播图商品创建成功，ID:', bannerProductId.value)
    return productId
  } catch (error) {
    console.error('[轮播图管理] 获取或创建轮播图商品失败:', error)
    throw error
  }
}

const loadBanners = async () => {
  try {
    // 1. 获取或创建轮播图商品
    const productId = await getOrCreateBannerProduct()
    
    // 2. 获取轮播图商品的详情
    const productDetail = await getProductDetail(productId)
    const product = productDetail.data || productDetail
    
    console.log('[轮播图管理] 轮播图商品详情:', product)
    console.log('[轮播图管理] banner_images 字段:', product.banner_images, '类型:', typeof product.banner_images, '是否为数组:', Array.isArray(product.banner_images))
    
    // 3. 从商品的 banner_images 中获取所有轮播图
    let bannerImages = []
    if (product.banner_images) {
      if (Array.isArray(product.banner_images)) {
        bannerImages = product.banner_images
      } else if (typeof product.banner_images === 'string') {
        // 如果是字符串，尝试解析为JSON
        try {
          bannerImages = JSON.parse(product.banner_images)
          if (!Array.isArray(bannerImages)) {
            bannerImages = [product.banner_images]
          }
        } catch (e) {
          bannerImages = [product.banner_images]
        }
      } else {
        console.warn('[轮播图管理] banner_images 格式异常:', product.banner_images)
        bannerImages = []
      }
    }
    
    console.log('[轮播图管理] 从商品获取轮播图:', bannerImages.length, '张', '数据:', bannerImages)
    
    // 4. 转换为轮播图格式
    bannerList.value = bannerImages.map((imageUrl, index) => {
      // 处理图片URL（如果是相对路径，添加服务器地址）
      let processedUrl = imageUrl
      if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://') && !processedUrl.startsWith('/static')) {
        if (processedUrl.startsWith('/')) {
          processedUrl = `${config.baseURL}${processedUrl}`
        } else {
          processedUrl = `${config.baseURL}/${processedUrl}`
        }
      }
      
      return {
        id: index, // 使用索引作为临时ID
        image: processedUrl,
        imageUrl: imageUrl, // 保存原始URL，用于删除
        link: '' // 不设置跳转链接
      }
    })
    
    console.log('[轮播图管理] 最终轮播图数量:', bannerList.value.length)
  } catch (error) {
    console.error('加载轮播图失败', error)
    bannerList.value = []
    uni.showToast({ 
      title: '加载轮播图失败: ' + (error.message || '未知错误'), 
      icon: 'none' 
    })
  }
}


/**
 * 批量添加轮播图
 */
const batchAddBanners = () => {
  uni.chooseImage({
    count: 9, // 最多选择9张图片
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      console.log('选择的图片:', res.tempFilePaths)
      
      if (res.tempFilePaths.length === 0) {
        return
      }
      
      // 直接处理所有图片，不设置跳转链接
      processBanners(res.tempFilePaths, '')
    },
    fail: (err) => {
      console.error('选择图片失败', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

/**
 * 处理轮播图 - 使用商品图片更新接口添加新图片
 */
const processBanners = async (filePaths, link) => {
  uni.showLoading({ title: '上传中...' })
  
  try {
    // 1. 获取或创建轮播图商品
    const productId = await getOrCreateBannerProduct()
    
    // 2. 获取当前商品的轮播图列表
    const productDetail = await getProductDetail(productId)
    const product = productDetail.data || productDetail
    const existingBanners = product.banner_images && Array.isArray(product.banner_images) 
      ? product.banner_images 
      : []
    
    console.log('[轮播图] 当前已有轮播图:', existingBanners.length, '张')
    console.log('[轮播图] 准备添加新轮播图:', filePaths.length, '张')
    
    // 3. 使用 POST 接口上传商品图片（一次性提交所有轮播图）
    //    后端会更新 product.banner_images 字段
    const uploadData = {
      banner_images: [...existingBanners, ...filePaths], // 保留现有图片，添加新图片
      detail_images: [] // 不修改详情图
    }
    
    console.log('[轮播图] 上传商品图片，商品ID:', productId, '总图片数:', uploadData.banner_images.length)
    const updateRes = await uploadProductImages(productId, uploadData)
    console.log('[轮播图] 上传接口返回:', updateRes)
    
    // 4. 等待后端处理完成，然后重新加载轮播图列表
    console.log('[轮播图] 等待后端处理完成...')
    await new Promise(resolve => setTimeout(resolve, 500)) // 等待500ms确保后端处理完成
    
    // 5. 重新加载轮播图列表（此时应从 product.banner_images 中取到最新数据）
    await loadBanners()
    
    // 6. 如果重新加载后还是0张，尝试从返回数据中获取
    if (bannerList.value.length === 0 && updateRes && updateRes.data) {
      console.log('[轮播图] 重新加载后仍为0张，尝试从返回数据中获取')
      console.log('[轮播图] 返回数据完整结构:', JSON.stringify(updateRes, null, 2))
      
      // 尝试多种方式提取图片URL
      let imageUrls = []
      
      // 方式1: 直接是数组
      if (Array.isArray(updateRes.data)) {
        console.log('[轮播图] 返回数据是数组格式')
        imageUrls = updateRes.data.map(item => {
          if (typeof item === 'string') return item
          if (typeof item === 'object' && item) {
            return item.image_url || item.url || item.banner_image || item.image || item.path || item.file_path || null
          }
          return null
        }).filter(Boolean)
      }
      // 方式2: 有 data 属性
      else if (updateRes.data.data && Array.isArray(updateRes.data.data)) {
        console.log('[轮播图] 返回数据在 data.data 中')
        imageUrls = updateRes.data.data.map(item => {
          if (typeof item === 'string') return item
          if (typeof item === 'object' && item) {
            return item.image_url || item.url || item.banner_image || item.image || item.path || item.file_path || null
          }
          return null
        }).filter(Boolean)
      }
      // 方式3: 有 banner_images 属性
      else if (updateRes.data.banner_images && Array.isArray(updateRes.data.banner_images)) {
        console.log('[轮播图] 返回数据在 banner_images 中')
        imageUrls = updateRes.data.banner_images.filter(Boolean)
      }
      // 方式4: 尝试从所有可能的字段中提取
      else if (typeof updateRes.data === 'object') {
        console.log('[轮播图] 返回数据是对象，尝试提取所有可能的图片字段')
        const possibleFields = ['banner_images', 'images', 'image_urls', 'urls', 'files']
        for (const field of possibleFields) {
          if (updateRes.data[field] && Array.isArray(updateRes.data[field])) {
            imageUrls = updateRes.data[field].map(item => {
              if (typeof item === 'string') return item
              if (typeof item === 'object' && item) {
                return item.image_url || item.url || item.banner_image || item.image || item.path || item.file_path || null
              }
              return null
            }).filter(Boolean)
            if (imageUrls.length > 0) {
              console.log(`[轮播图] 从字段 ${field} 中提取到图片`)
              break
            }
          }
        }
      }
      
      console.log('[轮播图] 提取到的图片URL:', imageUrls)
      
      if (imageUrls.length > 0) {
        bannerList.value = imageUrls.map((imageUrl, index) => {
          let processedUrl = imageUrl
          if (processedUrl && !processedUrl.startsWith('http://') && !processedUrl.startsWith('https://') && !processedUrl.startsWith('/static')) {
            if (processedUrl.startsWith('/')) {
              processedUrl = `${config.baseURL}${processedUrl}`
            } else {
              processedUrl = `${config.baseURL}/${processedUrl}`
            }
          }
          return {
            id: index,
            image: processedUrl,
            imageUrl: imageUrl,
            link: ''
          }
        })
        console.log('[轮播图] ✅ 从返回数据更新轮播图列表，数量:', bannerList.value.length)
        console.log('[轮播图] 更新后的 bannerList.value:', bannerList.value)
        
        // 强制触发响应式更新
        bannerList.value = [...bannerList.value]
      } else {
        console.warn('[轮播图] ⚠️ 无法从返回数据中提取图片URL')
      }
    }
    
    // 最终确认轮播图数量
    console.log('[轮播图] 最终轮播图数量:', bannerList.value.length)
    if (bannerList.value.length === 0) {
      console.error('[轮播图] ❌ 上传成功但轮播图列表仍为空，返回数据:', updateRes)
    }
    
    uni.hideLoading()
    uni.showToast({ 
      title: bannerList.value.length > 0 
        ? `成功添加${bannerList.value.length}张轮播图` 
        : `上传完成，但未获取到图片（请刷新页面）`, 
      icon: bannerList.value.length > 0 ? 'success' : 'none',
      duration: bannerList.value.length > 0 ? 2000 : 3000
    })
  } catch (error) {
    console.error('[轮播图] 批量处理失败:', error)
    uni.hideLoading()
    uni.showToast({ 
      title: '上传失败: ' + (error.message || '未知错误'), 
      icon: 'none' 
    })
  }
}


/**
 * 编辑轮播图 - 使用商品图片更新接口
 */
const editBanner = async (banner, index) => {
  uni.showActionSheet({
    itemList: ['更换图片'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        // 更换图片：使用 PUT 接口更新图片
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album'],
          success: async (imgRes) => {
            uni.showLoading({ title: '更换中...' })
            
            try {
              // 1. 获取或创建轮播图商品
              const productId = await getOrCreateBannerProduct()
              
              // 2. 获取当前商品的轮播图列表
              const productDetail = await getProductDetail(productId)
              const product = productDetail.data || productDetail
              const existingBanners = product.banner_images && Array.isArray(product.banner_images) 
                ? product.banner_images 
                : []
              
              // 3. 替换指定索引的图片
              const newBanners = [...existingBanners]
              newBanners[index] = imgRes.tempFilePaths[0] // 替换指定位置的图片
              
              // 4. 使用 PUT 接口更新商品图片
              const updateData = {
                banner_images: newBanners,
                image_type: 'banner' // 明确指定图片类型为轮播图
              }
              
              console.log('[轮播图] 更新商品图片，商品ID:', productId, '索引:', index)
              await updateProductImages(productId, updateData)
              
              // 5. 重新加载轮播图列表
              await loadBanners()
              
              uni.hideLoading()
              uni.showToast({ title: '更换成功', icon: 'success' })
            } catch (error) {
              console.error('[轮播图] 更换图片失败:', error)
              uni.hideLoading()
              uni.showToast({ title: '更换失败: ' + (error.message || '未知错误'), icon: 'none' })
            }
          }
        })
      }
    }
  })
}

/**
 * 删除轮播图 - 使用商品图片删除接口
 */
const deleteBanner = async (index) => {
  const banner = bannerList.value[index]
  
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张轮播图吗？删除后无法恢复。',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        
        try {
          // 1. 获取或创建轮播图商品
          const productId = await getOrCreateBannerProduct()
          
          // 2. 获取当前商品的轮播图列表
          const productDetail = await getProductDetail(productId)
          const product = productDetail.data || productDetail
          const existingBanners = product.banner_images && Array.isArray(product.banner_images) 
            ? product.banner_images 
            : []
          
          // 3. 找到要删除的图片URL
          let imageUrlToDelete = banner.imageUrl || banner.image || existingBanners[index]
          
          // 处理图片URL：如果是完整URL，提取路径部分；如果是相对路径，确保格式正确
          if (imageUrlToDelete) {
            // 如果是完整URL，提取路径部分（保留从域名后的路径）
            if (imageUrlToDelete.startsWith('http://') || imageUrlToDelete.startsWith('https://')) {
              try {
                const urlObj = new URL(imageUrlToDelete)
                imageUrlToDelete = urlObj.pathname + (urlObj.search || '')
              } catch (e) {
                // 如果URL解析失败，尝试手动提取路径
                const match = imageUrlToDelete.match(/https?:\/\/[^\/]+(\/.*)/)
                if (match && match[1]) {
                  imageUrlToDelete = match[1]
                }
              }
            }
            
            // 确保URL以/开头
            if (imageUrlToDelete && !imageUrlToDelete.startsWith('/')) {
              imageUrlToDelete = '/' + imageUrlToDelete
            }
            
            console.log('[轮播图] 准备删除图片，商品ID:', productId, '处理后的图片URL:', imageUrlToDelete)
            
            // 4. 使用 DELETE 接口删除指定图片
            await deleteProductImages(productId, {
              image_urls: [imageUrlToDelete],
              image_type: 'banner' // 明确指定图片类型为轮播图
            })
            console.log('[轮播图] 删除图片成功，商品ID:', productId, '图片URL:', imageUrlToDelete)
          } else {
            throw new Error('无法找到要删除的图片URL')
          }
          
          // 5. 重新加载轮播图列表
          await loadBanners()
          
          uni.hideLoading()
          uni.showToast({ title: '删除成功', icon: 'success' })
        } catch (error) {
          console.error('[轮播图] 删除失败:', error)
          uni.hideLoading()
          uni.showToast({ title: '删除失败: ' + (error.message || '未知错误'), icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadBanners()
})

onShow(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-manage-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30rpx;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.batch-add-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.banner-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.banner-item {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.banner-item:active {
  transform: scale(0.98);
}

.banner-image-wrapper {
  position: relative;
  width: 100%;
  height: 360rpx;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-index {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}

.banner-info {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
  word-break: break-all;
}

.info-value.empty {
  color: #999;
  font-style: italic;
}

.banner-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s;
}

.action-btn.edit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-btn.delete {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: #fff;
}

.action-btn:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-icon-wrapper {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff5e6 0%, #ffe5cc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}
</style>

