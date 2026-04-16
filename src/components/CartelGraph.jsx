import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { AlertTriangle, Shield, Globe, RefreshCw, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'

// REQ 6 — Node classification colors
const getNodeColor = (node) => {
  if (node.type === 'apk') return '#0A1628'
  const classificationMap = {
    'CHINESE_INFRASTRUCTURE': '#C0392B',
    'BURNER_DOMAIN': '#D35400',
    'STAGING_IN_PRODUCTION': '#9A7D0A',
    'SUSPICIOUS': '#C0392B',
  }
  return classificationMap[node.classification] || '#475569'
}

// Build cartel hubs list from edges - any domain that appears at least once
function buildCartelHubs(nodes, edges) {
  if (!nodes || !edges) {
    console.log("buildCartelHubs: nodes or edges is null/undefined")
    return []
  }
  
  // Step 1 — Count incoming connections for each domain node
  const domainConnectionCount = {}
  
  edges.forEach(edge => {
    const targetNode = nodes.find(n => n.id === edge.target)
    if (targetNode && targetNode.type === 'domain') {
      domainConnectionCount[edge.target] = 
        (domainConnectionCount[edge.target] || 0) + 1
    }
  })
  
  console.log("Domain Connection Count:", domainConnectionCount)
  
  // Step 2 — Build cartel hubs list
  // A cartel hub = any domain node that appears in at least 1 edge
  const cartelHubs = nodes
    .filter(n => n.type === 'domain' && domainConnectionCount[n.id] > 0)
    .map(n => ({
      id: n.id,
      label: n.label,
      classification: n.classification,
      connectionCount: domainConnectionCount[n.id] || 0
    }))
    .sort((a, b) => b.connectionCount - a.connectionCount)
  
  return cartelHubs
}

// Legacy function for graph rendering - domains with 2+ connections
function findHubs(nodes, edges) {
  const domainCount = {}
  edges.forEach(e => {
    if (!domainCount[e.target]) domainCount[e.target] = new Set()
    domainCount[e.target].add(e.source)
  })
  const hubs = new Set()
  Object.entries(domainCount).forEach(([domain, apks]) => {
    if (apks.size >= 2) hubs.add(domain)
  })
  return hubs
}

const SUSPICIOUS_KEYWORDS = ['baidu', 'foxuc', 'highrummy', 'postpi', 'adjust', 'defaultlink', 'xiaomi']
function isSuspicious(id) {
  return SUSPICIOUS_KEYWORDS.some(k => id.toLowerCase().includes(k))
}

export default function CartelGraph() {
  const svgRef    = useRef(null)
  const [graphData, setGraphData] = useState(null)
  const [selected, setSelected]   = useState(null)
  const [stats, setStats]         = useState({ apks: 0, domains: 0, hubs: 0, edges: 0 })
  const [cartelHubs, setCartelHubs] = useState([])
  const [loading, setLoading]     = useState(true)
  const zoomRef   = useRef(null)
  const svgElRef  = useRef(null)

  useEffect(() => {
    fetch('/cartel_graph_data.json')
      .then(r => r.json())
      .then(data => { setGraphData(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!graphData || !svgRef.current) return

    const { nodes: rawNodes, edges: rawEdges } = graphData
    const hubs = findHubs(rawNodes, rawEdges)
    const cartelHubsList = buildCartelHubs(rawNodes, rawEdges)
    
    // DEBUG: Check if cartel hubs are being built correctly
    console.log("CARTEL HUBS:", cartelHubsList)
    
    setCartelHubs(cartelHubsList)

    const apkCount    = rawNodes.filter(n => n.type === 'apk').length
    const domainCount = rawNodes.filter(n => n.type === 'domain').length
    setStats({ apks: apkCount, domains: domainCount, hubs: cartelHubsList.length, edges: rawEdges.length })

    const container = svgRef.current.parentElement
    const W = container.clientWidth  || 900
    const H = container.clientHeight || 600

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H)

    // Defs — arrowhead marker
    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#94a3b8')

    defs.append('marker')
      .attr('id', 'arrow-red')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#ef4444')

    // Zoom
    const g = svg.append('g')
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3])
      .on('zoom', e => g.attr('transform', e.transform))
    svg.call(zoom)
    zoomRef.current = zoom
    svgElRef.current = svg

    // Clone nodes/edges for simulation (D3 mutates them)
    const nodes = rawNodes.map(n => ({ ...n }))
    const edges = rawEdges.map(e => ({ ...e }))

    // Force simulation
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(d => {
        const isHub = hubs.has(d.target?.id ?? d.target)
        return isHub ? 80 : 120
      }).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(28))

    // Edges
    const link = g.append('g').selectAll('line')
      .data(edges).join('line')
      .attr('stroke', d => {
        const tId = d.target?.id ?? d.target
        return hubs.has(tId) || isSuspicious(tId) ? '#ef4444' : '#94a3b8'
      })
      .attr('stroke-width', d => {
        const tId = d.target?.id ?? d.target
        return hubs.has(tId) ? 1.8 : 1
      })
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => {
        const tId = d.target?.id ?? d.target
        return hubs.has(tId) || isSuspicious(tId) ? 'url(#arrow-red)' : 'url(#arrow)'
      })

    // Node groups
    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click', (e, d) => { e.stopPropagation(); setSelected(d) })

    // Node circles
    node.append('circle')
      .attr('r', d => {
        if (d.type === 'apk') {
          // REQ 6 — APK size proportional to risk_score
          const riskScore = d.risk_score ?? 0.5
          return Math.max(30, riskScore * 60) / 2 // Divide by 2 for radius
        }
        if (hubs.has(d.id)) return 13
        return 9
      })
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => {
        if (d.type === 'apk') return '#FF9933'
        if (hubs.has(d.id)) return '#fca5a5'
        return '#94a3b8'
      })
      .attr('stroke-width', d => d.type === 'apk' || hubs.has(d.id) ? 2.5 : 1)

    // Node icons (text)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => d.type === 'apk' ? 10 : 8)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.type === 'apk' ? 'APK' : '🌐')

    // Labels
    node.append('text')
      .attr('x', 0)
      .attr('y', d => (d.type === 'apk' ? 16 : hubs.has(d.id) ? 13 : 9) + 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', d => d.type === 'apk' ? '#1a237e' : hubs.has(d.id) ? '#b91c1c' : '#64748b')
      .attr('font-weight', d => d.type === 'apk' || hubs.has(d.id) ? '700' : '400')
      .attr('pointer-events', 'none')
      .text(d => {
        const lbl = d.label || d.id
        return lbl.length > 18 ? lbl.slice(0, 16) + '…' : lbl
      })

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Click background to deselect
    svg.on('click', () => setSelected(null))

    return () => sim.stop()
  }, [graphData])

  const handleZoom = (dir) => {
    if (!zoomRef.current || !svgElRef.current) return
    svgElRef.current.transition().duration(300).call(
      dir === 'in' ? zoomRef.current.scaleBy : zoomRef.current.scaleBy,
      dir === 'in' ? 1.4 : 0.7
    )
  }

  const handleReset = () => {
    if (!zoomRef.current || !svgElRef.current) return
    svgElRef.current.transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity)
  }

  // Connections for selected node
  const getConnections = (node) => {
    if (!graphData || !node) return []
    return graphData.edges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => e.source === node.id ? e.target : e.source)
  }

  return (
    <div className="space-y-4">

      {/* Header card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#1a237e] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF9933]" />
            <span className="text-sm font-bold text-white uppercase tracking-wide">
              Cartel Threat Network — Batch Analysis
            </span>
          </div>
          <span className="text-[10px] text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
            CLASSIFIED · AppGuard Intelligence
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { icon: Shield,        label: 'APK Nodes',      value: stats.apks,    color: 'text-[#1a237e]' },
            { icon: Globe,         label: 'Domain Nodes',   value: stats.domains, color: 'text-slate-600' },
            { icon: AlertTriangle, label: 'Cartel Hubs',    value: stats.hubs,    color: 'text-red-600' },
            { icon: Info,          label: 'Connections',    value: stats.edges,   color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 px-4 py-3">
              <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-black ${s.color} leading-none`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-4 py-2 flex flex-wrap items-center gap-4 text-[11px] text-gray-500 border-b border-gray-100 bg-gray-50">
          <span className="font-bold text-gray-600 uppercase tracking-widest text-[10px]">Legend:</span>
          {[
            { color: 'bg-[#0A1628] border-[#FF9933]', label: 'APK (Fraudulent App)' },
            { color: 'bg-[#C0392B] border-red-300',    label: 'Chinese Infrastructure / Suspicious' },
            { color: 'bg-[#D35400] border-orange-300', label: 'Burner Domain' },
            { color: 'bg-[#9A7D0A] border-amber-300',  label: 'Staging in Production' },
            { color: 'bg-slate-500 border-slate-300',  label: 'Benign Domain' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full border-2 ${l.color}`} />
              <span>{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-gray-400">Drag nodes · Scroll to zoom · Click to inspect</span>
        </div>
      </div>

      {/* Graph + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Graph canvas */}
        <div className="lg:col-span-3 bg-[#0d1117] rounded-lg border border-gray-700 overflow-hidden relative" style={{ height: 560 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
                <p className="text-blue-300 text-xs font-semibold">Loading threat graph…</p>
              </div>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />

          {/* Zoom controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {[
              { icon: ZoomIn,    fn: () => handleZoom('in'),  title: 'Zoom in' },
              { icon: ZoomOut,   fn: () => handleZoom('out'), title: 'Zoom out' },
              { icon: Maximize2, fn: handleReset,             title: 'Reset view' },
            ].map(({ icon: Icon, fn, title }) => (
              <button key={title} onClick={fn} title={title}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg flex items-center justify-center text-white transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Watermark */}
          <div className="absolute bottom-3 left-3 text-[10px] text-white/20 font-mono select-none">
            AppGuard · Cartel Intelligence · CLASSIFIED
          </div>
        </div>

        {/* Inspector panel */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#1a237e] px-3 py-2">
              <span className="text-xs font-bold text-white uppercase tracking-wide">Node Inspector</span>
            </div>
            <div className="p-3">
              {!selected ? (
                <div className="text-center py-6 text-gray-400">
                  <Globe className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs">Click any node to inspect</p>
                </div>
              ) : (
                <div className="space-y-3 fade-in">
                  {/* Type badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      selected.type === 'apk'
                        ? 'bg-[#0A1628] text-white'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {selected.type === 'apk' ? '📦 APK' : '🌐 Domain'}
                    </span>
                    {selected.type === 'domain' && graphData && (() => {
                      const hubs = findHubs(graphData.nodes, graphData.edges)
                      return hubs.has(selected.id)
                        ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white">⚑ CARTEL HUB</span>
                        : null
                    })()}
                    {/* REQ 6 — Show classification badge */}
                    {selected.classification && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                        {selected.classification.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* ID */}
                  <div className="bg-[#f5f6ff] border border-[#c5cae9] rounded-lg p-2.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                      {selected.type === 'apk' ? 'Package ID' : 'Domain'}
                    </p>
                    <p className="font-mono text-xs text-[#1a237e] font-bold break-all">{selected.id}</p>
                  </div>

                  {/* Label */}
                  <div className="bg-[#f5f6ff] border border-[#c5cae9] rounded-lg p-2.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Label</p>
                    <p className="text-xs text-gray-700 font-semibold">{selected.label}</p>
                  </div>

                  {/* REQ 6 — Show risk_score and verdict for APK nodes */}
                  {selected.type === 'apk' && (selected.risk_score != null || selected.verdict) && (
                    <div className="bg-[#f5f6ff] border border-[#c5cae9] rounded-lg p-2.5">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Risk Assessment</p>
                      {selected.risk_score != null && (
                        <p className="text-xs text-gray-700 font-semibold">Score: {Math.round(selected.risk_score * 100)}%</p>
                      )}
                      {selected.verdict && (
                        <p className="text-xs text-red-700 font-bold mt-1">Verdict: {selected.verdict}</p>
                      )}
                    </div>
                  )}

                  {/* Connections */}
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1.5">
                      Connections ({getConnections(selected).length})
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getConnections(selected).map(c => (
                        <div key={c} className="text-[10px] font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600 truncate">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cartel hubs list */}
          {cartelHubs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-red-700 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wide">⚑ Cartel Hubs</span>
                <span className="text-[10px] text-white bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {cartelHubs.length}
                </span>
              </div>
              <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                {cartelHubs.map(hub => {
                  const classColors = {
                    'CHINESE_INFRASTRUCTURE': 'bg-red-50 border-red-300 text-red-800',
                    'SUSPICIOUS': 'bg-red-50 border-red-300 text-red-800',
                    'STAGING_IN_PRODUCTION': 'bg-amber-50 border-amber-300 text-amber-800',
                    'BURNER_DOMAIN': 'bg-orange-50 border-orange-300 text-orange-800',
                  }
                  const colorClass = classColors[hub.classification] || 'bg-gray-50 border-gray-300 text-gray-800'
                  
                  return (
                    <div key={hub.id} className={`flex items-start gap-2 text-[10px] border rounded px-2 py-1.5 ${colorClass}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold truncate">{hub.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] opacity-70">{hub.connectionCount} APK{hub.connectionCount > 1 ? 's' : ''}</span>
                          {hub.classification && (
                            <span className="text-[8px] uppercase tracking-wider opacity-60">
                              {hub.classification.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
