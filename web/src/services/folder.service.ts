import api from './api'

export type FolderItem = {
    id: number
    name: string
    parentId: number | null
    reviewEnabled: boolean
    children: FolderItem[]
    decks: DeckInFolder[]
}

export type DeckInFolder = {
    id: number
    name: string
    description: string
    color: string | null
    reviewEnabled: boolean
    cardCount: number
    folderId: number | null
}

export const folderService = {
    getTree: async (): Promise<FolderItem[]> => {
        const { data } = await api.get('/folders')
        return data
    },

    create: async (name: string, parentId?: number): Promise<FolderItem> => {
        const { data } = await api.post('/folders', { name, parentId: parentId ?? null })
        return data
    },

    rename: async (id: number, name: string): Promise<FolderItem> => {
        const { data } = await api.patch(`/folders/${id}/rename`, { name })
        return data
    },

    move: async (id: number, parentId: number | null): Promise<FolderItem> => {
        const { data } = await api.patch(`/folders/${id}/move`, { parentId })
        return data
    },

    toggleReview: async(id: number): Promise<FolderItem> => {
        const { data } = await api.patch(`/folders/${id}/toggle-review`)
        return data
    },

    moveDeckToFolder: async (folderId: number, deckId: number) => {
        const { data } = await api.patch(`/folders/${folderId}/decks/${deckId}`)
        return data
    },

    removeDeckFromFolder: async (deckId: number) => {
        const { data } = await api.patch(`/folders/decks/${deckId}/remove`)
        return data
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/folders/${id}`)
    },
}