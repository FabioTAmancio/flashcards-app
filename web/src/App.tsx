import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import DecksPage from './pages/DecksPage'
import FlashcardsPage from './pages/FlashcardPage'
import ReviewPage from './pages/ReviewPage'
import ImportPage from './pages/ImportPage'
import StatsPage from './pages/StatsPage'
import EmailBanner from './components/EmailBanner'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const verified = params.get('verified')
    if(verified === 'true') {
      const stored = localStorage.getItem('user')
      if(stored) {
        const user = JSON.parse(stored)
        user.emailVerified = true
        localStorage.setItem('user', JSON.stringify(user))
      }
      navigate('/decks', { replace: true })
    } else if(verified === 'false') {
      navigate('/decks', { replace: true })
    }
  }, [location.search, navigate])

  return (
    <>
      <EmailBanner />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        {/* Private -> redirect to login if doesnt have auth */}
        <Route path="/" element={<PrivateRoute><Navigate to="/decks" replace /></PrivateRoute>} />
        <Route path="/decks" element={<PrivateRoute><DecksPage /></PrivateRoute>} />
        <Route path="/decks/:deckId" element={<PrivateRoute><FlashcardsPage /></PrivateRoute>} />
        <Route path="/review" element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        <Route path="/import" element={<PrivateRoute><ImportPage /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><StatsPage /></PrivateRoute>} />

        {/* Any unknown route -> root (which redirects according to auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
        {/* Public */}
    </BrowserRouter>
  )
}

export default App