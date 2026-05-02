import api from './api'

export type ImportResult = {
    imported: number
    skipped: number
    imagesUploaded?: number
    errors?: string[]
}

export const importService = {
    apkg: async(deckId: number, file: File): Promise<ImportResult> => {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post(`/import/apkg/${deckId}`, form)
        return data;
    },

    csv: async (deckId: number, cards: { front: string; back: string; subject: string }[]) => {
    let imported = 0, skipped = 0
    for (const c of cards) {
      try {
        await api.post('/flashcards', { deckId, front: c.front, back: c.back, subject: c.subject })
        imported++
      } catch {
        skipped++
      }
    }
    return { imported, skipped }
  },
}