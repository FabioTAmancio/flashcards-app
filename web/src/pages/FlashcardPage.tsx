import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { flashcardService, deckService } from '../services/deck.service'

type Card = { id: number; front: string; back: string, subject: string }
type Deck = { id: number; name: string; description: string }

function CardItem({ card, onEdit, onDelete }: { card: Card; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '16px 20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: 16,
      alignItems: 'center',
      transition: 'all 0.15s',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Frente</div>
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{card.front}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Verso</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{card.back}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, opacity: hover ? 1 : 0, transition: 'opacity 0.15s' }}>
        <button onClick={onEdit} style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13,
        }}>✎</button>
        <button onClick={onDelete} style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--red)', cursor: 'pointer', fontSize: 13, opacity: 0.7,
        }}>✕</button>
      </div>
    </div>
  )
}

function CardModal({ card, deckId, onClose, onSave }: {
  card?: Card; deckId: number; onClose: () => void; onSave: () => void
}) {
  const [front, setFront] = useState(card?.front || '')
  const [back, setBack] = useState(card?.back || '')
  const [subject, setSubject] = useState(card?.subject || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    if (card) {
      await flashcardService.update(card.id, front, back, subject)
    } else {
      await flashcardService.create(deckId, front, back, subject)
    }
    setLoading(false)
    onSave()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius)',
        padding: 32, width: '100%', maxWidth: 480,
        animation: 'fadeUp 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          {card ? 'Editar Card' : 'Novo Card'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Front', value: front, set: setFront, placeholder: 'Pergunta ou termo...' },
            { label: 'Back', value: back, set: setBack, placeholder: 'Resposta ou definicao...' },
            { label: 'Subject', value: subject, set: setSubject, placeholder: 'Biologia...'}
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </label>
              <textarea value={value} onChange={e => set(e.target.value)} placeholder={placeholder} required rows={3} style={{
                width: '100%', padding: '10px 13px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 9, color: 'var(--text)',
                fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', resize: 'vertical',
              }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 9, color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 9, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const navigate = useNavigate()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'create' | Card>(null)

  const id = Number(deckId)

  async function load() {
    try {
      const [allDecks, cardData] = await Promise.all([
        deckService.getAll(),
        flashcardService.getByDeck(id),
      ])
      setDeck(allDecks.find((d: Deck) => d.id === id) || null)
      setCards(cardData)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleDelete(cardId: number) {
    if (!confirm('Excluir este card?')) return
    await flashcardService.delete(cardId)
    load()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ paddingTop: 92, paddingLeft: 32, paddingRight: 32, maxWidth: 900, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, animation: 'fadeIn 0.3s ease' }}>
          <button onClick={() => navigate('/decks')} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)',
            padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ← Decks
          </button>
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{deck?.name || '...'}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ animation: 'fadeUp 0.4s ease' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.8px', marginBottom: 4 }}>
              {loading ? '—' : (deck?.name || 'Deck')}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {loading ? '—' : `${cards.length} card${cards.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => setModal('create')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px',
            background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', animation: 'fadeUp 0.4s ease 0.1s both',
          }}>
            <span style={{ fontSize: 15 }}>+</span> Novo Card
          </button>
        </div>

        {/* Cards list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid var(--border2)', borderTopColor: 'var(--accent)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, animation: 'fadeUp 0.5s ease' }}>
            <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>◎</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              Sem cards ainda
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Adicione seus primeiros flashcards para começar a estudar.
            </p>
            <button onClick={() => setModal('create')} style={{
              padding: '9px 20px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}>Adicionar card</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cards.map((card, i) => (
              <div key={card.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                <CardItem
                  card={card}
                  onEdit={() => setModal(card)}
                  onDelete={() => handleDelete(card.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CardModal
          card={modal === 'create' ? undefined : modal}
          deckId={id}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}