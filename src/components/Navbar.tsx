import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const navItems = [
  { label: 'Inicio', path: '/' },
  { label: 'Lugares', path: '/lugares' },
  { label: 'Mapa', path: '/mapa' },
  { label: 'Favoritos', path: '/favoritos' },
  { label: 'Historia', path: '/historia' },
  { label: 'Próximos', path: '/proximos' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 18 C4 18 6 10 11 6 C16 2 18 4 18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="18" cy="4" r="1.5" fill="currentColor"/>
            <path d="M11 6 L13 9 L10 11 L13 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
          </svg>
          <span className="navbar-wordmark">SENDA</span>
        </Link>

        <ul className="navbar-links">
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <Link to="/agregar" className="btn-add-nav">+ Nueva huella</Link>

          {/* Profile dropdown */}
          <div className="nav-profile-wrap" ref={profileRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setProfileOpen(p => !p)}
              aria-label="Menú de perfil"
            >
              {profile?.avatar_url
                ? <div className="nav-avatar" style={{ backgroundImage: `url(${profile.avatar_url})` }} />
                : <div className="nav-avatar nav-avatar-placeholder"><User size={14} /></div>
              }
            </button>

            {profileOpen && (
              <div className="nav-profile-dropdown">
                <div className="dropdown-user">
                  {profile?.avatar_url
                    ? <div className="dropdown-avatar" style={{ backgroundImage: `url(${profile.avatar_url})` }} />
                    : <div className="dropdown-avatar dropdown-avatar-placeholder"><User size={16} /></div>
                  }
                  <div>
                    <p>{profile?.display_name || 'Usuario'}</p>
                    <span>@{profile?.username || '—'}</span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <Link to="/perfil" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                  <Settings size={14} /> Editar perfil
                </Link>
                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/agregar" className="mobile-link-add" onClick={() => setMenuOpen(false)}>
            + Nueva huella
          </Link>
          <div className="mobile-menu-divider" />
          <Link to="/perfil" className="mobile-link" onClick={() => setMenuOpen(false)}>Perfil</Link>
          <button className="mobile-link mobile-logout" onClick={() => { handleLogout(); setMenuOpen(false) }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
