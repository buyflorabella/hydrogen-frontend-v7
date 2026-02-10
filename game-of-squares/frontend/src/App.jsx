import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import GamePage from './pages/GamePage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import ContactPage from './pages/ContactPage.jsx'

export default function App() {
  return (
    <>
      <NavBar />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
    </>
  )
}
