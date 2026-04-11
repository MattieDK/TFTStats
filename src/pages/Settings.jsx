import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'

const PLATFORMS = [
  { value: 'na1',  label: 'NA  — North America' },
  { value: 'euw1', label: 'EUW — Europe West' },
  { value: 'eun1', label: 'EUNE — Europe Nordic & East' },
  { value: 'kr',   label: 'KR  — Korea' },
  { value: 'jp1',  label: 'JP  — Japan' },
  { value: 'br1',  label: 'BR  — Brazil' },
  { value: 'la1',  label: 'LAN — Latin America North' },
  { value: 'la2',  label: 'LAS — Latin America South' },
  { value: 'oc1',  label: 'OCE — Oceania' },
  { value: 'tr1',  label: 'TR  — Turkey' },
  { value: 'ru',   label: 'RU  — Russia' },
  { value: 'me1',  label: 'ME  — Middle East' },
  { value: 'sg2',  label: 'SG  — Singapore' },
]

export default function Settings() {
  const { settings, updateSettings } = useApp()

  const [form, setForm] = useState({
    apiKey:   '',
    gameName: '',
    tagLine:  '',
    platform: 'euw1',
  })
  const [status, setStatus] = useState(null)  // { type: 'success'|'error', text }
  const [testing, setTesting] = useState(false)

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        apiKey:   settings.apiKey   ?? '',
        gameName: settings.gameName ?? '',
        tagLine:  settings.tagLine  ?? '',
        platform: settings.platform ?? 'euw1',
      })
    }
  }, [settings])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setStatus(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.apiKey.trim()) { setStatus({ type: 'error', text: 'API key is required.' }); return }
    if (!form.gameName.trim()) { setStatus({ type: 'error', text: 'Game name is required.' }); return }
    if (!form.tagLine.trim()) { setStatus({ type: 'error', text: 'Tag line is required.' }); return }

    await updateSettings(form)
    setStatus({ type: 'success', text: 'Settings saved!' })
  }

  async function handleTest() {
    if (!form.apiKey.trim() || !form.gameName.trim() || !form.tagLine.trim()) {
      setStatus({ type: 'error', text: 'Fill in all fields before testing.' })
      return
    }
    setTesting(true)
    setStatus(null)
    try {
      const res = await window.tft.account.get({
        gameName: form.gameName.trim(),
        tagLine:  form.tagLine.trim(),
        platform: form.platform,
        apiKey:   form.apiKey.trim(),
      })
      if (res.error) {
        setStatus({ type: 'error', text: `API error ${res.error.status}: ${res.error.message}` })
      } else {
        setStatus({ type: 'success', text: `Connected! PUUID: ${res.data.puuid.slice(0, 16)}…` })
      }
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setTesting(false)
    }
  }

  if (!settings) {
    return <div className="text-tft-muted animate-pulse">Loading settings…</div>
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-tft-muted text-sm mb-6">
        Configure your Riot API key and Riot ID to start tracking stats.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        {/* API Key */}
        <div className="card space-y-1">
          <label className="block text-sm font-medium text-slate-300">
            Riot API Key
          </label>
          <p className="text-xs text-tft-muted mb-2">
            Get yours at{' '}
            <a
              href="https://developer.riotgames.com"
              target="_blank"
              rel="noreferrer"
              className="text-tft-gold hover:underline"
            >
              developer.riotgames.com
            </a>
            . Development keys expire every 24 hours — remember to refresh it daily!
          </p>
          <input
            type="text"
            name="apiKey"
            value={form.apiKey}
            onChange={handleChange}
            placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full bg-tft-dark border border-tft-border rounded-lg px-3 py-2
                       text-sm text-white placeholder-tft-muted font-mono
                       focus:outline-none focus:border-tft-gold transition-colors"
          />
        </div>

        {/* Riot ID */}
        <div className="card space-y-3">
          <p className="text-sm font-medium text-slate-300">Riot ID</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-tft-muted mb-1">Game Name</label>
              <input
                type="text"
                name="gameName"
                value={form.gameName}
                onChange={handleChange}
                placeholder="YourName"
                className="w-full bg-tft-dark border border-tft-border rounded-lg px-3 py-2
                           text-sm text-white placeholder-tft-muted
                           focus:outline-none focus:border-tft-gold transition-colors"
              />
            </div>
            <div className="flex items-end pb-2 text-tft-muted font-bold">#</div>
            <div className="w-28">
              <label className="block text-xs text-tft-muted mb-1">Tag</label>
              <input
                type="text"
                name="tagLine"
                value={form.tagLine}
                onChange={handleChange}
                placeholder="EUW"
                className="w-full bg-tft-dark border border-tft-border rounded-lg px-3 py-2
                           text-sm text-white placeholder-tft-muted
                           focus:outline-none focus:border-tft-gold transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Region */}
        <div className="card">
          <label className="block text-sm font-medium text-slate-300 mb-2">Region / Platform</label>
          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full bg-tft-dark border border-tft-border rounded-lg px-3 py-2
                       text-sm text-white focus:outline-none focus:border-tft-gold transition-colors"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Status message */}
        {status && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {status.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Save Settings
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="btn-ghost border border-tft-border disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </form>
    </div>
  )
}
