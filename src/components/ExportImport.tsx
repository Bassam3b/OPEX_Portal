import React from 'react'
import type { Project, Idea } from '../lib/types'

type Props = { projects: Project[]; ideas: Idea[]; onImport: (data:{projects:Project[];ideas:Idea[]}) => void }

export default function ExportImport({ projects, ideas, onImport }: Props) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ projects, ideas }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `opex-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => { try { onImport(JSON.parse(String(reader.result))) } catch { alert('Invalid backup file') } }
    reader.readAsText(file)
  }
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">Backup</h3>
      <div className="flex items-center gap-3">
        <button onClick={exportData} className="rounded-xl border px-3 py-2 text-sm">Export JSON</button>
        <label className="rounded-xl border px-3 py-2 text-sm cursor-pointer">
          Import JSON
          <input type="file" accept="application/json" className="hidden" onChange={importData}/>
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">Use Export/Import as a safety net if the cloud is unreachable.</p>
    </div>
  )
}
