import { useEffect, useRef, useState } from 'react'
import { Copy, Check, Terminal as TermIcon } from 'lucide-react'

export default function Terminal({ lines }) {
  const bottomRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const handleCopy = () => {
    const text = lines.map(l => `[${l.time}] ${l.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg overflow-hidden border border-[#30363d] shadow-lg">
      {/* Title bar */}
      <div className="bg-[#161b22] flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <TermIcon className="w-3 h-3 text-[#8b949e]" />
            <span className="text-[#8b949e] text-[10px] font-mono">AppGuard OSINT Terminal v2.1 — [CLASSIFIED]</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Output */}
      <div className="bg-[#0d1117] font-mono text-xs text-green-400 p-3 h-52 overflow-y-auto terminal-scroll">
        {lines.length === 0 && (
          <span className="text-[#8b949e]">Waiting for input…</span>
        )}
        {lines.map((line, i) => (
          <div key={i} className={`leading-5 flex gap-2 ${
            line.type === 'error'   ? 'text-red-400'
            : line.type === 'warn' ? 'text-yellow-400'
            : line.type === 'success' ? 'text-green-300'
            : 'text-green-500'
          }`}>
            <span className="text-[#555] select-none w-5 text-right flex-shrink-0">{i + 1}</span>
            <span className="text-[#8b949e]">[{line.time}]</span>
            <span>{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
        <span className="text-green-400 terminal-cursor">█</span>
      </div>
    </div>
  )
}
