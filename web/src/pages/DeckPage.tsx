import { useEffect, useState } from 'react'
import { deckService } from '../services/deck.service'
import { useNavigate } from 'react-router-dom'

type Deck = {
    id: number
    name: string
    description: string
    color: string
    subject: string
    is_public: boolean
}

export default function DeckPage() {
    const [decks, setDecks] = useState<Deck[]>([])
    const navigate = useNavigate()

    useEffect(() => {
        loadDecks()
    }, [])

    async function loadDecks() {
        const data = await deckService.getAll()
        setDecks(data)
    }

    return (
        <div className='p-6'>
            <h1 className='text-2x1 font-bold mb-6'>My Decks</h1>

            <div className='grid gap-4'>
                {decks.map((deck) =>(
                    <div
                        key={deck.id}
                        className='p-4 rounded-xl shadow cursor-pointer'
                        style={{ backgroundColor: deck.color }}
                        onClick={() => navigate(`review?deckId=${deck.id}`)}
                    >
                        <h2 className='text-lg font-bold'>{deck.id}</h2>
                        <p className='text-sm'>{deck.description}</p>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/decks/create')}
                className='mb-4 px-2 bg-indigo-600 text-white rounded-lg'
            >
                + Create Deck
            </button>

        </div>
    )
}