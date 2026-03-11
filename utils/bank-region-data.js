import areaFull from '@/data/area-full.json'

/** 常用开户银行（与微信支付进件常用名称一致） */
export const BANK_LIST = [
  '中国工商银行',
  '中国农业银行',
  '中国银行',
  '中国建设银行',
  '交通银行',
  '招商银行',
  '中国邮政储蓄银行',
  '中信银行',
  '中国光大银行',
  '华夏银行',
  '中国民生银行',
  '广发银行',
  '平安银行',
  '兴业银行',
  '浦发银行',
  '浙商银行',
  '渤海银行',
  '恒丰银行',
  '北京银行',
  '上海银行',
  '江苏银行',
  '宁波银行',
  '南京银行',
  '杭州银行',
  '山西省农村信用社',
  '晋商银行',
  '北京农商银行',
  '上海农商银行',
  '广州银行',
  '其他银行'
]

/**
 * 从 area-full.json 构建全国省市区映射
 * 结构：省 { name, code: 2位 } -> 市 { name, code: 4位 } -> 区 { name, code: 6位 }
 */
const PROVINCES = []
const CITIES_BY_PROV = {}
const DISTRICTS_BY_CITY = {}

;(areaFull || []).forEach(prov => {
  const provCode = String(prov.adcode || '').slice(0, 2)
  if (!provCode) return

  PROVINCES.push({
    name: prov.name,
    code: provCode
  })

  const cities = []
  ;(prov.districts || []).forEach(city => {
    const cityCode = String(city.adcode || '').slice(0, 4)
    if (!cityCode) return

    cities.push({
      name: city.name,
      code: cityCode
    })

    const districts = []
    ;(city.districts || []).forEach(dist => {
      const distCode = String(dist.adcode || '').slice(0, 6)
      if (!distCode) return
      districts.push({
        name: dist.name,
        code: distCode
      })
    })

    if (districts.length) {
      DISTRICTS_BY_CITY[cityCode] = districts
    }
  })

  if (cities.length) {
    CITIES_BY_PROV[provCode] = cities
  }
})

function ensureCities(provCode) {
  const code = String(provCode || '').slice(0, 2)
  if (CITIES_BY_PROV[code] && CITIES_BY_PROV[code].length) return CITIES_BY_PROV[code]
  return [{ name: '请选择市', code: code + '01' }]
}

function ensureDistricts(cityCode) {
  const code = String(cityCode || '').slice(0, 4)
  if (DISTRICTS_BY_CITY[code] && DISTRICTS_BY_CITY[code].length) return DISTRICTS_BY_CITY[code]
  const six = (code + '01').slice(0, 6)
  return [{ name: '请选择区/县', code: six }]
}

export function getProvinces() {
  return PROVINCES
}

export function getCities(provinceCode) {
  return ensureCities(provinceCode)
}

export function getDistricts(cityCode) {
  return ensureDistricts(cityCode)
}

export function getRegionLabel(provCode, cityCode, districtCode) {
  const pCode = String(provCode || '').slice(0, 2)
  const cCode = String(cityCode || '').slice(0, 4)
  const dCode = String(districtCode || '').slice(0, 6)

  const p = PROVINCES.find(x => x.code === pCode)
  const cities = getCities(pCode)
  const c = cities.find(x => x.code === cCode)
  const districts = getDistricts(cCode)
  const d = districts.find(x => x.code === dCode)
  const parts = [p?.name, c?.name, d?.name].filter(Boolean)
  return parts.join(' ') || ''
}

