import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { statsService } from '../services/deck.service'

// Types

type DailyReview = { date: string; reviewed: number }
type DeckStat = {
  deckId: number; deckName: string; totalCards: number
  cardsNew: number; cardsLearning: number; cardsReview: number; cardsDue: number
}
type Stats = {
  totalDecks: number; totalCards: number
  cardsDueToday: number; cardsReviewedToday: number
  cardsNew: number; cardsLearning: number; cardsReview: number
  currentStreak: number; longestStreak: number
  deckStats: DeckStat[]; dailyHistory: DailyReview[]
}

// Helpers 

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// Subcomponents 

function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div style={{
      background: 'var(--code-bg)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </span>
      <span style={{ fontSize: 36, fontWeight: 800, color: color || 'var(--text-h)', lineHeight: 1, letterSpacing: '-1px' }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text)', opacity: 0.5 }}>{sub}</span>}
    </div>
  )
}

function BarChart({ data }: { data: DailyReview[] }) {
  const max = Math.max(...data.map(d => d.reviewed), 1)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 4,
        height: 100, padding: '0 4px',
      }}>
        {data.map(d => {
          const pct = d.reviewed / max
          const isToday = d.date === today
          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div
                title={`${d.reviewed} revisões em ${fmtDate(d.date)}`}
                style={{
                  width: '100%',
                  height: d.reviewed === 0 ? 3 : `${Math.max(pct * 100, 6)}%`,
                  background: isToday
                    ? 'var(--accent)'
                    : d.reviewed > 0
                      ? 'var(--accent-bg)'
                      : 'var(--border)',
                  border: isToday ? '1px solid var(--accent-border)' : '1px solid transparent',
                  borderRadius: 4,
                  transition: 'height 0.4s ease',
                  cursor: 'default',
                }}
              />
            </div>
          )
        })}
      </div>
      {/* Data Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4, paddingRight: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text)', opacity: 0.4 }}>{fmtDate(data[0]?.date || '')}</span>
        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>hoje</span>
      </div>
    </div>
  )
}

function StatusBar({ cardsNew, cardsLearning, cardsReview }: {
  cardsNew: number; cardsLearning: number; cardsReview: number
}) {
  const total = cardsNew + cardsLearning + cardsReview || 1
  const pNew      = (cardsNew / total) * 100
  const pLearning = (cardsLearning / total) * 100
  const pReview   = (cardsReview / total) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[
        { label: 'Novos',     count: cardsNew,      pct: pNew,      color: '#60a5fa' },
        { label: 'Aprendendo',count: cardsLearning, pct: pLearning, color: '#fb923c' },
        { label: 'Revisão',   count: cardsReview,   pct: pReview,   color: '#4ade80' },
      ].map(({ label, count, pct, color }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: color, borderRadius: 99,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DeckTable({ decks }: { decks: DeckStat[] }) {
  const navigate = useNavigate()
  if (decks.length === 0) return (
    <p style={{ color: 'var(--text)', opacity: 0.4, fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
      Nenhum deck encontrado.
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 70px',
        gap: 12, padding: '0 12px',
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--text)', opacity: 0.4,
      }}>
        <span>Deck</span>
        <span style={{ textAlign: 'center' }}>Novos</span>
        <span style={{ textAlign: 'center' }}>Apren.</span>
        <span style={{ textAlign: 'center' }}>Revis.</span>
        <span style={{ textAlign: 'center' }}>Vencidos</span>
      </div>

      {decks.map(d => (
        <div
          key={d.deckId}
          onClick={() => navigate(`/decks/${d.deckId}`)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 70px',
            gap: 12, alignItems: 'center',
            padding: '10px 12px',
            background: 'var(--code-bg)',
            border: '1px solid var(--border)',
            borderRadius: 10, cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)' }}>{d.deckName}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', opacity: 0.4 }}>{d.totalCards} cards</div>
          </div>
          <span style={{ textAlign: 'center', fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>{d.cardsNew}</span>
          <span style={{ textAlign: 'center', fontSize: 13, color: '#fb923c', fontWeight: 600 }}>{d.cardsLearning}</span>
          <span style={{ textAlign: 'center', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{d.cardsReview}</span>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {d.cardsDue > 0 ? (
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: '2px 10px', borderRadius: 99,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}>{d.cardsDue}</span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text)', opacity: 0.3 }}>—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Page
export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    statsService.get()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const panel = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{
      background: 'var(--code-bg)',
      border: '1px solid var(--border)',
      borderRadius: 14, padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )

  const sectionTitle = (title: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text)', opacity: 0.5, marginBottom: 16 }}>
      {title}
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )

  if (!stats) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text)', opacity: 0.5 }}>Não foi possível carregar as estatísticas.</p>
      </div>
    </div>
  )

  const totalStatusCards = stats.cardsNew + stats.cardsLearning + stats.cardsReview

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 24, paddingRight: 24, textAlign: 'left' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <button
            onClick={() => navigate('/decks')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text)', opacity: 0.5, fontSize: 13,
              fontFamily: 'inherit', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Decks
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.6px', margin: 0, color: 'var(--text-h)' }}>
            Estatísticas
          </h1>
          <p style={{ color: 'var(--text)', opacity: 0.5, fontSize: 14, marginTop: 4 }}>
            Acompanhe seu progresso de estudo.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Total de cards"   value={stats.totalCards}          sub={`em ${stats.totalDecks} deck${stats.totalDecks !== 1 ? 's' : ''}`} />
          <StatCard label="Vencidos hoje"    value={stats.cardsDueToday}       sub="para revisar agora"   color={stats.cardsDueToday > 0 ? '#f87171' : undefined} />
          <StatCard label="Revisados hoje"   value={stats.cardsReviewedToday}  sub="nesta sessão"         color={stats.cardsReviewedToday > 0 ? '#4ade80' : undefined} />
          <StatCard label="Sequência atual"  value={`${stats.currentStreak}d`} sub={`recorde: ${stats.longestStreak}d`} color={stats.currentStreak > 0 ? 'var(--accent)' : undefined} />
        </div>

        {/* Graph + Status side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {panel(
            <>
              {sectionTitle('Revisões — últimos 14 dias')}
              <BarChart data={stats.dailyHistory} />
            </>
          )}
          {panel(
            <>
              {sectionTitle(`Distribuição — ${totalStatusCards} cards`)}
              <StatusBar
                cardsNew={stats.cardsNew}
                cardsLearning={stats.cardsLearning}
                cardsReview={stats.cardsReview}
              />
              {/* Mini legenda */}
              <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
                {[
                  { label: 'Novos', color: '#60a5fa', pct: totalStatusCards ? Math.round((stats.cardsNew / totalStatusCards) * 100) : 0 },
                  { label: 'Aprendendo', color: '#fb923c', pct: totalStatusCards ? Math.round((stats.cardsLearning / totalStatusCards) * 100) : 0 },
                  { label: 'Revisão', color: '#4ade80', pct: totalStatusCards ? Math.round((stats.cardsReview / totalStatusCards) * 100) : 0 },
                ].map(({ label, color, pct }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 11, color: 'var(--text)', opacity: 0.6 }}>{label} {pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Deck Table */}
        {panel(
          <>
            {sectionTitle('Por deck')}
            <DeckTable decks={stats.deckStats} />
          </>
        )}

      </div>
    </div>
  )
}
