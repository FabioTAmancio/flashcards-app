import api from './api'

export type UserProfile = {
    id: number
        name: string
        email: string
    avatarUrl: string | null
    plan: 'FREE' | 'PREMIUM'
    emailVerified: boolean
    totalDecks: number
    totalCards: number
    currentStreak: number
}

export const profileService = {
    get: async(): Promise<UserProfile> => {
        const { data } = await api.get('/profile')
        return data
    },

    update: async(name: string, avatarUrl?: string): Promise<UserProfile> => {
        const { data } = await api.patch('/profile', { name, avatarUrl })
        return data
    },

    uploadAvatar: async(file:File): Promise<string> => {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/profile/avatar', form)
        return data
    },

    upgrade: async(): Promise<UserProfile> => {
        const { data } = await api.post('/profile/upgrade')
        return data
    }
}