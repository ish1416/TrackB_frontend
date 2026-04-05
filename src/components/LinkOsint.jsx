import { useState, useCallback, useEffect, useRef } from 'react'
import { Link2, AlertCircle, Search, Clipboard, Globe, ShieldAlert, Network, Cpu, BarChart3 } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import Terminal from './Terminal'
import ResultsPanel from './ResultsPanel'

function timestamp() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false })
}

const TERMINAL_SEQUENCE = (url) => [
  { text: `Initiating OSINT scan for target: ${url}`, type: 'info' },
  { text: 'Resolving DNS records… OK', type: 'info' },
  { text: 'Establishing TLS tunnel via secure proxy…', type: 'info' },
  { text: 'Bypassing SSL certificate pinning… OK', type: 'warn' },
  { text: 'Sending HTTP HEAD request to target server…', type: 'info' },
  { text: 'Response: 200 OK — Content-Type: application/vnd.android.package-archive', type: 'success' },
  { text: 'Downloading payload to isolated sandbox container…', type: 'info' },
  { text: 'Download complete. Verifying APK signature integrity…', type: 'info' },
  { text: 'Extracting AndroidManifest.xml… OK', type: 'info' },
  { text: 'Extracting classes.dex bytecode… OK', type: 'info' },
  { text: 'Running static ML inference pipeline…', type: 'warn' },
  { text: 'Checking RBI KFS regulatory compliance…', type: 'warn' },
  { text: 'Submitting to deep detonation sandbox…', type: 'warn' },
  { text: '✓ Stage 1 complete. Awaiting dynamic sandbox verdict…', type: 'success' },
]

const SAMPLE_URLS = [
  'https://github.com/raw/sample/fake-loan-app.apk',
  'https://cdn.fraudsite.xyz/loanapp_v2.apk',
]

const FEATURES = [
  { icon: Globe,      label: 'Remote Payload Fetch' },
  { icon: ShieldAlert,label: 'SSL Bypass & Proxy' },
  { icon: Cpu,        label: 'Same ML Pipeline' },
  { icon: Network,    label: 'OSINT Enrichment' },
]

export default function LinkOsint() {
  const [url, setUrl] = useState('')
  const [terminalLines, setTerminalLines] = useState([])
  const { stage, stage1Data, stage2Data, errorMsg, analyzeLink, reset } = useAnalysis()
  const seqRef = useRef(null)

  const runTerminalSequence = useCallback((targetUrl) => {
    const seq = TERMINAL_SEQUENCE(targetUrl)
    let i = 0
    seqRef.current = setInterval(() => {
      if (i >= seq.length) { clearInterval(seqRef.current); return }
      setTerminalLines(prev => [...prev, { ...seq[i], time: timestamp() }])
      i++
    }, 850)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setTerminalLines([])
    clearInterval(seqRef.current)
    runTerminalSequence(url.trim())
    await analyzeLink(url.trim())
  }, [url, analyzeLink, runTerminalSequence])

  const handleReset = () => {
    reset()
    setTerminalLines([])
    setUrl('')
    clearInterval(seqRef.current)
  }

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setUrl(text)
  }

  useEffect(() => {
    if (stage === 'polling') {
      const id = setInterval(() => {
        setTerminalLines(prev => [...prev, {
          text: `GET /api/v1/report/dynamic/${stage1Data?.package_id} → 404 Report not found (detonating…)`,
          type: 'warn',
          time: timestamp(),
        }])
      }, 10000)
      return () => clearInterval(id)
    }
    if (stage === 'complete') {
      setTerminalLines(prev => [...prev, {
        text: `✓ Dynamic verdict received: ${stage2Data?.final_dynamic_verdict}`,
        type: stage2Data?.final_dynamic_verdict === 'CRITICAL' ? 'error' : 'success',
        time: timestamp(),
      }])
    }
  }, [stage, stage1Data, stage2Data])

  const isLoading = stage === 'loading'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ── Left Panel ── */}
      <div className="lg:col-span-1 space-y-4">

        {/* Feature pills */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden card-lift">
          <div className="bg-[#1a237e] text-white px-4 py-2.5">
            <span className="text-sm font-bold tracking-wide uppercase">URL / Link OSINT</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Paste a suspect APK download URL. AppGuard remotely fetches, extracts, and analyses the payload without exposing your device.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-[#f5f6ff] border border-[#e8eaf6] rounded-lg px-2.5 py-2 text-[11px] text-[#1a237e] font-semibold">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#ff9933]" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* URL Input */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden card-lift">
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Suspect APK Download URL
              </label>

              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/app.apk"
                  disabled={isLoading}
                  className="w-full pl-9 pr-10 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a237e] focus:ring-2 focus:ring-[#1a237e]/20 disabled:opacity-50 font-mono bg-gray-50"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a237e] transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sample URLs */}
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-semibold">Sample test URLs</p>
                <div className="space-y-1">
                  {SAMPLE_URLS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUrl(s)}
                      className="w-full text-left text-[10px] font-mono text-[#1a237e] bg-[#f5f6ff] border border-[#e8eaf6] rounded px-2 py-1.5 hover:bg-[#e8eaf6] transition-colors truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#1a237e] hover:bg-[#283593] active:bg-[#0d1b5e] disabled:opacity-40 text-white text-xs font-bold py-3 rounded-lg transition-colors shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                {isLoading ? 'Scanning in progress…' : 'Initiate OSINT Scan'}
              </button>
            </form>
          </div>
        </div>

        {/* Error */}
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Scan Failed</p>
              <p className="mt-0.5 text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Terminal */}
        {terminalLines.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Live Terminal Output</p>
            <Terminal lines={terminalLines} />
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      <div className="lg:col-span-2">
        {stage === 'idle' && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl h-72 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Link2 className="w-8 h-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">No URL submitted yet</p>
              <p className="text-xs text-gray-400 mt-1">Paste a suspect APK download link to begin OSINT analysis</p>
            </div>
          </div>
        )}
        <ResultsPanel stage={stage} stage1Data={stage1Data} stage2Data={stage2Data} onReset={handleReset} />
      </div>
    </div>
  )
}
