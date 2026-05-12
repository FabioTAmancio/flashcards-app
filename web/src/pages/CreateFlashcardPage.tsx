import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { flashcardService, deckService, imageService } from '../services/deck.service'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Deck = { id: number; name: string; description: string }
type CardType = 'BASIC' | 'QA'

interface CardDraft {
  front: string
  back: string
  subject: string
  frontImageUrl: string
  backImageUrl: string
  cardType: CardType
}

interface SavedCard {
  id: number
  front: string
  back: string
  cardType: string
}

const EMPTY_DRAFT: CardDraft = {
  front: '',
  back: '',
  subject: '',
  frontImageUrl: '',
  backImageUrl: '',
  cardType: 'BASIC',
}

// ── CSS helpers ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
}

// ── ImageInput ────────────────────────────────────────────────────────────────

function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [mode, setMode] = useState<'upload' | 'url'>('upload')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. Máximo: 5 MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const url = await imageService.upload(file)
      onChange(url)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setUploadError(msg || 'Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      {/* Label + modo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2, gap: 2 }}>
          {(['upload', 'url'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '3px 10px', borderRadius: 4, border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'uppercase',
              }}
            >
              {m === 'upload' ? '📁 Arquivo' : '🔗 URL'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              width: '100%', padding: '10px',
              background: 'var(--surface2)', border: '1px dashed var(--border2)',
              borderRadius: 9, color: 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
          >
            {uploading ? '⏳ Enviando...' : value ? '✓ Imagem carregada — clique para trocar' : '+ Clique para selecionar imagem'}
          </button>
          {uploadError && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, fontSize: 12, color: '#f87171' }}>
              ⚠ {uploadError}
            </div>
          )}
        </div>
      ) : (
        <input
          type="url" value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      )}

      {value && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="preview"
            style={{ height: 80, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <button type="button" onClick={() => onChange('')} style={{
            position: 'absolute', top: -6, right: -6,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--red)', border: 'none',
            color: '#fff', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
      )}
    </div>
  )
}

// ── CardTypeSelector ──────────────────────────────────────────────────────────

function CardTypeSelector({ value, onChange }: { value: CardType; onChange: (v: CardType) => void }) {
  const types = [
    { id: 'BASIC' as const, icon: '◈', label: 'Conceito / Definição', desc: 'Veja o conceito e lembre a definição' },
    { id: 'QA' as const, icon: '✎', label: 'Pergunta / Resposta', desc: 'Digite a resposta — sistema compara' },
  ]
  return (
    <div>
      <label style={labelStyle}>Tipo do card</label>
      <div style={{ display: 'flex', gap: 8 }}>
        {types.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, padding: '12px 14px', textAlign: 'left',
              border: `${value === t.id ? '2px' : '1px'} solid ${value === t.id ? 'var(--accent-border)' : 'var(--border)'}`,
              borderRadius: 10,
              background: value === t.id ? 'var(--accent-bg)' : 'var(--surface2)',
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: value === t.id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>
              {t.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── SavedCardPill ─────────────────────────────────────────────────────────────

function SavedCardPill({ card, index }: { card: SavedCard; index: number }) {
  const isQA = card.cardType === 'QA'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      animation: 'fadeUp 0.3s ease forwards',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
        background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#22d3a5',
      }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {card.front}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
          {card.back}
        </div>
      </div>
      <span style={{
        fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 700, flexShrink: 0,
        background: isQA ? 'rgba(96,165,250,0.1)' : 'rgba(170,59,255,0.1)',
        border: `1px solid ${isQA ? 'rgba(96,165,250,0.25)' : 'rgba(170,59,255,0.25)'}`,
        color: isQA ? 'var(--blue,#60a5fa)' : 'var(--accent)',
        textTransform: 'uppercase',
      }}>
        {isQA ? 'P/R' : 'C/D'}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateFlashcardPage() {
  const { deckId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [, setDeck] = useState<Deck | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<number>(Number(deckId) || 0)
  const [loadingDecks, setLoadingDecks] = useState(true)

  const [draft, setDraft] = useState<CardDraft>({ ...EMPTY_DRAFT })
  const [saving, setSaving] = useState(false)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Carrega os decks disponíveis
  useEffect(() => {
    async function load() {
      try {
        const data: Deck[] = await deckService.getAll()
        setDecks(data)
        const id = Number(deckId) || (data[0]?.id ?? 0)
        setSelectedDeckId(id)
        setDeck(data.find(d => d.id === id) || null)
      } catch {
        /* ignore */
      } finally {
        setLoadingDecks(false)
      }
    }
    load()
  }, [deckId])

  function setField<K extends keyof CardDraft>(key: K, value: CardDraft[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  function focusBorder(e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--accent-border)'
  }
  function blurBorder(e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--border)'
  }

  const isQA = draft.cardType === 'QA'
  const canSave = draft.front.trim() && draft.back.trim() && selectedDeckId > 0

  async function handleSave(andNew: boolean) {
    if (!canSave) return
    setSaving(true)
    setErrorMsg('')
    try {
      const created = await flashcardService.create(
        selectedDeckId,
        draft.front.trim(),
        draft.back.trim(),
        draft.subject.trim() || (decks.find(d => d.id === selectedDeckId)?.name ?? ''),
        draft.frontImageUrl || undefined,
        draft.backImageUrl || undefined,
        draft.cardType,
      )
      setSavedCards(prev => [created, ...prev])

      if (andNew) {
        // Mantém tipo e matéria, limpa conteúdo
        setDraft(prev => ({ ...EMPTY_DRAFT, cardType: prev.cardType, subject: prev.subject }))
        setSuccessMsg('Card salvo! ✓ Crie o próximo.')
        setTimeout(() => setSuccessMsg(''), 2500)
      } else {
        navigate(`/decks/${selectedDeckId}`)
      }
    } catch {
      setErrorMsg('Erro ao salvar o card. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleDeckChange(id: number) {
    setSelectedDeckId(id)
    setDeck(decks.find(d => d.id === id) || null)
  }

  const returnUrl = searchParams.get('from') || `/decks/${selectedDeckId}`

  if (loadingDecks) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 140 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    )
  }

  if (decks.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ paddingTop: 120, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Você ainda não tem nenhum deck.</p>
          <button
            onClick={() => navigate('/decks')}
            style={{ padding: '10px 24px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Criar um deck primeiro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ paddingTop: 88, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', padding: '88px 24px 80px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Formulário (coluna principal) ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <button
              onClick={() => navigate(returnUrl)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ← Voltar
            </button>
            <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', margin: 0 }}>
              Criar flashcard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {savedCards.length > 0 ? `${savedCards.length} card${savedCards.length !== 1 ? 's' : ''} criado${savedCards.length !== 1 ? 's' : ''} nesta sessão` : 'Preencha frente e verso para salvar'}
            </p>
          </div>

          {/* Card do formulário */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Deck selector */}
            <div>
              <label style={labelStyle}>Deck *</label>
              <select
                value={selectedDeckId}
                onChange={e => handleDeckChange(Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Tipo */}
            <CardTypeSelector value={draft.cardType} onChange={v => setField('cardType', v)} />

            {/* Preview da frente/verso */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Frente */}
              <div>
                <label style={labelStyle}>{isQA ? 'Pergunta *' : 'Frente *'}</label>
                <textarea
                  value={draft.front}
                  onChange={e => setField('front', e.target.value)}
                  placeholder={isQA ? 'Qual é a capital do Brasil?' : 'Conceito ou termo...'}
                  rows={4}
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>

              {/* Verso */}
              <div>
                <label style={labelStyle}>{isQA ? 'Resposta *' : 'Verso *'}</label>
                <textarea
                  value={draft.back}
                  onChange={e => setField('back', e.target.value)}
                  placeholder={isQA ? 'Brasília' : 'Definição ou explicação...'}
                  rows={4}
                  style={inputStyle}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                />
              </div>
            </div>

            {/* Info QA */}
            {isQA && (
              <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                💡 No modo <strong style={{ color: 'var(--text)' }}>Pergunta/Resposta</strong>, o aluno digita a resposta durante a revisão. A comparação ignora maiúsculas e acentos.
              </div>
            )}

            {/* Imagens */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ImageInput
                label={isQA ? 'Imagem da pergunta' : 'Imagem da frente'}
                value={draft.frontImageUrl}
                onChange={v => setField('frontImageUrl', v)}
              />
              <ImageInput
                label={isQA ? 'Imagem da resposta' : 'Imagem do verso'}
                value={draft.backImageUrl}
                onChange={v => setField('backImageUrl', v)}
              />
            </div>

            {/* Matéria */}
            <div>
              <label style={labelStyle}>Matéria <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
              <input
                value={draft.subject}
                onChange={e => setField('subject', e.target.value)}
                placeholder="Ex: Biologia, Inglês, Matemática..."
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>

            {/* Feedback */}
            {successMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.25)', borderRadius: 9, fontSize: 13, color: '#22d3a5', fontWeight: 600 }}>
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, fontSize: 13, color: '#f87171' }}>
                ⚠ {errorMsg}
              </div>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => navigate(returnUrl)}
                style={{ padding: '11px 20px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer', transition: 'all 0.15s' }}
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={saving || !canSave}
                onClick={() => handleSave(true)}
                style={{
                  flex: 1, padding: '11px 20px',
                  background: canSave ? 'var(--surface2)' : 'var(--surface2)',
                  border: `1px solid ${canSave ? 'var(--accent-border)' : 'var(--border)'}`,
                  borderRadius: 10,
                  color: canSave ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  cursor: saving || !canSave ? 'not-allowed' : 'pointer',
                  opacity: !canSave ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {saving ? 'Salvando...' : '+ Salvar e criar outro'}
              </button>

              <button
                type="button"
                disabled={saving || !canSave}
                onClick={() => handleSave(false)}
                style={{
                  flex: 1, padding: '11px 20px',
                  background: canSave ? 'var(--accent)' : 'var(--surface2)',
                  border: 'none',
                  borderRadius: 10, color: '#fff',
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  cursor: saving || !canSave ? 'not-allowed' : 'pointer',
                  opacity: !canSave ? 0.5 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar e sair'}
              </button>
            </div>
          </div>

          {/* Preview do card */}
          {(draft.front || draft.back) && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Preview
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Frente preview */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: 20, minHeight: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    {isQA ? '⬜ Pergunta' : '⬜ Frente'}
                  </div>
                  {draft.frontImageUrl && (
                    <img src={draft.frontImageUrl} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.5 }}>
                    {draft.front || <span style={{ color: 'var(--text-faint)' }}>...</span>}
                  </div>
                </div>
                {/* Verso preview */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, minHeight: 100 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    {isQA ? '✅ Resposta' : '✅ Verso'}
                  </div>
                  {draft.backImageUrl && (
                    <img src={draft.backImageUrl} alt="" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} onError={e => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {draft.back || <span style={{ color: 'var(--text-faint)' }}>...</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: histórico da sessão ── */}
        <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 88 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Sessão atual
              </span>
              {savedCards.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3a5', background: 'rgba(34,211,165,0.1)', border: '1px solid rgba(34,211,165,0.2)', borderRadius: 99, padding: '2px 8px' }}>
                  {savedCards.length}
                </span>
              )}
            </div>

            {savedCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                  Os cards salvos nesta sessão aparecerão aqui.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedCards.map((card, i) => (
                  <SavedCardPill key={card.id} card={card} index={savedCards.length - 1 - i} />
                ))}
              </div>
            )}

            {savedCards.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => navigate(`/decks/${selectedDeckId}`)}
                  style={{ width: '100%', padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Ver todos no deck →
                </button>
              </div>
            )}
          </div>

          {/* Dicas */}
          <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Dicas
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '◈', text: 'Use Conceito/Definição para vocabulário e termos técnicos.' },
                { icon: '✎', text: 'Use Pergunta/Resposta quando quiser testar a escrita exata.' },
                { icon: '📁', text: 'A matéria ajuda a filtrar cards na revisão.' },
                { icon: '↩', text: 'Salvar e criar outro mantém tipo e matéria para agilizar.' },
              ].map(({ icon, text }) => (
                <div key={icon} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}