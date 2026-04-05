const THRESHOLDS = {
  critical: { color: '#b71c1c', label: 'CRITICAL',    glow: '0 0 24px rgba(183,28,28,0.45)' },
  high:     { color: '#c62828', label: 'HIGH RISK',   glow: '0 0 18px rgba(198,40,40,0.35)' },
  medium:   { color: '#e65100', label: 'MEDIUM RISK', glow: '0 0 18px rgba(230,81,0,0.28)' },
  low:      { color: '#1b5e20', label: 'LOW RISK',    glow: '0 0 18px rgba(27,94,32,0.25)' },
}

function getTier(raw, isCritical) {
  if (isCritical || raw >= 1.0) return THRESHOLDS.critical
  if (raw >= 0.7) return THRESHOLDS.high
  if (raw >= 0.3) return THRESHOLDS.medium
  return THRESHOLDS.low
}

export default function RiskGauge({ score, isCriticalOverride }) {
  // Normalise: accept 0.0–1.0 or 0–100, guard NaN/null
  let raw = isCriticalOverride ? 1.0 : Number(score ?? 0)
  if (isNaN(raw)) raw = 0
  if (raw > 1)    raw = raw / 100          // handle accidental 0–100 input
  raw = Math.min(Math.max(raw, 0), 1)

  const tier = getTier(raw, isCriticalOverride)
  const pct  = Math.round(raw * 100)

  // SVG donut math
  const size   = 190
  const cx     = size / 2
  const cy     = size / 2
  const radius = 72
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  // clamp so the arc is always visible (min 2% arc for non-zero scores)
  const arcLen = raw === 0 ? 0 : Math.max(circumference * raw, circumference * 0.02)
  const dashArray  = `${arcLen} ${circumference}`
  // start from top (rotate -90deg via transform)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Donut */}
      <div className="relative" style={{ width: size, height: size, filter: raw > 0 ? `drop-shadow(${tier.glow})` : 'none' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#e8eaf6"
            strokeWidth={stroke}
          />
          {/* Filled arc — pure SVG, no Recharts, no animation bugs */}
          {raw > 0 && (
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={tier.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black leading-none tabular-nums" style={{ color: tier.color }}>
            {pct}
          </span>
          <span className="text-[10px] text-gray-400 font-semibold tracking-widest mt-0.5">RISK SCORE</span>
        </div>
      </div>

      {/* Verdict badge */}
      <div
        className="px-4 py-1.5 rounded-full text-white text-[11px] font-black tracking-[0.15em] uppercase shadow-sm"
        style={{ backgroundColor: tier.color }}
      >
        {tier.label}
      </div>

      {/* Score bar */}
      <div className="w-full max-w-[190px]">
        <div className="flex justify-between text-[9px] text-gray-400 mb-1 font-medium">
          <span>LOW</span><span>MEDIUM</span><span>HIGH</span>
        </div>
        <div className="h-1.5 rounded-full bg-gradient-to-r from-green-500 via-orange-400 to-red-600 relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow"
            style={{ left: `calc(${pct}% - 6px)`, borderColor: tier.color }}
          />
        </div>
      </div>
    </div>
  )
}
