import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { profileService } from '../services/profile.service'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileService.get()
        setProfile(data)
        setName(data.name)
      } catch (err) {
        setError('Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  async function handleUpdate() {
    try {
      let avatarUrl = profile?.avatarUrl

      // se tiver arquivo, faz upload
      if (file) {
        avatarUrl = await profileService.uploadAvatar(file)
      }

      const updated = await profileService.update(
        name,
        avatarUrl || undefined
      )

      setProfile(updated)
      alert('Perfil atualizado!')
    } catch (err) {
      alert('Erro ao atualizar perfil')
    }
  }

  async function handleUpgrade() {
    try {
      const updated = await profileService.upgrade()
      setProfile(updated)
      alert('Agora você é PREMIUM 🚀')
    } catch {
      alert('Erro ao fazer upgrade')
    }
  }

  if (loading) return <p>Carregando...</p>
  if (error) return <p>{error}</p>
  if (!profile) return null

  return (
    <>
      <Navbar />

      <div style={{ padding: 20 }}>
        <h1>Perfil</h1>

        {/* Avatar */}
        <div>
          <img
            src={profile.avatarUrl || 'https://via.placeholder.com/100'}
            alt="avatar"
            width={100}
            height={100}
          />
        </div>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {/* Nome */}
        <div>
          <label>Nome:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email */}
        <p>Email: {profile.email}</p>

        {/* Stats */}
        <div>
          <p>Plano: {profile.plan}</p>
          <p>Decks: {profile.totalDecks}</p>
          <p>Cards: {profile.totalCards}</p>
          <p>Streak: {profile.currentStreak}</p>
        </div>

        <button onClick={handleUpdate}>
          Salvar alterações
        </button>

        {profile.plan === 'FREE' && (
          <button onClick={handleUpgrade}>
            Virar PREMIUM
          </button>
        )}
      </div>
    </>
  )
}