import RiskGauge from './RiskGauge'
import PollingRadar from './PollingRadar'
import {
  AlertTriangle, CheckCircle2, Globe, Package,
  RefreshCw, Download, ShieldAlert, ShieldCheck,
  ChevronRight, Cpu, Network
} from 'lucide-react'

function SectionHeader({ icon: Icon, title, color = 'bg-[#1a237e]' }) {
  return (
    <div className={`${color} text-white px-4 py-2.5 flex items-center gap-2 rounded-t-lg`}>
      <Icon className="w-4 h-4 opacity-80" />
      <span className="text-sm font-bold tracking-wide uppercase">{title}</span>
    </div>
  )
}

function InfoChip({ label, value, mono, valueClass }) {
  return (
    <div className="bg-[#f5f6ff] border border-[#c5cae9] rounded-lg p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">{label}</p>
      <p className={`font-bold text-[#1a237e] text-sm break-all ${mono ? 'font-mono' : ''} ${valueClass ?? ''}`}>{value}</p>
    </div>
  )
}

export default function ResultsPanel({ stage, stage1Data, stage2Data, onReset }) {
  if (!stage1Data) return null

  const isCritical = stage2Data?.final_dynamic_verdict === 'CRITICAL'
  const isMaintain = stage2Data?.final_dynamic_verdict === 'MAINTAIN_STATIC_SCORE'
  const isComplete = stage === 'complete'

  // Score: direct path confirmed from live API — risk_breakdown.final_composite_score
  const score = Number(
    stage1Data?.risk_breakdown?.final_composite_score ??
    stage1Data?.risk_breakdown?.composite_score ??
    stage1Data?.final_composite_score ??
    stage1Data?.score ??
    0
  )
  const safeScore = isNaN(score) ? 0 : Math.min(Math.max(score, 0), 1)

  // Fix 2: verdict key is stage1Data.verdict ("LOW" / "MEDIUM" / "HIGH")
  const verdict = stage1Data.verdict ?? '—'

  // Fix 3: sandbox status — show dynamic_sandbox_status while polling, flip only when complete
  const sandboxStatus = isComplete
    ? (stage2Data?.sandbox_heuristics?.status ?? 'COMPLETED')
    : (stage1Data?.dynamic_sandbox_status ?? 'DETONATING_IN_BACKGROUND')

  // Fix 4: correct key is threat_intelligence.osint_flags (not impersonation_flags)
  const osintFlags = stage1Data.threat_intelligence?.osint_flags ?? []
  // also keep impersonation_flags as fallback in case backend sends both
  const impersonationFlags = stage1Data.threat_intelligence?.impersonation_flags ?? []
  const allFlags = [...new Set([...osintFlags, ...impersonationFlags])]

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ stage1: stage1Data, stage2: stage2Data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `appguard-report-${stage1Data.package_id}.json`
    a.click()
  }

  return (
    <div className="space-y-5 fade-in">

      {/* ── Stage 1 Card ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden card-lift">
        <SectionHeader icon={Cpu} title="Stage 1 — Static Analysis Verdict" />

        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-6 items-start">

            {/* Gauge */}
            <div className="flex-shrink-0 bg-[#f5f6ff] rounded-xl p-4 border border-[#e8eaf6]">
              <RiskGauge score={safeScore} isCriticalOverride={isCritical} />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Fix 2: verdict mapped directly from stage1Data.verdict */}
                <InfoChip label="Package ID"      value={stage1Data.package_id} mono />
                <InfoChip
                  label="Static Verdict"
                  value={verdict}
                  valueClass={
                    verdict === 'HIGH'   ? 'text-red-700 font-black text-base' :
                    verdict === 'MEDIUM' ? 'text-orange-600 font-black text-base' :
                                          'text-green-700 font-black text-base'
                  }
                />
                <InfoChip label="Composite Score" value={`${Math.round(safeScore * 100)} / 100`} />
                {/* Fix 3: sandbox status flips only when stage2 is complete */}
                <InfoChip
                  label="Sandbox Status"
                  value={sandboxStatus}
                  valueClass={sandboxStatus === 'DETONATING_IN_BACKGROUND' ? 'text-orange-600 text-xs' : 'text-green-700'}
                />
              </div>

              {/* Fix 4: osint_flags red alert banner below gauge */}
              {allFlags.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-lg overflow-hidden">
                  <div className="bg-red-600 px-3 py-1.5 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-white flex-shrink-0" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Threat Intelligence — OSINT Flags</span>
                  </div>
                  <ul className="divide-y divide-red-100">
                    {allFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 px-3 py-2 text-xs text-red-800">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw JSON debug accordion */}
              <details className="mt-2">
                <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 select-none font-mono">
                  ▶ View raw API response
                </summary>
                <pre className="mt-2 bg-[#0d1117] text-green-400 text-[10px] font-mono rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(stage1Data, null, 2)}
                </pre>
              </details>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-xs bg-[#1a237e] hover:bg-[#283593] text-white px-3 py-2 rounded-lg transition-colors font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> New Scan
                </button>
                {isComplete && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 text-xs bg-white border border-[#1a237e] text-[#1a237e] hover:bg-[#e8eaf6] px-3 py-2 rounded-lg transition-colors font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage 2 Card ── */}
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden card-lift ${
        isComplete
          ? isCritical ? 'border-red-300' : 'border-green-300'
          : 'border-gray-200'
      }`}>
        <SectionHeader
          icon={Network}
          title={`Stage 2 — Dynamic Sandbox${isComplete ? (isCritical ? ' · CRITICAL OVERRIDE' : ' · VERDICT MAINTAINED') : ' · In Progress'}`}
          color={isComplete ? (isCritical ? 'bg-red-700' : 'bg-green-700') : 'bg-gray-700'}
        />

        <div className="p-5">
          {!isComplete ? (
            <PollingRadar stage={stage} />
          ) : (
            <div className="space-y-4 fade-in">

              {/* Override / Maintain Banner */}
              {isCritical && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-red-700 uppercase tracking-widest">⚠ Dynamic Override Triggered</p>
                    <p className="text-sm text-red-800 mt-1 font-medium">{stage2Data.dynamic_override_reason}</p>
                  </div>
                </div>
              )}
              {isMaintain && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-medium">No additional threats detected. Static score maintained.</p>
                </div>
              )}

              {/* Network Domains Table */}
              {stage2Data?.network_domains?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Network Domains Contacted During Detonation
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#e8eaf6]">
                          <th className="text-left px-3 py-2.5 text-[#1a237e] font-bold w-8">#</th>
                          <th className="text-left px-3 py-2.5 text-[#1a237e] font-bold">Domain</th>
                          <th className="text-left px-3 py-2.5 text-[#1a237e] font-bold">Classification</th>
                          <th className="text-left px-3 py-2.5 text-[#1a237e] font-bold hidden sm:table-cell">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage2Data.network_domains.map((d, i) => {
                          const flagged = stage2Data.financial_intelligence?.flagged_burner_domains?.includes(d)
                          return (
                            <tr key={i} className={`border-t border-gray-100 transition-colors ${flagged ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-2.5 text-gray-400 font-mono">{i + 1}</td>
                              <td className="px-3 py-2.5 font-mono font-semibold text-gray-800">{d}</td>
                              <td className="px-3 py-2.5">
                                {flagged
                                  ? <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold">⚑ BURNER DOMAIN</span>
                                  : <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">✓ Benign</span>
                                }
                              </td>
                              <td className="px-3 py-2.5 hidden sm:table-cell">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${flagged ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: flagged ? '90%' : '15%' }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sandbox meta */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <Package className="w-3.5 h-3.5 text-[#1a237e]" />
                <span>Sandbox Engine:</span>
                <span className="font-bold text-gray-700">{stage2Data?.sandbox_heuristics?.status}</span>
                <span className="ml-auto text-[10px] text-gray-400">Final Verdict: <strong className={isCritical ? 'text-red-600' : 'text-green-600'}>{stage2Data?.final_dynamic_verdict}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
