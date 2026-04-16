import { useState, useEffect, useRef } from 'react'
import { Search, Shield, ShieldAlert, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Play, RotateCcw, Smartphone, Volume2 } from 'lucide-react'

// ── Citizen Portal ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  LOW:    { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-800',  badge: 'bg-green-600',  icon: CheckCircle2, msg: 'Verified — This app is in RBI\'s authorised registry. Safe to download.' },
  MEDIUM: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-500', icon: AlertTriangle, msg: 'Caution — This app has unresolved compliance gaps. Verify manually.' },
  HIGH:   { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800',    badge: 'bg-red-600',    icon: ShieldAlert,  msg: 'WARNING — This app is NOT authorised. Do not install.' },
  CRITICAL:{ bg: 'bg-red-50',   border: 'border-red-300',    text: 'text-red-800',    badge: 'bg-red-700',    icon: ShieldAlert,  msg: 'WARNING — This app is NOT authorised. Do not install.' },
  GHOST:  { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800',    badge: 'bg-red-800',    icon: ShieldAlert,  msg: 'Ghost App — Not found on any official store. High risk.' },
}

function CitizenPortal() {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      // REQ 2 — correct endpoint: POST /api/v1/analyze/check with JSON body
      const res = await fetch('/api/v1/analyze/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? `Error ${res.status}`)
      // REQ 2 — use response fields: verdict, risk_score, found_on_playstore, flagged_reasons, in_dla_registry
      const v = data.verdict ?? 'HIGH'
      const isGhost = data.found_on_playstore === false
      setResult({ ...data, _displayVerdict: isGhost ? 'GHOST' : v })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? (VERDICT_CONFIG[result._displayVerdict] ?? VERDICT_CONFIG.HIGH) : null
  const Icon = cfg?.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-[#1a237e] px-4 py-3">
        <h2 className="text-white font-bold text-sm">Verify App Before You Install</h2>
        <p className="text-blue-200 text-[11px] mt-0.5">Check if an app is authorised by RBI before downloading it</p>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setError('') }}
              placeholder="Enter app name or package ID (e.g. com.sbi.lotusintouch)"
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#1a237e] hover:bg-[#283593] disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Checking…</>
              : <><Search className="w-4 h-4" /> Check App</>
            }
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Check Failed</p>
              <p className="mt-0.5">{error}</p>
              <p className="mt-1 text-red-500">Note: This only works for Play Store apps. For sideloaded APKs, use Tab 1 file upload.</p>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && cfg && (
          <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden fade-in`}>
            <div className={`${cfg.badge} px-3 py-2 flex items-center gap-2`}>
              <Icon className="w-4 h-4 text-white flex-shrink-0" />
              <span className="text-white text-[11px] font-black uppercase tracking-widest">
                {result._displayVerdict === 'GHOST' ? 'GHOST APP DETECTED' : `Verdict: ${result._displayVerdict}`}
              </span>
              {/* REQ 2 — RBI Verified badge */}
              {result.in_dla_registry && (
                <span className="ml-auto text-[10px] font-black bg-green-600 text-white px-2 py-0.5 rounded-full">RBI Verified</span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {/* REQ 2 — Ghost App warning */}
              {result.found_on_playstore === false && (
                <div className="bg-red-100 border border-red-300 rounded px-2 py-1.5 text-xs text-red-800 font-bold">
                  Ghost App — Not on Play Store. Extremely high risk.
                </div>
              )}
              <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.msg}</p>
              {result.message && (
                <p className="text-xs text-gray-600 leading-relaxed">{result.message}</p>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/60 rounded px-2 py-1.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">App Name</p>
                  <p className="text-[10px] text-gray-700 font-bold mt-0.5">{result.app_name ?? result.package_id}</p>
                </div>
                <div className="bg-white/60 rounded px-2 py-1.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Risk Score</p>
                  <p className={`text-sm font-black mt-0.5 ${cfg.text}`}>
                    {/* REQ 2 — risk_score is float, multiply by 100 */}
                    {Math.round((result.risk_score ?? 0) * 100)} / 100
                  </p>
                </div>
              </div>
              {/* REQ 2 — flagged_reasons as bullet list */}
              {result.flagged_reasons?.length > 0 && (
                <div className="bg-white/60 rounded px-2 py-1.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Flagged Reasons</p>
                  {result.flagged_reasons.map((f, i) => (
                    <p key={i} className={`text-[10px] ${cfg.text} font-medium`}>• {f}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Helper note */}
        {!result && !error && !loading && (
          <div className="bg-[#e8eaf6] border border-[#c5cae9] rounded-lg px-3 py-2.5 text-[10px] text-[#3949ab]">
            <p className="font-bold mb-1">💡 How to use</p>
            <p>Enter a Play Store package ID like <code className="bg-white px-1 rounded">com.sbi.lotusintouch</code> or <code className="bg-white px-1 rounded">com.ausmallfinancebank.amb</code> to check if it's RBI-authorised.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Phone Simulator ───────────────────────────────────────────────────────────

const STATES = [
  {
    id: 'whatsapp',
    caption: 'Uncle clicks the WhatsApp link...',
  },
  {
    id: 'downloading',
    caption: 'APK file downloads to phone storage',
  },
  {
    id: 'checking',
    caption: 'AppGuard intercepts — analysis running in 5 seconds',
  },
  {
    id: 'blocked',
    caption: 'AppGuard blocks installation and speaks the warning aloud',
    sub: '🔊 Voice warning plays in Hindi via Indic Parler TTS',
  },
  {
    id: 'safe',
    caption: 'Threat eliminated. Guardian SMS sent to family member.',
  },
]

function DownloadBar() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPct(p => { if (p >= 100) { clearInterval(t); return 100 } return p + 4 }), 80)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="bg-gray-100 rounded-lg mx-3 mt-3 p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">APK</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-gray-800 truncate">aubank-kyc-update.apk</p>
          <p className="text-[9px] text-gray-500">Downloading…</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
        <div className="h-full bg-green-600 rounded-full transition-all duration-100" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-gray-500 mt-1 text-right">{pct}%</p>
    </div>
  )
}

function Countdown({ onDone }) {
  const [n, setN] = useState(10)
  useEffect(() => {
    if (n <= 0) { onDone?.(); return }
    const t = setTimeout(() => setN(n - 1), 1000)
    return () => clearTimeout(t)
  }, [n, onDone])
  return <span className="text-4xl font-black text-white">{n}</span>
}

function PhoneScreen({ stateId, onLinkClick }) {
  const [countdownDone, setCountdownDone] = useState(false)

  useEffect(() => { setCountdownDone(false) }, [stateId])

  if (stateId === 'whatsapp') return (
    <div className="flex flex-col h-full">
      {/* WA header */}
      <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">?</div>
        <div>
          <p className="text-white text-[11px] font-bold">Unknown Number</p>
          <p className="text-green-200 text-[9px]">+91 98765 43210</p>
        </div>
      </div>
      {/* Chat */}
      <div className="flex-1 bg-[#ece5dd] px-2 py-3 space-y-2 overflow-hidden">
        <div className="flex justify-start">
          <div className="bg-white rounded-lg px-2.5 py-1.5 shadow-sm max-w-[80%]">
            <p className="text-[11px] text-gray-800">AU Bank KYC update karna zaroori hai. Yahan se app download karein:</p>
            <button onClick={onLinkClick} className="text-[11px] text-blue-600 underline font-semibold block mt-1 break-all text-left">
              aubank-kyc.xyz/app.apk
            </button>
            <p className="text-[9px] text-gray-400 text-right mt-1">10:33 AM</p>
          </div>
        </div>
        <div className="flex justify-center">
          <button onClick={onLinkClick} className="bg-[#075e54] text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow">
            Download
          </button>
        </div>
      </div>
    </div>
  )

  if (stateId === 'downloading') return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#075e54] px-3 py-2">
        <p className="text-white text-[11px] font-bold">Downloads</p>
      </div>
      <DownloadBar />
    </div>
  )

  if (stateId === 'checking') return (
    <div className="flex flex-col h-full bg-[#0d1b5e] items-center justify-center px-4 text-center">
      <div className="text-4xl mb-3">🔍</div>
      <p className="text-white font-black text-2xl mb-2">रुकिए</p>
      <p className="text-blue-200 text-xs mb-1">AppGuard इस फ़ाइल को जाँच रहा है...</p>
      <p className="text-yellow-300 text-xs font-bold mb-4">Install मत करें</p>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  )

  if (stateId === 'blocked') return (
    <div className="flex flex-col h-full bg-red-600 items-center justify-center px-4 text-center">
      <p className="text-white font-black text-3xl mb-1">⛔ रुकिए</p>
      <p className="text-white font-black text-lg mb-2">यह ऐप नकली है</p>
      <p className="text-red-100 text-[11px] mb-1">AU Bank का यह ऐप RBI की सूची में नहीं है</p>
      <p className="text-red-100 text-[11px] mb-4">आपके contacts और SMS चुराना चाहता है</p>
      <div className="bg-white/20 rounded-xl px-4 py-3 mb-3 w-full">
        {countdownDone
          ? <p className="text-white font-black text-sm">✅ हटाया गया</p>
          : <div className="flex flex-col items-center gap-1">
              <Countdown onDone={() => setCountdownDone(true)} />
              <p className="text-white/70 text-[9px]">Auto-deleting in…</p>
            </div>
        }
      </div>
      <button className="bg-white text-red-600 font-black text-sm px-6 py-2 rounded-full shadow">
        हटाएं
      </button>
    </div>
  )

  if (stateId === 'safe') return (
    <div className="flex flex-col h-full bg-green-600 items-center justify-center px-4 text-center">
      <p className="text-white font-black text-3xl mb-2">✅ सुरक्षित</p>
      <p className="text-green-100 text-sm font-bold mb-1">फ़ाइल हटा दी गई</p>
      <p className="text-green-100 text-sm">आप सुरक्षित हैं</p>
      <div className="mt-4 bg-white/20 rounded-xl px-3 py-2 w-full">
        <p className="text-white text-[10px] font-semibold">🛡 AppGuard Active</p>
        <p className="text-green-100 text-[9px] mt-0.5">Guardian notified ✓</p>
      </div>
    </div>
  )

  return null
}

function PhoneSimulator() {
  const [stateIdx, setStateIdx] = useState(0)
  const [playing,  setPlaying]  = useState(false)
  const timerRef = useRef(null)

  const goTo = (i) => setStateIdx(Math.max(0, Math.min(STATES.length - 1, i)))

  const playDemo = () => {
    setStateIdx(0)
    setPlaying(true)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      if (i >= STATES.length) { clearInterval(timerRef.current); setPlaying(false); return }
      setStateIdx(i)
    }, 2500)
  }

  const reset = () => {
    clearInterval(timerRef.current)
    setPlaying(false)
    setStateIdx(0)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const current = STATES[stateIdx]

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative" style={{ width: 280 }}>
        <div className="bg-[#1a1a1a] rounded-[38px] p-2.5 shadow-2xl"
          style={{ boxShadow: '0 0 0 2px #333, 0 20px 50px rgba(0,0,0,0.5)' }}>
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a1a] rounded-b-2xl z-20" />
          {/* Screen */}
          <div className="bg-white rounded-[30px] overflow-hidden" style={{ height: 520 }}>
            {/* Status bar */}
            <div className="bg-[#075e54] px-4 pt-6 pb-1 flex items-center justify-between flex-shrink-0">
              <span className="text-white text-[9px] font-bold">9:41</span>
              <div className="flex items-center gap-1">
                <span className="text-white text-[8px]">▲▲▲</span>
                <span className="text-white text-[8px]">WiFi</span>
                <span className="text-white text-[8px]">🔋</span>
              </div>
            </div>
            {/* Dynamic screen content */}
            <div className="flex-1 overflow-hidden" style={{ height: 480 }}>
              <PhoneScreen
                stateId={current.id}
                onLinkClick={() => !playing && goTo(1)}
              />
            </div>
          </div>
        </div>
        {/* Home bar */}
        <div className="flex justify-center mt-2">
          <div className="w-20 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Caption */}
      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-gray-700">{current.caption}</p>
        {current.sub && <p className="text-[11px] text-gray-500 mt-0.5">{current.sub}</p>}
      </div>

      {/* Dot indicators */}
      <div className="flex gap-2">
        {STATES.map((_, i) => (
          <button key={i} onClick={() => { clearInterval(timerRef.current); setPlaying(false); goTo(i) }}
            className={`rounded-full transition-all ${i === stateIdx ? 'w-5 h-2.5 bg-[#1a237e]' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => { clearInterval(timerRef.current); setPlaying(false); goTo(stateIdx - 1) }}
          disabled={stateIdx === 0}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {playing
          ? <button onClick={reset}
              className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-full transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Stop
            </button>
          : <button onClick={playDemo}
              className="flex items-center gap-1.5 bg-[#1a237e] hover:bg-[#283593] text-white text-xs font-bold px-5 py-2 rounded-full transition-colors shadow">
              <Play className="w-3.5 h-3.5" /> Play Demo
            </button>
        }

        <button onClick={() => { clearInterval(timerRef.current); setPlaying(false); goTo(stateIdx + 1) }}
          disabled={stateIdx === STATES.length - 1}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Guardian SMS mock — shown on state 5 */}
      {current.id === 'safe' && (
        <div className="w-full max-w-xs bg-gray-900 rounded-2xl p-3 shadow-lg fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-white text-[10px] font-bold">AppGuard Alert</p>
              <p className="text-gray-400 text-[9px]">now</p>
            </div>
          </div>
          <p className="text-gray-200 text-[11px] leading-relaxed">
            Blocked a fake AU Bank app on Dad's phone. Risk: 94%. File deleted.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function B2CShield() {
  return (
    <div className="space-y-4">

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0d1b5e] to-[#1a237e] rounded-lg px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#FF9933] flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-base leading-tight">
            AppGuard Shield — Protecting India's vulnerable citizens from fake lending apps
          </p>
          <p className="text-blue-200 text-[11px] mt-0.5">
            Voice-First Accessibility Block · Vernacular Audio Warnings · Guardian Mode · RBI IOS 2021
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1">
          <Volume2 className="w-3 h-3 text-[#FF9933]" />
          <span className="text-white text-[10px] font-bold">DEMO MODE</span>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left — Citizen Portal */}
        <CitizenPortal />

        {/* Right — Phone Simulator */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-[#1a237e] px-4 py-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#FF9933]" />
            <div>
              <p className="text-white font-bold text-sm">Interactive Phone Simulator</p>
              <p className="text-blue-200 text-[11px]">See how AppGuard protects a vulnerable citizen in real-time</p>
            </div>
          </div>
          <div className="p-5">
            <PhoneSimulator />
          </div>
        </div>
      </div>
    </div>
  )
}
