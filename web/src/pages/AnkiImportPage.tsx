import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ankiImportService, type AnkiDeckPreview, type ApkgPreview, type ApkgStructuredResult } from '../services/anki.service'
import { useAuthStore } from '../store/auth.store'

type Step = 'upload' | 'preview' | 'importing' | 'result'

// ── Estilos compartilhados ────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 14, padding: 24,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
}

// ── Componente de resolução de conflito por deck ──────────────────────────────

function DeckConflictRow({ deck, resolution, onChange }: {
  deck: AnkiDeckPreview
  resolution: 'USE_EXISTING' | 'CREATE_NEW'
  onChange: (v: 'USE_EXISTING' | 'CREATE_NEW') => void
}) {
  const hasConflict = deck.existingDeckId !== null

  return (
    <div style={{
      padding: '14px 16px',
      background: hasConflict ? 'rgba(251,191,36,0.04)' : 'var(--surface2, #1a1a24)',
      border: `1px solid ${hasConflict ? 'rgba(251,191,36,0.2)' : 'var(--border)'}`,
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        {/* Info do deck */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)' }}>
              {deck.deckName}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 99,
              background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}>
              {deck.cardCount} cards
            </span>
            {hasConflict && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                color: '#fbbf24',
              }}>
                ⚠ conflito
              </span>
            )}
          </div>

          {/* Caminho de pastas */}
          {deck.folderPath && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              📁 {deck.folderPath.split(' > ').join(' › ')}
            </div>
          )}

          {/* Deck existente em conflito */}
          {hasConflict && (
            <div style={{ fontSize: 12, color: '#fbbf24', opacity: 0.8 }}>
              Já existe um deck chamado "{deck.existingDeckName}"
            </div>
          )}
        </div>

        {/* Resolução de conflito */}
        {hasConflict ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => onChange('CREATE_NEW')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                border: `1px solid ${resolution === 'CREATE_NEW' ? 'var(--accent-border)' : 'var(--border)'}`,
                background: resolution === 'CREATE_NEW' ? 'var(--accent-bg)' : 'transparent',
                color: resolution === 'CREATE_NEW' ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: resolution === 'CREATE_NEW' ? 600 : 400,
              }}
            >
              + Criar novo
            </button>
            <button
              type="button"
              onClick={() => onChange('USE_EXISTING')}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
                border: `1px solid ${resolution === 'USE_EXISTING' ? 'rgba(34,211,165,0.4)' : 'var(--border)'}`,
                background: resolution === 'USE_EXISTING' ? 'rgba(34,211,165,0.08)' : 'transparent',
                color: resolution === 'USE_EXISTING' ? '#22d3a5' : 'var(--text-muted)',
                fontWeight: resolution === 'USE_EXISTING' ? 600 : 400,
              }}
            >
              ↩ Usar existente
            </button>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#22d3a5', flexShrink: 0 }}>✓ Será criado</span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnkiImportPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore(s => s.user)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ApkgPreview | null>(null)
  const [resolutions, setResolutions] = useState<Record<number, 'USE_EXISTING' | 'CREATE_NEW'>>({})
  const [result, setResult] = useState<ApkgStructuredResult | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  // ── Upload e preview ───────────────────────────────────────────────────────

  async function handlePreview() {
    if (!file) return
    setError('')
    setProgress('Lendo estrutura do deck...')
    setStep('importing')

    try {
      const data = await ankiImportService.preview(file)

      // Inicializa resoluções com os defaults do backend
      const defaultResolutions: Record<number, 'USE_EXISTING' | 'CREATE_NEW'> = {}
      data.decks.forEach(d => {
        defaultResolutions[d.ankiDeckId] = d.resolution
      })
      setResolutions(defaultResolutions)
      setPreview(data)
      setStep('preview')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data?.message
        || (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        || 'Erro ao ler o arquivo.'
      setError(msg)
      setStep('upload')
    } finally {
      setProgress('')
    }
  }

  // ── Confirmar importação ───────────────────────────────────────────────────

  async function handleConfirm() {
    if (!preview) return
    setError('')
    setStep('importing')
    setProgress('Criando pastas e decks...')

    try {
      const data = await ankiImportService.confirm(preview.uploadToken, resolutions)
      setResult(data)
      setStep('result')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Erro ao importar.'
      setError(msg)
      setStep('preview')
    } finally {
      setProgress('')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    const MAX_SIZE = 150 * 1024 * 1024 // 150MB

    if(f.size > MAX_SIZE) {
       setError('File is too big. Maximum size is 150MB.')
       setFile(null)
       return
    }

    setFile(f)
    setError('')
    e.target.value = ''
  }

  // ── Tela: sem premium ──────────────────────────────────────────────────────

  if (user?.plan !== 'PREMIUM') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>Recurso Premium</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', maxWidth: 340 }}>
          A importação estruturada de decks do Anki é exclusiva para usuários Premium.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/profile')} style={{
            padding: '10px 24px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Ver planos</button>
          <button onClick={() => navigate('/decks')} style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 10,
            color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }}>Voltar</button>
        </div>
      </div>
    </div>
  )

  // ── Tela: resultado ────────────────────────────────────────────────────────

  if (step === 'result' && result) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', marginBottom: 20,
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        }}>✓</div>

        <h2 style={{ fontWeight: 700, fontSize: 22, margin: '0 0 24px' }}>Importação concluída!</h2>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Cards', value: result.cardsImported, color: 'var(--accent)' },
            { label: 'Decks criados', value: result.decksCreated, color: '#22d3a5' },
            { label: 'Decks reusados', value: result.decksReused, color: '#60a5fa' },
            { label: 'Pastas criadas', value: result.foldersCreated, color: '#fb923c' },
            ...(result.imagesUploaded > 0 ? [{ label: 'Imagens', value: result.imagesUploaded, color: '#f59e0b' }] : []),
            ...(result.cardsSkipped > 0 ? [{ label: 'Ignorados', value: result.cardsSkipped, color: 'var(--text-muted)' }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Erros/avisos */}
        {result.errors.length > 0 && (
          <div style={{
            width: '100%', maxWidth: 480, marginBottom: 24,
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
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
          <button onClick={() => navigate('/decks')} style={{
            padding: '10px 24px', background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Ver decks</button>
          <button onClick={() => { setStep('upload'); setFile(null); setPreview(null); setResult(null) }} style={{
            padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }}>Importar outro</button>
        </div>
      </div>
    </div>
  )

  // ── Tela: importando ───────────────────────────────────────────────────────

  if (step === 'importing') return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{progress || 'Processando...'}</p>
      </div>
    </div>
  )

  // ── Tela: preview ──────────────────────────────────────────────────────────

  if (step === 'preview' && preview) {
    const conflicts = preview.decks.filter(d => d.existingDeckId !== null)
    const totalCards = preview.decks.reduce((sum, d) => sum + d.cardCount, 0)

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>

          <button onClick={() => setStep('upload')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4,
          }}>← Voltar</button>

          <h1 style={{ fontWeight: 700, fontSize: 24, margin: '0 0 4px', letterSpacing: '-0.4px' }}>
            Revisar importação
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 24px' }}>
            {preview.decks.length} deck{preview.decks.length !== 1 ? 's' : ''} · {totalCards} cards
            {conflicts.length > 0 && (
              <span style={{ color: '#fbbf24', marginLeft: 8 }}>
                · {conflicts.length} conflito{conflicts.length !== 1 ? 's' : ''} para resolver
              </span>
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {preview.decks.map(deck => (
              <DeckConflictRow
                key={deck.ankiDeckId}
                deck={deck}
                resolution={resolutions[deck.ankiDeckId] || 'CREATE_NEW'}
                onChange={v => setResolutions(prev => ({ ...prev, [deck.ankiDeckId]: v }))}
              />
            ))}
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, fontSize: 13, color: '#f87171',
            }}>{error}</div>
          )}

          <button onClick={handleConfirm} style={{
            width: '100%', padding: '14px',
            background: 'var(--accent)', border: 'none', borderRadius: 12,
            color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            Importar {totalCards} cards →
          </button>
        </div>
      </div>
    )
  }

  // ── Tela: upload ───────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 88, paddingBottom: 60, paddingLeft: 20, paddingRight: 20 }}>

        <button onClick={() => navigate('/import')} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4,
        }}>← Importar</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontWeight: 700, fontSize: 24, margin: 0, letterSpacing: '-0.4px' }}>
            Importar do Anki
          </h1>
          <span style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 99, fontWeight: 600,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#fff',
          }}>PREMIUM</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' }}>
          Importa seus decks do Anki mantendo a hierarquia de pastas e subdecks.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload */}
          <div style={panel}>
            <div style={{ ...labelStyle, display: 'block', marginBottom: 12 }}>Arquivo .apkg</div>

            <input ref={fileRef} type="file" accept=".apkg" onChange={handleFileChange} style={{ display: 'none' }} />

            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '36px 20px',
                background: file ? 'rgba(34,197,94,0.04)' : 'transparent',
                border: `2px dashed ${file ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => !file && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
              onMouseLeave={e => !file && (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <span style={{ fontSize: 36 }}>{file ? '✓' : '🃏'}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: file ? '#22d3a5' : 'var(--text-h)' }}>
                {file ? file.name : 'Clique para selecionar o arquivo .apkg'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(1)} MB — clique para trocar`
                  : 'No Anki: Arquivo → Exportar → Formato: Anki Deck Package (.apkg)'}
              </span>
            </button>

            {file && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
                borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
              }}>
                💡 O sistema vai ler a estrutura do seu deck antes de importar. Você poderá resolver conflitos de nomes na próxima etapa.
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, fontSize: 13, color: '#f87171',
            }}>{error}</div>
          )}

          <button
            onClick={handlePreview}
            disabled={!file}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: 'none',
              background: file ? 'var(--accent)' : 'var(--surface)',
              color: file ? '#fff' : 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: file ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {file ? 'Analisar arquivo →' : 'Selecione um arquivo .apkg'}
          </button>
        </div>
      </div>
    </div>
  )
}
