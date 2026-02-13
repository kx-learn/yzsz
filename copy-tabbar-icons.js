// 构建后脚本：确保 tabbar 图标文件被复制到输出目录
const fs = require('fs')
const path = require('path')

// 支持多个输出目录（开发和生产环境）
const outputDirs = [
  path.join(__dirname, 'unpackage/dist/dev/mp-weixin/static/tabbar'),
  path.join(__dirname, 'unpackage/dist/build/mp-weixin/static/tabbar')
]

const sourceDir = path.join(__dirname, 'static/tabbar')

// 要复制的图标文件列表
const iconFiles = ['shouye.png', 'tuandui.png', 'tongzhi.png', 'wode.png']

// 检查源目录是否存在
if (!fs.existsSync(sourceDir)) {
  console.error('[copy-tabbar-icons] 源目录不存在:', sourceDir)
  process.exit(1)
}

// 为每个输出目录复制文件
outputDirs.forEach(targetDir => {
  // 检查输出目录的父目录是否存在（说明已经编译过）
  const parentDir = path.dirname(targetDir)
  if (!fs.existsSync(parentDir)) {
    console.log('[copy-tabbar-icons] 跳过未编译的目录:', targetDir)
    return
  }

  // 确保目标目录存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
    console.log('[copy-tabbar-icons] 创建目标目录:', targetDir)
  }

  // 复制每个图标文件
  let successCount = 0
  iconFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file)
    const targetPath = path.join(targetDir, file)
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath)
        successCount++
        console.log('[copy-tabbar-icons] 复制成功:', file, '->', targetDir)
      } catch (error) {
        console.error('[copy-tabbar-icons] 复制失败:', file, error.message)
      }
    } else {
      console.warn('[copy-tabbar-icons] 源文件不存在:', sourcePath)
    }
  })

  if (successCount === iconFiles.length) {
    console.log('[copy-tabbar-icons] 所有图标已复制到:', targetDir)
  }
})

console.log('[copy-tabbar-icons] 完成')
