import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function PrivateRoute({ children }: any) {
    //const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    const { user, isAuthenticated} = useAuthStore()

    if(!user && !isAuthenticated) {
        return <Navigate to="/login" />
    }

    return children
}