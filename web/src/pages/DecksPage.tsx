import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { deckService } from '../services/deck.service'
import { folderService, type FolderItem } from '../services/folder.service'

// Types
type Deck = {
  id: number; name: string; description: string
  color: string | null; reviewEnabled: boolean
  cardCount?: number; folderId?: number | null
}

type SortField = 'name' | 'cards' | 'created'
type SortDir   = 'asc' | 'desc'

const PALETTE = ['var(--accent)', '#22d3a5', '#ff8c42', '#60a5fa', '#f59e0b', '#ec4899']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 9, color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

// ReviewToggle
function ReviewToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      title={enabled ? 'Desabilitar revisão' : 'Habilitar revisão'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px',
        background: enabled ? 'rgba(34,211,165,0.08)' : 'transparent',
        border: `1px solid ${enabled ? 'rgba(34,211,165,0.25)' : 'var(--border)'}`,
        borderRadius: 99, cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 26, height: 14, borderRadius: 99, position: 'relative', flexShrink: 0,
        background: enabled ? '#22d3a5' : 'var(--border)', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: enabled ? 13 : 2,
          width: 10, height: 10, background: '#fff', borderRadius: '50%',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 500, color: enabled ? '#22d3a5' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {enabled ? 'on' : 'off'}
      </span>
    </button>
  )
}

//DeckCard (grid)
function DeckCard({ deck, onEdit, onDelete, onToggleReview, onMoveToFolder }: {
  deck: Deck; onEdit: () => void; onDelete: () => void
  onToggleReview: () => void; onMoveToFolder: () => void
}) {
  const navigate = useNavigate()
  const color = deck.color || PALETTE[deck.id % PALETTE.length]
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface)', border: `1px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 12, padding: 20, cursor: 'default', transition: 'all 0.2s',
        transform: hover ? 'translateY(-1px)' : 'none',
        opacity: deck.reviewEnabled ? 1 : 0.6,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: deck.reviewEnabled ? color : 'var(--border)',
        borderRadius: '12px 12px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>▦</div>
        <ReviewToggle enabled={deck.reviewEnabled} onToggle={onToggleReview} />
      </div>

      <div onClick={() => navigate(`/decks/${deck.id}`)} style={{ cursor: 'pointer' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, letterSpacing: '-0.2px' }}>
          {deck.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {deck.description || 'Sem descrição'}
        </div>
        {deck.cardCount !== undefined && (
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
            {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => navigate(`/decks/${deck.id}`)} style={{
          flex: 1, padding: '6px 0',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 7, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
        }}>Ver cards</button>
        <button onClick={e => { e.stopPropagation(); onMoveToFolder() }} title="Mover para pasta" style={{
          padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 7, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
        }}>📁</button>
        <button onClick={e => { e.stopPropagation(); onEdit() }} style={{
          padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 7, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
        }}>✎</button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          padding: '6px 10px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 7, color: 'var(--red)', fontSize: 12, cursor: 'pointer', opacity: 0.7,
        }}>✕</button>
      </div>
    </div>
  )
}

// DeckListRow (lista)
function DeckListRow({ deck, color, onEdit, onDelete, onToggleReview, onMoveToFolder }: {
  deck: Deck; color: string; onEdit: () => void; onDelete: () => void
  onToggleReview: () => void; onMoveToFolder: () => void
}) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 80px 100px 120px', gap: 12,
        alignItems: 'center', padding: '12px 14px',
        background: hover ? 'var(--surface)' : 'transparent',
        border: `1px solid ${hover ? 'var(--border)' : 'transparent'}`,
        borderRadius: 10, transition: 'all 0.15s',
        opacity: deck.reviewEnabled ? 1 : 0.55,
      }}
    >
      {/* Nome */}
      <div
        onClick={() => navigate(`/decks/${deck.id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minWidth: 0 }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>▦</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deck.name}
          </div>
          {deck.description && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {deck.description}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {deck.cardCount ?? 0} card{deck.cardCount !== 1 ? 's' : ''}
      </div>

      {/* Toggle */}
      <ReviewToggle enabled={deck.reviewEnabled} onToggle={onToggleReview} />

      {/* Ações */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={e => { e.stopPropagation(); onMoveToFolder() }} title="Mover" style={{
          padding: '5px 8px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
        }}>📁</button>
        <button onClick={e => { e.stopPropagation(); onEdit() }} style={{
          padding: '5px 8px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
        }}>✎</button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          padding: '5px 8px', background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--red)', fontSize: 11, cursor: 'pointer', opacity: 0.7,
        }}>✕</button>
      </div>
    </div>
  )
}

// FolderNode / FolderTree
function FolderNode({ folder, selectedId, onSelect, onToggleReview, level }: {
  folder: FolderItem; selectedId: number | null
  onSelect: (id: number | null) => void
  onToggleReview: (id: number) => void; level: number
}) {
  const [open, setOpen] = useState(true)
  const isSelected  = selectedId === folder.id
  const hasChildren = folder.children && folder.children.length > 0
  const enabled     = folder.reviewEnabled

  return (
    <div>
      <div
        onClick={() => onSelect(folder.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', paddingLeft: 10 + level * 16,
          borderRadius: 8, cursor: 'pointer',
          background: isSelected ? 'var(--accent-bg)' : 'transparent',
          border: `1px solid ${isSelected ? 'var(--accent-border)' : 'transparent'}`,
          transition: 'all 0.15s', opacity: enabled ? 1 : 0.5,
        }}
      >
        {hasChildren ? (
          <span onClick={e => { e.stopPropagation(); setOpen(!open) }}
            style={{ fontSize: 10, opacity: 0.6, flexShrink: 0, cursor: 'pointer', width: 14 }}>
            {open ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: 14, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 14 }}>{enabled ? '📁' : '📂'}</span>
        <span style={{
          fontSize: 13, fontWeight: isSelected ? 600 : 400,
          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{folder.name}</span>
        <button
          onClick={e => { e.stopPropagation(); onToggleReview(folder.id) }}
          title={enabled ? 'Desativar revisão' : 'Ativar revisão'}
          style={{
            width: 28, height: 16, borderRadius: 99, position: 'relative', flexShrink: 0,
            background: enabled ? '#22d3a5' : 'var(--border)',
            border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 2, left: enabled ? 14 : 2,
            width: 12, height: 12, background: '#fff', borderRadius: '50%',
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>
      {open && hasChildren && (
        <FolderTree folders={folder.children} selectedId={selectedId}
          onSelect={onSelect} onToggleReview={onToggleReview} level={level + 1} />
      )}
    </div>
  )
}

function FolderTree({ folders, selectedId, onSelect, onToggleReview, level = 0 }: {
  folders: FolderItem[]; selectedId: number | null
  onSelect: (id: number | null) => void
  onToggleReview: (id: number) => void; level?: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {folders.map(folder => (
        <FolderNode key={folder.id} folder={folder} selectedId={selectedId}
          onSelect={onSelect} onToggleReview={onToggleReview} level={level} />
      ))}
    </div>
  )
}

// Modal
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 420,
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

// Page
export default function DecksPage() {
  const [decks, setDecks]     = useState<Deck[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState<number | null | 'root'>('root')

  // sort + busca + view
  const [search, setSearch]       = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')

  // modais
  const [deckModal, setDeckModal]   = useState<null | 'create' | Deck>(null)
  const [folderModal, setFolderModal] = useState<null | 'create' | { id: number; name: string }>(null)
  const [deleteFolderModal, setDeleteFolderModal] = useState<{ id: number; name: string } | null>(null)
  const [deleteFolderLoading, setDeleteFolderLoading] = useState(false)
  const [moveModal, setMoveModal]   = useState<Deck | null>(null)

  // form state
  const [deckName, setDeckName]     = useState('')
  const [deckDesc, setDeckDesc]     = useState('')
  const [deckTargetFolder, setDeckTargetFolder] = useState<number | null>(null)
  const [folderName, setFolderName] = useState('')
  const [folderParentId, setFolderParentId] = useState<number | ''>('')
  const [moveFolderId, setMoveFolderId] = useState<number | ''>('')
  const [saving, setSaving]         = useState(false)

  async function load() {
    try {
      const [decksData, foldersData] = await Promise.all([
        deckService.getAll(),
        folderService.getTree(),
      ])
      setDecks(decksData)
      setFolders(foldersData)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flattenFolders(list: FolderItem[], depth = 0): { id: number; name: string; depth: number }[] {
    return list.flatMap(f => [
      { id: f.id, name: f.name, depth },
      ...flattenFolders(f.children || [], depth + 1),
    ])
  }
  const allFolders = flattenFolders(folders)

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const visibleDecks = decks
    .filter(d => selectedFolder === 'root' ? d.folderId == null : d.folderId === selectedFolder)
    .filter(d => !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'name')    cmp = a.name.localeCompare(b.name, 'pt-BR')
      if (sortField === 'cards')   cmp = (a.cardCount ?? 0) - (b.cardCount ?? 0)
      if (sortField === 'created') cmp = a.id - b.id
      return sortDir === 'asc' ? cmp : -cmp
    })

  const enabledCount = decks.filter(d => d.reviewEnabled).length

  async function handleSaveDeck() {
    if (!deckName.trim()) return
    setSaving(true)
    try {
      if (deckModal === 'create') {
        await deckService.create(deckName.trim(), deckDesc.trim(), undefined, deckTargetFolder ?? undefined)
      } else if (deckModal && typeof deckModal !== 'string') {
        await deckService.update(deckModal.id, deckName.trim(), deckDesc.trim())
      }
      setDeckModal(null); load()
    } finally { setSaving(false) }
  }

  async function handleSaveFolder() {
    if (!folderName.trim()) return
    setSaving(true)
    try {
      if (folderModal === 'create') {
        await folderService.create(folderName.trim(), folderParentId ? Number(folderParentId) : undefined)
      } else if (folderModal && typeof folderModal !== 'string') {
        await folderService.rename(folderModal.id, folderName.trim())
      }
      setFolderModal(null); load()
    } finally { setSaving(false) }
  }

  async function handleMoveToFolder() {
    if (!moveModal) return
    setSaving(true)
    try {
      if (moveFolderId === '') {
        await folderService.removeDeckFromFolder(moveModal.id)
      } else {
        await folderService.moveDeckToFolder(Number(moveFolderId), moveModal.id)
      }
      setMoveModal(null); load()
    } finally { setSaving(false) }
  }

  async function handleDeleteDeck(id: number) {
    if (!confirm('Excluir este deck e todos os seus cards?')) return
    await deckService.delete(id); load()
  }

  async function handleDeleteFolder(id: number) {
    const folder = allFolders.find(f => f.id === id)
    if (!folder) return
    setDeleteFolderModal({ id, name: folder.name })
  }

  async function confirmDeleteFolder(cascade: boolean) {
    if (!deleteFolderModal) return
    setDeleteFolderLoading(true)
    try {
      await folderService.delete(deleteFolderModal.id, cascade)
      if (selectedFolder === deleteFolderModal.id) setSelectedFolder('root')
      setDeleteFolderModal(null); load()
    } catch { /* ignore */ }
    finally { setDeleteFolderLoading(false) }
  }

  async function handleToggleDeckReview(id: number) {
    try {
      const updated = await deckService.toggleReview(id)
      setDecks(prev => prev.map(d => d.id === id ? { ...d, reviewEnabled: updated.reviewEnabled } : d))
    } catch { /* ignore */ }
  }

  async function handleToggleFolderReview(id: number) {
    try { await folderService.toggleReview(id); load() }
    catch { /* ignore */ }
  }

  const openDeckCreate = () => {
    setDeckName(''); setDeckDesc('')
    setDeckTargetFolder(typeof selectedFolder === 'number' ? selectedFolder : null)
    setDeckModal('create')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ paddingTop: 88, paddingLeft: 24, paddingRight: 24, paddingBottom: 60, maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24 }}>

        {/*Sidebar*/}
        <div style={{
          width: 240, flexShrink: 0, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 14, padding: 16,
          height: 'fit-content', position: 'sticky', top: 88,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pastas</span>
            <button
              onClick={() => { setFolderName(''); setFolderParentId(''); setFolderModal('create') }}
              title="Nova pasta"
              style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >+</button>
          </div>

          <button
            onClick={() => setSelectedFolder('root')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              background: selectedFolder === 'root' ? 'var(--accent-bg)' : 'transparent',
              border: `1px solid ${selectedFolder === 'root' ? 'var(--accent-border)' : 'transparent'}`,
              color: selectedFolder === 'root' ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: 13, fontWeight: selectedFolder === 'root' ? 600 : 400,
              marginBottom: 4, transition: 'all 0.15s', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 14 }}>🏠</span>
            <span>Sem pasta</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.4 }}>
              {decks.filter(d => d.folderId == null).length}
            </span>
          </button>

          {folders.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>
              Nenhuma pasta ainda
            </div>
          ) : (
            <FolderTree
              folders={folders}
              selectedId={typeof selectedFolder === 'number' ? selectedFolder : null}
              onSelect={id => setSelectedFolder(id)}
              onToggleReview={handleToggleFolderReview}
            />
          )}

          {typeof selectedFolder === 'number' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  const f = allFolders.find(f => f.id === selectedFolder)
                  if (f) { setFolderName(f.name); setFolderModal({ id: f.id, name: f.name }) }
                }}
                style={{ flex: 1, padding: '5px', fontSize: 11, background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer' }}
              >✎ Renomear</button>
              <button
                onClick={() => handleDeleteFolder(selectedFolder)}
                style={{ padding: '5px 8px', fontSize: 11, background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--red)', cursor: 'pointer', opacity: 0.7 }}
              >✕</button>
            </div>
          )}
        </div>

        {/*Conteúdo*/}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Linha 1: título + ações */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.6px', margin: 0 }}>
                {selectedFolder === 'root' ? 'Decks' : (allFolders.find(f => f.id === selectedFolder)?.name || 'Pasta')}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>
                {loading ? '—' : `${visibleDecks.length} deck${visibleDecks.length !== 1 ? 's' : ''}`}
                {!loading && decks.length > 0 && (
                  <span style={{ marginLeft: 8, color: '#22d3a5', fontSize: 12 }}>· {enabledCount} para revisão</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {typeof selectedFolder === 'number' && (
                <button
                  onClick={() => { setFolderName(''); setFolderParentId(selectedFolder); setFolderModal('create') }}
                  style={{ padding: '9px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}
                >📁 Nova subpasta</button>
              )}
              <button onClick={openDeckCreate} style={{ padding: '9px 16px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + Novo deck
              </button>
            </div>
          </div>

          {/* Linha 2: busca + sort + view */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            {/* Busca */}
            <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-faint)', pointerEvents: 'none' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar decks..."
                style={{
                  width: '100%', padding: '8px 32px 8px 32px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 9, color: 'var(--text)', fontFamily: 'inherit',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

            {/* Sort */}
            <div style={{ display: 'flex', gap: 4 }}>
              {([
                { field: 'name'    as SortField, label: 'Nome' },
                { field: 'cards'   as SortField, label: 'Cards' },
                { field: 'created' as SortField, label: 'Data' },
              ]).map(({ field, label }) => {
                const active = sortField === field
                return (
                  <button key={field} onClick={() => toggleSort(field)} style={{
                    padding: '6px 11px', borderRadius: 8,
                    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-bg)' : 'var(--surface)',
                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
                  }}>
                    {label}
                    {active && <span style={{ fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                )
              })}
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 2, gap: 2 }}>
              {(['grid', 'list'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} title={mode === 'grid' ? 'Grade' : 'Lista'} style={{
                  width: 28, height: 26, borderRadius: 6, border: 'none',
                  background: viewMode === mode ? 'var(--surface2)' : 'transparent',
                  color: viewMode === mode ? 'var(--text)' : 'var(--text-faint)',
                  cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {mode === 'grid' ? '⊞' : '☰'}
                </button>
              ))}
            </div>
          </div>

          {/* Badge de busca */}
          {search && (
            <div style={{ marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
              {visibleDecks.length === 0
                ? <span>Nenhum resultado para <strong>"{search}"</strong></span>
                : <span><strong>{visibleDecks.length}</strong> resultado{visibleDecks.length !== 1 ? 's' : ''} para <strong>"{search}"</strong></span>
              }
            </div>
          )}

          {/* Conteúdo principal */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : visibleDecks.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{search ? '🔍' : '📭'}</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                {search ? `Nenhum deck encontrado para "${search}".` : selectedFolder === 'root' ? 'Nenhum deck sem pasta.' : 'Nenhum deck nesta pasta.'}
              </p>
              {!search && (
                <button onClick={openDeckCreate} style={{ padding: '10px 24px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Criar deck
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {visibleDecks.map(deck => (
                <DeckCard
                  key={deck.id} deck={deck}
                  onEdit={() => { setDeckName(deck.name); setDeckDesc(deck.description || ''); setDeckModal(deck) }}
                  onDelete={() => handleDeleteDeck(deck.id)}
                  onToggleReview={() => handleToggleDeckReview(deck.id)}
                  onMoveToFolder={() => { setMoveFolderId(''); setMoveModal(deck) }}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header colunas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 120px', gap: 12, padding: '4px 14px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <button onClick={() => toggleSort('name')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: sortField === 'name' ? 'var(--accent)' : 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Nome</span>
                  {sortField === 'name' && <span style={{ fontSize: 10, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <button onClick={() => toggleSort('cards')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: sortField === 'cards' ? 'var(--accent)' : 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cards</span>
                  {sortField === 'cards' && <span style={{ fontSize: 10, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </button>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Revisão</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ações</span>
              </div>
              {visibleDecks.map(deck => (
                <DeckListRow
                  key={deck.id} deck={deck}
                  color={deck.color || PALETTE[deck.id % PALETTE.length]}
                  onEdit={() => { setDeckName(deck.name); setDeckDesc(deck.description || ''); setDeckModal(deck) }}
                  onDelete={() => handleDeleteDeck(deck.id)}
                  onToggleReview={() => handleToggleDeckReview(deck.id)}
                  onMoveToFolder={() => { setMoveFolderId(''); setMoveModal(deck) }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/*Modal Deck*/}
      {deckModal && (
        <Modal title={deckModal === 'create' ? 'Novo Deck' : 'Editar Deck'} onClose={() => setDeckModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {deckModal === 'create' && (
              <div style={{ padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📁</span>
                <span>Será criado em: <strong style={{ color: 'var(--text)' }}>
                  {deckTargetFolder ? (allFolders.find(f => f.id === deckTargetFolder)?.name ?? 'Pasta') : 'Sem pasta (raiz)'}
                </strong></span>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nome</label>
              <input value={deckName} onChange={e => setDeckName(e.target.value)} placeholder="Ex: Inglês B2" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Descrição</label>
              <textarea value={deckDesc} onChange={e => setDeckDesc(e.target.value)} placeholder="Opcional..." rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setDeckModal(null)} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSaveDeck} disabled={saving || !deckName.trim()} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/*Modal Pasta*/}
      {folderModal && (
        <Modal title={folderModal === 'create' ? 'Nova Pasta' : 'Renomear Pasta'} onClose={() => setFolderModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nome</label>
              <input value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="Ex: Idiomas" style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent-border)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            {folderModal === 'create' && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dentro de</label>
                <select value={folderParentId} onChange={e => setFolderParentId(Number(e.target.value) || '')}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Raiz (sem pasta pai)</option>
                  {allFolders.map(f => (
                    <option key={f.id} value={f.id}>{'  '.repeat(f.depth)}{f.depth > 0 ? '└ ' : ''}{f.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setFolderModal(null)} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSaveFolder} disabled={saving || !folderName.trim()} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/*Modal Mover Deck*/}
      {moveModal && (
        <Modal title={`Mover "${moveModal.name}"`} onClose={() => setMoveModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mover para</label>
              <select value={moveFolderId} onChange={e => setMoveFolderId(Number(e.target.value) || '')}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Sem pasta (raiz)</option>
                {allFolders.map(f => (
                  <option key={f.id} value={f.id}>{'  '.repeat(f.depth)}{f.depth > 0 ? '└ ' : ''}📁 {f.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setMoveModal(null)} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleMoveToFolder} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Movendo...' : 'Mover'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/*Modal deletar pasta*/}
      {deleteFolderModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => !deleteFolderLoading && setDeleteFolderModal(null)}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🗑</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-h)' }}>Excluir pasta</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>"{deleteFolderModal.name}"</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '16px 0', padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              O que deseja fazer com os <strong style={{ color: 'var(--text)' }}>decks e subpastas</strong> dentro desta pasta?
            </p>
            <button disabled={deleteFolderLoading} onClick={() => confirmDeleteFolder(false)}
              style={{ width: '100%', padding: '14px 16px', marginBottom: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, cursor: deleteFolderLoading ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.15s', opacity: deleteFolderLoading ? 0.6 : 1 }}
              onMouseEnter={e => !deleteFolderLoading && (e.currentTarget.style.borderColor = 'var(--border2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-h)', marginBottom: 3 }}>📂 Deixar os decks soltos</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>A pasta é removida, mas os decks e subpastas permanecem na raiz. Nenhum card é perdido.</div>
            </button>
            <button disabled={deleteFolderLoading} onClick={() => confirmDeleteFolder(true)}
              style={{ width: '100%', padding: '14px 16px', marginBottom: 20, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, cursor: deleteFolderLoading ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.15s', opacity: deleteFolderLoading ? 0.6 : 1 }}
              onMouseEnter={e => !deleteFolderLoading && (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)')}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--red)', marginBottom: 3 }}>🗑 Apagar tudo dentro</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Remove a pasta, todos os decks, subpastas e <strong style={{ color: 'var(--red)' }}>todos os cards</strong> permanentemente. Essa ação não pode ser desfeita.</div>
            </button>
            <button disabled={deleteFolderLoading} onClick={() => setDeleteFolderModal(null)}
              style={{ width: '100%', padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
              {deleteFolderLoading ? 'Aguarde...' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}