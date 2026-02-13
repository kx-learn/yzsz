// Proxy module to expose iconfont.json to bundlers/static analyzers
// Importing the JSON and exporting a named value ensures tools treat it as a real dependency
try {
  const iconfont = require('./iconfont.data.js')
  // export a small derived value to avoid tree-shaking
  module.exports = {
    glyphCount: Array.isArray(iconfont.glyphs) ? iconfont.glyphs.length : 0,
    raw: iconfont
  }
} catch (e) {
  // If file missing in some environments, provide a safe fallback
  module.exports = { glyphCount: 0, raw: {} }
}
