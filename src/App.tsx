import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import GamePage from '@/pages/GamePage'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play/:gameId" element={<GamePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
