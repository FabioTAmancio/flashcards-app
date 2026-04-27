import { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import api from '../services/api'

export default function EmailBanner() {
  const user = useAuthStore(s => s.user)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  // Só mostra se o user existe e não verificou o email
  if (!user || user.emailVerified) return null

  async function handleResend() {
    setLoading(true)
    try {
      await api.post('/auth/resend-verification', { email: user!.email })
      setSent(true)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 60, left: 0, right: 0, zIndex: 90,
      background: 'rgba(251,191,36,0.08)',
      borderBottom: '1px solid rgba(251,191,36,0.2)',
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <span style={{ fontSize: 13, color: '#fbbf24' }}>
        ⚠️ Confirme seu email para garantir acesso à sua conta.
      </span>
      {sent ? (
        <span style={{ fontSize: 12, color: '#4ade80' }}>✓ Email reenviado!</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          style={{
            fontSize: 12, fontWeight: 600,
            color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 7, padding: '4px 12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Enviando...' : 'Reenviar email'}
        </button>
      )}
    </div>
  )
}
