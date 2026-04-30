import api from './api'

export const deckService = {
  getAll: async () => {
    const { data } = await api.get('/decks')
    return data
  },
  create: async (name: string, description: string, color?: string) => {
    const { data } = await api.post('/decks', { name, description, color })
    return data
  },
  update: async (id: number, name: string, description: string, color?: string) => {
    const { data } = await api.put(`/decks/${id}`, { name, description, color })
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

// Upload de imagem para o Cloudinary via backend
export const imageService = {
  upload: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/images/upload', form)
    return data.url
  },
}

export const flashcardService = {
  getByDeck: async (deckId: number) => {
    const { data } = await api.get(`/flashcards/deck/${deckId}`)
    return data
  },
  create: async (deckId: number, front: string, back: string, subject: string, frontImageUrl?: string, backImageUrl?: string, cardType?: string) => {
      const { data } = await api.post('/flashcards', { deckId, front, back, subject, frontImageUrl, backImageUrl, cardType })
      return data
    },
  import: async (deckId: number, front: string, back: string, subject: string) => {
    await api.post(`/flashcards/import/${deckId}`, { front, back, subject })
  },
  update: async (id: number, front: string, back: string, subject: string, frontImageUrl?: string, backImageUrl?: string, cardType?: string) => {
    const { data } = await api.put(`/flashcards/${id}`, { front, back, subject, frontImageUrl, backImageUrl, cardType })
    return data
  },
  delete: async (id: number) => {
    await api.delete(`/flashcards/${id}`)
  },
}

export const reviewService = {
  // deckId = undefined → todos os decks habilitados
  getDueFlashcards: async (deckId?: number) => {
    const params = deckId ? { deckId } : {}
    const { data } = await api.get('/review/due', { params })
    return data
  },
  review: async (flashcardId: number, quality: number) => {
    await api.post(`/review/${flashcardId}`, { quality })
  },
}

export const statsService = {
  get: async () => {
    const { data } = await api.get('/stats')
    return data
  },
}
