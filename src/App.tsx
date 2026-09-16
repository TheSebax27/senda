import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PlacesProvider } from './context/PlacesContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { MobileNav } from './components/MobileNav'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Perfil } from './pages/Perfil'
import { Home } from './pages/Home'
import { Lugares } from './pages/Lugares'
import { PlaceDetail } from './pages/PlaceDetail'
import { AgregarLugar } from './pages/AgregarLugar'
import { Mapa } from './pages/Mapa'
import { Favoritos } from './pages/Favoritos'
import { Historia } from './pages/Historia'
import { Proximos } from './pages/Proximos'
import './App.css'

function AppShell() {
  return (
    <PlacesProvider>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/lugares/:id" element={<PlaceDetail />} />
            <Route path="/agregar" element={<AgregarLugar />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/historia" element={<Historia />} />
            <Route path="/proximos" element={<Proximos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </PlacesProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
