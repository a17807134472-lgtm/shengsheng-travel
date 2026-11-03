import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DAY_COLORS = ['#C42121', '#210C02', '#8C5A2B', '#4A6741', '#7B6556']

const cleanName = (name) => name.replace(/（.*?）/g, '').replace(/[·・].*$/, '')

// Nominatim 公益地理编码：限速 1 次/秒，按名称变体逐级重试
const stripDecor = (s) =>
  s.replace(/（.*?）/g, '')
    .replace(/[·・].*$/, '')
    .replace(/(免费预约|免费|夜景|轻轨穿楼|逛吃|早市|门口打卡|围观|骑行|体验|挑战.*)$/g, '')
    .trim()

async function geocode(cityName, name) {
  const base = cleanName(name)
  const short = stripDecor(name)
  const queries = [...new Set([`${base} ${cityName}`, `${short} ${cityName}`, short])]
  for (const q0 of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cn&q=${encodeURIComponent(q0)}`,
        { headers: { 'Accept-Language': 'zh-CN' } },
      )
      const json = await res.json()
      if (json[0]) return [parseFloat(json[0].lat), parseFloat(json[0].lon)]
    } catch { /* 单个失败继续下一个变体 */ }
    await new Promise((r) => setTimeout(r, 1100))
  }
  return null
}

const numIcon = (n, color) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#FAF7F1;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 13px ui-monospace,monospace;border:2px solid #FAF7F1;box-shadow:0 2px 8px rgba(33,12,2,.35)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })

export default function MapRoute({ city, route }) {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const layerRef = useRef(null)
  const activeDayRef = useRef(0)
  const [activeDay, setActiveDay] = useState(0)
  const [points, setPoints] = useState({}) // itemId -> [lat,lon]
  const [custom, setCustom] = useState([]) // {id,name,pos,day}
  const [loading, setLoading] = useState(true)

  const items = useMemo(
    () => route.flatMap((day, di) => day.map((p) => ({ ...p, day: di }))),
    [route],
  )

  // 初始化地图（每城一次）
  useEffect(() => {
    setPoints({})
    setCustom([])
    setActiveDay(0)
    activeDayRef.current = 0
    if (mapObj.current) {
      mapObj.current.remove()
      mapObj.current = null
    }
    const m = L.map(mapRef.current, { attributionControl: true }).setView(
      [city.coords.lat, city.coords.lon],
      12,
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap 贡献者',
      maxZoom: 18,
    }).addTo(m)
    layerRef.current = L.layerGroup().addTo(m)
    // 自取点：点击地图任意位置加入当前选中的天数
    m.on('click', (e) => {
      setCustom((c) => [
        ...c,
        {
          id: `custom-${Date.now()}`,
          name: `自取点 ${c.length + 1}`,
          pos: [e.latlng.lat, e.latlng.lng],
          day: activeDayRef.current,
        },
      ])
    })
    mapObj.current = m
    setTimeout(() => m.invalidateSize(), 100)
    return () => {
      m.remove()
      mapObj.current = null
    }
  }, [city])

  // 地理编码（逐个、限速）
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const out = {}
      for (const it of items) {
        try {
          const pos = await geocode(city.name, it.name)
          if (pos) out[it.id] = pos
        } catch { /* 单个失败不影响整体 */ }
        if (cancelled) return
        await new Promise((r) => setTimeout(r, 1100))
      }
      if (!cancelled) {
        setPoints(out)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])

  // 绘制标记 + 逐日连线
  useEffect(() => {
    const g = layerRef.current
    if (!g) return
    g.clearLayers()
    const allLatLngs = []
    const byDay = new Map()
    items.forEach((it) => {
      const pos = points[it.id]
      if (!pos) return
      if (!byDay.has(it.day)) byDay.set(it.day, [])
      byDay.get(it.day).push({ name: it.name, pos })
    })
    custom.forEach((c) => {
      if (!byDay.has(c.day)) byDay.set(c.day, [])
      byDay.get(c.day).push({ name: c.name, pos: c.pos })
    })

    ;[...byDay.entries()].forEach(([day, pts]) => {
      const color = DAY_COLORS[day % DAY_COLORS.length]
      pts_draw(g, byDay.get(day), color)
      const line = pts.map((p) => p.pos)
      if (line.length > 1) {
        L.polyline(line, { color, weight: 4, opacity: 0.85 }).addTo(g)
      }
      function pts_draw(group, pts, c) {
        pts.forEach((p, i) => {
          L.marker(p.pos, { icon: numIcon(i + 1, c) })
            .addTo(group)
            .bindPopup(`<b>${p.name}</b><br/>Day ${day + 1}`)
          allLatLngs.push(p.pos)
        })
      }
    })

    if (allLatLngs.length > 0) {
      mapObj.current.fitBounds(L.latLngBounds(allLatLngs).pad(0.15))
    }
  }, [points, custom, items])

  const unlocated = items.filter((it) => !points[it.id])
  const switchDay = (d) => {
    setActiveDay(d)
    activeDayRef.current = d
  }

  return (
    <div className="bg-white rounded-[20px] p-4 card-shadow mb-3">
      <div className="flex items-baseline justify-between mb-2">
        <span className="mono-data text-[11px] uppercase tracking-wider text-cinnabar">Map · 地图排线</span>
        <span className="mono-data text-[11px] text-clay">
          {loading ? '正在定位心动点…' : `已定位 ${items.length - unlocated.length}/${items.length}`}
        </span>
      </div>

      {/* 天数选择：决定自取点落在哪一天 */}
      <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
        {route.map((_, d) => (
          <button
            key={d}
            onClick={() => switchDay(d)}
            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
              activeDay === d ? 'text-cream' : 'bg-cream-deep text-clay'
            }`}
            style={activeDay === d ? { background: DAY_COLORS[d % DAY_COLORS.length] } : {}}
          >
            Day {d + 1}
          </button>
        ))}
      </div>

      <div ref={mapRef} className="w-full h-[340px] rounded-2xl overflow-hidden border border-sand z-0" />
      <p className="text-[11px] text-clay mt-1.5 leading-relaxed">
        点地图任意位置可把「自取点」加入当前选中的那天；数字标记是该天的游玩顺序，同色连线为当日动线。
      </p>

      {unlocated.length > 0 && !loading && (
        <p className="text-[11px] text-clay/80 mt-1.5">
          未收录定位：{unlocated.map((u) => cleanName(u.name)).join('、')}（小店太小众，用「高德打开」导航更准）
        </p>
      )}

      {custom.length > 0 && (
        <div className="mt-2 pt-2 border-t border-sand space-y-1">
          {custom.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: DAY_COLORS[c.day % DAY_COLORS.length] }}
              />
              <span className="flex-1">{c.name} · Day {c.day + 1}</span>
              <button
                onClick={() => setCustom((cur) => cur.filter((x) => x.id !== c.id))}
                className="text-clay hover:text-cinnabar"
              >
                删除 ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
