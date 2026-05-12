import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { profileService, type UserProfile } from '../services/profile.service'
import { useAuthStore } from '../store/auth.store'

// ── helpers de estilo ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string | number; color?: string
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text-h)', letterSpacing: '-0.8px', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  )
}

// ── PlanBadge ─────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: 'FREE' | 'PREMIUM' }) {
  const isPremium = plan === 'PREMIUM'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      background: isPremium ? 'rgba(245,158,11,0.12)' : 'var(--surface2)',
      border: `1px solid ${isPremium ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
      color: isPremium ? '#f59e0b' : 'var(--text-muted)',
    }}>
      {isPremium ? '✦ Premium' : '◇ Free'}
    </span>
  )
}

// ── AvatarUploader ────────────────────────────────────────────────────────────

function AvatarUploader({ current, name, onUploaded }: {
  current: string | null
  name: string
  onUploaded: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [hover, setHover] = useState(false)

  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo: 5 MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const updated = await profileService.uploadAvatar(file)
      onUploaded((updated as unknown as UserProfile).avatarUrl || '')
    } catch {
      alert('Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ position: 'relative', width: 88, height: 88 }}>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 88, height: 88,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: uploading ? 'not-allowed' : 'pointer',
          border: '2px solid var(--border2)',
          position: 'relative',
          background: 'var(--surface2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s',
          ...(hover && !uploading ? { borderColor: 'var(--accent-border)' } : {}),
        }}
      >
        {current ? (
          <img
            src={current}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
            {initials}
          </span>
        )}

        {(hover || uploading) && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
          }}>
            <span style={{ fontSize: 16 }}>{uploading ? '⏳' : '📷'}</span>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {uploading ? 'Enviando' : 'Trocar'}
            </span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 500,
      padding: '12px 20px',
      background: type === 'success' ? 'rgba(34,211,165,0.12)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${type === 'success' ? 'rgba(34,211,165,0.3)' : 'rgba(239,68,68,0.25)'}`,
      borderRadius: 12,
      color: type === 'success' ? '#22d3a5' : '#f87171',
      fontSize: 13, fontWeight: 600,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      animation: 'fadeUp 0.25s ease',
    }}>
      {type === 'success' ? '✓ ' : '⚠ '}{msg}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate = useNavigate()
  const { updateUser } = useAuthStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [upgradingLoading, setUpgradingLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
  const [dirty, setDirty] = useState(false)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await profileService.get()
        setProfile(data)
        setName(data.name)
        setAvatarUrl(data.avatarUrl || '')
      } catch {
        showToast('Erro ao carregar perfil', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!profile) return
    setDirty(name !== profile.name || avatarUrl !== (profile.avatarUrl || ''))
  }, [name, avatarUrl, profile])

  async function handleSave() {
    if (!dirty || !profile) return
    setSaving(true)
    try {
      const updated = await profileService.update(name.trim(), avatarUrl || undefined)
      setProfile(updated)
      setDirty(false)
      updateUser({ name: updated.name, avatarUrl: updated.avatarUrl })
      showToast('Perfil atualizado com sucesso!')
    } catch {
      showToast('Erro ao salvar. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpgrade() {
    setUpgradingLoading(true)
    try {
      const updated = await profileService.upgrade()
      setProfile(updated)
      updateUser({ plan: 'PREMIUM' })
      setShowUpgradeConfirm(false)
      showToast('Bem-vindo ao Premium! ✦')
    } catch {
      showToast('Erro ao fazer upgrade.', 'error')
    } finally {
      setUpgradingLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 140 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isPremium = profile.plan === 'PREMIUM'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '88px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button
            onClick={() => navigate('/decks')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}
          >← Decks</button>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', margin: 0 }}>Meu perfil</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gerencie suas informações e preferências</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatCard icon="▦" label="Decks criados" value={profile.totalDecks} color="var(--accent)" />
          <StatCard icon="◈" label="Cards no total" value={profile.totalCards} color="var(--blue)" />
          <StatCard icon="🔥" label="Dias seguidos" value={profile.currentStreak} color="#f59e0b" />
        </div>

        {/* Informações pessoais */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Informações pessoais</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Nome e foto de perfil</div>
            </div>
            {dirty && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 10px', borderRadius: 99 }}>
                ● Alterações não salvas
              </span>
            )}
          </div>

          <div style={{ padding: '24px' }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <AvatarUploader
                current={avatarUrl || null}
                name={name || profile.name}
                onUploaded={url => { setAvatarUrl(url); setDirty(true) }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-h)', letterSpacing: '-0.3px' }}>{profile.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, marginBottom: 8 }}>{profile.email}</div>
                <PlanBadge plan={profile.plan} />
              </div>
            </div>

            {/* Campos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome de exibição</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <div style={{ position: 'relative' }}>
                  <input value={profile.email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {profile.emailVerified ? (
                      <span style={{ fontSize: 11, color: '#22d3a5', fontWeight: 600, background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', padding: '2px 8px', borderRadius: 99 }}>✓ Verificado</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 99 }}>⚠ Não verificado</span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5 }}>O e-mail não pode ser alterado por aqui.</p>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                style={{
                  padding: '10px 24px',
                  background: dirty ? 'var(--accent)' : 'var(--surface2)',
                  border: `1px solid ${dirty ? 'transparent' : 'var(--border)'}`,
                  borderRadius: 10, color: dirty ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  cursor: saving || !dirty ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, transition: 'all 0.15s',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>

        {/* Plano */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${isPremium ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${isPremium ? 'rgba(245,158,11,0.15)' : 'var(--border)'}` }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Plano atual</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {isPremium ? 'Você tem acesso a todos os recursos' : 'Faça upgrade para desbloquear mais recursos'}
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            {isPremium ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✦</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#f59e0b' }}>Premium</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Acesso ilimitado a todos os recursos</div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--text-muted)' }}>◇ Free</div>
                    {['Até 10 decks', 'Até 100 cards', 'Revisão SRS básica', 'Importação manual'].map(f => (
                      <div key={f} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ color: 'var(--border2)' }}>–</span> {f}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#f59e0b' }}>✦ Premium</div>
                    {['Decks ilimitados', 'Cards ilimitados', 'Revisão SRS avançada', 'Importação Anki (.apkg)'].map(f => (
                      <div key={f} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 6, display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ color: '#22d3a5' }}>✓</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeConfirm(true)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px' }}
                >✦ Fazer upgrade para Premium</button>
              </>
            )}
          </div>
        </div>

        {/* Conta */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Conta</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Ações relacionadas à sua conta</div>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>ID de usuário</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2, fontFamily: 'var(--mono)' }}>#{profile.id}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>Sair da conta</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Encerra a sessão neste dispositivo</div>
              </div>
              <button
                onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login' }}
                style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, color: 'var(--red)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >Sair</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal upgrade */}
      {showUpgradeConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowUpgradeConfirm(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 18, padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, margin: '0 0 8px', letterSpacing: '-0.4px' }}>Upgrade para Premium</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Decks e cards ilimitados, importação Anki e revisão SRS avançada.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowUpgradeConfirm(false)} style={{ flex: 1, padding: '11px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleUpgrade} disabled={upgradingLoading} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: upgradingLoading ? 'not-allowed' : 'pointer', opacity: upgradingLoading ? 0.7 : 1 }}>
                {upgradingLoading ? 'Ativando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}