import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ivory)',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
            <path d="M4 18 C4 18 6 10 11 6 C16 2 18 4 18 4" stroke="var(--forest)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <circle cx="4" cy="18" r="1.5" fill="var(--forest)"/>
            <circle cx="18" cy="4" r="1.5" fill="var(--forest)"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cargando senda…
          </span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
