import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function PrivateRoute({ children }: { children: React.ReactNode}) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const hydrated = useAuthStore((s) => s.hydrated)

    if(!hydrated) {
        return null
    }

    if(!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>{ children }</>
}