import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const NAV_ITEMS = [
  { to: '/matches', label: 'Match History', icon: '📋' },
  { to: '/live',    label: 'Live Game',     icon: '🔴' },
  { to: '/settings', label: 'Settings',    icon: '⚙️' },
]

export default function Navbar() {
  const { settings } = useApp()
  const configured = settings?.apiKey && settings?.gameName && settings?.tagLine

  return (
    <aside className="flex flex-col w-52 shrink-0 bg-tft-card border-r border-tft-border h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-tft-border">
        <span className="text-tft-gold font-bold text-lg tracking-wide">TFT Stats</span>
        {configured && (
          <p className="text-tft-muted text-xs mt-0.5 truncate">
            {settings.gameName}#{settings.tagLine}
          </p>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                isActive
                  ? 'bg-tft-gold/10 text-tft-gold font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              ].join(' ')
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-tft-border">
        <p className="text-xs text-tft-muted">Powered by Riot Games API</p>
      </div>
    </aside>
  )
}
