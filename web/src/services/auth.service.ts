import api from './api'

export const authService = {

    login: async (email: string, password: string) => {
        const { data } =await api.post('/auth/login', {
            email,
            password
        })

        // save token
        localStorage.setItem('token', data.token)

        const user = {
            name: data.name,
            email: data.email,
            role: data.role
        }

        // save user
        localStorage.setItem('user', JSON.stringify(user))

        return {
            token: data.token,
            user
        }
    },

    logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    
}
