import api from "./api"

export const reviewService = {
    getDueFlashcards: async () => {
        const { data } = await api.get('/review/due')
        return data
    },

    review: async (flashcardId: number, quality: number) => {
        await api.post(`/review/${flashcardId}`, { quality })
    }
}