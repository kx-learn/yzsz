/**
 * 修正錯誤寫法的 http(s) 地址（如 `https:yuzedigital.site` 少 `//`）。
 * 小程序會把這類字串當成相對路徑，拼到當前頁路徑下導致圖片 500。
 */
export function normalizeRemoteUrl(url) {
	if (url == null || typeof url !== 'string') return url
	const s = url.trim()
	if (s.startsWith('https://') || s.startsWith('http://')) return s
	if (s.startsWith('https:/') && !s.startsWith('https://')) {
		return 'https://' + s.slice('https:/'.length)
	}
	if (s.startsWith('http:/') && !s.startsWith('http://')) {
		return 'http://' + s.slice('http:/'.length)
	}
	if (/^https:[^/]/.test(s)) {
		return 'https://' + s.slice('https:'.length).replace(/^\/+/, '')
	}
	if (/^http:[^/]/.test(s)) {
		return 'http://' + s.slice('http:'.length).replace(/^\/+/, '')
	}
	return s
}

/** 是否為已拼好的遠程 http(s) 圖片地址（normalize 後判斷） */
export function isAbsoluteHttpUrl(url) {
	if (!url || typeof url !== 'string') return false
	const u = normalizeRemoteUrl(url)
	return u.startsWith('https://') || u.startsWith('http://')
}
