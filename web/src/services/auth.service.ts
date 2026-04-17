import api from './api'

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })

    console.log("LOGIN RESPONSE:", data)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
