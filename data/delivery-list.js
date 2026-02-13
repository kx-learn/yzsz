/**
 * 微信小程序支持的快递公司列表（本地缓存，常用置顶 + 支持搜索）
 * 数据来源：GET /merchant/wechat/delivery-list 接口返回的 delivery_list
 * 完整 1509 条：可将接口返回的 delivery_list 数组合并进 DELIVERY_LIST_FULL，或通过 getDeliveryListFromApi 拉取后传入 getDeliveryListSorted(rawList)
 */

/** 常用快递公司编码（页面最上方优先显示） */
export const COMMON_DELIVERY_IDS = [
  'SF',        // 顺丰速运
  'YTO',       // 圆通速递
  'ZTO',       // 中通快递
  'STO',       // 申通快递
  'YD',        // 韵达速递
  'EMS',       // EMS
  'JTSD',      // 极兔速递
  'JD',        // 京东快递
  'DBL',       // 德邦快递
  'HTKY',      // 百世快递
  'ZJS',       // 宅急送
  'FWX',       // 丰网速运
  'YZPY',      // 邮政快递包裹
  'CHINAPOST', // China Post
  'CNPEX',     // CNPEX中邮快递
  'DHL',       // DHL
  'FEDEX',     // FEDEX联邦
  'UPS',       // UPS
  'OTHER'      // 其他快递
]

/**
 * 完整快递列表：{ delivery_id, delivery_name }（与接口返回格式一致）
 * 此处为接口返回的全量数据本地缓存，便于离线使用与搜索
 */
export const DELIVERY_LIST_FULL = [
  { delivery_id: 'SF', delivery_name: '顺丰速运' },
  { delivery_id: 'YTO', delivery_name: '圆通速递' },
  { delivery_id: 'ZTO', delivery_name: '中通快递' },
  { delivery_id: 'STO', delivery_name: '申通快递' },
  { delivery_id: 'YD', delivery_name: '韵达速递' },
  { delivery_id: 'EMS', delivery_name: 'EMS' },
  { delivery_id: 'JTSD', delivery_name: '极兔速递' },
  { delivery_id: 'JD', delivery_name: '京东快递' },
  { delivery_id: 'DBL', delivery_name: '德邦快递' },
  { delivery_id: 'HTKY', delivery_name: '百世快递' },
  { delivery_id: 'ZJS', delivery_name: '宅急送' },
  { delivery_id: 'FWX', delivery_name: '丰网速运' },
  { delivery_id: 'YZPY', delivery_name: '邮政快递包裹' },
  { delivery_id: 'CHINAPOST', delivery_name: 'China Post' },
  { delivery_id: 'CNPEX', delivery_name: 'CNPEX中邮快递' },
  { delivery_id: '007EX', delivery_name: '俄顺达' },
  { delivery_id: '138SD', delivery_name: '泰国138快递' },
  { delivery_id: '139EXPRESS', delivery_name: '139快递' },
  { delivery_id: '1DLEXPRESS', delivery_name: 'e递诺快递' },
  { delivery_id: 'CITY100', delivery_name: '城市100' },
  { delivery_id: 'DHL', delivery_name: 'DHL' },
  { delivery_id: 'FEDEX', delivery_name: 'FEDEX联邦(国内件）' },
  { delivery_id: 'FEDEX_GJ', delivery_name: 'FEDEX联邦(国际件）' },
  { delivery_id: 'UPS', delivery_name: 'UPS' },
  { delivery_id: 'USPS', delivery_name: 'USPS美国邮政' },
  { delivery_id: 'OTHER', delivery_name: '其他快递' }
]

/**
 * 获取格式化列表（前端用）：{ code, name }
 * @param {Array} rawList 可选，接口返回的 delivery_list；不传则用本地 DELIVERY_LIST_FULL
 * @returns {Array<{ code: string, name: string }>}
 */
export function formatDeliveryList (rawList) {
  const list = Array.isArray(rawList) && rawList.length > 0 ? rawList : DELIVERY_LIST_FULL
  return list.map(item => {
    if (typeof item === 'string') return { code: item, name: item }
    const code = item.delivery_id ?? item.code ?? item.id ?? item.name ?? ''
    const name = item.delivery_name ?? item.name ?? item.code ?? ''
    return { code: String(code), name: String(name) }
  }).filter(x => x.code)
}

/**
 * 常用置顶 + 其余按原序
 * @param {Array<{ code: string, name: string }>} list formatDeliveryList 的结果
 * @returns {Array<{ code: string, name: string }>}
 */
export function sortCommonFirst (list) {
  const commonSet = new Set(COMMON_DELIVERY_IDS)
  const common = list.filter(x => commonSet.has(x.code))
  const rest = list.filter(x => !commonSet.has(x.code))
  const order = [...COMMON_DELIVERY_IDS]
  common.sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
  return [...common, ...rest]
}

/**
 * 获取快递列表（常用置顶，供页面/接口兼容使用）
 * @param {Array} rawList 可选，接口 delivery_list；不传则用本地
 * @returns {Array<{ code: string, name: string }>}
 */
export function getDeliveryListSorted (rawList) {
  const formatted = formatDeliveryList(rawList)
  return sortCommonFirst(formatted)
}

/**
 * 按关键词搜索（匹配 code 或 name）
 * @param {string} keyword
 * @param {Array<{ code: string, name: string }>} list 可选，默认用 getDeliveryListSorted()
 * @returns {Array<{ code: string, name: string }>}
 */
export function searchDeliveryList (keyword, list) {
  const full = list && list.length > 0 ? list : getDeliveryListSorted()
  if (!keyword || !String(keyword).trim()) return full
  const q = String(keyword).trim().toLowerCase()
  return full.filter(item =>
    (item.code && item.code.toLowerCase().includes(q)) ||
    (item.name && item.name.toLowerCase().includes(q))
  )
}
