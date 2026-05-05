import api from './api'

export type AnkiDeckPreview = {
    ankiDeckId: number
    fullPath: string
    deckName: string
    folderPath: string | null
    cardCount: number
    existingDeckId: number | null
    existingDeckName: string | null
    resolution: 'USE_EXISTING' | 'CREATE_NEW'
}

export type ApkgPreview = {
    uploadToken: string
    decks: AnkiDeckPreview[]
}

export type ApkgStructuredResult = {
    decksCreated: number
    decksReused: number
    foldersCreated: number
    cardsImported: number
    cardsSkipped: number
    imagesUploaded: number
    errors: string[]
}

export const ankiImportService = {
    preview: async(file:File): Promise<ApkgPreview> => {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/flashcards/import/anki/preview', form)
        return data
    },

    confirm: async(
        uploadToken: string,
        resolutions: Record<number, 'USE_EXISTING' | 'CREATE_NEW'>
    ): Promise<ApkgStructuredResult> => {
        const { data } = await api.post('/flashcards/import/anki/confirm', {
            uploadToken,
            resolutions
        })
        return data
    },
}