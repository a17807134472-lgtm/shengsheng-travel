// 共享小组件：价格数字、分区标题、胶囊按钮、Chip、徽章、印章
export function Money({ value, size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }
  return (
    <span className={`price-serif font-bold ${sizes[size]} ${className}`}>
      <span className="text-[0.55em] mr-0.5 align-baseline">¥</span>
      {Number(value).toLocaleString('zh-CN')}
    </span>
  )
}

export function SectionTitle({ zh, en }) {
  return (
    <div className="mb-4">
      <div className="mono-data text-[11px] uppercase tracking-[0.2em] text-cinnabar mb-1">{en}</div>
      <h2 className="price-serif text-[26px] font-bold leading-tight">{zh}</h2>
    </div>
  )
}

export function PillButton({ children, variant = 'primary', className = '', ...rest }) {
  const base =
    'rounded-full font-semibold transition-all active:scale-[0.97] inline-flex items-center justify-center gap-1.5'
  const styles = {
    primary: 'bg-cinnabar text-white hover:bg-cinnabar-deep px-6 py-3',
    secondary: 'bg-cream-deep text-ink border border-sand px-6 py-3',
    ghost: 'text-cinnabar px-3 py-1.5 text-sm',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Chip({ active, children, ...rest }) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap active:scale-[0.97] ${
        active
          ? 'bg-ink text-cream border-ink'
          : 'bg-transparent text-clay border-sand hover:border-clay'
      }`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-cream-deep text-clay',
    red: 'bg-cinnabar/10 text-cinnabar',
    dark: 'bg-ink text-cream',
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

// 中式印章：品牌点睛元素
export function Seal({ children = '省', className = '' }) {
  return (
    <div
      className={`bg-cinnabar text-cream price-serif font-bold flex items-center justify-center rounded-[6px] ring-2 ring-cinnabar ring-offset-2 ring-offset-cream rotate-6 select-none ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
