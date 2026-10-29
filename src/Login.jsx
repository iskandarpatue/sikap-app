import { useState } from 'react'
import { supabase } from './supabase' // Tambahan import Supabase
import logoSekolah from './assets/logo_sekolah.ico'

export default function Login({ onLoginSukses }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Cek ke database Supabase (Ganti 'users' jika nama tabel Bapak berbeda)
      const { data, error: err } = await supabase
        .from('users') 
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      // 2. Jika akun tidak ditemukan di database
      if (err || !data) {
        // PINTU DARURAT (Backdoor) untuk Admin jika database bermasalah/kosong
        if (username === 'admin' && password === 'admin123') {
          const adminData = { role: 'admin', nama_lengkap: 'Administrator Utama' }
          localStorage.setItem('sesiSikap', JSON.stringify(adminData))
          onLoginSukses(adminData)
          setLoading(false)
          return
        }
        throw new Error('Username atau Password tidak ditemukan di sistem!')
      }

      // 3. Jika akun ditemukan di database, ekstrak datanya
      const userData = {
        role: data.role, // Pastikan ada kolom 'role' (admin/guru/perpus) di tabel
        nama_lengkap: data.nama_lengkap || data.nama || username
      }

      // 4. Simpan sesi dan masuk ke dashboard
      localStorage.setItem('sesiSikap', JSON.stringify(userData))
      onLoginSukses(userData)

    } catch (err) {
      setError(err.message)
    }
    
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        {/* BAGIAN HEADER & LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src={logoSekolah} 
            alt="Logo SMAN 1 Batudaa Pantai" 
            style={{ width: '110px', height: 'auto', marginBottom: '15px' }} 
          />
          <h1 style={{ margin: '0', color: '#1e3a8a', fontSize: '28px' }}>SIKAP</h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Sistem Informasi Kehadiran & Administrasi Pendidik<br/>
            <strong style={{ color: '#1e293b' }}>SMAN 1 Batudaa Pantai</strong>
          </p>
        </div>

        {/* PESAN ERROR */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#334155', fontWeight: 'bold', fontSize: '14px' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Masukkan username..."
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '15px' }} 
              required 
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#334155', fontWeight: 'bold', fontSize: '14px' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Masukkan password..."
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', outline: 'none', fontSize: '15px' }} 
              required 
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', transition: '0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}>
            {loading ? 'MEMERIKSA DATA...' : 'MASUK'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '12px', color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} SMAN 1 Batudaa Pantai
        </p>
      </div>
    </div>
  )
}
