import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, Map, Star, Plus } from 'lucide-react'
import './MobileNav.css'

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: MapPin, label: 'Lugares', path: '/lugares' },
  { icon: Map, label: 'Mapa', path: '/mapa' },
  { icon: Star, label: 'Favoritos', path: '/favoritos' },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="mobile-nav">
      {navItems.slice(0, 2).map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </Link>
      ))}

      <Link to="/agregar" className="mobile-nav-add">
        <Plus size={22} />
      </Link>

      {navItems.slice(2).map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
