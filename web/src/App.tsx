import { BrowserRouter, Routes, Route } from "react-router-dom"
import ReviewPage from "./pages/ReviewPage"
import LoginPage from "./pages/LoginPage"
import DeckPage from "./pages/DeckPage"
import CreateDeckPage from "./pages/CreateDeckPage"
import PrivateRoute from "./components/PrivateRoute"

function App() {
  return (<BrowserRouter>
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/decks" element={<DeckPage />} />
      <Route 
        path="/review"
        element={
          <PrivateRoute>
            <ReviewPage />
          </PrivateRoute>
        }
      />
      <Route path="/decks/create" element={<CreateDeckPage />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App