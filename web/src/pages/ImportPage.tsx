import { useEffect, useRef, useState} from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService, flashcardService } from '../services/deck.service'

// Types
type Deck = { id: number; name: string; description: string }
type ParsedCard = { front: string; back: string; subject: string; _error?: string }
type ImportResult = { imported: number; skipped: number }

// Parser CSV
// Support ; or , as separator, and double quotes around values

function parseCsv(raw: string, fallbackSubject: string): ParsedCard[] {
    return raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map((line, i) => {
            const sep = line.includes(';') ? ';' : ','
            const parts = line
                .split(sep)
                .map(p => p.trim().replace(/^"|"$/g, '').trim())
            
            if(parts.length < 2 || !parts[0] || !parts[1]) {
                return {
                    front: '', back: '', subject: '',
                    _error: `Line ${i + 1}: must have at least "front;back"`
                }
            }
            return {
                front: parts[0],
                back: parts[1],
                subject: parts[2]?.trim() || fallbackSubject,
            }
        })
}

// Sytles
const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6,
}

const fieldInput: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'var(--code-bg, #1a1a24)',
  border: '1px solid var(--border)',
  borderRadius: 9, color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}

const panel: React.CSSProperties = {
  background: 'var(--code-bg, #1a1a24)',
  border: '1px solid var(--border)', borderRadius: 14, padding: 24,
}

// Component
export default function ImportPage() {
    const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState<number | ''>('')
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState<ParsedCard[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    deckService.getAll().then(setDecks).catch(console.error)
  }, [])

  const selectedDeck = decks.find(d => d.id === Number(deckId))

  // Preview in real time
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRawText((ev.target?.result as string) || '')
    reader.readAsText(file, 'utf-8')
    e.target.value = '' // allow reload same file
  }

  const validCards = preview.filter(c => !c._error)
  const errorCount = preview.filter(c => !!c._error).length

  async function handleImport() {
    if (!deckId || validCards.length === 0) return
    setImporting(true)
    try {
      let imported = 0
      let skipped = 0
      for (const c of validCards) {
        try {
          await flashcardService.create(Number(deckId), c.front, c.back, c.subject)
          imported++
        } catch {
          skipped++
        }
      }
      setResult({ imported, skipped })
    } catch {
      setParseError('Error importing. Check your connection and try again.')
    } finally {
      setImporting(false)
    }
  }

  // ─── Tela de resultado ─────────────────────────────────────────────────────

  if (result) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 0,
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
        <p style={{ color: 'var(--text-muted)', margin: '0 0 28px', fontSize: 14 }}>
          {result.imported} card{result.imported !== 1 ? 's' : ''} adicionado{result.imported !== 1 ? 's' : ''}
          {result.skipped > 0 ? `, ${result.skipped} with error` : ''}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate(`/decks/${deckId}`)}
            style={{
              padding: '10px 24px', background: 'var(--accent)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Ver deck
          </button>
          <button
            onClick={() => { setResult(null); setRawText(''); setPreview([]) }}
            style={{
              padding: '10px 24px',
              background: 'var(--code-bg, #1a1a24)',
              border: '1px solid var(--border)', borderRadius: 10,
              color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
            }}
          >
            Importar mais
          </button>
        </div>
      </div>
    </div>
  )

  // Main Display

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 660, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>

        {/* Header */}
        <button
          onClick={() => navigate('/decks')}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← Decks
        </button>
        <h1 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          Importar Flashcards
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' }}>
          Cole ou carregue um arquivo CSV para criar vários cards de uma vez.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 1 — Deck */}
          <div style={panel}>
            <label style={fieldLabel}>Deck de destino</label>
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

          {/* 2 — CSV */}
          <div style={panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>Conteúdo CSV</label>
              <>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px',
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text-muted)',
                    fontFamily: 'inherit', fontSize: 12, cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  📂 Carregar arquivo
                </button>
              </>
            </div>

            {/* Format example */}
            <div style={{
              padding: '9px 13px', marginBottom: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.9,
              color: 'var(--text-muted)',
            }}>
              <span style={{ color: 'var(--accent)', display: 'block', marginBottom: 2 }}>
                frente ; verso ; matéria&nbsp;&nbsp;← cabeçalho opcional
              </span>
              Qual é a capital do Brasil? ; Brasília ; Geografia<br />
              What is React? ; A JS library for UIs ; Programação<br />
              H₂O é a fórmula de que? ; Água
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>&nbsp;&nbsp;← matéria opcional</span>
            </div>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={'Cole o CSV aqui ou clique em "Carregar arquivo"'}
              rows={8}
              style={{ ...fieldInput, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />

            {parseError && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8, fontSize: 12, color: '#f87171',
              }}>
                {parseError}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ ...fieldLabel, marginBottom: 0 }}>
                  Preview — {preview.length} {preview.length === 1 ? 'linha' : 'linhas'}
                </span>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 600 }}>
                  {validCards.length > 0 && <span style={{ color: '#4ade80' }}>✓ {validCards.length} válidos</span>}
                  {errorCount > 0 && <span style={{ color: '#f87171' }}>✕ {errorCount} com erro</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 280, overflowY: 'auto' }}>
                {preview.map((c, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: c._error ? '1fr' : '1fr 1fr auto',
                    gap: 10, alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8, fontSize: 12,
                    background: c._error ? 'rgba(239,68,68,0.07)' : 'var(--bg)',
                    border: `1px solid ${c._error ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
                  }}>
                    {c._error ? (
                      <span style={{ color: '#f87171' }}>{c._error}</span>
                    ) : (
                      <>
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.front}
                        </span>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.back}
                        </span>
                        <span style={{
                          padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                          background: 'var(--accent-bg, rgba(170,59,255,0.1))',
                          border: '1px solid var(--accent-border)',
                          color: 'var(--accent)', fontSize: 10,
                        }}>
                          {c.subject}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Button */}
          <button
            onClick={handleImport}
            disabled={importing || !deckId || validCards.length === 0}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              border: '1px solid var(--border)',
              background: importing || !deckId || validCards.length === 0
                ? 'var(--code-bg, #1a1a24)'
                : 'var(--accent)',
              color: importing || !deckId || validCards.length === 0
                ? 'var(--text-muted)'
                : '#fff',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: importing || !deckId || validCards.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {importing
              ? `Importando ${validCards.length} cards...`
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