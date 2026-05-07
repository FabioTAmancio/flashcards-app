import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService } from '../services/deck.service'
import { importService } from '../services/import.service'
import { useAuthStore } from '../store/auth.store'

//Types 

type Deck = { id: number; name: string }
type ParsedCard = { front: string; back: string; subject: string; _error?: string }
type ImportResult = { imported: number; skipped: number; imagesUploaded?: number; errors?: string[] }

//CSV Parser 

function parseCsv(raw: string, fallbackSubject: string): ParsedCard[] {
  return raw
    .split('\n').map(l => l.trim()).filter(Boolean)
    .map((line, i) => {
      const sep = line.includes(';') ? ';' : ','
      const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, '').trim())
      if (parts.length < 2 || !parts[0] || !parts[1])
        return { front: '', back: '', subject: '', _error: `Linha ${i + 1}: precisa ter pelo menos frente e verso` }
      return { front: parts[0], back: parts[1], subject: parts[2]?.trim() || fallbackSubject }
    })
}

// Styles

const panel: React.CSSProperties = {
  background: 'var(--code-bg, #1a1a24)',
  border: '1px solid var(--border)',
  borderRadius: 14, padding: 24,
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
}

const fieldInput: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'var(--surface2, #1a1a24)',
  border: '1px solid var(--border)',
  borderRadius: 9, color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}

// Subcomponentes 
function AnkiBanner({ isPremium }: { isPremium: boolean }) {
  const navigate = useNavigate()
  return (
    <div style={{
      ...panel,
      background: isPremium
        ? 'linear-gradient(135deg, rgba(170,59,255,0.08), rgba(96,165,250,0.08))'
        : 'var(--code-bg, #1a1a24)',
      border: isPremium ? '1px solid var(--accent-border)' : '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>🃏</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>
            Importar do Anki com hierarquia
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
            flexShrink: 0,
          }}>
            PREMIUM
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          {isPremium
            ? 'Importa seus decks mantendo pastas, subdecks e imagens — exatamente como no Anki.'
            : 'Faça upgrade para importar decks completos com a hierarquia de pastas do Anki.'}
        </p>
      </div>
      <button
        onClick={() => navigate(isPremium ? '/import/anki' : '/profile')}
        style={{
          padding: '9px 18px', flexShrink: 0,
          background: isPremium ? 'var(--accent)' : 'var(--surface2, #1a1a24)',
          border: isPremium ? 'none' : '1px solid var(--border)',
          borderRadius: 10, color: isPremium ? '#fff' : 'var(--text-muted)',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {isPremium ? 'Usar →' : 'Ver planos →'}
      </button>
    </div>
  )
}

function CsvPreview({ preview }: { preview: ParsedCard[] }) {
  const valid  = preview.filter(c => !c._error)
  const errors = preview.filter(c => !!c._error)
  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ ...fieldLabel, marginBottom: 0 }}>
          Preview — {preview.length} {preview.length === 1 ? 'linha' : 'linhas'}
        </span>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 600 }}>
          {valid.length > 0  && <span style={{ color: '#4ade80' }}>✓ {valid.length} válidos</span>}
          {errors.length > 0 && <span style={{ color: '#f87171' }}>✕ {errors.length} com erro</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
        {preview.map((c, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: c._error ? '1fr' : '1fr 1fr auto',
            gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: c._error ? 'rgba(239,68,68,0.07)' : 'var(--bg)',
            border: `1px solid ${c._error ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
          }}>
            {c._error ? (
              <span style={{ color: '#f87171' }}>{c._error}</span>
            ) : (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{c.front}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{c.back}</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                  background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
                  color: 'var(--accent)', fontSize: 10,
                }}>{c.subject}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Page

export default function ImportPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const csvFileRef = useRef<HTMLInputElement>(null)

  const [decks, setDecks]           = useState<Deck[]>([])
  const [deckId, setDeckId]         = useState<number | ''>('')
  const [rawText, setRawText]       = useState('')
  const [preview, setPreview]       = useState<ParsedCard[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting]   = useState(false)
  const [result, setResult]         = useState<ImportResult | null>(null)

  const selectedDeck = decks.find(d => d.id === Number(deckId))
  const validCards   = preview.filter(c => !c._error)
  const isPremium    = user?.plan?.toUpperCase() === "PREMIUM"

  useEffect(() => {
    deckService.getAll().then(setDecks).catch(console.error)
  }, [])

  useEffect(() => {
    setParseError('')
    setPreview([])
    if (!rawText.trim()) return
    try {
      setPreview(parseCsv(rawText, selectedDeck?.name || 'Geral'))
    } catch {
      setParseError('Não foi possível interpretar o conteúdo.')
    }
  }, [rawText, selectedDeck])

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRawText((ev.target?.result as string) || '')
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  async function handleImport() {
    if (!deckId || validCards.length === 0) return
    setImporting(true)
    setParseError('')
    try {
      const res = await importService.csv(Number(deckId), validCards)
      setResult(res)
    } catch {
      setParseError('Erro ao importar. Verifique a conexão.')
    } finally {
      setImporting(false)
    }
  }

  if (result) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', marginBottom: 20,
          background: result.imported > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
          border: `1px solid ${result.imported > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>
          {result.imported > 0 ? '✓' : '⚠'}
        </div>

        <h2 style={{ fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>Importação concluída</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: 14 }}>
          {result.imported} card{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
          {result.skipped ? `, ${result.skipped} ignorados` : ''}
          {result.imagesUploaded ? ` · ${result.imagesUploaded} imagens` : ''}
        </p>

        {result.errors && result.errors.length > 0 && (
          <div style={{
            width: '100%', maxWidth: 480, marginBottom: 20,
            background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: 10, padding: '12px 16px', maxHeight: 160, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Avisos ({result.errors.length})
            </div>
            {result.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>• {e}</div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`/decks/${deckId}`)} style={{
            padding: '10px 24px', background: 'var(--accent)',
            border: 'none', borderRadius: 10, color: '#fff',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Ver deck</button>
          <button onClick={() => { setResult(null); setRawText(''); setPreview([]) }} style={{
            padding: '10px 24px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }}>Importar mais</button>
        </div>
      </div>
    </div>
  )

  // ── Principal ──────────────────────────────────────────────────────────────

  const canImport = !importing && !!deckId && validCards.length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      

      <div style={{ maxWidth: 660, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>

        <button onClick={() => navigate('/decks')} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4,
        }}>← Decks</button>

        <h1 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          Importar Flashcards
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' }}>
          Importe cards de um CSV ou use a importação completa do Anki.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Banner Anki Premium */}
          <AnkiBanner isPremium={isPremium} />

          {/* Deck de destino */}
          <div style={panel}>
            <label style={fieldLabel}>Deck de destino (CSV)</label>
            <select
              value={deckId}
              onChange={e => setDeckId(Number(e.target.value) || '')}
              style={{ ...fieldInput, cursor: 'pointer' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            >
              <option value="">Selecione um deck...</option>
              {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* CSV */}
          <div style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>Conteúdo CSV</label>
              <input ref={csvFileRef} type="file" accept=".csv,.txt" onChange={handleCsvFile} style={{ display: 'none' }} />
              <button
                onClick={() => csvFileRef.current?.click()}
                style={{
                  padding: '5px 11px', background: 'transparent',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                📂 Carregar arquivo
              </button>
            </div>

            <div style={{
              padding: '9px 13px', marginBottom: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.9,
              color: 'var(--text-muted)',
            }}>
              <span style={{ color: 'var(--accent)', display: 'block', marginBottom: 2 }}>
                frente ; verso ; matéria
              </span>
              Qual é a capital do Brasil? ; Brasília ; Geografia<br />
              What is React? ; A JS library for UIs ; Programação
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder='Cole o CSV aqui ou clique em "Carregar arquivo"'
              rows={7}
              style={{ ...fieldInput, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />

            {parseError && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, fontSize: 12, color: '#f87171',
              }}>{parseError}</div>
            )}
          </div>

          {/* Preview CSV */}
          {preview.length > 0 && <CsvPreview preview={preview} />}

          {/* Botão importar */}
          <button
            onClick={handleImport}
            disabled={!canImport}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              border: '1px solid var(--border)',
              background: canImport ? 'var(--accent)' : 'var(--code-bg, #1a1a24)',
              color: canImport ? '#fff' : 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: canImport ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {importing
              ? 'Importando...'
              : !deckId
                ? 'Selecione um deck primeiro'
                : validCards.length === 0
                  ? 'Cole ou carregue um CSV acima'
                  : `Importar ${validCards.length} card${validCards.length !== 1 ? 's' : ''} → "${selectedDeck?.name}"`}
          </button>

        </div>
      </div>
    </div>
  )
}