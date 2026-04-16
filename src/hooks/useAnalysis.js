import { useState, useRef, useCallback } from 'react'

const BASE_URL = '/api/v1'

function parseError(res) {
  if (res.status === 413) return 'File too large — update Nginx: client_max_body_size 150M'
  if (res.status === 422) return 'Invalid file. Ensure you are uploading a valid .apk file.'
  if (res.status === 502 || res.status === 503) return 'Backend unreachable. Ensure FastAPI is running on the VM.'
  if (res.status === 408 || res.status === 504) return 'Request timed out. APK may be too large or server is busy.'
  return `Server error: ${res.status}`
}

export function useAnalysis() {
  const [stage, setStage]           = useState('idle')
  const [stage1Data, setStage1Data] = useState(null)
  const [stage2Data, setStage2Data] = useState(null)
  const [errorMsg, setErrorMsg]     = useState('')
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
        if (!res.ok) return
        const data = await res.json()
        if (data.error) return
        stopPolling()
        setStage2Data(data)
        setStage('complete')
      } catch { /* keep polling */ }
    }, 10000)
  }, [])

  const handleStage1Response = useCallback(async (data) => {
    setStage1Data(data)
    setStage('stage1')

    // REQ 9 — Cache hit: dynamic_sandbox_status already COMPLETED, fetch Stage 2 immediately
    if (data.dynamic_sandbox_status === 'COMPLETED') {
      try {
        const url = data.fetch_dynamic_report_url ?? `${BASE_URL}/report/dynamic/${data.package_id}`
        const res = await fetch(url)
        if (res.ok) {
          const report = await res.json()
          if (!report.error) {
            setStage2Data(report)
            setStage('complete')
            return
          }
        }
      } catch { /* fall through to polling */ }
    }

    // Fresh analysis — start polling every 10 seconds
    startPolling(data.package_id)

  }, [startPolling])

  const analyzeFile = useCallback(async (file) => {
    setStage('loading')
    setStage1Data(null)
    setStage2Data(null)
    setErrorMsg('')
    stopPolling()
    try {
      if (file.size > 300 * 1024 * 1024) {
        throw new Error(`File is ${(file.size / 1024 / 1024).toFixed(0)} MB. The backend may time out on files over 100 MB.`)
      }
      const form = new FormData()
      form.append('file', file)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 300000)
      try {
        const res = await fetch(`${BASE_URL}/analyze/unified`, { method: 'POST', body: form, signal: controller.signal })
        clearTimeout(timeout)
        if (!res.ok) throw new Error(parseError(res))
        const data = await res.json()
        await handleStage1Response(data)
      } catch (e) {
        clearTimeout(timeout)
        if (e.name === 'AbortError') throw new Error('Upload timed out after 90 seconds.')
        throw e
      }
    } catch (e) {
      setErrorMsg(e.message)
      setStage('error')
    }
  }, [handleStage1Response])

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
  }, [handleStage1Response])

  const reset = useCallback(() => {
    stopPolling()
    setStage('idle')
    setStage1Data(null)
    setStage2Data(null)
    setErrorMsg('')
  }, [])

  return { stage, stage1Data, stage2Data, errorMsg, analyzeFile, analyzeLink, reset }
}
