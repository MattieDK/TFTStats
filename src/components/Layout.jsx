import Navbar from './Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-tft-dark">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
