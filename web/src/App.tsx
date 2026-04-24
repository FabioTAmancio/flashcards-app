import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import DecksPage from './pages/DecksPage'
import FlashcardsPage from './pages/FlashcardPage'
import ReviewPage from './pages/ReviewPage'
import ImportPage from './pages/ImportPage'
import StatsPage from './pages/StatsPage'

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}

export default App