import api from './api'

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })

    const user = { name: data.name, email: data.email, role: data.role }
    
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))

    return { token: data.token, user }
  },
  register: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    const user = { name: data.name, email: data.email, role: data.role }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    return { token: data.token, user }
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}
