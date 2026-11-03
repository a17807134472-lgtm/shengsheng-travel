// 城市天际线剪影：代码绘制，米白低透明度，衬在墨色 Hero 上
function Landmark({ type }) {
  switch (type) {
    case 'stilted': // 重庆：山坡吊脚楼 + 过江索道
      return (
        <g>
          <path d="M0 140 L120 60 L400 120 L400 140 Z" opacity="0.5" />
          <rect x="120" y="70" width="26" height="34" />
          <rect x="152" y="78" width="22" height="32" />
          <rect x="180" y="88" width="26" height="30" />
          <path d="M120 70 L133 60 L146 70 Z" />
          <path d="M152 78 L163 69 L174 78 Z" />
          <line x1="230" y1="55" x2="360" y2="80" strokeWidth="2" stroke="currentColor" />
          <rect x="286" y="62" width="14" height="10" rx="2" />
        </g>
      )
    case 'pagoda': // 西安：钟楼三重檐
      return (
        <g>
          <path d="M180 100 L220 100 L214 82 L186 82 Z" />
          <path d="M176 84 L224 84 L216 68 L184 68 Z" />
          <path d="M182 70 L218 70 L210 56 L190 56 Z" />
          <path d="M200 56 L200 44 M194 50 L206 50" stroke="currentColor" strokeWidth="3" />
          <rect x="196" y="100" width="8" height="40" />
        </g>
      )
    case 'twin': // 长沙：IFS 双塔
      return (
        <g>
          <rect x="176" y="18" width="26" height="122" />
          <rect x="210" y="34" width="22" height="106" />
          <rect x="176" y="18" width="26" height="8" opacity="0.6" />
        </g>
      )
    case 'tower': // 成都：339 电视塔
      return (
        <g>
          <rect x="198" y="8" width="4" height="132" />
          <ellipse cx="200" cy="58" rx="20" ry="10" />
          <ellipse cx="200" cy="86" rx="13" ry="7" />
        </g>
      )
    case 'pier': // 青岛：栈桥回澜阁
      return (
        <g>
          <rect x="120" y="112" width="220" height="6" />
          <path d="M300 112 L300 84 L324 84 L324 112" />
          <path d="M294 86 L330 86 L312 70 Z" />
          <path d="M312 70 L312 60" stroke="currentColor" strokeWidth="3" />
        </g>
      )
    case 'mountain': // 大理：苍山 + 洱海
      return (
        <g>
          <path d="M60 140 L150 50 L210 110 L260 66 L350 140 Z" opacity="0.7" />
          <path d="M20 128 Q60 120 100 128 T180 128 T260 128 T340 128" fill="none" stroke="currentColor" strokeWidth="4" />
        </g>
      )
    case 'canton': // 广州：小蛮腰
      return (
        <g>
          <path d="M192 140 C192 100 208 96 188 60 C176 38 190 20 194 8 L206 8 C210 20 224 38 212 60 C192 96 208 100 208 140 Z" />
        </g>
      )
    case 'spike': // 深圳：平安金融中心
      return (
        <g>
          <path d="M196 140 L200 4 L206 140 Z" />
          <rect x="222" y="60" width="18" height="80" />
          <rect x="168" y="76" width="16" height="64" />
        </g>
      )
    case 'shell': // 珠海：日月贝
      return (
        <g>
          <path d="M160 140 A44 44 0 0 1 248 140 Z" />
          <path d="M240 140 A30 30 0 0 1 308 140 Z" opacity="0.7" />
        </g>
      )
    case 'bridge': // 潮汕：广济桥浮桥亭
      return (
        <g>
          <rect x="60" y="112" width="280" height="6" />
          {[110, 180, 250].map((x) => (
            <g key={x}>
              <rect x={x} y="92" width="18" height="20" />
              <path d={`M${x - 5} 94 L${x + 9} 78 L${x + 23} 94 Z`} />
            </g>
          ))}
        </g>
      )
    default:
      return null
  }
}

export default function CityArt({ type, className = '' }) {
  return (
    <svg viewBox="0 0 400 140" className={className} fill="currentColor" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      {/* 基础楼群 */}
      <rect x="0" y="96" width="34" height="44" />
      <rect x="40" y="76" width="26" height="64" />
      <rect x="330" y="84" width="30" height="56" />
      <rect x="366" y="100" width="34" height="40" />
      <Landmark type={type} />
    </svg>
  )
}
