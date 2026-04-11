import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
import Settings from './pages/Settings.jsx'
import MatchHistory from './pages/MatchHistory.jsx'
import LiveGame from './pages/LiveGame.jsx'

/**
 * HashRouter is used because Electron loads files via file:// protocol,
 * which doesn't support the HTML5 history API used by BrowserRouter.
 */
export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/matches" replace />} />
            <Route path="/matches" element={<MatchHistory />} />
            <Route path="/live"    element={<LiveGame />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  )
}
