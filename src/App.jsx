import { useState, useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'

export default function App() {
  const [user, setUser] = useState(null)

  // Cek apakah user sudah login sebelumnya
  useEffect(() => {
    const sesi = localStorage.getItem('sesiSikap')
    if (sesi) {
      setUser(JSON.parse(sesi))
    }
  }, [])

  const handleLoginSukses = (dataUser) => {
    setUser(dataUser) // Ini akan dipanggil oleh onLoginSukses di Login.jsx
  }

  const handleLogout = () => {
    localStorage.removeItem('sesiSikap')
    setUser(null)
  }

  return (
    <div>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSukses={handleLoginSukses} />
      )}
    </div>
  )
}