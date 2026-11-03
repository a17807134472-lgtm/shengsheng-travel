// 共享地理编码（Nominatim 公益服务，限速 1 次/秒）
const cleanName = (s) => s.replace(/（.*?）/g, '').replace(/[·・].*$/, '')
const stripDecor = (s) =>
  cleanName(s)
    .replace(/(免费预约|免费|夜景|轻轨穿楼|逛吃|早市|门口打卡|围观|骑行|体验|挑战.*)$/g, '')
    .trim()

const cache = new Map()

export async function geocode(cityName, name) {
  const key = `${cityName}::${name}`
  if (cache.has(key)) return cache.get(key)
  const base = cleanName(name)
  const short = stripDecor(name)
  const queries = [...new Set([`${base} ${cityName}`, `${short} ${cityName}`, short])]
  let pos = null
  for (const q0 of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cn&q=${encodeURIComponent(q0)}`,
        { headers: { 'Accept-Language': 'zh-CN' } },
      )
      const json = await res.json()
      if (json[0]) {
        pos = [parseFloat(json[0].lat), parseFloat(json[0].lon)]
        break
      }
    } catch { /* 单个失败继续 */ }
    await new Promise((r) => setTimeout(r, 1100))
  }
  cache.set(key, pos)
  return pos
}

// 汇总一个城市的全部可落图点位（景点+餐饮+娱乐）
export function buildCityItems(city) {
  return [
    ...city.pois.map((p, i) => ({
      id: `poi-${p.name}`, kind: 'poi', idx: i, name: p.name,
      area: p.area, hours: p.hours,
      priceNote: p.cost === 0 ? '免费' : p.student != null && p.student !== p.cost ? `学生 ¥${p.student}` : `¥${p.cost}`,
    })),
    ...(city.eats || []).map((e, i) => ({
      id: `eat-${e.name}`, kind: 'eat', idx: i, name: e.name,
      area: e.area, hours: 1.5, priceNote: `人均 ¥${e.per}`,
    })),
    ...(city.funs || []).map((f, i) => ({
      id: `fun-${f.name}`, kind: 'fun', idx: i, name: f.name,
      area: f.area, hours: f.hours,
      priceNote: f.price === 0 ? '免费' : `¥${f.price}`,
    })),
  ]
}

export const KIND_COLOR = { poi: '#C42121', eat: '#210C02', fun: '#8C5A2B' }
export const KIND_NAME = { poi: '景点', eat: '餐饮', fun: '娱乐' }
