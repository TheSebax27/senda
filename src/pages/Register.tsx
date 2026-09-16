import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Camera, User, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export function Register() {
  const { signUp, uploadAvatar, configured } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La foto no puede superar los 5 MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.displayName.trim()) return setError('Escribe tu nombre.')
    if (!form.username.trim()) return setError('Escribe un nombre de usuario.')
    if (!/^[a-z0-9_]{3,20}$/.test(form.username.toLowerCase().trim())) {
      return setError('El usuario debe tener 3–20 caracteres: letras, números o _')
    }
    if (!form.email.trim()) return setError('Escribe tu correo.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')

    setLoading(true)

    const { error: signUpError } = await signUp(
      form.email,
      form.password,
      form.username,
      form.displayName
    )

    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    // Subir avatar si se seleccionó
    if (avatarFile) {
      const { error: avatarError } = await uploadAvatar(avatarFile)
      if (avatarError) console.warn('Avatar upload failed:', avatarError)
    }

    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80)' }} />
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
          <h2>Comienza tu<br />camino.</h2>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-header">
            <h1>Crear cuenta</h1>
            <p>Solo dos personas pueden registrarse.</p>
          </div>

          {!configured && (
            <div className="auth-warn">
              <AlertTriangle size={15} />
              <span>Supabase no está configurado. Agrega <strong>VITE_SUPABASE_URL</strong> y <strong>VITE_SUPABASE_ANON_KEY</strong> en Vercel → Settings → Environment Variables y haz Redeploy.</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Avatar picker */}
            <div className="avatar-picker">
              <div
                className="avatar-preview"
                onClick={() => fileRef.current?.click()}
                style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : {}}
              >
                {!avatarPreview && <User size={28} className="avatar-placeholder-icon" />}
                <div className="avatar-camera"><Camera size={14} /></div>
              </div>
              <div className="avatar-info">
                <p>Foto de perfil</p>
                <span>JPG o PNG · máx. 5 MB</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} hidden />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Tu nombre</label>
                <input
                  type="text"
                  placeholder="María"
                  value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <label>Usuario</label>
                <div className="username-input">
                  <span className="username-at">@</span>
                  <input
                    type="text"
                    placeholder="maria"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    autoComplete="username"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

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
                  placeholder="mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label>Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="repite la contraseña"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
