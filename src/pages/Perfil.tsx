import { useState, useRef } from 'react'
import { User, Camera, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

export function Perfil() {
  const { profile, signOut, updateProfile, uploadAvatar } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La foto no puede superar los 5 MB.'); return }
    setAvatarLoading(true)
    setError(null)
    const { error } = await uploadAvatar(file)
    if (error) setError(error)
    setAvatarLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.display_name.trim()) return setError('El nombre no puede estar vacío.')
    if (!/^[a-z0-9_]{3,20}$/.test(form.username.toLowerCase().trim())) {
      return setError('El usuario debe tener 3–20 caracteres: letras, números o _')
    }

    setLoading(true)
    const { error } = await updateProfile({
      display_name: form.display_name.trim(),
      username: form.username.toLowerCase().trim(),
    })
    if (error) setError(error)
    else setSuccess(true)
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="profile-page">
      <div className="profile-inner">
        <div className="profile-header">
          <h1 className="profile-title">Tu perfil</h1>
          <p className="profile-sub">Así te verá tu compañero en la senda.</p>
        </div>

        {/* Avatar */}
        <div className="profile-section">
          <div className="profile-avatar-block">
            <div
              className="profile-avatar-large"
              style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : {}}
              onClick={() => fileRef.current?.click()}
            >
              {!profile?.avatar_url && <User size={32} color="var(--text-muted)" opacity={0.4} />}
              <div className="profile-avatar-overlay">
                {avatarLoading
                  ? <span className="auth-spinner" />
                  : <Camera size={18} />}
              </div>
            </div>
            <div className="profile-avatar-info">
              <p>{profile?.display_name || 'Sin nombre'}</p>
              <span>@{profile?.username || 'usuario'}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} hidden />
          </div>
        </div>

        {/* Edit info */}
        <div className="profile-section">
          <h3>Información personal</h3>
          <form onSubmit={handleSave}>
            <div className="profile-fields">
              <div className="auth-field">
                <label>Nombre para mostrar</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="auth-field">
                <label>Usuario</label>
                <div className="username-input">
                  <span className="username-at">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="tu_usuario"
                    maxLength={20}
                  />
                </div>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="profile-success">¡Perfil actualizado correctamente!</div>}

              <button className="profile-save-btn" type="submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Logout */}
        <div className="profile-section">
          <h3>Sesión</h3>
          <button className="btn-danger" onClick={handleLogout}>
            <LogOut size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
