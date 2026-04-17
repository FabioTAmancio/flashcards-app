import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ReviewPage from "./pages/ReviewPage"
import LoginPage from "./pages/LoginPage"
import DecksPage from "./pages/DecksPage"
import FlashcardsPage from "./pages/FlashcardPage"

function App() {
  return (<BrowserRouter>
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/decks" replace />} />

      <Route path="/decks" element={
         <DecksPage />
        } />
        <Route path="/decks/:deckId" element={
          <FlashcardsPage />
        } />
        <Route path="/review" element={
          <ReviewPage />
        } />
      </Routes>
  </BrowserRouter>
  )
}

export default App