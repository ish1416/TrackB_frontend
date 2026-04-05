import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STEPS = [
  'APK acquired & extracted',
  'Static ML inference complete',
  'Sandbox environment initialised',
  'Detonating in isolated container…',
  'Monitoring network egress traffic',
  'Awaiting dynamic verdict',
]

export default function PollingRadar({ stage }) {
  const isPolling = stage === 'polling' || stage === 'stage1'
  const [elapsed, setElapsed] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (!isPolling) return
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [isPolling])

  useEffect(() => {
    if (!isPolling) return
    const t = setInterval(() => setStepIdx(i => Math.min(i + 1, STEPS.length - 1)), 8000)
    return () => clearInterval(t)
  }, [isPolling])

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-4 px-2">
      {/* Radar visual */}
      <div className="relative w-28 h-28 flex-shrink-0">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-full border border-[#1a237e]/20 pulse-ring"
            style={{
              inset: `${i * 8}px`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        <div className="absolute inset-4 rounded-full bg-[#e8eaf6] border-2 border-[#1a237e]/40 overflow-hidden flex items-center justify-center">
          {isPolling && (
            <div
              className="absolute top-0 left-1/2 w-1/2 h-full origin-left radar-sweep"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(26,35,126,0.35))' }}
            />
          )}
          <div className="w-2 h-2 rounded-full bg-[#1a237e] z-10" />
        </div>
        {/* Elapsed */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[#1a237e] whitespace-nowrap">
          {mins}:{secs}
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 space-y-1.5 mt-4 sm:mt-0">
        <p className="text-xs font-bold text-[#1a237e] uppercase tracking-widest mb-2">
          {isPolling ? '⚙ Deep Sandbox Detonation In Progress' : '✅ Detonation Complete'}
        </p>
        {STEPS.map((step, i) => {
          const done = !isPolling || i < stepIdx
          const active = isPolling && i === stepIdx
          return (
            <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${i > stepIdx && isPolling ? 'opacity-30' : 'opacity-100'}`}>
              {done
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                : active
                  ? <Loader2 className="w-3.5 h-3.5 text-[#1a237e] flex-shrink-0 animate-spin" />
                  : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
              }
              <span className={active ? 'text-[#1a237e] font-semibold' : done ? 'text-gray-600' : 'text-gray-400'}>
                {step}
              </span>
            </div>
          )
        })}
        <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
          Polling <code className="bg-gray-100 px-1 rounded">GET /api/v1/report/dynamic/…</code> every 10 seconds
        </p>
      </div>
    </div>
  )
}
