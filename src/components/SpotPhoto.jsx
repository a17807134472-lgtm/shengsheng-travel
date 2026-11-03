import { useEffect, useState } from 'react'

// 维基百科 pageimages API：按条目名取真实配图，来源可追溯（维基百科/Wikimedia Commons）
const cache = new Map()

async function wikiImage(title) {
  if (cache.has(title)) return cache.get(title)
  let src = null
  try {
    // 首选：条目主图
    const res = await fetch(
      `https://zh.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=800&origin=*&titles=${encodeURIComponent(title)}`,
    )
    const json = await res.json()
    const first = Object.values(json.query?.pages || {})[0]
    src = first?.thumbnail?.source || null

    // 次选：条目内嵌的第一张实拍图（很多景点没有主图但有内图）
    if (!src) {
      const res2 = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&prop=images&format=json&imlimit=8&origin=*&titles=${encodeURIComponent(title)}`,
      )
      const json2 = await res2.json()
      const imgs = Object.values(json2.query?.pages || {})[0]?.images || []
      const file = imgs
        .map((i) => i.title)
        .find((t) => /\.(jpe?g|png)$/i.test(t) && !/map|logo|icon|locator|位置图/i.test(t))
      if (file) {
        const res3 = await fetch(
          `https://zh.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*&titles=${encodeURIComponent(file)}`,
        )
        const json3 = await res3.json()
        const info = Object.values(json3.query?.pages || {})[0]?.imageinfo?.[0]
        src = info?.thumburl || info?.url || null
      }
    }
    // 兜底：直接在 Wikimedia Commons 搜实拍（景点最可靠的免费图床）
    if (!src) {
      const res4 = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`,
      )
      const json4 = await res4.json()
      const pages4 = Object.values(json4.query?.pages || {})
      const hit = pages4.find((p) => /\.(jpe?g|png)$/i.test(p.title))
      src = hit?.imageinfo?.[0]?.thumburl || hit?.imageinfo?.[0]?.url || null
    }
  } catch {
    src = null
  }
  cache.set(title, src)
  return src
}

export default function SpotPhoto({ title, className = '', imgClass = '', bare = false }) {
  const [src, setSrc] = useState(cache.has(title) ? cache.get(title) : 'loading')

  useEffect(() => {
    let on = true
    if (src === 'loading' || src === null) {
      wikiImage(title).then((s) => on && setSrc(s))
    }
    return () => { on = false }
  }, [title])

  if (src && src !== 'loading') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={src}
          alt={title}
          loading="lazy"
          className={`w-full h-full object-cover ${imgClass}`}
        />
        {!bare && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/70 to-transparent px-2.5 pt-6 pb-1.5 flex items-end justify-between">
            <span className="text-[9px] text-cream/85">图：维基百科 / Wikimedia</span>
            <a
              href={`https://search.bilibili.com/all?keyword=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noreferrer"
              className="text-[9px] text-cream/85 underline underline-offset-2"
            >
              实拍/视频 ↗
            </a>
          </div>
        )}
      </div>
    )
  }

  if (src === 'loading') {
    return <div className={`bg-cream-deep animate-pulse ${className}`} />
  }

  // 无可用实拍：诚实占位，引导共建投稿
  return (
    <div className={`bg-cream-deep flex flex-col items-center justify-center gap-1 ${className}`}>
      <span className="mono-data text-[10px] text-clay/70">暂无实拍图</span>
      <span className="text-[10px] text-clay/50">欢迎共建投稿</span>
    </div>
  )
}
