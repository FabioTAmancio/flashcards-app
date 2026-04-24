import api from './api'

export const deckService = {
    
    getAll: async () => {
        const { data } = await api.get('/decks')
        return data
    },
    create: async (name: string, description: string) => {
        const { data } = await api.post('/decks', { name, description })
        return data
    },
    update: async (id: number, name: string, description: string) => {
        const { data } = await api.put(`/decks/${id}`, { name, description })
        return data
    },
    toggleReview: async (id: number) => {
        const { data } = await api.patch(`/decks/${id}/toggle-review`)
        return data
    },
    delete: async (id: number) => {
        await api.delete(`/decks/${id}`)
    },
}

export const flashcardService = {
    getByDeck: async (deckId: number) => {
        const { data } = await api.get(`/flashcards/deck/${deckId}`)
        return data
    },
    create: async (deckId: number, front: string, back: string, subject: string) => {
        const { data } = await api.post('/flashcards', { deckId, front, back, subject })
        return data
    },
    import: async (deckId: number, front: string, back: string, subject: string) => {
        await api.post(`/flashcards/import/${deckId}`, { front, back, subject})
    },
    update: async (deckId: number, front: string, back: string, subject: string) => {
        const { data } = await api.put('/flashcards', { deckId, front, back, subject })
        return data
    },
    delete: async (id: number) => {
        await api.delete(`/flashcards/${id}`)
    },
}

export const reviewService = {
    // if deckId = undefined -> all decks enabled
  getDueFlashcards: async (deckId?: number) => {
    const params = deckId ? { deckId } : {}
    const { data } = await api.get('/review/due', { params })
    return data
  },
  review: async (flashcardId: number, quality: number) => {
    await api.post(`/review/${flashcardId}`, { quality })
  }
}

export const statsService =  {
    get: async () => {
        const { data } = await api.get('stats')
        return data
    }
}