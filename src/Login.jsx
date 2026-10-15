import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onLoginSukses }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    // 1. Cek Login Admin Permanen (Bypass Database)
    if (username === 'admin' && password === 'admin123') {
      const userData = { username: 'admin', nama_lengkap: 'Administrator', role: 'admin' }
      localStorage.setItem('sesiSikap', JSON.stringify(userData))
      onLoginSukses(userData)
      return
    }

    // 2. Cek Akun Guru / Perpus di Database Supabase
    try {
      const { data, error } = await supabase
        .from('akun_petugas')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle()

      if (error || !data) {
        setErrorMsg('Username atau Password salah!')
      } else {
        const userData = { username: data.username, nama_lengkap: data.nama_lengkap, role: data.role }
        localStorage.setItem('sesiSikap', JSON.stringify(userData))
        onLoginSukses(userData)
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1e3a8a', margin: '0 0 10px 0', fontSize: '28px' }}>Sistem SIKAP</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Login untuk mengakses panel Anda</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #fca5a5' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold' }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="Masukkan username..." />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 'bold' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '16px', boxSizing: 'border-box' }} placeholder="Masukkan password..." />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 4px 6px rgba(37,99,235,0.3)' }}>
            {loading ? 'Memeriksa...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  )
}