// 抢票/行前时间表组件：垂直时间线，逾期和今天的标红催办
import { buildTimeline, fmtDate } from '../lib/timeline.js'

const STATUS = {
  overdue: { label: '已开抢，立即办', cls: 'bg-cinnabar text-white' },
  today: { label: '今天就办', cls: 'bg-cinnabar text-white' },
  soon: { label: '近 3 天', cls: 'bg-cinnabar/10 text-cinnabar' },
  future: { label: '', cls: 'bg-cream-deep text-clay' },
}

export default function Timeline({ plan, prep, departDate, dark }) {
  const items = buildTimeline(plan, prep, departDate)
  const line = dark ? 'border-cream/15' : 'border-sand'
  const text = dark ? 'text-cream/85' : ''
  const sub = dark ? 'text-cream/55' : 'text-clay'

  return (
    <div className="mt-4">
      {items.map((it, i) => {
        const st = STATUS[it.status]
        const urgent = it.status === 'overdue' || it.status === 'today'
        return (
          <div key={i} className={`relative pl-6 pb-4 border-l ${line} last:pb-0`}>
            <span
              className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${
                urgent ? 'bg-cinnabar' : dark ? 'bg-cream/40' : 'bg-sand border border-clay/30'
              }`}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`mono-data text-xs ${urgent ? 'text-cinnabar font-bold' : sub}`}>
                {fmtDate(it.date)}
              </span>
              {st.label && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>
                  {st.label}
                </span>
              )}
            </div>
            <div className={`text-sm font-semibold mt-1 ${text}`}>{it.title}</div>
            <div className={`text-xs leading-relaxed mt-0.5 ${sub}`}>{it.detail}</div>
          </div>
        )
      })}
    </div>
  )
}
