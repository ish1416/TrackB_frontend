import { useState, useEffect } from 'react'
import { AlertTriangle, Download, ExternalLink, RefreshCw, TrendingUp } from 'lucide-react'

export default function AlertsFeed() {
  const [alerts, setAlerts] = useState([])
  const [totalDetections, setTotalDetections] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://34.14.189.124:8000/api/v1/alerts')
      const data = await response.json()
      setAlerts(data.alerts ?? [])
      setTotalDetections(data.total_high_risk_detections ?? 0)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getVerdictColor = (verdict) => {
    if (verdict === 'CRITICAL') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    if (verdict === 'HIGH') return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
    return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-red-700 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">
              Live High-Risk Detections Feed
            </span>
          </div>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xl font-black text-red-600 leading-none">{totalDetections}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                Total High-Risk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-xl font-black text-orange-600 leading-none">{alerts.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                Recent Alerts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-700 leading-none">
                {lastUpdate.toLocaleTimeString('en-IN', { hour12: false })}
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                Last Updated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No high-risk detections found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const verdictStyle = getVerdictColor(alert.verdict)
            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-800 truncate">
                          {alert.app_name}
                        </h3>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${verdictStyle.bg} ${verdictStyle.text} border ${verdictStyle.border}`}
                        >
                          {alert.verdict}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {alert.package_id}
                      </p>
                      {alert.developer && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Developer: {alert.developer}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-red-600 leading-none">
                        {Math.round(alert.risk_score * 100)}
                      </p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                        Risk Score
                      </p>
                    </div>
                  </div>

                  {/* Top Flag */}
                  {alert.top_flag && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-0.5">
                        Primary Threat
                      </p>
                      <p className="text-xs text-red-800 font-semibold">{alert.top_flag}</p>
                    </div>
                  )}

                  {/* Permission Violations */}
                  {alert.permission_violations > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-orange-100 border border-orange-300 text-orange-800 px-2 py-1 rounded font-semibold">
                        {alert.permission_violations} RBI Permission Violations
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {alert.report_url && (
                      <a
                        href={alert.report_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-[#1a237e] hover:bg-[#283593] text-white px-3 py-1.5 rounded transition-colors font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Report
                      </a>
                    )}
                    {alert.pdf_url && (
                      <a
                        href={alert.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-white border border-[#1a237e] text-[#1a237e] hover:bg-[#e8eaf6] px-3 py-1.5 rounded transition-colors font-semibold"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
