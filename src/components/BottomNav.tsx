import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Workouts', icon: '🏋️', end: true },
  { to: '/progress', label: 'Progress', icon: '📈', end: false },
  { to: '/stats', label: 'Stats', icon: '📊', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="nav-ico">{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
