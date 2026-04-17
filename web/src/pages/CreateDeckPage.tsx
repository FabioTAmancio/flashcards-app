import { useState } from 'react'
import { deckService } from '../services/deck.service'
import { useNavigate } from 'react-router-dom'


export default function CreateDeckPage() {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [subject, setSubject] = useState('')
    const [color, setColor] = useState('#6366f1')
    const [isPublic, setIsPublic] = useState(false)

    const navigate = useNavigate()

    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault()
        
        try {
            await deckService.create(
                name,
                description)

            navigate('/decks')
        } catch (err: any) {
            console.error('ERRO COMPLETO:', err)
            console.error('RESPONSE:', err.response)

            alert(err.response?.data?.message || 'Erro ao criar deck')
        }
    }

    return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">Criar Deck</h2>

        <input
          placeholder="Nome"
          className="w-full mb-3 p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Descrição"
          className="w-full mb-3 p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          placeholder="Matéria"
          className="w-full mb-3 p-2 border rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <input
          type="color"
          className="w-full mb-3 p-2 border rounded"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Público
        </label>

        <button className="w-full bg-indigo-600 text-white py-2 rounded">
          Criar
        </button>
      </form>
    </div>
    )
}