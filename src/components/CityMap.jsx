import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocode, KIND_COLOR, KIND_NAME } from '../lib/geo.js'

const dotIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid #FAF7F1;box-shadow:0 2px 6px rgba(33,12,2,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

// 通用导览图：某城全部点位（或指定子集）落图，点标记直达详情页
export default function CityMap({ city, items, height = 300, zoom = 12 }) {
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const layerRef = useRef(null)
  const [located, setLocated] = useState(0)
  const [total, setTotal] = useState(0)

  const spots = useMemo(() => items, [items])

  useEffect(() => {
    if (mapObj.current) {
      mapObj.current.remove()
      mapObj.current = null
    }
    const m = L.map(mapRef.current).setView([city.coords.lat, city.coords.lon], zoom)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap 贡献者',
      maxZoom: 18,
    }).addTo(m)
    layerRef.current = L.layerGroup().addTo(m)
    mapObj.current = m
    setTimeout(() => m.invalidateSize(), 100)

    // 逐个定位并落点（边定位边上点）
    let cancelled = false
    setTotal(spots.length)
    setLocated(0)
    const bounds = []
    ;(async () => {
      for (const s of spots) {
        if (cancelled) return
        const pos = await geocode(city.name, s.name)
        if (cancelled) return
        if (pos) {
          const color = KIND_COLOR[s.kind] || '#C42121'
          const html = `<div style="font:13px/1.5 sans-serif"><b>${s.name}</b><br/>${s.priceNote || ''}${s.area ? ' · ' + s.area : ''} · ${s.hours}h<br/><a href="#/spot/${city.id}/${s.kind}/${s.idx}" style="color:#C42121;font-weight:600">详情 →</a></div>`
          L.marker(pos, { icon: dotIcon(color) }).addTo(layerRef.current).bindPopup(html)
          bounds.push(pos)
          setLocated((n) => n + 1)
          if (bounds.length === 1) m.setView(pos, 13)
          if (bounds.length >= 2) m.fitBounds(L.latLngBounds(bounds).pad(0.2))
        }
      }
    })()
    return () => {
      cancelled = true
      m.remove()
      mapObj.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, spots])

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="mono-data text-[10px] text-clay">已定位 {located}/{total} · 点标记看详情</span>
        <div className="flex gap-2 ml-auto">
          {Object.entries(KIND_NAME).map(([k, n]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-clay">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} />{n}
            </span>
          ))}
        </div>
      </div>
      <div ref={mapRef} style={{ height }} className="w-full rounded-[20px] overflow-hidden border border-sand card-shadow z-0" />
    </div>
  )
}
