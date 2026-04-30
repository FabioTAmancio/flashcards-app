import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService, reviewService } from '../services/deck.service'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type Flashcard = {
  id: number; front: string; back: string; subject?: string
  frontImageUrl?: string; backImageUrl?: string; cardType?: string
}
type Deck = { id: number; name: string; reviewEnabled: boolean }

const QUALITY_BTNS = [
  { label: 'Errei',   sublabel: 'Rever agora',     value: 0, color: 'var(--red)',    bg: 'rgba(255,77,109,0.08)',   border: 'rgba(255,77,109,0.25)',  key: '1' },
  { label: 'Difícil', sublabel: 'Em breve',         value: 3, color: 'var(--orange)', bg: 'rgba(255,140,66,0.08)',   border: 'rgba(255,140,66,0.25)',  key: '2' },
  { label: 'Bom',     sublabel: 'Em alguns dias',   value: 4, color: 'var(--blue)',   bg: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.25)',  key: '3' },
  { label: 'Fácil',   sublabel: 'Em 1+ semana',     value: 5, color: 'var(--green)',  bg: 'rgba(34,211,165,0.08)',   border: 'rgba(34,211,165,0.25)', key: '4' },
]

// ── Diff estilo Anki ───────────────────────────────────────────────────────────
// Compara entrada do usuário com resposta esperada caractere a caractere
// Ignora maiúsculas, acentos e espaços extras

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ')
    .trim()
}

type DiffToken = { char: string; type: 'correct' | 'wrong' | 'missing' }

function computeDiff(input: string, expected: string): DiffToken[] {
  const a = normalize(input)
  const b = normalize(expected)

  // DP para LCS
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])

  // Backtrack
  let i = m, j = n
  const tokens: DiffToken[] = []
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      tokens.unshift({ char: b[j-1], type: 'correct' })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      tokens.unshift({ char: b[j-1], type: 'missing' })
      j--
    } else {
      tokens.unshift({ char: a[i-1], type: 'wrong' })
      i--
    }
  }
  return tokens
}

function DiffDisplay({ input, expected }: { input: string; expected: string }) {
  const isCorrect = normalize(input) === normalize(expected)
  const tokens = computeDiff(input, expected)

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Resposta do usuário com diff */}
      <div style={{
        fontFamily: 'monospace', fontSize: 18, lineHeight: 1.8,
        padding: '12px 16px',
        background: isCorrect ? 'rgba(34,211,165,0.08)' : 'rgba(255,77,109,0.08)',
        border: `1px solid ${isCorrect ? 'rgba(34,211,165,0.25)' : 'rgba(255,77,109,0.25)'}`,
        borderRadius: 10, marginBottom: 12,
        display: 'inline-block', minWidth: 200,
      }}>
        {isCorrect ? (
          <span style={{ color: 'var(--green)' }}>{expected}</span>
        ) : (
          tokens.map((t, i) => (
            <span key={i} style={{
              color: t.type === 'correct' ? 'var(--text)' : t.type === 'wrong' ? 'var(--red)' : 'var(--green)',
              textDecoration: t.type === 'missing' ? 'underline' : t.type === 'wrong' ? 'line-through' : 'none',
              opacity: t.type === 'missing' ? 0.7 : 1,
            }}>
              {t.char}
            </span>
          ))
        )}
      </div>

      {!isCorrect && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Resposta correta</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 18,
            color: 'var(--green)', padding: '10px 16px',
            background: 'rgba(34,211,165,0.06)',
            border: '1px solid rgba(34,211,165,0.2)',
            borderRadius: 10, display: 'inline-block',
          }}>
            {expected}
          </div>
        </>
      )}
    </div>
  )
}

// ── Seletor de deck ────────────────────────────────────────────────────────────

function DeckSelector({ decks, selected, onSelect }: {
  decks: Deck[]; selected: number | null; onSelect: (id: number | null) => void
}) {
  const enabled = decks.filter(d => d.reviewEnabled)
  return (
    <div style={{ width: '100%', maxWidth: 600, marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
        Revisar deck
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => onSelect(null)} style={{
          padding: '7px 14px', borderRadius: 99,
          border: `1px solid ${selected === null ? 'var(--accent-border)' : 'var(--border)'}`,
          background: selected === null ? 'var(--accent-bg)' : 'transparent',
          color: selected === null ? 'var(--accent)' : 'var(--text-muted)',
          fontFamily: 'inherit', fontSize: 13, fontWeight: selected === null ? 600 : 400,
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          Todos os decks
        </button>
        {enabled.map(d => (
          <button key={d.id} onClick={() => onSelect(d.id)} style={{
            padding: '7px 14px', borderRadius: 99,
            border: `1px solid ${selected === d.id ? 'var(--accent-border)' : 'var(--border)'}`,
            background: selected === d.id ? 'var(--accent-bg)' : 'transparent',
            color: selected === d.id ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: 13, fontWeight: selected === d.id ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flipping, setFlipping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  // QA mode state
  const [userAnswer, setUserAnswer] = useState('')
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [suggestedQuality, setSuggestedQuality] = useState<number | null>(null)

  useEffect(() => {
    deckService.getAll().then(setDecks).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    setCards([])
    setCurrent(0)
    setShowBack(false)
    setSessionDone(false)
    setUserAnswer('')
    setAnswerSubmitted(false)
    reviewService.getDueFlashcards(selectedDeck ?? undefined)
      .then(setCards)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedDeck])

  const card = cards[current]
  const isQA = card?.cardType === 'QA'

  // Foca o input automaticamente no modo QA
  useEffect(() => {
    if (isQA && !answerSubmitted && inputRef.current) {
      inputRef.current.focus()
    }
  }, [current, isQA, answerSubmitted])

  // Calcula qualidade sugerida com base no diff
  function calcSuggestedQuality(input: string, expected: string): number {
    const a = normalize(input)
    const b = normalize(expected)
    if (a === b) return 5
    // Similaridade por Levenshtein simplificado
    const longer = Math.max(a.length, b.length)
    if (longer === 0) return 5
    const matches = computeDiff(input, expected).filter(t => t.type === 'correct').length
    const ratio = matches / longer
    if (ratio >= 0.9) return 4
    if (ratio >= 0.7) return 3
    if (ratio >= 0.4) return 1
    return 0
  }

  function handleSubmitAnswer() {
    if (!userAnswer.trim() || answerSubmitted) return
    const quality = calcSuggestedQuality(userAnswer, card.back)
    setSuggestedQuality(quality)
    setAnswerSubmitted(true)
    setShowBack(true)
  }

  const handleReveal = useCallback(() => {
    if (showBack || flipping) return
    setFlipping(true)
    setTimeout(() => { setShowBack(true); setFlipping(false) }, 200)
  }, [showBack, flipping])

  const handleQuality = useCallback(async (q: number) => {
    if (submitting || !showBack) return
    setSubmitting(true)
    await reviewService.review(card.id, q)
    if (current + 1 >= cards.length) {
      setSessionDone(true)
    } else {
      setFlipping(true)
      setTimeout(() => {
        setCurrent(p => p + 1)
        setShowBack(false)
        setUserAnswer('')
        setAnswerSubmitted(false)
        setSuggestedQuality(null)
        setFlipping(false)
      }, 200)
    }
    setSubmitting(false)
  }, [submitting, showBack, card, cards, current])

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // QA mode: Enter para submeter resposta
      if (isQA && !answerSubmitted && e.code === 'Enter') {
        handleSubmitAnswer()
        return
      }
      // BASIC mode: Space para revelar
      if (!isQA && e.code === 'Space' && !showBack) {
        e.preventDefault()
        handleReveal()
      }
      // Qualidade com teclas numéricas (após revelar)
      if (showBack) {
        if (e.key === '1') handleQuality(0)
        if (e.key === '2') handleQuality(3)
        if (e.key === '3') handleQuality(4)
        if (e.key === '4') handleQuality(5)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isQA, answerSubmitted, showBack, handleReveal, handleQuality])

  const progress = cards.length > 0 ? (current / cards.length) * 100 : 0
  const deckName = selectedDeck ? decks.find(d => d.id === selectedDeck)?.name : null

  // ── Sessão concluída ───────────────────────────────────────────────────────

  if (sessionDone || (!loading && cards.length === 0)) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', marginBottom: 24,
          background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>✓</div>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
          {cards.length === 0 ? 'Nada para revisar' : 'Sessão concluída!'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, textAlign: 'center', maxWidth: 340 }}>
          {cards.length === 0
            ? deckName ? `Nenhum card vencido em "${deckName}".` : 'Todos os cards estão em dia. Volte amanhã!'
            : `Você revisou ${cards.length} card${cards.length !== 1 ? 's' : ''}. Bom trabalho!`}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setSessionDone(false); setCards([]); setCurrent(0) }} style={{
            padding: '10px 20px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
          }}>Trocar deck</button>
          <button onClick={() => navigate('/decks')} style={{
            padding: '10px 24px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Ver decks</button>
        </div>
      </div>
    </div>
  )

  // ── Tela principal ─────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 88, paddingBottom: 40, paddingLeft: 24, paddingRight: 24, minHeight: '100vh',
      }}>

        <DeckSelector decks={decks} selected={selectedDeck} onSelect={setSelectedDeck} />

        {loading ? (
          <div style={{ marginTop: 80 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : (
          <>
            {/* Barra de progresso */}
            <div style={{ width: '100%', maxWidth: 600, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {current + 1} de {cards.length}
                    {deckName && <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>· {deckName}</span>}
                  </span>
                  {/* Badge do tipo */}
                  <span style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 99, fontWeight: 600,
                    background: isQA ? 'rgba(96,165,250,0.1)' : 'rgba(170,59,255,0.1)',
                    border: `1px solid ${isQA ? 'rgba(96,165,250,0.25)' : 'rgba(170,59,255,0.25)'}`,
                    color: isQA ? 'var(--blue)' : 'var(--accent)',
                  }}>
                    {isQA ? 'Pergunta/Resposta' : 'Conceito/Definição'}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--accent)', borderRadius: 99, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>

            {/* Card */}
            <div style={{
              width: '100%', maxWidth: 600, minHeight: isQA ? 'auto' : 280,
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 20, padding: '36px 44px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', marginBottom: 20, position: 'relative', overflow: 'hidden',
              opacity: flipping ? 0 : 1, transform: flipping ? 'scale(0.97)' : 'scale(1)',
              transition: 'opacity 0.2s, transform 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: showBack
                  ? 'linear-gradient(90deg, transparent, var(--accent), transparent)'
                  : 'linear-gradient(90deg, transparent, var(--border2), transparent)',
                transition: 'background 0.3s',
              }} />

              {card?.subject && (
                <div style={{
                  position: 'absolute', top: 14, right: 18,
                  fontSize: 10, padding: '2px 8px', borderRadius: 99,
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}>
                  {card.subject}
                </div>
              )}

              {/* ── MODO BÁSICO ── */}
              {!isQA && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 20 }}>
                    {showBack ? 'Definição' : 'Conceito'}
                  </div>
                  {!showBack && card?.frontImageUrl && (
                    <img src={card.frontImageUrl} alt="" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 16 }} />
                  )}
                  {showBack && card?.backImageUrl && (
                    <img src={card.backImageUrl} alt="" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 16 }} />
                  )}
                  <p style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.6, color: showBack ? 'var(--accent)' : 'var(--text)', margin: 0 }}>
                    {showBack ? card?.back : card?.front}
                  </p>
                  {!showBack && (
                    <div style={{ position: 'absolute', bottom: 14, right: 18, fontSize: 11, color: 'var(--text-faint)', opacity: 0.5 }}>
                      <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 }}>Space</kbd>
                    </div>
                  )}
                </>
              )}

              {/* ── MODO QA ── */}
              {isQA && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 16, opacity: 0.7 }}>
                    Pergunta
                  </div>
                  {card?.frontImageUrl && (
                    <img src={card.frontImageUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 16 }} />
                  )}
                  <p style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.6, color: 'var(--text)', margin: '0 0 24px' }}>
                    {card?.front}
                  </p>

                  {!answerSubmitted ? (
                    /* Campo de resposta */
                    <div style={{ width: '100%', maxWidth: 400 }}>
                      <input
                        ref={inputRef}
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Digite sua resposta..."
                        style={{
                          width: '100%', padding: '11px 14px',
                          background: 'var(--surface2)', border: '1px solid var(--border2)',
                          borderRadius: 10, color: 'var(--text)',
                          fontFamily: 'inherit', fontSize: 16, outline: 'none',
                          textAlign: 'center', boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => (e.target.style.borderColor = 'var(--blue)')}
                        onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
                      />
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8, opacity: 0.5 }}>
                        pressione <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', fontSize: 10 }}>Enter</kbd> para verificar
                      </div>
                    </div>
                  ) : (
                    /* Resultado com diff */
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 12 }}>
                        Sua resposta
                      </div>
                      <DiffDisplay input={userAnswer} expected={card.back} />
                      {card?.backImageUrl && (
                        <img src={card.backImageUrl} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginTop: 16 }} />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Botões de ação ── */}
            {!showBack ? (
              /* BÁSICO: botão revelar / QA: botão verificar */
              <button
                onClick={isQA ? handleSubmitAnswer : handleReveal}
                disabled={isQA && !userAnswer.trim()}
                style={{
                  padding: '13px 40px',
                  background: isQA ? 'var(--blue)' : 'var(--surface)',
                  border: isQA ? 'none' : '1px solid var(--border2)',
                  borderRadius: 12,
                  color: isQA ? '#fff' : 'var(--text)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: isQA ? 600 : 500,
                  cursor: isQA && !userAnswer.trim() ? 'not-allowed' : 'pointer',
                  opacity: isQA && !userAnswer.trim() ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {isQA ? 'Verificar resposta' : 'Mostrar resposta'}
              </button>
            ) : (
              /* Botões de qualidade — com sugestão destacada no modo QA */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 600 }}>
                {isQA && suggestedQuality !== null && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                    Sugestão baseada na sua resposta — você pode ajustar
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  {QUALITY_BTNS.map(({ label, sublabel, value, color, bg, border, key }) => {
                    const isSuggested = isQA && suggestedQuality === value
                    return (
                      <button
                        key={value}
                        onClick={() => handleQuality(value)}
                        disabled={submitting}
                        style={{
                          flex: 1, padding: '12px 8px',
                          background: isSuggested ? bg : 'transparent',
                          border: `${isSuggested ? '2px' : '1px'} solid ${isSuggested ? color : border}`,
                          borderRadius: 12, color,
                          fontFamily: 'inherit',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s', opacity: submitting ? 0.6 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          transform: isSuggested ? 'scale(1.03)' : 'none',
                        }}
                        onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = bg }}
                        onMouseLeave={e => { if (!isSuggested) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 10, opacity: 0.7 }}>{sublabel}</span>
                        <span style={{ fontSize: 9, opacity: 0.4, marginTop: 2 }}>
                          {isSuggested ? '★ sugerido' : `tecla ${key}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
