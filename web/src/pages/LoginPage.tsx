import { useState, useEffect } from 'react'
import { authService } from '../services/auth.service'
import { useAuthStore } from '../store/auth.store'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifyBanner, setVerifyBanner] = useState<'success' | 'error' | 'expired' | null>(null)

  const setUser = useAuthStore((s) => s.setUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const verified = searchParams.get('verified')
    const reason   = searchParams.get('reason') ?? ''
    if (verified === 'true')  setVerifyBanner('success')
    if (verified === 'false') {
      if (reason.toLowerCase().includes('expired')) setVerifyBanner('expired')
      else setVerifyBanner('error')
    }
  }, [searchParams])

  if (isAuthenticated) return <Navigate to="/decks" replace />

 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (tab === 'login') {
        const data = await authService.login(email, password)
        setUser(data.user)
      } else {
        const data = await authService.register(name, email, password)
        setUser(data.user)
      }
      navigate('/decks')
    } catch {
      setError(tab === 'login' ? 'Email ou senha incorretos.' : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,165,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
 
      {/* Left side - branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        maxWidth: 520,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 42,
          lineHeight: 1,
          marginBottom: 24,
          color: 'var(--text)',
          letterSpacing: '-1.5px',
        }}>
          flash<span style={{ color: 'var(--accent)' }}>.</span>
        </div>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 340 }}>
          Aprenda com repetição espaçada inteligente. Memorize mais, esqueça menos.
        </p>
 
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { icon: '◎', title: 'Repetição Espaçada', desc: 'Algoritmo SM-2 otimiza seu aprendizado' },
            { icon: '▦', title: 'Organize em Decks', desc: 'Crie e gerencie seus flashcards facilmente' },
            { icon: '↗', title: 'Progrida Todo Dia', desc: 'Acompanhe sua evolução com sessões diárias' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: 'var(--accent)', flexShrink: 0,
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
 
      {/* Right side - form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          animation: 'fadeUp 0.5s ease forwards',
        }}>
          {/* Banner de verificação de email */}
          {verifyBanner === 'success' && (
            <div style={{
              marginBottom: 24, padding: '14px 16px',
              background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.25)',
              borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#22d3a5', marginBottom: 2 }}>
                  Email verificado com sucesso!
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Sua conta está ativa. Entre abaixo para começar.
                </div>
              </div>
            </div>
          )}
          {verifyBanner === 'expired' && (
            <div style={{
              marginBottom: 24, padding: '14px 16px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏰</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>
                  Link expirado
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  O link de verificação expirou. Entre na sua conta e solicite um novo email.
                </div>
              </div>
            </div>
          )}
          {verifyBanner === 'error' && (
            <div style={{
              marginBottom: 24, padding: '14px 16px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
                  Link inválido
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  O link de verificação é inválido ou já foi usado. Entre na conta e solicite um novo.
                </div>
              </div>
            </div>
          )}

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 32,
          }}>
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 9,
                  border: 'none',
                  background: tab === t ? 'var(--surface2)' : 'transparent',
                  color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
 
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tab === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            )}
 
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
 
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
 
            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--red-soft)',
                border: '1px solid rgba(255,77,109,0.25)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}
 
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '12px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}