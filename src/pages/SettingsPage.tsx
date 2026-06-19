import { useEffect, useRef, useState } from 'react'
import {
  exportBackup,
  downloadBackup,
  importBackup,
  clearAllData,
  requestPersistentStorage,
} from '../db/backup'

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string>('')
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [usage, setUsage] = useState<string>('')

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
    navigator.storage?.estimate?.().then((e) => {
      if (e.usage != null) setUsage(`${(e.usage / 1024).toFixed(0)} KB stored`)
    })
  }, [])

  async function onExport() {
    const data = await exportBackup()
    downloadBackup(data)
    setStatus(`Exported ${data.workouts.length} workouts.`)
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (
        !confirm('Restore this backup? It will REPLACE all current data on this device.')
      ) {
        return
      }
      const res = await importBackup(parsed, 'replace')
      setStatus(`Restored ${res.workouts} workouts and ${res.exercises} exercises.`)
    } catch (err) {
      setStatus(`Import failed: ${(err as Error).message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onPersist() {
    const ok = await requestPersistentStorage()
    setPersisted(ok)
    setStatus(
      ok
        ? 'Persistent storage granted — your data is protected from automatic cleanup.'
        : 'The browser declined persistent storage (data still saved, but may be evicted if storage runs low).',
    )
  }

  async function onClear() {
    if (!confirm('Delete ALL workouts and exercises? Export a backup first!')) return
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return
    await clearAllData()
    setStatus('All data cleared.')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Backup</h3>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          Your data lives only on this device. Export regularly so you never lose your
          history.
        </p>
        <div className="row-gap" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onExport}>
            Export backup (.json)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import backup…
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportFile(f)
          }}
        />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Storage</h3>
        <p className="subtitle" style={{ marginBottom: 12 }}>
          {persisted == null
            ? 'Checking storage…'
            : persisted
              ? '✅ Persistent storage is enabled.'
              : '⚠️ Storage is not marked persistent.'}
          {usage && ` · ${usage}`}
        </p>
        {!persisted && (
          <button className="btn" onClick={onPersist}>
            Enable persistent storage
          </button>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Install on iPhone</h3>
        <p className="subtitle">
          In Safari, tap the Share button → <strong>Add to Home Screen</strong>. The app
          then launches fullscreen and works offline.
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 8, color: 'var(--danger)' }}>Danger zone</h3>
        <button className="btn btn-danger" onClick={onClear}>
          Clear all data
        </button>
      </div>

      {status && (
        <p className="subtitle" style={{ marginTop: 12 }}>
          {status}
        </p>
      )}
    </div>
  )
}
