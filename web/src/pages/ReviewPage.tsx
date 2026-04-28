import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService, reviewService } from '../services/deck.service'

type Flashcard = { id: number; front: string; back: string; subject?: string; frontImageUrl?: string; backImageUrl?: string }
type Deck = { id: number; name: string; reviewEnabled: boolean }

const QUALITY_BTNS = [
  { label: 'Errei',  sublabel: 'Rever agora',      value: 0, color: 'var(--red)',    soft: 'var(--red-soft)',    border: 'rgba(255,77,109,0.3)',  key: '1' },
  { label: 'Difícil',sublabel: 'Em breve',          value: 3, color: 'var(--orange)', soft: 'var(--orange-soft)', border: 'rgba(255,140,66,0.3)',  key: '2' },
  { label: 'Bom',    sublabel: 'Em algumas horas',  value: 4, color: 'var(--blue)',   soft: 'var(--blue-soft)',   border: 'rgba(96,165,250,0.3)',  key: '3' },
  { label: 'Fácil',  sublabel: 'Em alguns dias',    value: 5, color: 'var(--green)',  soft: 'var(--green-soft)',  border: 'rgba(34,211,165,0.3)',  key: '4' },
]

// ── Seletor de deck ────────────────────────────────────────────────────────

function DeckSelector({
  decks,
  selected,
  onSelect,
}: {
  decks: Deck[]
  selected: number | null
  onSelect: (id: number | null) => void
}) {
  const enabledDecks = decks.filter(d => d.reviewEnabled)

  return (
    <div style={{ width: '100%', maxWidth: 600, marginBottom: 28, animation: 'fadeDown 0.4s ease' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        Revisar deck
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Opção "Todos" */}
        <button
          onClick={() => onSelect(null)}
          style={{
            padding: '7px 14px', borderRadius: 99,
            border: `1px solid ${selected === null ? 'var(--accent-border)' : 'var(--border)'}`,
            background: selected === null ? 'var(--accent-bg)' : 'transparent',
            color: selected === null ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: selected === null ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          Todos os decks
        </button>

        {enabledDecks.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            style={{
              padding: '7px 14px', borderRadius: 99,
              border: `1px solid ${selected === d.id ? 'var(--accent-border)' : 'var(--border)'}`,
              background: selected === d.id ? 'var(--accent-bg)' : 'transparent',
              color: selected === d.id ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: selected === d.id ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (selected !== d.id) e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { if (selected !== d.id) e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {d.name}
          </button>
        ))}

        {enabledDecks.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-faint)', fontStyle: 'italic' }}>
            Nenhum deck habilitado para revisão
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  // Carrega decks uma vez
  useEffect(() => {
    deckService.getAll().then(setDecks).catch(console.error)
  }, [])

  // Carrega cards quando o deck selecionado muda
  useEffect(() => {
    setLoading(true)
    setCards([])
    setCurrent(0)
    setShowBack(false)
    setSessionDone(false)
    reviewService.getDueFlashcards(selectedDeck ?? undefined)
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedDeck])

  const handleReveal = useCallback(() => {
    if (showBack || flipping) return
    setFlipping(true)
    setTimeout(() => { setShowBack(true); setFlipping(false) }, 200)
  }, [showBack, flipping])

  const handleQuality = useCallback(async (q: number) => {
    if (submitting || !showBack) return
    setSubmitting(true)
    await reviewService.review(cards[current].id, q)
    if (current + 1 >= cards.length) {
      setSessionDone(true)
    } else {
      setFlipping(true)
      setTimeout(() => { setCurrent(p => p + 1); setShowBack(false); setFlipping(false) }, 200)
    }
    setSubmitting(false)
  }, [submitting, showBack, cards, current])

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); handleReveal() }
      if (showBack) {
        if (e.key === '1') handleQuality(0)
        if (e.key === '2') handleQuality(3)
        if (e.key === '3') handleQuality(4)
        if (e.key === '4') handleQuality(5)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleReveal, handleQuality, showBack])

  const progress = cards.length > 0 ? (current / cards.length) * 100 : 0
  const deckName = selectedDeck ? decks.find(d => d.id === selectedDeck)?.name : null

  // ── Sessão concluída ───────────────────────────────────────────────────

  if (sessionDone || (!loading && cards.length === 0)) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', marginBottom: 24,
          background: 'var(--green-soft)', border: '1px solid rgba(34,211,165,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.6px', marginBottom: 8 }}>
          {cards.length === 0 ? 'Nada para revisar' : 'Sessão concluída!'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, textAlign: 'center', maxWidth: 340 }}>
          {cards.length === 0
            ? deckName
              ? `Nenhum card vencido em "${deckName}". Tente outro deck!`
              : 'Todos os cards estão em dia. Volte amanhã!'
            : `Você revisou ${cards.length} card${cards.length !== 1 ? 's' : ''}${deckName ? ` de "${deckName}"` : ''}. Bom trabalho!`}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setSessionDone(false); setCards([]); setCurrent(0) }}
            style={{
              padding: '10px 20px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Trocar deck
          </button>
          <button
            onClick={() => navigate('/decks')}
            style={{
              padding: '10px 24px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: '#fff',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver decks
          </button>
        </div>
      </div>
    </div>
  )

  const card = cards[current]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 88, paddingBottom: 40, paddingLeft: 24, paddingRight: 24,
        minHeight: '100vh',
      }}>

        {/* Seletor de deck */}
        <DeckSelector decks={decks} selected={selectedDeck} onSelect={setSelectedDeck} />

        {/* Loading */}
        {loading ? (
          <div style={{ marginTop: 80 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid var(--border2)', borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <>
            {/* Barra de progresso */}
            <div style={{ width: '100%', maxWidth: 600, marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {current + 1} de {cards.length}
                  {deckName && <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>· {deckName}</span>}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--accent)', borderRadius: 99,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* Card */}
            <div
              onClick={!showBack ? handleReveal : undefined}
              style={{
                width: '100%', maxWidth: 600, minHeight: 280,
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 20, padding: '40px 48px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', marginBottom: 28,
                position: 'relative', overflow: 'hidden',
                cursor: !showBack ? 'pointer' : 'default',
                opacity: flipping ? 0 : 1,
                transform: flipping ? 'scale(0.97)' : 'scale(1)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: showBack
                  ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
                  : 'linear-gradient(90deg, transparent, var(--border2), transparent)',
                transition: 'background 0.3s',
              }} />

              {card?.subject && (
                <div style={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: 10, padding: '2px 8px',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  borderRadius: 99, color: 'var(--accent)',
                }}>
                  {card.subject}
                </div>
              )}

              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 20,
              }}>
                {showBack ? 'Resposta' : 'Pergunta'}
              </div>

              {!showBack && card?.frontImageUrl && (
                <img src={card.frontImageUrl} alt=""
                  style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 16 }}
                />
              )}
              {showBack && card?.backImageUrl && (
                <img src={card.backImageUrl} alt=""
                  style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 16 }}
                />
              )}
              <p style={{
                fontSize: 20, fontWeight: 400, lineHeight: 1.6,
                color: showBack ? 'var(--accent)' : 'var(--text)',
                letterSpacing: '-0.2px', transition: 'color 0.2s',
                margin: 0,
              }}>
                {showBack ? card?.back : card?.front}
              </p>

              {!showBack && (
                <div style={{ position: 'absolute', bottom: 14, right: 18, fontSize: 11, color: 'var(--text-faint)', opacity: 0.5 }}>
                  <kbd style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '1px 5px',
                    fontFamily: 'monospace', fontSize: 10,
                  }}>Space</kbd>
                </div>
              )}
            </div>

            {/* Botões de qualidade */}
            {!showBack ? (
              <button
                onClick={handleReveal}
                style={{
                  padding: '13px 40px',
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: 12, color: 'var(--text)',
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = 'var(--accent-border)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
              >
                Mostrar resposta
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 600, animation: 'fadeUp 0.25s ease' }}>
                {QUALITY_BTNS.map(({ label, sublabel, value, color, soft, border, key }) => (
                  <button
                    key={value}
                    onClick={() => handleQuality(value)}
                    disabled={submitting}
                    style={{
                      flex: 1, padding: '12px 8px',
                      background: soft, border: `1px solid ${border}`,
                      borderRadius: 12, color,
                      fontFamily: 'var(--font-body)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s', opacity: submitting ? 0.6 : 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}
                    onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>{sublabel}</span>
                    <span style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>tecla {key}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
