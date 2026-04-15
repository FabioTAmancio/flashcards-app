import { create } from 'zustand'

type User = {
    name: string
    email: string
    role: string 
}

interface AuthStore {
    user: User | null
    isAuthenticated: boolean
    setUser: (user: User | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>((set) =>  ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('token'),

    setUser: (user) => {
        if(user) {
            localStorage.setItem('user', JSON.stringify(user))
            localStorage.setItem('token', localStorage.getItem('token') || '')
        }
        set({ user, isAuthenticated: !!user})
    },

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, isAuthenticated: false})
    }
}))