// 抢票/行前时间表：根据出发日期、天数、交通方式倒排每一步的办理日期
const DAY = 86400000
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const addDays = (d, n) => new Date(d.getTime() + n * DAY)
export const fmtDate = (d) => `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`

export function defaultDepartDate() {
  // 默认 16 天后出发：火车票刚好还没开售，时间表立刻有用
  const d = addDays(new Date(), 16)
  return d.toISOString().slice(0, 10)
}

export function buildTimeline(plan, prep, departDateStr) {
  const today = new Date(new Date().toDateString())
  const depart = new Date(`${departDateStr}T00:00:00`)
  const days = plan.daysCount || 3
  const returnDay = addDays(depart, days - 1)
  const items = []

  const push = (date, title, detail) => items.push({ date, title, detail })

  if (plan.transport.mode === '飞机') {
    push(addDays(depart, -21), '开始蹲特价机票', '中联航/航司 App 每天刷一次，促销多在上午放票；特价票一般不可退改，确认行程再下单')
    push(addDays(depart, -14), '机票决策截止', '临出发两周特价减少——还没蹲到就回头对比高铁/动车现价')
  } else if (plan.transport.mode === '大巴' || plan.transport.mode === '地铁') {
    push(addDays(depart, -3), '买大巴票/查班次', '滴滴小程序「站点巴士」选好就近上车点；地铁直达的什么都不用买，带交通卡就行')
  } else {
    push(addDays(depart, -14), '抢去程火车票', '12306 提前 15 天（含乘车日）放票，8:00 起售；学生票先完成线上资质核验，秒没就立刻挂候补')
    push(addDays(returnDay, -14), '抢返程票', '返程同样提前 15 天放票；去程抢到什么时间，返程跟着锁定')
  }

  ;(prep || []).forEach((p) => {
    push(addDays(depart, -p.advanceDays), `预约：${p.name}`, p.note)
  })

  push(
    addDays(depart, -7),
    '订住宿',
    plan.style === 'easy' ? '订快捷酒店：周日—周四价格最低，连住问前台有没有学生价' : '订青旅床位：选评分 4.5+、有储物柜、近地铁的店',
  )
  push(addDays(depart, -1), '行前检查', '学生证注册章齐全+火车票优惠卡已充磁、身份证、充电宝、U 型枕（夜车神器）')

  return items
    .sort((a, b) => a.date - b.date)
    .map((it) => {
      const diff = Math.round((it.date - today) / DAY)
      const status = diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff <= 3 ? 'soon' : 'future'
      return { ...it, status, daysLeft: diff }
    })
}
