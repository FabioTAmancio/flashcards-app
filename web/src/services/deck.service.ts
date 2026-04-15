import api from './api'

export const deckService = {
    
    getAll: async () => {
        const { data } = await api.get('/decks')
        return data;
    },

    create: async (deck: {
        name: string
        description: string
        color: string
        subject: string
        isPublic: boolean
    }) => {
        const { data } = await api.post('/decks', deck)
        return data;
    }
}