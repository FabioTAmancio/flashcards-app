import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../services/auth.service'

const NAV = [
  { to: '/decks', label: 'Decks', icon: '▦' },
  { to: '/review', label: 'Review', icon: '◎' },
  { to: '/import', label: 'Import', icon: '↑' },
  { to: '/stats', label: 'Stats', icon: '◈' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    authService.logout()
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <Link to="/decks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 18,
          color: 'var(--text)',
          letterSpacing: '-0.5px',
        }}>flash<span style={{ color: 'var(--accent)' }}>.</span></span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV.map(({ to, label, icon }) => {
          const active = location.pathname === to
          return (
            <Link key={to} to={to} style={{
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: active ? 'var(--text)' : 'var(--text-muted)',
              background: active ? 'var(--surface2)' : 'transparent',
              border: active ? '1px solid var(--border2)' : '1px solid transparent',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 11 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {user.name}
          </span>
        )}
        <button onClick={handleLogout} style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-muted)',
          fontSize: 12,
          padding: '5px 12px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          fontFamily: 'var(--font-body)',
        }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.color = 'var(--text)'
            ;(e.target as HTMLElement).style.borderColor = 'var(--border2)'
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.color = 'var(--text-muted)'
            ;(e.target as HTMLElement).style.borderColor = 'var(--border)'
          }}
        >
          Sair
        </button>
      </div>
    </nav>
  )
}