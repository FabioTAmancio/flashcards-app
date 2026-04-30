import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { flashcardService, deckService, imageService } from '../services/deck.service'
 
type Card = {
  id: number; front: string; back: string; subject: string
  frontImageUrl?: string; backImageUrl?: string; cardType?: string
}
type Deck = { id: number; name: string; description: string }
 
// ImageInput 
 
function ImageInput({ label, value, onChange }: {
  label: string; value: string; onChange: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [mode, setMode] = useState<'url' | 'upload'>('upload')
 
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Arquivo muito grande. O tamanho máximo é 5MB.')
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2, gap: 2 }}>
          {(['upload', 'url'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding: '3px 10px', borderRadius: 4, border: 'none',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'uppercase',
            }}>
              {m === 'upload' ? '📁 Arquivo' : '🔗 URL'}
            </button>
          ))}
        </div>
      </div>
 
      {mode === 'upload' ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            width: '100%', padding: '10px',
            background: 'var(--surface2)', border: '1px dashed var(--border2)',
            borderRadius: 9, color: 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.borderColor = 'var(--accent-border)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
          >
            {uploading ? 'Enviando...' : value ? '✓ Imagem carregada — clique para trocar' : '+ Clique para selecionar imagem'}
          </button>
          {uploadError && (
            <div style={{
              marginTop: 6, padding: '6px 10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 7, fontSize: 12, color: '#f87171',
            }}>
              ⚠ {uploadError}
            </div>
          )}
        </div>
      ) : (
        <input
          type="url" value={value} onChange={e => onChange(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          style={{
            width: '100%', padding: '10px 13px',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 9, color: 'var(--text)',
            fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
          }}
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
 
function CardTypeSelector({ value, onChange }: {
  value: 'BASIC' | 'QA'; onChange: (v: 'BASIC' | 'QA') => void
}) {
  const types = [
    { id: 'BASIC' as const, icon: '◈', label: 'Conceito / Definição', desc: 'Veja o conceito e lembre a definição' },
    { id: 'QA' as const,    icon: '✎', label: 'Pergunta / Resposta',  desc: 'Digite a resposta — o sistema compara' },
  ]
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: 'var(--text-muted)', marginBottom: 8,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Tipo do card
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        {types.map(t => (
          <button key={t.id} type="button" onClick={() => onChange(t.id)} style={{
            flex: 1, padding: '10px 12px', textAlign: 'left',
            border: `${value === t.id ? '2px' : '1px'} solid ${value === t.id ? 'var(--accent-border)' : 'var(--border)'}`,
            borderRadius: 10,
            background: value === t.id ? 'var(--accent-bg)' : 'var(--surface2)',
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: value === t.id ? 'var(--accent)' : 'var(--text)', marginBottom: 2 }}>
              {t.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
 
// ── CardItem ──────────────────────────────────────────────────────────────────
 
function CardItem({ card, onEdit, onDelete }: { card: Card; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false)
  const isQA = card.cardType === 'QA'
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
      borderRadius: 12, padding: '16px 20px',
      display: 'grid', gridTemplateColumns: '1fr 1fr auto',
      gap: 16, alignItems: 'center', transition: 'all 0.15s',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isQA ? 'Pergunta' : 'Frente'}
          </span>
          <span style={{
            fontSize: 9, padding: '1px 6px', borderRadius: 99, fontWeight: 600,
            background: isQA ? 'rgba(96,165,250,0.1)' : 'rgba(170,59,255,0.1)',
            border: `1px solid ${isQA ? 'rgba(96,165,250,0.2)' : 'rgba(170,59,255,0.2)'}`,
            color: isQA ? 'var(--blue)' : 'var(--accent)',
          }}>
            {isQA ? 'P/R' : 'C/D'}
          </span>
        </div>
        {card.frontImageUrl && (
          <img src={card.frontImageUrl} alt="" style={{ height: 48, borderRadius: 6, objectFit: 'cover', marginBottom: 4, display: 'block' }} />
        )}
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{card.front}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {isQA ? 'Resposta' : 'Verso'}
        </div>
        {card.backImageUrl && (
          <img src={card.backImageUrl} alt="" style={{ height: 48, borderRadius: 6, objectFit: 'cover', marginBottom: 4, display: 'block' }} />
        )}
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
 
// ── CardModal ─────────────────────────────────────────────────────────────────
 
function CardModal({ card, deckId, onClose, onSave }: {
  card?: Card; deckId: number; onClose: () => void; onSave: () => void
}) {
  const [front, setFront] = useState(card?.front || '')
  const [back, setBack] = useState(card?.back || '')
  const [subject, setSubject] = useState(card?.subject || '')
  const [frontImageUrl, setFrontImageUrl] = useState(card?.frontImageUrl || '')
  const [backImageUrl, setBackImageUrl] = useState(card?.backImageUrl || '')
  const [cardType, setCardType] = useState<'BASIC' | 'QA'>(
    (card?.cardType as 'BASIC' | 'QA') || 'BASIC'
  )
  const [loading, setLoading] = useState(false)
 
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 9, color: 'var(--text)',
    fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }
 
  const isQA = cardType === 'QA'
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setLoading(true)
    try {
      if (card) {
        await flashcardService.update(
          card.id, front, back, subject,
          frontImageUrl || undefined, backImageUrl || undefined, cardType
        )
      } else {
        await flashcardService.create(
          deckId, front, back, subject,
          frontImageUrl || undefined, backImageUrl || undefined, cardType
        )
      }
      onSave()
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: 28,
        width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
          {card ? 'Editar card' : 'Novo card'}
        </h2>
 
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
 
          {/* Tipo do card */}
          <CardTypeSelector value={cardType} onChange={setCardType} />
 
          {/* Frente / Pergunta */}
          <div>
            <label style={labelStyle}>{isQA ? 'Pergunta *' : 'Frente *'}</label>
            <textarea value={front} onChange={e => setFront(e.target.value)}
              placeholder={isQA ? 'Qual é a capital do Brasil?' : 'Conceito ou termo'}
              required rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
 
          <ImageInput
            label={isQA ? 'Imagem da pergunta' : 'Imagem da frente'}
            value={frontImageUrl}
            onChange={setFrontImageUrl}
          />
 
          {/* Verso / Resposta */}
          <div>
            <label style={labelStyle}>{isQA ? 'Resposta *' : 'Verso *'}</label>
            <textarea value={back} onChange={e => setBack(e.target.value)}
              placeholder={isQA ? 'Brasília' : 'Definição ou explicação'}
              required rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
 
          {isQA && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
            }}>
              💡 No modo Pergunta/Resposta o aluno digita a resposta durante a revisão. A comparação ignora maiúsculas e acentos.
            </div>
          )}
 
          <ImageInput
            label={isQA ? 'Imagem da resposta' : 'Imagem do verso'}
            value={backImageUrl}
            onChange={setBackImageUrl}
          />
 
          {/* Matéria */}
          <div>
            <label style={labelStyle}>Matéria</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Ex: Biologia, Inglês..."
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
 
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 9, color: 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
            }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px',
              background: 'var(--accent)', border: 'none',
              borderRadius: 9, color: '#fff',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
// ── Page ──────────────────────────────────────────────────────────────────────
 
export default function FlashcardPage() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const [cards, setCards] = useState<Card[]>([])
  const [deck, setDeck] = useState<Deck | null>(null)
  const [modal, setModal] = useState<null | 'create' | Card>(null)
  const [loading, setLoading] = useState(true)
 
  const id = Number(deckId)
 
  async function load() {
    try {
      const [cardsData, deckData] = await Promise.all([
        flashcardService.getByDeck(id),
        deckService.getAll().then((decks: Deck[]) => decks.find(d => d.id === id) || null),
      ])
      setCards(cardsData)
      setDeck(deckData)
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
      <div style={{ paddingTop: 88, paddingLeft: 32, paddingRight: 32, paddingBottom: 60, maxWidth: 900, margin: '0 auto' }}>
 
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <button onClick={() => navigate('/decks')} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4,
            }}>← Decks</button>
            <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.4px', margin: 0 }}>
              {deck?.name || '—'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {loading ? '—' : `${cards.length} card${cards.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => setModal('create')} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: 'var(--accent)', border: 'none',
            borderRadius: 10, color: '#fff',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 16 }}>+</span> Novo card
          </button>
        </div>
 
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{
              width: 32, height: 32, border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Nenhum card neste deck ainda.</p>
            <button onClick={() => setModal('create')} style={{
              padding: '10px 24px', background: 'var(--accent)', border: 'none',
              borderRadius: 10, color: '#fff', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Criar primeiro card</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cards.map(card => (
              <CardItem
                key={card.id} card={card}
                onEdit={() => setModal(card)}
                onDelete={() => handleDelete(card.id)}
              />
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