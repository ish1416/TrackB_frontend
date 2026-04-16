import RiskGauge from './RiskGauge'
import PollingRadar from './PollingRadar'
import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle2, Globe, Package,
  RefreshCw, Download, ShieldAlert, ShieldCheck,
  ChevronRight, Cpu, Network, Zap, Bug, Fingerprint,
  Bell, CheckSquare, XSquare
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
      <p className={`font-bold text-[#1a237e] text-sm break-all ${mono ? 'font-mono' : ''} ${valueClass ?? ''}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function RiskBar({ label, value }) {
  // value is 0.0–1.0
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 70 ? '#c62828' : pct >= 30 ? '#e65100' : '#1b5e20'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-36 text-gray-500 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 text-right font-mono font-bold flex-shrink-0" style={{ color }}>{pct}</span>
    </div>
  )
}

export default function ResultsPanel({ stage, stage1Data, stage2Data, onReset }) {
  if (!stage1Data) return null

  const isCritical = stage2Data?.final_dynamic_verdict === 'CRITICAL'
  const isMaintain = stage2Data?.final_dynamic_verdict === 'MAINTAIN_STATIC_SCORE'
  const isComplete  = stage === 'complete'

  // REQ 1 — sandbox status driven by React state, NOT by stage1 API field
  const sandboxStatus = stage2Data ? 'COMPLETED' : 'DETONATING_IN_BACKGROUND'
  const isStage2Loaded = !!stage2Data

  // REQ 1 — verdict variable for display
  const verdict = stage1Data?.verdict ?? 'UNKNOWN'

  // REQ 1 — Calculate scores
  const staticScore = Math.round((stage1Data?.risk_breakdown?.final_composite_score ?? 0) * 100)
  const finalScore = isCritical ? 100 : staticScore
  const finalVerdict = isCritical ? 'CRITICAL' : verdict

  // Risk breakdown sub-scores
  const rb = stage1Data.risk_breakdown ?? {}

  // Threat intelligence — osint_flags is the correct key per backend team
  const osintFlags        = stage1Data.threat_intelligence?.osint_flags ?? []
  const impersonationFlags= stage1Data.threat_intelligence?.impersonation_flags ?? []
  // permission_flags is now [{signal, detail, weight}] — normalise to handle both old (string) and new (object) shapes
  const permissionFlags = (stage1Data.threat_intelligence?.permission_flags ?? []).map(p =>
    typeof p === 'string' ? { signal: p, detail: '', weight: 0 } : p
  )
  const allAlertFlags     = [...new Set([...osintFlags, ...impersonationFlags])]
  const regulatoryFlags   = stage1Data.threat_intelligence?.custom_regulatory_flags ?? {}
  const anomalyNote       = stage1Data.threat_intelligence?.anomaly_interpretation

  // Engines that fired
  const engines = stage1Data.engines_firing ?? []

  // REQ 4 — Fix "None" engine label
  const displayEngine = (engine) =>
    engine.includes('None') || engine.includes('not found')
      ? 'Ghost App Detection Engine'
      : engine

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ stage1: stage1Data, stage2: stage2Data }, null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `appguard-report-${stage1Data.package_id}.json`
    a.click()
  }

  const handlePdfDownload = () => {
    window.open(`http://34.14.189.124:8000/api/v1/report/pdf/${stage1Data.package_id}`, '_blank')
  }

  return (
    <div className="space-y-5 fade-in">

      {/* ══ REQ 1: TWO-COLUMN LAYOUT ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: STAGE 1 — STATIC VERDICT */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden card-lift">
          <SectionHeader icon={Cpu} title="Stage 1 — Static Analysis Verdict" />

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoChip label="Package ID" value={stage1Data.package_id} mono />
              <InfoChip
                label="Static Verdict"
                value={verdict}
                valueClass={
                  verdict === 'HIGH'   ? 'text-red-700 font-black text-base' :
                  verdict === 'MEDIUM' ? 'text-orange-600 font-black text-base' :
                                        'text-green-700 font-black text-base'
                }
              />
              <InfoChip
                label="Composite Score"
                value={`${staticScore} / 100`}
                valueClass="text-lg font-black"
              />
              <InfoChip
                label="Sandbox Status"
                value={sandboxStatus}
                valueClass={
                  sandboxStatus === 'DETONATING_IN_BACKGROUND'
                    ? 'text-orange-600 text-[11px]'
                    : 'text-green-700 text-[11px]'
                }
              />
              {stage1Data.playstore_name !== undefined && (
                <InfoChip label="Play Store Name" value={stage1Data.playstore_name ?? 'Not Found'} />
              )}
              {stage1Data.developer !== undefined && (
                <InfoChip label="Developer" value={stage1Data.developer ?? 'Unknown'} />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINAL COMBINED SCORE */}
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden card-lift ${
          isStage2Loaded
            ? isCritical ? 'border-red-300' : 'border-green-300'
            : 'border-gray-200'
        }`}>
          <SectionHeader 
            icon={Network} 
            title="Final Combined Score" 
            color={isStage2Loaded ? (isCritical ? 'bg-red-700' : 'bg-green-700') : 'bg-gray-700'}
          />

          <div className="p-5">
            {!isStage2Loaded ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-gray-600">Deep Sandbox Analysis in Progress...</p>
                <p className="text-xs text-gray-400 mt-1">This may take up to 5 minutes</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <RiskGauge score={finalScore / 100} isCriticalOverride={isCritical} isStage2Loaded={true} />
                <div className="mt-4 w-full">
                  <InfoChip
                    label="Final Verdict"
                    value={finalVerdict}
                    valueClass={
                      finalVerdict === 'CRITICAL' ? 'text-red-700 font-black text-xl' :
                      finalVerdict === 'HIGH'     ? 'text-red-700 font-black text-xl' :
                      finalVerdict === 'MEDIUM'   ? 'text-orange-600 font-black text-xl' :
                                                    'text-green-700 font-black text-xl'
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ STAGE 1 DETAILS ══════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden card-lift">
        <SectionHeader icon={Cpu} title="Stage 1 — Detailed Analysis" />
        <div className="p-5 space-y-5">

          {/* ── OSINT / Threat Flags (Fix 4 — correct key: osint_flags) ── */}
          {allAlertFlags.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-red-300">
              <div className="bg-red-600 px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-white text-[11px] font-black uppercase tracking-widest">
                  Threat Intelligence — OSINT Flags
                </span>
              </div>
              <ul className="divide-y divide-red-100 bg-red-50">
                {allAlertFlags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 px-3 py-2.5 text-xs text-red-800">
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Risk Breakdown Sub-scores ── */}
          {(rb.ml_binary_risk != null || rb.nlp_semantic_risk != null) && (
            <div className="bg-[#f5f6ff] border border-[#e8eaf6] rounded-lg p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#ff9933]" /> Risk Score Breakdown
              </p>
              <div className="space-y-2">
                <RiskBar label="ML Binary Risk"         value={rb.ml_binary_risk} />
                <RiskBar label="NLP Semantic Risk"      value={rb.nlp_semantic_risk} />
                <RiskBar label="OSINT Domain Risk"      value={rb.osint_domain_risk} />
                <RiskBar label="Anomaly Risk"           value={rb.anomaly_risk} />
                <RiskBar label="Regulatory Penalty"     value={rb.custom_feature_penalty} />
              </div>
            </div>
          )}

          {/* ── Regulatory Flags ── */}
          {(regulatoryFlags.unverified_distribution || regulatoryFlags.kfs_missing) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-2">
                RBI Regulatory Compliance
              </p>
              <div className="flex flex-wrap gap-2">
                {regulatoryFlags.unverified_distribution && (
                  <span className="text-[11px] bg-orange-100 border border-orange-300 text-orange-800 px-2 py-1 rounded font-semibold">
                    ✗ Unverified Distribution
                  </span>
                )}
                {regulatoryFlags.kfs_missing && (
                  <span className="text-[11px] bg-red-100 border border-red-300 text-red-800 px-2 py-1 rounded font-semibold">
                    ✗ KFS Document Missing
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Permission Flags ── */}
          {permissionFlags.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-orange-300">
              <div className="bg-orange-600 px-3 py-2 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-white text-[11px] font-black uppercase tracking-widest">
                  RBI Permission Violations ({permissionFlags.length})
                </span>
              </div>
              <ul className="divide-y divide-orange-100 bg-orange-50">
                {permissionFlags.map((p, i) => {
                  const isRBI = p.signal?.toLowerCase().includes('rbi') || (p.weight ?? 0) >= 0.4
                  return (
                    <li key={i} className="px-3 py-2.5 space-y-0.5">
                      <div className="flex items-start gap-2">
                        <ChevronRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isRBI ? 'text-red-500' : 'text-orange-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${isRBI ? 'text-red-800' : 'text-orange-800'}`}>{p.signal}</p>
                          {p.detail && <p className="text-[10px] text-gray-500 mt-0.5">{p.detail}</p>}
                        </div>
                        {p.weight > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                            p.weight >= 0.4 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            +{p.weight}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* ── Anomaly Interpretation ── */}
          {anomalyNote && anomalyNote !== 'N/A' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
              <span className="font-bold">Anomaly: </span>{anomalyNote}
            </div>
          )}

          {/* ── Engines Firing ── */}
          {engines.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Bug className="w-3 h-3" /> Analysis Engines Fired
              </p>
              <div className="flex flex-wrap gap-1.5">
                {engines.map((e, i) => (
                  <span key={i} className="text-[10px] bg-[#e8eaf6] border border-[#c5cae9] text-[#1a237e] px-2 py-0.5 rounded font-medium">
                    {displayEngine(e)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 pt-1 border-t border-gray-100 flex-wrap">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs bg-[#1a237e] hover:bg-[#283593] text-white px-3 py-2 rounded-lg transition-colors font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> New Scan
            </button>
            {isStage2Loaded && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs bg-white border border-[#1a237e] text-[#1a237e] hover:bg-[#e8eaf6] px-3 py-2 rounded-lg transition-colors font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Export JSON Report
              </button>
            )}
            {isStage2Loaded && stage2Data?.final_dynamic_verdict && (
              <button
                onClick={handlePdfDownload}
                className="flex items-center gap-1.5 text-xs bg-[#1565c0] hover:bg-[#0d47a1] text-white px-3 py-2 rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Download RBI Compliance Report (PDF)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ STAGE 2 DETAILS ══════════════════════════════════════════════════════════ */}
      {isStage2Loaded && (
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden card-lift ${
          isCritical ? 'border-red-300' : 'border-yellow-400'
        }`}>
          <SectionHeader
            icon={Network}
            title={`Stage 2 — Dynamic Sandbox${isCritical ? ' · CRITICAL OVERRIDE' : ' · VERDICT MAINTAINED'}`}
            color={isCritical ? 'bg-red-700' : 'bg-[#b45309]'}
          />

          <div className="p-5">
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
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <ShieldCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-yellow-700 uppercase tracking-widest">Static Score Maintained</p>
                    <p className="text-sm text-yellow-800 mt-0.5">{stage2Data.dynamic_override_reason}</p>
                  </div>
                </div>
              )}

              {/* Stage 2 stats row — sandbox_execution_score is the renamed key */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoChip label="Sandbox Execution Health" value={`${stage2Data.sandbox_execution_score ?? stage2Data.security_score ?? '—'} / 100`} />
                <InfoChip label="Permissions Analyzed"     value={stage2Data.permissions_analyzed ?? '—'} />
                <InfoChip label="Trackers Detected"        value={stage2Data.trackers_found?.detected_trackers ?? '—'} />
                <InfoChip label="Sandbox Result"           value={stage2Data.sandbox_heuristics?.status ?? '—'} />
              </div>

              {/* Sandbox interpretation */}
              {stage2Data.sandbox_heuristics?.interpretation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                  <span className="font-bold">Sandbox: </span>
                  {stage2Data.sandbox_heuristics.interpretation}
                </div>
              )}

              {/* Network Domains Table — REQ 5: flagged_burner_domains now array of objects */}
              {stage2Data?.network_domains?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Network Domains Contacted
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#e8eaf6]">
                          <th className="text-left px-3 py-2 text-[#1a237e] font-bold w-8">#</th>
                          <th className="text-left px-3 py-2 text-[#1a237e] font-bold">Domain / IP</th>
                          <th className="text-left px-3 py-2 text-[#1a237e] font-bold">Classification</th>
                          <th className="text-left px-3 py-2 text-[#1a237e] font-bold hidden sm:table-cell">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stage2Data.network_domains.map((d, i) => {
                          // REQ 5 — flagged_burner_domains is now array of objects {domain, classification, risk}
                          const flaggedDomains = stage2Data.financial_intelligence?.flagged_burner_domains ?? []
                          const flaggedItem = flaggedDomains.find(item => 
                            typeof item === 'object' ? item.domain === d : item === d
                          )
                          const classification = flaggedItem?.classification
                          const riskLevel = flaggedItem?.risk
                          
                          const classificationColors = {
                            'CHINESE_INFRASTRUCTURE': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '🇨🇳 Chinese Infra' },
                            'BURNER_DOMAIN': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: '⚑ Burner' },
                            'STAGING_IN_PRODUCTION': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: '⚠ Staging' },
                            'SUSPICIOUS': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: '⚠ Suspicious' },
                          }
                          const classStyle = classificationColors[classification] ?? null
                          
                          return (
                            <tr key={i} className={`border-t border-gray-100 ${flaggedItem ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                              <td className="px-3 py-2 font-mono font-semibold text-gray-800">{d}</td>
                              <td className="px-3 py-2">
                                {classStyle
                                  ? <span className={`inline-flex items-center gap-1 ${classStyle.bg} ${classStyle.text} border ${classStyle.border} px-2 py-0.5 rounded-full text-[10px] font-bold`}>{classStyle.label}</span>
                                  : <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">✓ Benign</span>
                                }
                              </td>
                              <td className="px-3 py-2 hidden sm:table-cell">
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${flaggedItem ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: flaggedItem ? '90%' : '15%' }} />
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

              {/* UPI / Financial Intel */}
              {stage2Data.financial_intelligence?.extracted_upis?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Extracted UPI IDs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stage2Data.financial_intelligence.extracted_upis.map((u, i) => (
                      <span key={i} className="font-mono text-xs bg-red-100 border border-red-300 text-red-800 px-2 py-0.5 rounded">{u}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* REQ 8 — Dynamic KFS Compliance Card */}
              {stage2Data.dynamic_kfs_compliance && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`px-3 py-2 flex items-center justify-between ${
                    stage2Data.dynamic_kfs_compliance.compliant ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      {stage2Data.dynamic_kfs_compliance.compliant ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <XSquare className="w-4 h-4 text-white" />
                      )}
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        RBI KFS Runtime Compliance Check
                      </span>
                    </div>
                    <span className="text-[10px] text-white bg-white/20 px-2 py-0.5 rounded-full font-bold">
                      {stage2Data.dynamic_kfs_compliance.signals_found} / {stage2Data.dynamic_kfs_compliance.signals_total}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { key: 'apr_shown_at_runtime', label: 'APR / Interest Rate shown during runtime' },
                      { key: 'kfs_screen_detected', label: 'KFS or sanction letter screen appeared' },
                      { key: 'grievance_shown', label: 'Grievance Redressal Officer info visible' },
                      { key: 'cooling_off_mentioned', label: 'Cooling-off / loan cancellation option shown' },
                    ].map(({ key, label }) => {
                      const passed = stage2Data.dynamic_kfs_compliance.signals[key]
                      return (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          {passed ? (
                            <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XSquare className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={passed ? 'text-gray-700' : 'text-gray-500'}>{label}</span>
                        </div>
                      )
                    })}
                    <div className={`mt-2 px-3 py-2 rounded-lg text-xs font-semibold ${
                      stage2Data.dynamic_kfs_compliance.signals_found >= 2
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {stage2Data.dynamic_kfs_compliance.verdict}
                    </div>
                  </div>
                </div>
              )}

              {/* Malware Behavior */}
              {stage2Data.malware_behavior?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Malware Behaviors Detected</p>
                  <ul className="space-y-1">
                    {stage2Data.malware_behavior.map((b, i) => (
                      <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer meta */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Package className="w-3.5 h-3.5 text-[#1a237e]" />
                <span>Final Dynamic Verdict:</span>
                <strong className={isCritical ? 'text-red-600' : 'text-green-600'}>
                  {stage2Data?.final_dynamic_verdict}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
