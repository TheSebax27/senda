import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PlacesProvider } from './context/PlacesContext'
import { Navbar } from './components/Navbar'
import { MobileNav } from './components/MobileNav'
import { Home } from './pages/Home'
import { Lugares } from './pages/Lugares'
import { PlaceDetail } from './pages/PlaceDetail'
import { AgregarLugar } from './pages/AgregarLugar'
import { Mapa } from './pages/Mapa'
import { Favoritos } from './pages/Favoritos'
import { Historia } from './pages/Historia'
import { Proximos } from './pages/Proximos'
import './App.css'

export default function App() {
  return (
    <PlacesProvider>
      <BrowserRouter>
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
            </Routes>
          </main>
          <MobileNav />
        </div>
      </BrowserRouter>
    </PlacesProvider>
  )
}
