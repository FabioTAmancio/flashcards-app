import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService } from '../services/deck.service'

type Deck = {
  id: number
  name: string
  description: string
  reviewEnabled: boolean
  cardCount?: number
}

const PALETTE = ['var(--accent)', 'var(--green)', 'var(--orange)', 'var(--blue)', '#f59e0b', '#ec4899']

// Toggle review

function ReviewToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={enabled ? 'Desabilitar para revisão' : 'Habilitar para revisão'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px',
        background: enabled
          ? 'rgba(34,211,165,0.08)'
          : hover ? 'var(--surface2)' : 'transparent',
        border: `1px solid ${enabled ? 'rgba(34,211,165,0.25)' : 'var(--border)'}`,
        borderRadius: 99,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {/* pill track */}
      <div style={{
        width: 28, height: 16, borderRadius: 99, position: 'relative',
        background: enabled ? 'var(--green)' : 'var(--border2)',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2,
          left: enabled ? 14 : 2,
          width: 12, height: 12,
          background: '#fff', borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: enabled ? 'var(--green)' : 'var(--text-muted)',
        transition: 'color 0.2s',
        whiteSpace: 'nowrap',
      }}>
        {enabled ? 'Revisão on' : 'Revisão off'}
      </span>
    </button>
  )
}

// DeckCard

function DeckCard({
  deck, onEdit, onDelete, onToggleReview,
}: {
  deck: Deck
  onEdit: (d: Deck) => void
  onDelete: (id: number) => void
  onToggleReview: (id: number) => void
}) {
  const navigate = useNavigate()
  const color = PALETTE[deck.id % PALETTE.length]
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: 24,
        cursor: 'default',
        transition: 'all 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
        opacity: deck.reviewEnabled ? 1 : 0.6,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* color bar on top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: deck.reviewEnabled ? color : 'var(--border2)',
        borderRadius: '16px 16px 0 0',
        transition: 'background 0.3s',
      }} />

      {/* icon + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          ▦
        </div>
        <ReviewToggle
          enabled={deck.reviewEnabled}
          onToggle={() => onToggleReview(deck.id)}
        />
      </div>

      {/* name + description */}
      <div
        onClick={() => navigate(`/decks/${deck.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: 17, marginBottom: 4, letterSpacing: '-0.3px',
        }}>
          {deck.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {deck.description || 'Sem descrição'}
        </div>
        {deck.cardCount !== undefined && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/decks/${deck.id}`) }}
          style={{
            flex: 1, padding: '7px 0',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
            fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Ver cards
        </button>
        <button
          onClick={e => { e.stopPropagation(); onEdit(deck) }}
          style={{
            padding: '7px 14px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-muted)',
            fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ✎
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(deck.id) }}
          style={{
            padding: '7px 14px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--red)',
            fontSize: 12, cursor: 'pointer',
            fontFamily: 'var(--font-body)', opacity: 0.6, transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Modal create/edit

function DeckModal({ deck, onClose, onSave }: {
  deck?: Deck
  onClose: () => void
  onSave: (name: string, desc: string) => Promise<void>
}) {
  const [name, setName] = useState(deck?.name || '')
  const [desc, setDesc] = useState(deck?.description || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onSave(name.trim(), desc.trim())
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 9, color: 'var(--text)',
    fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 500,
    color: 'var(--text-muted)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', padding: 32,
          width: '100%', maxWidth: 440,
          animation: 'fadeUp 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          {deck ? 'Editar Deck' : 'Novo Deck'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Inglês B2" required style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Opcional..." rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 9, color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 9, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Page

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'create' | Deck>(null)

  async function load() {
    try {
      const data = await deckService.getAll()
      setDecks(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(name: string, desc: string) {
    if (modal === 'create') {
      await deckService.create(name, desc)
    } else if (modal && typeof modal !== 'string') {
      await deckService.update(modal.id, name, desc)
    }
    setModal(null)
    load()
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este deck e todos os seus cards?')) return
    await deckService.delete(id)
    load()
  }

  async function handleToggleReview(id: number) {
    // Optimistic update
    setDecks(prev =>
      prev.map(d => d.id === id ? { ...d, reviewEnabled: !d.reviewEnabled } : d)
    )
    try {
      await deckService.toggleReview(id)
    } catch {
      // if fail revert
      load()
    }
  }

  const enabledCount = decks.filter(d => d.reviewEnabled).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ paddingTop: 92, paddingLeft: 32, paddingRight: 32, paddingBottom: 60, maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 32, letterSpacing: '-1px', marginBottom: 6,
            }}>
              Meus Decks
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {loading ? '—' : `${decks.length} deck${decks.length !== 1 ? 's' : ''}`}
              {!loading && decks.length > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--green)', fontSize: 12 }}>
                  · {enabledCount} para revisão
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => setModal('create')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              animation: 'fadeUp 0.4s ease 0.1s both',
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Novo Deck
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{
              width: 32, height: 32,
              border: '2px solid var(--border2)', borderTopColor: 'var(--accent)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 100, animation: 'fadeUp 0.5s ease' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>▦</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              Nenhum deck ainda
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
              Crie seu primeiro deck e comece a estudar.
            </p>
            <button
              onClick={() => setModal('create')}
              style={{
                padding: '10px 24px',
                background: 'var(--accent)', border: 'none',
                borderRadius: 10, color: '#fff',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Criar primeiro deck
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {decks.map((deck, i) => (
              <div key={deck.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                <DeckCard
                  deck={deck}
                  onEdit={setModal}
                  onDelete={handleDelete}
                  onToggleReview={handleToggleReview}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <DeckModal
          deck={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
