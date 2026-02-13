// 注册静态资源与小程序端私有配置，确保构建器/分析器识别这些文件为有依赖项
// 以 try-catch 包裹，避免在目标环境不存在时抛错
try {
  // iconfont 数据模块（仅用于打包/字体映射）
  require('../static/999/iconfont.data.js')
} catch (e) {
  // ignore
}

try {
  // 小程序本地私有配置（已转为 JS 模块以便运行时引用）
  require('./project.private.config.js')
} catch (e) {
  // ignore
}

try {
  // wechat-auth 模块（静默登录工具），有时被动态 import
  // 显式引用有助于一些静态分析/打包工具识别依赖
  require('./wechat-auth.js')
} catch (e) {
  // ignore
}

// 注册 tabbar 图标文件路径，确保构建工具识别这些静态资源
// 注意：这些路径字符串会被构建工具扫描，从而确保文件被复制到输出目录
const tabbarIcons = [
  '/static/tabbar/shouye.png',
  '/static/tabbar/tuandui.png',
  '/static/tabbar/tongzhi.png',
  '/static/tabbar/wode.png'
]

// 在构建时，这些路径字符串会被静态分析工具识别
// 运行时，这些路径会在 app.json/pages.json 中被引用
if (typeof process !== 'undefined' && process.env) {
  // 构建环境，输出日志以便调试
  console.log('[register-static-assets] 注册 tabbar 图标路径:', tabbarIcons)
}

module.exports = {
  tabbarIcons
}
