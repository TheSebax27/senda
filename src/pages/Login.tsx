import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function Login() {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    setError(null)
    const { error } = await signIn(form.email, form.password)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-bg" style={{ backgroundImage: 'url(https://i.pinimg.com/1200x/1f/9c/a6/1f9ca61b7124efe5c635099483e54c6d.jpg)' }} />
        <div className="auth-visual-overlay" />
        <div className="auth-visual-content">
          <div className="auth-logo">
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <path d="M4 18 C4 18 6 10 11 6 C16 2 18 4 18 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <circle cx="4" cy="18" r="1.5" fill="white"/>
              <circle cx="18" cy="4" r="1.5" fill="white"/>
            </svg>
            <span>SENDA</span>
          </div>
          <h2>El camino que<br />recorremos juntos.</h2>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-header">
            <h1>Bienvenido de vuelta</h1>
            <p>Accede a vuestra senda compartida.</p>
          </div>

          {!configured && (
            <div className="auth-warn">
              <AlertTriangle size={15} />
              <span>Las variables de entorno de Supabase no están configuradas. Agrégalas en Vercel → Settings → Environment Variables y haz Redeploy.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label>Contraseña</label>
              <div className="password-input">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading || !form.email || !form.password}>
              {loading ? <span className="auth-spinner" /> : 'Entrar'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
