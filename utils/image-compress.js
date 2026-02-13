/**
 * @Description: 字符串字节大小计算函数
 * @param {string} str - 要计算的字符串
 * @returns {number} 字符串的字节大小
 */
export const getStringByteSize = (str) => {
  if (!str || typeof str !== 'string') return 0
  let size = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code <= 0x7f) {
      size += 1
    } else if (code <= 0x7ff) {
      size += 2
    } else if (code <= 0xffff) {
      size += 3
    } else {
      size += 4
    }
  }
  return size
}

/**
 * @Description: 选择图片
 * @param {number} count - 最多可以选择的图片张数，默认1
 * @param {Array<string>} sizeType - 图片尺寸，默认["compressed"]
 * @param {Array<string>} sourceType - 图片的来源，默认["album", "camera"]
 * @returns {Promise<string|Array<string>>} 返回图片路径，如果count>1则返回数组
 */
export const chooseImage = (count = 1, sizeType = ["compressed"], sourceType = ["album", "camera"]) => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: count,
      sizeType: sizeType,
      sourceType: sourceType,
      success: (res) => {
        if (count === 1) {
          resolve(res.tempFiles[0].path)
        } else {
          resolve(res.tempFiles.map(file => file.path))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * @Description: 压缩图片
 * @param {string} path - 图片路径
 * @param {number} maxSize - 图片压缩后最大文件大小，单位Byte
 * @param {number} quality - 图片压缩率 1~100，越小压缩率越大，默认80
 * @param {number} compressedWidth - 压缩后的宽度，默认800
 * @param {number} compressedHeight - 压缩后的高度，默认800
 * @returns {Promise<string>} 返回压缩后的base64格式图片或路径
 */
export const compressImage = (path, maxSize, quality = 80, compressedWidth = 800, compressedHeight = 800) => {
  return new Promise((resolve, reject) => {
    if (quality === 0) {
      reject(new Error(`图片无法压缩至${maxSize}B以下，请重新上传`))
      return
    }

    if (!path || typeof path !== 'string') {
      reject(new Error('图片路径无效'))
      return
    }

    uni.compressImage({
      src: path, // 文件路径
      quality: quality, // 压缩后图片质量
      compressedWidth: compressedWidth, // 压缩后的宽
      compressedHeight: compressedHeight, // 压缩后的高度
      success: (res) => {
        if (!res.tempFilePath) {
          reject(new Error('压缩失败，未返回临时文件路径'))
          return
        }

        // 尝试将压缩后的暂存文件路径转换为base64格式
        try {
          if (uni.getFileSystemManager && typeof uni.getFileSystemManager === 'function') {
            const fs = uni.getFileSystemManager()
            const base64Data = fs.readFileSync(res.tempFilePath, 'base64')
            const result = `data:image/png;base64,${base64Data}`
            const resultSize = getStringByteSize(result)

            if (resultSize > maxSize) {
              // 如果仍然超过最大大小，降低质量继续压缩
              const nextQuality = Math.max(10, quality - 5)
              compressImage(path, maxSize, nextQuality, compressedWidth, compressedHeight)
                .then(resolve)
                .catch(reject)
            } else {
              resolve(result)
            }
          } else {
            // 不支持getFileSystemManager的平台（如H5），直接返回临时文件路径
            console.warn('[图片压缩] 平台不支持getFileSystemManager，返回临时文件路径')
            resolve(res.tempFilePath)
          }
        } catch (error) {
          console.error('[图片压缩] 读取文件失败:', error)
          // 如果读取失败，返回临时文件路径
          resolve(res.tempFilePath)
        }
      },
      fail: (err) => {
        console.error('[图片压缩] 压缩失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * @Description: 压缩图片（返回文件路径，不转换为base64）
 * 适用于需要上传文件路径的场景
 * @param {string} path - 图片路径
 * @param {number} maxSizeMB - 图片压缩后最大文件大小，单位MB
 * @param {number} quality - 图片压缩率 1~100，越小压缩率越大，默认80
 * @param {number} attempt - 当前尝试次数，默认1
 * @returns {Promise<string>} 返回压缩后的文件路径
 */
export const compressImageToPath = (path, maxSizeMB = 0.7, quality = 80, attempt = 1) => {
  return new Promise((resolve, reject) => {
    const maxAttempts = 10 // 最多尝试10次压缩

    if (!path || typeof path !== 'string') {
      reject(new Error('图片路径无效'))
      return
    }

    if (quality === 0 || attempt > maxAttempts) {
      reject(new Error(`图片无法压缩至${maxSizeMB}MB以下，已尝试${maxAttempts}次`))
      return
    }

    // 计算压缩质量（逐步降低）
    const compressQuality = attempt === 1 ? quality : Math.max(10, quality - (attempt - 1) * 5)

    uni.compressImage({
      src: path,
      quality: compressQuality,
      compressedWidth: 800,
      compressedHeight: 800,
      success: (res) => {
        if (!res.tempFilePath) {
          reject(new Error('压缩失败，未返回临时文件路径'))
          return
        }

        // 检查文件大小
        if (uni.getFileSystemManager && typeof uni.getFileSystemManager === 'function') {
          const fs = uni.getFileSystemManager()
          fs.getFileInfo({
            filePath: res.tempFilePath,
            success: (fileInfo) => {
              const fileSizeMB = fileInfo.size / 1024 / 1024

              // 如果文件大小满足要求，或者已达到最大尝试次数，返回结果
              if (fileSizeMB <= maxSizeMB || attempt >= maxAttempts) {
                resolve(res.tempFilePath)
              } else {
                // 继续递归压缩
                compressImageToPath(res.tempFilePath, maxSizeMB, compressQuality, attempt + 1)
                  .then(resolve)
                  .catch(reject)
              }
            },
            fail: () => {
              // 获取文件信息失败，如果还有尝试次数，继续压缩
              if (attempt < maxAttempts && compressQuality > 10) {
                compressImageToPath(res.tempFilePath, maxSizeMB, compressQuality - 5, attempt + 1)
                  .then(resolve)
                  .catch(() => resolve(res.tempFilePath))
              } else {
                resolve(res.tempFilePath)
              }
            }
          })
        } else {
          // 不支持getFileSystemManager的平台，如果还有尝试次数，继续压缩以确保满足大小要求
          if (attempt < maxAttempts && compressQuality > 10) {
            compressImageToPath(res.tempFilePath, maxSizeMB, compressQuality - 5, attempt + 1)
              .then(resolve)
              .catch(() => resolve(res.tempFilePath))
          } else {
            resolve(res.tempFilePath)
          }
        }
      },
      fail: (err) => {
        console.error(`[图片压缩] 压缩失败（第${attempt}次尝试）:`, err)
        // 压缩失败，如果还有尝试次数，降低质量继续尝试
        if (attempt < maxAttempts && compressQuality > 10) {
          compressImageToPath(path, maxSizeMB, compressQuality - 5, attempt + 1)
            .then(resolve)
            .catch(() => resolve(path))
        } else {
          // 达到最大尝试次数或质量已最低，返回原文件路径
          resolve(path)
        }
      }
    })
  })
}
