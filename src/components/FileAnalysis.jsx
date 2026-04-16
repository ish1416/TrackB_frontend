import { useState, useRef, useCallback } from 'react'
import { Upload, FileArchive, AlertCircle, CheckCircle2, Cpu, ShieldCheck, Network, BarChart3 } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis'
import ResultsPanel from './ResultsPanel'
import AlertsFeed from './AlertsFeed'

const FEATURES = [
  { icon: Cpu,        label: 'Static ML Inference' },
  { icon: ShieldCheck,label: 'RBI KFS Verification' },
  { icon: Network,    label: 'Deep Sandbox (5 min)' },
  { icon: BarChart3,  label: 'Network Traffic Analysis' },
]

export default function FileAnalysis() {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)
  const progressRef = useRef(null)
  const { stage, stage1Data, stage2Data, errorMsg, analyzeFile, reset } = useAnalysis()

  const startProgress = () => {
    setProgress(0)
    let p = 0
    progressRef.current = setInterval(() => {
      p += Math.random() * 6 + 1
      if (p >= 95) { clearInterval(progressRef.current); p = 95 }
      setProgress(Math.min(p, 95))
    }, 500)
  }

  const handleFile = useCallback(async (file) => {
    if (!file?.name.endsWith('.apk')) return
    setSelectedFile(file)
    startProgress()
    await analyzeFile(file)
    clearInterval(progressRef.current)
    setProgress(100)
  }, [analyzeFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleReset = () => {
    reset()
    setSelectedFile(null)
    setProgress(0)
    clearInterval(progressRef.current)
  }

  const isLoading = stage === 'loading'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Panel ── */}
        <div className="lg:col-span-1 space-y-4">

        {/* Feature list */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden card-lift">
          <div className="bg-[#1a237e] text-white px-4 py-2.5">
            <span className="text-sm font-bold tracking-wide uppercase">APK File Analysis</span>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Upload an Android application package (.apk) for a comprehensive two-stage security assessment.
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

        {/* Upload Zone */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden card-lift">
          <div className="p-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? 'border-[#1a237e] bg-[#e8eaf6] scale-[1.01]'
                  : 'border-gray-300 hover:border-[#1a237e] hover:bg-[#f5f6ff]'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".apk"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#e8eaf6] flex items-center justify-center">
                <Upload className="w-7 h-7 text-[#1a237e]" />
              </div>
              <p className="text-sm font-bold text-[#1a237e]">Drop .apk file here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
              <div className="mt-3 inline-block bg-[#1a237e]/10 text-[#1a237e] text-[10px] font-semibold px-3 py-1 rounded-full">
                Accepted: .apk only
              </div>
            </div>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 bg-[#e8eaf6] border border-[#c5cae9] rounded-lg px-3 py-2.5 text-xs">
                <FileArchive className="w-4 h-4 text-[#1a237e] flex-shrink-0" />
                <span className="font-semibold text-[#1a237e] truncate">{selectedFile.name}</span>
                <span className="text-gray-400 ml-auto flex-shrink-0">{(selectedFile.size / 1024).toFixed(0)} KB</span>
              </div>
            )}

            {/* Progress */}
            {(isLoading || (progress > 0 && progress < 100)) && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                  <span>Uploading &amp; Analysing…</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-shimmer transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {progress === 100 && stage !== 'idle' && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Upload complete — processing results
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Analysis Failed</p>
              <p className="mt-0.5 text-red-600">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Panel ── */}
      <div className="lg:col-span-2">
        {stage === 'idle' && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl h-72 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <FileArchive className="w-8 h-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-500">No APK uploaded yet</p>
              <p className="text-xs text-gray-400 mt-1">Upload an .apk file to begin the security assessment</p>
            </div>
          </div>
        )}

        {/* Loading skeleton — shown while APK is uploading / backend is processing */}
        {stage === 'loading' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1a237e] px-4 py-2.5 flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/20 animate-pulse" />
              <div className="h-3 w-48 rounded bg-white/20 animate-pulse" />
            </div>
            <div className="p-5 space-y-5">
              {/* Gauge + chips skeleton */}
              <div className="flex gap-6">
                <div className="w-[190px] h-[190px] rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-3 space-y-2 animate-pulse">
                        <div className="h-2 w-16 bg-gray-200 rounded" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  {/* Scanning status */}
                  <div className="bg-[#e8eaf6] border border-[#c5cae9] rounded-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1a237e] animate-ping flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#1a237e]">Static Analysis In Progress</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Running ML inference pipeline — please wait…</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Risk bar skeletons */}
              <div className="bg-[#f5f6ff] border border-[#e8eaf6] rounded-lg p-4 space-y-3">
                <div className="h-2 w-32 bg-gray-200 rounded animate-pulse" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-36 h-2 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-6 h-2 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ResultsPanel stage={stage} stage1Data={stage1Data} stage2Data={stage2Data} onReset={handleReset} />
      </div>
    </div>

    {/* REQ 7 — Alerts Feed */}
    <div className="mt-6">
      <AlertsFeed />
    </div>
  </div>
  )
}
