import { useState, useRef, useCallback } from 'react'

const BASE_URL = '/api/v1'

function parseError(res) {
  if (res.status === 413) return 'File too large. The server rejected the upload (413). Fix: run the Nginx config update on the VM — see console for instructions.'
  if (res.status === 422) return 'Invalid file format. Ensure you are uploading a valid .apk file.'
  if (res.status === 502 || res.status === 503) return 'Backend unreachable (502/503). Ensure the FastAPI server is running on the VM.'
  if (res.status === 408 || res.status === 504) return 'Request timed out. The APK may be too large or the server is busy.'
  return `Server error: ${res.status}`
}

export function useAnalysis() {
  const [stage, setStage] = useState('idle') // idle | loading | stage1 | polling | complete | error
  const [stage1Data, setStage1Data] = useState(null)
  const [stage2Data, setStage2Data] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const intervalRef = useRef(null)

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startPolling = useCallback((packageId) => {
    setStage('polling')
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/report/dynamic/${packageId}`)
        const data = await res.json()
        // Only keep polling if it's a genuine "not ready yet" response
        // FastAPI 404 returns {"detail": "Report not found..."}
        if (!res.ok) return // 404 = still processing, keep polling
        if (data.error) return
        stopPolling()
        setStage2Data(data)
        setStage('complete')
      } catch {
        // network hiccup, keep polling
      }
    }, 10000)
  }, [])

  // Handles both fresh response (has risk_breakdown) and
  // cached response (has message + fetch_dynamic_report_url)
  const handleStage1Response = async (data) => {
    // CACHED PATH: backend already analyzed this APK before
    // Shape: { message, package_id, dynamic_sandbox_status, fetch_dynamic_report_url }
    if (data.message && data.fetch_dynamic_report_url && !data.risk_breakdown) {
      // Fetch the full dynamic report immediately — it already exists
      const reportRes = await fetch(data.fetch_dynamic_report_url)
      const report = await reportRes.json()

      // security_score from dynamic report is 0–100, convert to 0.0–1.0
      const rawScore = typeof report.security_score === 'number'
        ? report.security_score > 1 ? report.security_score / 100 : report.security_score
        : 0
      // Invert: security_score 100 = safe = risk 0, security_score 0 = danger = risk 1
      const riskScore = parseFloat((1 - rawScore).toFixed(2))

      // Reconstruct a stage1Data-shaped object the UI can consume
      const syntheticStage1 = {
        package_id: data.package_id,
        verdict: riskScore >= 0.7 ? 'HIGH' : riskScore >= 0.3 ? 'MEDIUM' : 'LOW',
        dynamic_sandbox_status: 'COMPLETED',
        risk_breakdown: { final_composite_score: riskScore },
        threat_intelligence: {
          osint_flags: report.malware_behavior ?? [],
          impersonation_flags: [],
        },
        _cached: true,
      }

      setStage1Data(syntheticStage1)
      setStage2Data(report)
      setStage('complete')
      return
    }

    // FRESH PATH: normal full response with risk_breakdown
    setStage1Data(data)
    setStage('stage1')
    startPolling(data.package_id)
  }

  const analyzeFile = useCallback(async (file) => {
    setStage('loading')
    setStage1Data(null)
    setStage2Data(null)
    setErrorMsg('')
    stopPolling()
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BASE_URL}/analyze/unified`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(parseError(res))
      const data = await res.json()
      await handleStage1Response(data)
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }, [startPolling])

  const analyzeLink = useCallback(async (url) => {
    setStage('loading')
    setStage1Data(null)
    setStage2Data(null)
    setErrorMsg('')
    stopPolling()
    try {
      const res = await fetch(`${BASE_URL}/analyze/unified/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_url: url }),
      })
      if (!res.ok) throw new Error(parseError(res))
      const data = await res.json()
      await handleStage1Response(data)
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }, [startPolling])

  const reset = useCallback(() => {
    stopPolling()
    setStage('idle')
    setStage1Data(null)
    setStage2Data(null)
    setErrorMsg('')
  }, [])

  return { stage, stage1Data, stage2Data, errorMsg, analyzeFile, analyzeLink, reset }
}
