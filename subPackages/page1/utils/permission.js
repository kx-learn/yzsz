/**
 * 权限管理工具
 * 用于检查和申请应用权限
 */

/**
 * 检查并申请相册/相机权限
 * @returns {Promise<boolean>} 是否有权限
 */
export const checkImagePermission = () => {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    // App端需要检查权限
    const platform = uni.getSystemInfoSync().platform
    if (platform === 'android') {
      // Android平台 - 需要根据系统版本选择不同的权限
      const systemInfo = uni.getSystemInfoSync()
      const sdkVersion = systemInfo.sdkVersion || 0
      
      // Android 13 (API 33) 及以上版本使用 READ_MEDIA_IMAGES
      // Android 12 及以下版本使用 READ_EXTERNAL_STORAGE
      const permissions = []
      if (sdkVersion >= 33) {
        permissions.push('android.permission.READ_MEDIA_IMAGES')
      } else {
        permissions.push('android.permission.READ_EXTERNAL_STORAGE')
        permissions.push('android.permission.WRITE_EXTERNAL_STORAGE')
      }
      permissions.push('android.permission.CAMERA')
      
      // 检查第一个权限（主要权限）
      const mainPermission = permissions[0]
      plus.android.checkPermission(mainPermission, (status) => {
        if (status === 1) {
          // 已授权
          console.log('[权限检查] 已有权限:', mainPermission)
          resolve(true)
        } else {
          // 未授权，申请权限
          console.log('[权限检查] 申请权限:', permissions)
          plus.android.requestPermissions(
            permissions,
            (resultObj) => {
              console.log('[权限申请] 结果:', resultObj)
              const granted = resultObj.granted && resultObj.granted.length > 0
              if (granted) {
                console.log('[权限申请] 权限已授予')
                resolve(true)
              } else {
                console.warn('[权限申请] 权限被拒绝')
                uni.showModal({
                  title: '权限申请',
                  content: '需要相册和相机权限才能上传图片，请在设置中开启',
                  showCancel: true,
                  confirmText: '去设置',
                  success: (res) => {
                    if (res.confirm) {
                      plus.runtime.openURL('app-settings:')
                    }
                    resolve(false)
                  }
                })
              }
            },
            (error) => {
              console.error('[权限申请] 申请失败:', error)
              uni.showToast({ title: '权限申请失败', icon: 'none' })
              resolve(false)
            }
          )
        }
      })
    } else if (platform === 'ios') {
      // iOS平台 - uni.chooseImage 会自动处理权限
      resolve(true)
    } else {
      resolve(true)
    }
    // #endif
    
    // #ifndef APP-PLUS
    // 非App端（小程序、H5等）不需要手动申请权限
    resolve(true)
    // #endif
  })
}

/**
 * 选择图片（带权限检查）
 * @param {Object} options 选择图片的选项
 * @returns {Promise}
 */
export const chooseImageWithPermission = (options = {}) => {
  return new Promise(async (resolve, reject) => {
    // 先检查权限
    const hasPermission = await checkImagePermission()
    if (!hasPermission) {
      reject(new Error('没有相册/相机权限'))
      return
    }
    
    // 调用选择图片
    uni.chooseImage({
      count: options.count || 9,
      sizeType: options.sizeType || ['compressed'],
      sourceType: options.sourceType || ['album', 'camera'],
      success: (res) => {
        resolve(res)
      },
      fail: (err) => {
        console.error('[选择图片] 失败:', err)
        // 如果是权限问题，给出更友好的提示
        if (err.errMsg && err.errMsg.includes('permission')) {
          uni.showModal({
            title: '权限不足',
            content: '需要相册和相机权限才能选择图片，请在设置中开启',
            showCancel: true,
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // #ifdef APP-PLUS
                plus.runtime.openURL('app-settings:')
                // #endif
              }
            }
          })
        }
        reject(err)
      }
    })
  })
}

