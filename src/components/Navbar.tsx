import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)

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
          <Link to="/agregar" className="btn-add-nav">
            + Nueva huella
          </Link>
          <div className="avatar-pair">
            <div className="avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80)' }} />
            <div className="avatar" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80)' }} />
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
        </div>
      )}
    </nav>
  )
}
