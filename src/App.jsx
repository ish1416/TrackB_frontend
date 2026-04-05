import { useState, useEffect } from 'react'
import FileAnalysis from './components/FileAnalysis'
import LinkOsint from './components/LinkOsint'
import {
  Shield, FileSearch, Link2, Clock,
  CheckCircle2, AlertOctagon, Activity,
  Phone, Mail, ExternalLink, Info,
  ChevronRight, Lock, Globe
} from 'lucide-react'

const TABS = [
  { id: 'file', label: 'APK File Analysis', icon: FileSearch },
  { id: 'link', label: 'URL / Link OSINT',  icon: Link2 },
]

const TICKER_ITEMS = [
  '⚠ RBI Advisory: Beware of fraudulent loan apps not listed on official app stores',
  '🔴 I4C Alert: 1,200+ fake lending apps detected in Q1 2025',
  '✅ AppGuard has blocked 3,847 fraudulent APKs since deployment',
  '📢 Citizens are advised to verify apps via RBI Sachet portal before installation',
  '🛡 AppGuard v2.1 — Deep Sandbox Detonation Engine now live',
  '⚠ MeitY Circular: Report suspicious apps to cybercrime.gov.in or call 1930',
]

const PORTAL_LINKS = [
  { label: 'RBI Sachet',        href: 'https://sachet.rbi.org.in',       flag: 'RBI' },
  { label: 'Cyber Crime Portal',href: 'https://cybercrime.gov.in',        flag: 'I4C' },
  { label: 'MeitY',             href: 'https://meity.gov.in',             flag: 'GOI' },
  { label: 'CERT-In',           href: 'https://cert-in.org.in',           flag: 'CERT' },
  { label: 'Digital India',     href: 'https://digitalindia.gov.in',      flag: 'DI' },
  { label: 'RBI Official',      href: 'https://rbi.org.in',               flag: 'RBI' },
]

function StatPill({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-lg px-3.5 py-2 border border-white/15">
      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
      <div>
        <p className="text-white font-extrabold text-base leading-none">{value}</p>
        <p className="text-blue-200 text-[9px] mt-0.5 uppercase tracking-wider font-medium">{label}</p>
      </div>
    </div>
  )
}

/* Ashoka Chakra SVG — 24 spokes */
function AshokaChakra({ size = 40, className = '' }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24
    const rad = (angle * Math.PI) / 180
    const r1 = 0.28, r2 = 0.46
    const cx = 0.5 + r1 * Math.sin(rad)
    const cy = 0.5 - r1 * Math.cos(rad)
    const ex = 0.5 + r2 * Math.sin(rad)
    const ey = 0.5 - r2 * Math.cos(rad)
    return { cx: cx * size, cy: cy * size, ex: ex * size, ey: ey * size }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <circle cx={size/2} cy={size/2} r={size*0.48} fill="none" stroke="#1a237e" strokeWidth={size*0.04} />
      <circle cx={size/2} cy={size/2} r={size*0.12} fill="#1a237e" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.cx} y1={s.cy} x2={s.ex} y2={s.ey} stroke="#1a237e" strokeWidth={size*0.025} strokeLinecap="round" />
      ))}
    </svg>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('file')
  const [time, setTime] = useState(new Date())
  const [fontSize, setFontSize] = useState('normal')

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (fontSize === 'large')   root.style.fontSize = '17px'
    else if (fontSize === 'xl') root.style.fontSize = '19px'
    else                        root.style.fontSize = '15px'
  }, [fontSize])

  const timeStr = time.toLocaleTimeString('en-IN', { hour12: false })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen flex flex-col bg-[#eef0f5]">

      {/* Skip to content — accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Accessibility / Quick Links Bar (NIC pattern) ── */}
      <div className="a11y-bar px-4 py-1 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-gray-500">
            <span className="font-semibold text-gray-600">Screen Reader Access</span>
            <span>|</span>
            <span>Text Size:</span>
            {[['A-','normal'],['A','large'],['A+','xl']].map(([lbl, val]) => (
              <button
                key={val}
                onClick={() => setFontSize(val)}
                className={`font-bold px-1.5 py-0.5 rounded transition-colors ${fontSize === val ? 'bg-[#1a237e] text-white' : 'hover:bg-gray-200'}`}
                style={{ fontSize: val === 'normal' ? 10 : val === 'large' ? 12 : 14 }}
              >
                {lbl}
              </button>
            ))}
            <span>|</span>
            <span className="flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Secure Portal</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <a href="https://sachet.rbi.org.in" target="_blank" rel="noreferrer" className="hover:text-[#1a237e] hover:underline flex items-center gap-0.5">
              RBI Sachet <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>|</span>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#1a237e] hover:underline flex items-center gap-0.5">
              Cyber Crime Portal <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <span>|</span>
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <Phone className="w-2.5 h-2.5" /> Helpline: 1930
            </span>
          </div>
        </div>
      </div>

      {/* ── Tricolor Bar ── */}
      <div className="tricolor-bar w-full" />

      {/* ── Top Government Strip ── */}
      <div className="bg-[#0d1b5e] text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wide">भारत सरकार &nbsp;|&nbsp; Government of India</span>
            <span className="hidden md:inline text-blue-300 border-l border-blue-700 pl-3">
              Ministry of Finance &nbsp;·&nbsp; Reserve Bank of India &nbsp;·&nbsp; I4C &nbsp;·&nbsp; MeitY
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-300 font-mono">
            <Clock className="w-3 h-3" />
            <span>{timeStr} IST &nbsp;|&nbsp; {dateStr}</span>
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <header className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Emblem + Title */}
            <div className="flex items-center gap-4">
              {/* Emblem */}
              <div className="relative flex-shrink-0">
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#1565c0] flex items-center justify-center shadow-lg ring-[3px] ring-[#FF9933]">
                  <Shield className="text-white w-9 h-9 drop-shadow" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF9933] rounded-full flex items-center justify-center shadow border-2 border-white">
                  <span className="text-white text-[8px] font-black leading-none">AI</span>
                </div>
              </div>

              {/* Title block */}
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h1 className="text-[#1a237e] font-black text-2xl leading-tight tracking-tight">
                    AppGuard
                  </h1>
                  <span className="hidden sm:block text-gray-300 font-light text-xl">|</span>
                  <span className="hidden sm:block text-gray-700 font-semibold text-base">
                    Fraudulent App Detection System
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                  Integrated with&nbsp;
                  <a href="https://sachet.rbi.org.in" target="_blank" rel="noreferrer" className="text-[#1a237e] font-semibold hover:underline">RBI Sachet</a>
                  &nbsp;&amp;&nbsp;
                  <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-[#1a237e] font-semibold hover:underline">I4C Cyber Crime Portal</a>
                  &nbsp;·&nbsp; AI/ML Static + Dynamic Sandbox Analysis
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="govt-badge">✓ Govt. Verified</span>
                  <span className="govt-badge" style={{ background:'#e3f2fd', borderColor:'#90caf9', color:'#0d47a1' }}>
                    🔒 ISO 27001
                  </span>
                  <span className="govt-badge" style={{ background:'#fff3e0', borderColor:'#ffcc80', color:'#e65100' }}>
                    ⚡ NIC Hosted
                  </span>
                </div>
              </div>
            </div>

            {/* Right: YellowSense brand + live status */}
            <div className="hidden md:flex flex-col items-end gap-2.5">
              {/* YellowSense badge */}
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#fffde7] to-[#fff8e1] border border-[#fdd835] rounded-xl px-3.5 py-2 shadow-sm">
                <img src="/logo11.png" alt="YellowSense Technologies" className="h-8 w-auto object-contain" />
                <div className="border-l border-[#fdd835]/60 pl-2.5">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold leading-none">Powered by</p>
                  <p className="text-sm font-extrabold text-[#f57f17] leading-tight mt-0.5">YellowSense Technologies</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">AI Security Research Lab</p>
                </div>
              </div>
              {/* Live status */}
              <div className="flex items-center gap-2">
                <span className="live-dot text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  SYSTEM LIVE
                </span>
                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                  34.14.189.124:8000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-[#1a237e] border-t border-[#283593]">
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all relative ${
                    active
                      ? 'text-white bg-white/10'
                      : 'text-blue-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF9933] rounded-t" />
                  )}
                </button>
              )
            })}

            {/* Live stats */}
            <div className="ml-auto hidden lg:flex items-center gap-2 py-2">
              <StatPill icon={CheckCircle2} value="3,847" label="Blocked APKs"  color="text-green-400" />
              <StatPill icon={AlertOctagon} value="1,204" label="Critical Flags" color="text-red-400" />
              <StatPill icon={Activity}     value="99.2%" label="Uptime"         color="text-yellow-300" />
            </div>
          </div>
        </div>
      </header>

      {/* ── News Ticker ── */}
      <div className="bg-[#fff8e1] border-b border-[#ffe082]">
        <div className="flex items-stretch">
          <div className="flex-shrink-0 bg-[#FF9933] text-white text-[10px] font-black px-4 flex items-center uppercase tracking-widest">
            ALERT
          </div>
          <div className="overflow-hidden flex-1 py-1.5 px-2">
            <div className="ticker-track flex gap-20 whitespace-nowrap text-[11px] text-[#5d4037] font-medium">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <span key={i} className="flex-shrink-0">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="bg-[#e8eaf6] border-b border-[#c5cae9]">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] text-[#3949ab]">
          <Globe className="w-3 h-3" />
          <a href="/" className="hover:underline ml-1">Home</a>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="hover:underline cursor-pointer">AppGuard</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-[#1a237e]">
            {activeTab === 'file' ? 'APK File Analysis' : 'URL / Link OSINT'}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 fade-in" key={activeTab}>
        {activeTab === 'file' ? <FileAnalysis /> : <LinkOsint />}
      </main>

      {/* ══════════════════════════════════════════
          FOOTER — RBI Sachet / NIC style
      ══════════════════════════════════════════ */}
      <footer className="bg-[#0d1b5e] text-white mt-auto" role="contentinfo">

        {/* Top footer — portal links row */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1.5">
            <span className="text-[10px] text-blue-300 uppercase tracking-widest font-bold flex-shrink-0">
              Related Portals:
            </span>
            {PORTAL_LINKS.map(p => (
              <a
                key={p.label}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-200 hover:text-white transition-colors hover:underline"
              >
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                {p.label}
              </a>
            ))}
          </div>
        </div>

        {/* Main footer body */}
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Col 1 — AppGuard identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#FF9933]" />
              </div>
              <div>
                <p className="font-black text-white text-base leading-tight">AppGuard</p>
                <p className="text-[10px] text-blue-300 uppercase tracking-widest">v2.1 — Classified</p>
              </div>
            </div>
            <p className="text-blue-300 text-xs leading-relaxed">
              AI-powered fraudulent digital lending app detection system for India's financial ecosystem. Deployed under the RBI Sachet initiative.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <AshokaChakra size={28} className="opacity-60" />
              <span className="text-[10px] text-blue-400 leading-tight">
                National Cyber Crime<br />Coordination Centre
              </span>
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <div className="space-y-3">
            <p className="text-white font-bold text-sm border-b border-white/10 pb-2">Quick Links</p>
            <ul className="space-y-1.5 text-xs">
              {[
                ['RBI Sachet Portal',       'https://sachet.rbi.org.in'],
                ['Cyber Crime Reporting',   'https://cybercrime.gov.in'],
                ['CERT-In Advisories',      'https://cert-in.org.in'],
                ['MeitY Digital Payments',  'https://meity.gov.in'],
                ['Digital India',           'https://digitalindia.gov.in'],
                ['NPCI — UPI Safety',       'https://npci.org.in'],
              ].map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" className="footer-link flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 opacity-50 flex-shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Help & Contact */}
          <div className="space-y-3">
            <p className="text-white font-bold text-sm border-b border-white/10 pb-2">Help & Contact</p>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Cyber Crime Helpline</p>
                  <p className="text-blue-300 font-mono text-sm font-bold">1930</p>
                  <p className="text-blue-400 text-[10px]">24×7 Available</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">RBI Sachet Helpline</p>
                  <p className="text-blue-300 font-mono text-sm font-bold">14440</p>
                  <p className="text-blue-400 text-[10px]">Mon–Sat, 9AM–6PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF9933] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Technical Support</p>
                  <p className="text-blue-300">appguard@nic.in</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Col 4 — YellowSense + Certifications */}
          <div className="space-y-3">
            <p className="text-white font-bold text-sm border-b border-white/10 pb-2">Technology Partner</p>

            {/* YellowSense branded card */}
            <div className="rounded-xl overflow-hidden border border-[#fdd835]/30 shadow-lg">

              {/* Top: logo on white */}
              <div className="bg-white flex items-center justify-center px-6 py-4">
                <img
                  src="/logo11.png"
                  alt="YellowSense Technologies"
                  className="h-16 w-16 object-contain rounded-lg"
                />
              </div>

              {/* Bottom: name + tagline on dark-yellow gradient */}
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0d1b5e] border-t border-[#fdd835]/20 px-4 py-3 text-center">
                <p className="text-[#fdd835] font-black text-sm tracking-wide leading-tight">
                  YellowSense Technologies
                </p>
                <p className="text-blue-300 text-[10px] mt-0.5">Pvt. Ltd.</p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fdd835]" />
                  <span className="text-[9px] text-blue-400 uppercase tracking-widest font-semibold">
                    AI Security Research Lab
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fdd835]" />
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'ISO', sub: '27001' },
                { label: 'NIC', sub: 'Hosted' },
                { label: 'STQC', sub: 'Certified' },
              ].map(c => (
                <div key={c.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                  <p className="text-white font-black text-xs">{c.label}</p>
                  <p className="text-blue-400 text-[9px]">{c.sub}</p>
                </div>
              ))}
            </div>

            <p className="text-blue-400 text-[10px] leading-relaxed">
              Backend infrastructure hosted on Google Cloud Platform with NIC compliance standards.
            </p>
          </div>
        </div>

        {/* ── Disclaimer bar ── */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-400 leading-relaxed">
              <span className="font-bold text-blue-300">Disclaimer:</span> This portal is for official use by authorised personnel of RBI, I4C, and affiliated financial institutions only.
              All analysis results are indicative and must be reviewed by a qualified cybersecurity officer before enforcement action.
              Misuse of this system is a punishable offence under the IT Act, 2000 and IPC.
            </p>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/10 bg-[#060e35]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {/* White pill so logo is visible on dark bg */}
              <div className="bg-white rounded-md px-2 py-1 flex items-center">
                <img
                  src="/logo11.png"
                  alt="YellowSense Technologies"
                  className="h-5 w-auto object-contain"
                />
              </div>
              <span className="text-[10px] text-blue-400">
                © 2025 AppGuard by YellowSense Technologies &nbsp;|&nbsp; All rights reserved
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-blue-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>|</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
              <span>|</span>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
              <span>|</span>
              <span className="text-blue-600">For official use only</span>
            </div>
          </div>
        </div>

        {/* Tricolor bottom stripe */}
        <div className="tricolor-bar w-full" />
      </footer>
    </div>
  )
}
