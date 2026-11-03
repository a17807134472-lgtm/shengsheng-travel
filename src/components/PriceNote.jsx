// 全局价格波动提示：所有报价均为参考价
export default function PriceNote({ dark = false }) {
  return (
    <p className={`text-xs leading-relaxed ${dark ? 'text-cream/60' : 'text-clay/80'}`}>
      * 价格会波动：车票随日期与余票浮动，餐饮住宿随淡旺季涨跌可达两三成，
      本页均为 2026 年 10 月检索的参考价——下单前请以 12306、航司、点评/美团的实时页面为准。
    </p>
  )
}
