// iconfont.module.js：显式导入 iconfont.json，导出 glyphs/meta，并提供注册函数
try {
    const iconfont = require('./iconfont.data.js')

    module.exports = {
        glyphs: Array.isArray(iconfont.glyphs) ? iconfont.glyphs : [],
        meta: {
            id: iconfont.id,
            name: iconfont.name,
            fontFamily: iconfont.font_family || 'iconfont'
        },
        raw: iconfont,
        register: function () {
            try {
                if (typeof wx !== 'undefined' && typeof wx.loadFontFace === 'function') {
                    try {
                        wx.loadFontFace({
                            family: iconfont.font_family || 'iconfont',
                            source: `url("/static/999/iconfont.ttf")`
                        })
                    } catch (e) { }
                }
                if (typeof document !== 'undefined') {
                    const styleId = 'iconfont-face-style'
                    if (!document.getElementById(styleId)) {
                        const s = document.createElement('style')
                        s.id = styleId
                        s.innerText = `@font-face { font-family: '${iconfont.font_family || 'iconfont'}'; src: url('/static/999/iconfont.woff2') format('woff2'), url('/static/999/iconfont.woff') format('woff'), url('/static/999/iconfont.ttf') format('truetype'); font-weight: normal; font-style: normal; }`
                        document.head.appendChild(s)
                    }
                }
            } catch (e) { }
        }
    }
} catch (e) {
    module.exports = { glyphs: [], meta: {}, raw: {}, register: function () { } }
}