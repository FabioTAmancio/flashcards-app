import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService } from '../services/deck.service'
import { importService } from '../services/import.service'


// Types

type Deck = { id: number; name: string }
type ImportMode = 'csv' | 'apkg'
type ParsedCard = { front: string; back: string; subject: string; _error?: string }
type ImportResult = { imported: number; skipped: number; imagesUploaded?: number; errors?: string[] }

// Parser CSV
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

// ── Estilos ───────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const navigate = useNavigate()
  const csvFileRef  = useRef<HTMLInputElement>(null)
  const apkgFileRef = useRef<HTMLInputElement>(null)

  const [decks, setDecks] = useState<Deck[]>([])
  const [deckId, setDeckId] = useState<number | ''>('')
  const [mode, setMode] = useState<ImportMode>('csv')

  // CSV state
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState<ParsedCard[]>([])
  const [parseError, setParseError] = useState('')

  // APKG state
  const [apkgFile, setApkgFile] = useState<File | null>(null)

  // Shared
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    deckService.getAll().then(setDecks).catch(console.error)
  }, [])

  const selectedDeck = decks.find(d => d.id === Number(deckId))

  // Preview CSV em tempo real
  useEffect(() => {
    setParseError('')
    setPreview([])
    if (!rawText.trim() || mode !== 'csv') return
    try {
      setPreview(parseCsv(rawText, selectedDeck?.name || 'Geral'))
    } catch {
      setParseError('Não foi possível interpretar o conteúdo.')
    }
  }, [rawText, mode, selectedDeck])

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRawText((ev.target?.result as string) || '')
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function handleApkgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setApkgFile(file)
    e.target.value = ''
  }

  // ── Importar CSV ──────────────────────────────────────────────────────────

  async function handleImportCsv() {
    if (!deckId || validCards.length === 0) return
    setImporting(true)
    setImportProgress('Criando cards...')
    try {
      const result = await importService.csv(Number(deckId), validCards)
      setResult(result)
    } catch {
      setParseError('Erro ao importar. Verifique a conexão.')
    } finally {
      setImporting(false)
      setImportProgress('')
    }
  }

  // ── Importar APKG ─────────────────────────────────────────────────────────

  async function handleImportApkg() {
    if (!deckId || !apkgFile) return
    setImporting(true)
    setImportProgress('Processando deck do Anki...')
    try {
      const result = await importService.apkg(Number(deckId), apkgFile)
      setResult(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setParseError(msg || 'Erro ao importar o arquivo .apkg.')
    } finally {
      setImporting(false)
      setImportProgress('')
    }
  }

  const validCards = preview.filter(c => !c._error)
  const errorCount  = preview.filter(c => !!c._error).length

  // ── Tela de resultado ──────────────────────────────────────────────────────

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
        <p style={{ color: 'var(--text-muted)', margin: '0 0 24px', fontSize: 14 }}>
          {result.imported} card{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
          {result.skipped ? `, ${result.skipped} ignorados` : ''}
          {result.imagesUploaded ? ` · ${result.imagesUploaded} imagens` : ''}
        </p>

        {result.errors && result.errors.length > 0 && (
          <div style={{
            width: '100%', maxWidth: 480, marginBottom: 20,
            background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
            borderRadius: 10, padding: '12px 16px',
            maxHeight: 160, overflowY: 'auto',
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
          <button onClick={() => { setResult(null); setRawText(''); setPreview([]); setApkgFile(null) }} style={{
            padding: '10px 24px',
            background: 'var(--code-bg, #1a1a24)', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }}>Importar mais</button>
        </div>
      </div>
    </div>
  )

  // ── Tela principal ─────────────────────────────────────────────────────────

  const canImport = !importing && !!deckId && (
    mode === 'csv' ? validCards.length > 0 : !!apkgFile
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: 660, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>

        {/* Header */}
        <button onClick={() => navigate('/decks')} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4,
        }}>← Decks</button>
        <h1 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          Importar Flashcards
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' }}>
          Importe cards de um arquivo CSV ou de um deck do Anki (.apkg).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Deck */}
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

          {/* Toggle CSV / APKG */}
          <div style={panel}>
            <label style={fieldLabel}>Formato</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { id: 'csv'  as ImportMode, icon: '📄', label: 'CSV',  desc: 'Arquivo de texto separado por ponto-vírgula' },
                { id: 'apkg' as ImportMode, icon: '🃏', label: 'Anki', desc: 'Arquivo .apkg exportado do Anki' },
              ]).map(({ id, icon, label, desc }) => (
                <button key={id} type="button" onClick={() => setMode(id)} style={{
                  flex: 1, padding: '12px 14px', textAlign: 'left',
                  border: `${mode === id ? '2px' : '1px'} solid ${mode === id ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 10,
                  background: mode === id ? 'var(--accent-bg)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: mode === id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── CSV ── */}
          {mode === 'csv' && (
            <div style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ ...fieldLabel, marginBottom: 0 }}>Conteúdo CSV</label>
                <input ref={csvFileRef} type="file" accept=".csv,.txt" onChange={handleCsvFile} style={{ display: 'none' }} />
                <button onClick={() => csvFileRef.current?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
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
                value={rawText} onChange={e => setRawText(e.target.value)}
                placeholder={'Cole o CSV aqui ou clique em "Carregar arquivo"'}
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
          )}

          {/* ── Preview CSV ── */}
          {mode === 'csv' && preview.length > 0 && (
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
                    display: 'grid', gridTemplateColumns: c._error ? '1fr' : '1fr 1fr auto',
                    gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 8, fontSize: 12,
                    background: c._error ? 'rgba(239,68,68,0.07)' : 'var(--bg)',
                    border: `1px solid ${c._error ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
                  }}>
                    {c._error ? (
                      <span style={{ color: '#f87171' }}>{c._error}</span>
                    ) : (
                      <>
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.front}</span>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.back}</span>
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
          )}

          {/* ── APKG ── */}
          {mode === 'apkg' && (
            <div style={panel}>
              <label style={fieldLabel}>Arquivo Anki (.apkg)</label>

              <input ref={apkgFileRef} type="file" accept=".apkg" onChange={handleApkgFile} style={{ display: 'none' }} />

              <button
                onClick={() => apkgFileRef.current?.click()}
                style={{
                  width: '100%', padding: '32px 20px',
                  background: apkgFile ? 'rgba(34,197,94,0.05)' : 'transparent',
                  border: `2px dashed ${apkgFile ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  borderRadius: 12, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => !apkgFile && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
                onMouseLeave={e => !apkgFile && (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ fontSize: 32 }}>{apkgFile ? '✓' : '🃏'}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: apkgFile ? '#4ade80' : 'var(--text)' }}>
                  {apkgFile ? apkgFile.name : 'Clique para selecionar o arquivo .apkg'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {apkgFile
                    ? `${(apkgFile.size / 1024 / 1024).toFixed(1)} MB — clique para trocar`
                    : 'Exportado do Anki em Arquivo → Exportar → .apkg'}
                </span>
              </button>

              {apkgFile && (
                <div style={{
                  marginTop: 10, padding: '10px 14px',
                  background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
                  borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
                }}>
                  💡 Cards com imagens terão as imagens enviadas automaticamente para o servidor. Decks grandes podem demorar alguns segundos.
                </div>
              )}

              {parseError && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, fontSize: 12, color: '#f87171',
                }}>{parseError}</div>
              )}
            </div>
          )}

          {/* Botão importar */}
          <button
            onClick={mode === 'csv' ? handleImportCsv : handleImportApkg}
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
              ? importProgress || 'Importando...'
              : !deckId
                ? 'Selecione um deck primeiro'
                : mode === 'csv'
                  ? validCards.length === 0
                    ? 'Cole ou carregue um CSV acima'
                    : `Importar ${validCards.length} card${validCards.length !== 1 ? 's' : ''} → "${selectedDeck?.name}"`
                  : !apkgFile
                    ? 'Selecione um arquivo .apkg'
                    : `Importar "${apkgFile.name}" → "${selectedDeck?.name}"`}
          </button>

        </div>
      </div>
    </div>
  )
}
