import { create } from 'zustand'

type User = {
    name: string
    email: string
    role: string 
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    hydrated: boolean // true depois que o local storage foi lido
    setUser: (user: User | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthState>((set) => {

  const storedUser = localStorage.getItem('user')
  const token = localStorage.getItem('token')

  const user = storedUser && storedUser !== 'undefined'
    ? JSON.parse(storedUser)
    : null

  return {
    user,
    isAuthenticated: !!(user && token), //valido so com o user e o token
    hydrated: true,

    setUser: (user) => {
      if (user) localStorage.setItem('user', JSON.stringify(user))
      useAuthStore.setState({ user, isAuthenticated: !!(user && localStorage.getItem('token')) })
    },

    logout: () => {
      localStorage.removeItem('user')
      localStorage.removeItem('token')

      set({
        user: null,
        isAuthenticated: false
      })
    }
  }
})

