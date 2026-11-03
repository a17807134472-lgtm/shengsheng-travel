// 双模式方案生成引擎：同一目的地，产出省事版与耗时版两套方案
const round = (n) => Math.round(n)

// 玩法偏好 → poi 标签映射
const TAG_THEME = {
  街区: 'walk', 古镇: 'walk', 古城: 'walk', 建筑: 'walk', 徒步: 'walk', 夜景: 'walk',
  打卡: 'walk', 文艺: 'walk', 地标: 'walk', 园林: 'walk', 博物馆: 'walk', 人文: 'walk',
  体验: 'fun', 乐园: 'fun', 一日游: 'fun', 登山: 'fun', 观景: 'fun', 海滨: 'fun', 海岛: 'fun', 骑行: 'fun',
  美食: 'food', 商圈: 'food',
}

// 出发地变体：fs=佛山 / gz=广州（全量已核实数据）；其余出发地走里程估算引擎（明确标注估算）
const haversine = (a, b) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(s)))
}

// 估算：直线距离×1.2 近似铁路里程，高铁二等座 ¥0.46/km、普速硬座 ¥0.13/km
export function estimateTransport(city, origin) {
  const railKm = Math.round(haversine(origin, city.coords) * 1.2)
  const options = []
  if (railKm < 2000) {
    options.push({
      mode: '高铁', label: `${origin.name}→${city.name} 高铁/动车二等座（估算）`,
      price: Math.max(20, Math.round(railKm * 0.46)),
      hours: Math.round((railKm / 220 + 0.5) * 2) / 2,
      note: `约 ${railKm}km 铁路里程 × ¥0.46/km 估算，以 12306 为准`,
      channel: '12306 App', estimated: true,
    })
  }
  if (railKm >= 150 && railKm < 2600) {
    const hours = Math.round((railKm / 85 + 1) * 2) / 2
    options.push({
      mode: '普速', label: `${origin.name}→${city.name} 普速硬座（估算）`,
      price: Math.max(20, Math.round(railKm * 0.13)),
      hours, overnight: hours >= 8,
      note: `约 ${railKm}km × ¥0.13/km 估算${hours >= 8 ? '，夜车可省 1 晚住宿' : ''}，以 12306 为准`,
      channel: '12306 App', estimated: true,
    })
  }
  if (railKm >= 700) {
    const price = railKm < 1000 ? 350 : railKm < 1800 ? 450 : railKm < 2600 ? 550 : 700
    options.push({
      mode: '飞机', label: `${origin.name}→${city.name} 特价机票（估算）`,
      price, hours: Math.round((railKm / 700 + 1.5) * 2) / 2,
      note: '按距离档估算特价票，实际以航司实时为准',
      channel: '航司 App/携程比价', estimated: true,
    })
  }
  return options
}

export function transportFor(city, origin = 'fs') {
  // 兼容旧调用（字符串 'fs'/'gz'）
  const o = typeof origin === 'string' ? { key: origin, name: origin === 'fs' ? '佛山' : '广州' } : origin
  if (o.key === 'fs') return city.transport
  if (o.key === 'gz') {
    return city.transport
      .map((t) => {
        if (t.gz) return { ...t, ...t.gz }
        if (/沙堤|佛山西/.test(t.label)) return null
        return t
      })
      .filter(Boolean)
  }
  return estimateTransport(city, o)
}

// 每天的时间容量（小时）：特种兵式塞满 vs 躺平少而精
const PACE_CAP = { tight: 10, normal: 8, chill: 5 }

function pickPois(city, days, style, theme = 'mix', pace = 'normal') {
  const cap = PACE_CAP[pace] || PACE_CAP.normal
  // 排序优先级：主题命中 > 风格价格规则；同分保持原顺序
  const pool = [...city.pois].sort((a, b) => {
    if (theme !== 'mix') {
      const am = TAG_THEME[a.tag] === theme ? 0 : 1
      const bm = TAG_THEME[b.tag] === theme ? 0 : 1
      if (am !== bm) return am - bm
    }
    return style === 'easy' ? (b.cost - a.cost) : ((a.student ?? a.cost) - (b.student ?? b.cost))
  })

  const daysPlan = []
  let firstArea = null
  for (let d = 0; d < days; d++) {
    const isFirst = d === 0
    const isLast = d === days - 1
    // 抵达/返程日容量打 6 折
    let dayCap = cap0(cap, isFirst || isLast)
    let hours = 0
    let area = null
    const items = []
    // 逐日贪心：优先同片区，装到时间容量满为止
    while (pool.length) {
      const areaMatch = area ? pool.findIndex((p) => p.area === area) : 0
      let idx = areaMatch >= 0 ? areaMatch : 0
      // 若同片区装不下时间，允许跨片区
      const fitIdx = pool.findIndex((p) => hours + p.hours <= dayCap)
      if (fitIdx < 0) break
      if (hours + pool[idx].hours > dayCap) idx = fitIdx
      const poi = pool.splice(idx, 1)[0]
      items.push({
        name: poi.name,
        cost: style === 'tough' ? (poi.student ?? poi.cost) : poi.cost,
        hours: poi.hours,
        tag: poi.tag,
        area: poi.area,
        tips: poi.tips,
      })
      hours += poi.hours
      area = poi.area
      if (d === 0 && !firstArea) firstArea = area
    }
    daysPlan.push({
      day: d + 1,
      title: isFirst ? '抵达日' : isLast ? '返程日' : `第 ${d + 1} 天`,
      area,
      hours,
      items,
      food: city.food.recs[(d * 2) % city.food.recs.length],
      food2: city.food.recs[(d * 2 + 1) % city.food.recs.length],
    })
  }
  return daysPlan
}

function cap0(cap, edgeDay) {
  return edgeDay ? cap * 0.6 : cap
}

function buildOne(city, days, style, theme = 'mix', pace = 'normal', origin = 'fs') {
  const isEasy = style === 'easy'
  const options = transportFor(city, origin)
  const transport = isEasy
    ? [...options].sort((a, b) => a.hours - b.hours)[0]
    : [...options].sort((a, b) => a.price - b.price)[0]
  const overnight = !isEasy && transport.overnight
  const nights = overnight && days >= 2 ? days - 1 : days
  const stay = isEasy ? city.stay.comfort : city.stay.hostel
  const foodPerDay = isEasy ? city.food.comfort : city.food.budget
  const localPerDay = isEasy ? city.local.comfort : city.local.budget
  const daysPlan = pickPois(city, days, style, theme, pace)

  const tickets = daysPlan.flatMap((d) => d.items).reduce((s, i) => s + i.cost, 0)
  const breakdown = {
    transport: transport.price * 2,
    stay: stay.price * nights,
    food: foodPerDay * days,
    local: localPerDay * days,
    tickets,
  }
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return {
    style,
    transport,
    transportHours: transport.hours * 2,
    nights,
    stayLabel: stay.label,
    stayPrice: stay.price,
    daysPlan,
    breakdown,
    total,
    notes: isEasy
      ? ['白天出发不熬夜', '少换乘、少排队', '住宿位置优先选商圈/地铁口']
      : [
          overnight ? '夜车睡一觉就到，省 1 晚房费' : '全程最低票价组合',
          '免费景点优先，付费项目全用学生票',
          '市内公交+步行，顺便逛城市肌理',
        ],
  }
}

export function buildPlans(city, days, budget, theme = 'mix', pace = 'normal', origin = 'fs') {
  const easy = buildOne(city, days, 'easy', theme, pace, origin)
  const tough = buildOne(city, days, 'tough', theme, pace, origin)
  const saved = round(easy.total - tough.total)
  const extraHours = round(tough.transportHours - easy.transportHours)
  return {
    city, days, budget, easy, tough,
    verdict: {
      saved: Math.max(saved, 0),
      extraHours: Math.max(extraHours, 0),
      perHour: extraHours > 0 ? round(saved / extraHours) : null,
    },
    withinBudget: { easy: easy.total <= budget, tough: tough.total <= budget },
  }
}

export function estimateMin(city) {
  // 首页卡片用：3 天耗时版的起步价
  return buildPlans(city, 3, 99999).tough.total
}

// 预算超支时的「省钱手术单」：每条都是可执行的数据变换，点击即应用重算
export function adjustmentsFor(plan, city, days, budget) {
  const gap = plan.total - budget
  if (gap <= 0) return { gap, items: [], covered: true }

  const items = []
  const isEasy = plan.style === 'easy'

  // 1. 大交通降档
  const cheaper = city.transport
    .filter((t) => t.price < plan.transport.price)
    .sort((a, b) => b.price - a.price)[0]
  if (cheaper) {
    items.push({
      key: 'transport', kind: 'transport', to: cheaper,
      label: `大交通换成「${cheaper.label}」`,
      save: (plan.transport.price - cheaper.price) * 2,
    })
  }

  // 2. 住宿降档（省事版→青旅）
  if (isEasy) {
    const d = (city.stay.comfort.price - city.stay.hostel.price) * plan.nights
    if (d > 0) {
      items.push({
        key: 'stay', kind: 'stay', to: city.stay.hostel,
        label: `住宿换成「${city.stay.hostel.label}」`,
        save: d,
      })
    }
  }

  // 3. 夜车省一晚房费
  const ov = city.transport.find((t) => t.overnight)
  if (ov && plan.nights === days && days >= 2) {
    const price = isEasy ? city.stay.comfort.price : city.stay.hostel.price
    items.push({ key: 'overnight', kind: 'overnight', label: '改坐夕发朝至夜车，省 1 晚房费', save: price })
  }

  // 4. 砍掉最贵付费项目
  const paid = plan.daysPlan.flatMap((d) => d.items).filter((i) => i.cost > 0).sort((a, b) => b.cost - a.cost)
  if (paid[0]) {
    items.push({
      key: `poi-${paid[0].name}`, kind: 'poi', name: paid[0].name,
      label: `砍掉最贵项目「${paid[0].name}」`,
      save: paid[0].cost,
    })
  }

  // 5. 少玩一天
  if (days >= 3) {
    const perDay = Math.round((plan.breakdown.food + plan.breakdown.local + plan.breakdown.stay) / days)
    items.push({
      key: 'dropDay', kind: 'dropDay',
      perDayFood: Math.round(plan.breakdown.food / days),
      perDayLocal: Math.round(plan.breakdown.local / days),
      stayPrice: plan.stayPrice,
      label: '行程压缩 1 天',
      save: perDay,
    })
  }

  items.sort((a, b) => b.save - a.save)
  return { gap, items, covered: items.reduce((s, i) => s + i.save, 0) >= gap }
}

// 把选中的刀法应用到方案上，返回重算后的新方案（不改动原对象）
export function applyCuts(plan, cuts) {
  const p = {
    ...plan,
    breakdown: { ...plan.breakdown },
    daysPlan: plan.daysPlan.map((d) => ({ ...d, items: [...d.items] })),
  }
  for (const c of cuts) {
    if (c.kind === 'transport') {
      p.transport = c.to
      p.transportHours = c.to.hours * 2
      p.breakdown.transport = c.to.price * 2
    }
    if (c.kind === 'stay') {
      p.stayLabel = c.to.label
      p.stayPrice = c.to.price
      p.breakdown.stay = c.to.price * p.nights
    }
    if (c.kind === 'overnight' && p.nights > 0) {
      p.nights -= 1
      p.breakdown.stay = Math.max(0, p.breakdown.stay - p.stayPrice)
    }
    if (c.kind === 'poi') {
      for (const d of p.daysPlan) {
        const i = d.items.findIndex((x) => x.name === c.name)
        if (i >= 0) {
          p.breakdown.tickets = Math.max(0, p.breakdown.tickets - d.items[i].cost)
          d.items.splice(i, 1)
          break
        }
      }
    }
    if (c.kind === 'dropDay' && p.daysPlan.length > 2) {
      p.daysPlan.pop()
      p.daysCount -= 1
      p.nights = Math.max(0, p.nights - 1)
      p.breakdown.food = Math.max(0, p.breakdown.food - c.perDayFood)
      p.breakdown.local = Math.max(0, p.breakdown.local - c.perDayLocal)
      p.breakdown.stay = Math.max(0, p.breakdown.stay - c.stayPrice)
    }
  }
  p.total = Object.values(p.breakdown).reduce((a, b) => a + b, 0)
  return p
}

// 生成纯文本行程单：复制发给同行搭子
export function planToText(plan, cityName, departDate) {
  const styleName = plan.style === 'easy' ? '省事版' : '耗时版'
  const lines = [
    `【省省旅行】${cityName} · ${plan.daysCount}天 · ${styleName}`,
    `出发日期：${departDate}`,
    ``,
    `大交通：${plan.transport.label} ¥${plan.transport.price}×2（${plan.transport.note}）`,
    `住宿：${plan.stayLabel} ¥${plan.stayPrice}/晚 × ${plan.nights}晚`,
    ``,
  ]
  plan.daysPlan.forEach((d) => {
    lines.push(`Day ${d.day}（${d.title}）`)
    d.items.forEach((i) => lines.push(`  · ${i.name}　${i.cost === 0 ? '免费' : `¥${i.cost}`} · ${i.hours}h`))
    lines.push(`  吃：${d.food} / ${d.food2}`)
  })
  lines.push(
    ``,
    `花费明细：大交通¥${plan.breakdown.transport} / 住宿¥${plan.breakdown.stay} / 吃饭¥${plan.breakdown.food} / 市内¥${plan.breakdown.local} / 门票¥${plan.breakdown.tickets}`,
    `总计：¥${plan.total}`,
    ``,
    `* 大交通为佛山出发参考价（2026年10月检索），以 12306/航司实时为准`,
  )
  return lines.join('\n')
}
