import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { reviewService } from '../services/deck.service'

type Flashcard = { id: number; front: string; back: string }

const QUALITY_BTNS = [
  { label: 'Errei', sublabel: 'Rever agora', value: 0, color: 'var(--red)', soft: 'var(--red-soft)', border: 'rgba(255,77,109,0.3)' },
  { label: 'Difícil', sublabel: 'Em breve', value: 3, color: 'var(--orange)', soft: 'var(--orange-soft)', border: 'rgba(255,140,66,0.3)' },
  { label: 'Bom', sublabel: 'Em algumas horas', value: 4, color: 'var(--blue)', soft: 'var(--blue-soft)', border: 'rgba(96,165,250,0.3)' },
  { label: 'Fácil', sublabel: 'Em alguns dias', value: 5, color: 'var(--green)', soft: 'var(--green-soft)', border: 'rgba(34,211,165,0.3)' },
]

export default function ReviewPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  useEffect(() => {
    reviewService.getDueFlashcards()
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleReveal() {
    setFlipping(true)
    setTimeout(() => {
      setShowBack(true)
      setFlipping(false)
    }, 200)
  }

  async function handleQuality(q: number) {
    if (submitting) return
    setSubmitting(true)
    const card = cards[current]
    await reviewService.review(card.id, q)

    if (current + 1 >= cards.length) {
      setSessionDone(true)
    } else {
      setFlipping(true)
      setTimeout(() => {
        setCurrent(prev => prev + 1)
        setShowBack(false)
        setFlipping(false)
      }, 200)
    }
    setSubmitting(false)
  }

  const progress = cards.length > 0 ? ((current) / cards.length) * 100 : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2px solid var(--border2)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (cards.length === 0 || sessionDone) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', paddingTop: 60,
        animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{
          width: 80, height: 80,
          background: 'var(--green-soft)',
          border: '1px solid rgba(34,211,165,0.3)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 24,
        }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 8 }}>
          {cards.length === 0 ? 'Nada para revisar' : 'Sessão concluída!'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
          {cards.length === 0
            ? 'Todos os seus cards estão em dia. Volte amanhã!'
            : `Você revisou ${cards.length} card${cards.length !== 1 ? 's' : ''} hoje. Bom trabalho!`}
        </p>
        <a href="/decks" style={{
          padding: '11px 28px',
          background: 'var(--accent)', border: 'none',
          borderRadius: 10, color: '#fff',
          fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
          textDecoration: 'none', display: 'inline-block',
        }}>Ver meus decks</a>
      </div>
    </div>
  )

  const card = cards[current]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 92, paddingBottom: 40, paddingLeft: 24, paddingRight: 24,
        minHeight: '100vh',
      }}>
        {/* Progress */}
        <div style={{ width: '100%', maxWidth: 600, marginBottom: 32, animation: 'fadeDown 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {current + 1} de {cards.length}
            </span>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            height: 3, background: 'var(--surface2)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'var(--accent)',
              borderRadius: 99, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 600,
          minHeight: 280,
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 20,
          padding: '40px 48px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
          opacity: flipping ? 0 : 1,
          transform: flipping ? 'scale(0.97)' : 'scale(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          {/* Decorative gradient */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: showBack
              ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
              : 'linear-gradient(90deg, transparent, var(--border2), transparent)',
            transition: 'background 0.3s',
          }} />

          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--text-faint)',
            marginBottom: 20,
          }}>
            {showBack ? 'Resposta' : 'Pergunta'}
          </div>

          <p style={{
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.6,
            color: showBack ? 'var(--accent)' : 'var(--text)',
            letterSpacing: '-0.2px',
            transition: 'color 0.2s',
          }}>
            {showBack ? card.back : card.front}
          </p>
        </div>

        {/* Action buttons */}
        {!showBack ? (
          <button
            onClick={handleReveal}
            style={{
              padding: '13px 40px',
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              borderRadius: 12, color: 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
              animation: 'fadeUp 0.3s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = 'var(--surface2)'
              ;(e.target as HTMLElement).style.borderColor = 'var(--accent-border)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = 'var(--surface)'
              ;(e.target as HTMLElement).style.borderColor = 'var(--border2)'
            }}
          >
            Mostrar resposta
          </button>
        ) : (
          <div style={{
            display: 'flex', gap: 10, width: '100%', maxWidth: 600,
            animation: 'fadeUp 0.25s ease',
          }}>
            {QUALITY_BTNS.map(({ label, sublabel, value, color, soft, border }) => (
              <button
                key={value}
                onClick={() => handleQuality(value)}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: soft,
                  border: `1px solid ${border}`,
                  borderRadius: 12, color,
                  fontFamily: 'var(--font-body)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: submitting ? 0.6 : 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
                onMouseEnter={e => !submitting && ((e.currentTarget).style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget).style.transform = 'none'}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 10, opacity: 0.7, color }}>{sublabel}</span>
              </button>
            ))}
          </div>
        )}

        {/* Keyboard hint */}
        {!showBack && (
          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-faint)' }}>
            Pressione <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>Space</kbd> para revelar
          </p>
        )}
      </div>
    </div>
  )
}