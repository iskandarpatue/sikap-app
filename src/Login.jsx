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

    // 1. Cek Login Admin Permanen
    if (username === 'admin' && password === 'admin123') {
      const userData = { username: 'admin', nama_lengkap: 'Administrator', role: 'admin' }
      localStorage.setItem('sesiSikap', JSON.stringify(userData))
      onLoginSukses(userData)
      return
    }

    // 2. Cek Akun Guru / Perpus di Supabase
    try {
      const { data, error } = await supabase
        .from('akun_petugas')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle()

      if (error || !data) {
        setErrorMsg('❌ Username atau Password salah!')
      } else {
        const userData = { username: data.username, nama_lengkap: data.nama_lengkap, role: data.role }
        localStorage.setItem('sesiSikap', JSON.stringify(userData))
        onLoginSukses(userData)
      }
    } catch (err) {
      setErrorMsg('⚠️ Gagal terhubung ke server.')
    }
    
    setLoading(false)
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)', 
      padding: '20px', fontFamily: 'sans-serif' 
    }}>
      <div style={{ 
        backgroundColor: 'white', padding: '40px 30px', borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', width: '100%', maxWidth: '400px', 
        position: 'relative', overflow: 'hidden' 
      }}>
        
        {/* Dekorasi Latar Belakang Kartu (Lingkaran Gradien di pojok) */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'linear-gradient(135deg, #dbeafe, #eff6ff)', borderRadius: '50%', zIndex: 0, opacity: 0.6 }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '50%', zIndex: 0, opacity: 0.6 }}></div>
        
        {/* Header Logo & Judul */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#eff6ff', borderRadius: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '40px', margin: '0 auto 15px auto', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)' }}>
            🏫
          </div>
          <h1 style={{ color: '#0f172a', margin: '0 0 5px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>SIKAP</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px', fontWeight: '500' }}>Sistem Informasi Kehadiran & Perpustakaan<br/>SMAN 1 Batudaa Pantai</p>
        </div>

        {/* Pesan Error */}
        {errorMsg && (
          <div style={{ position: 'relative', zIndex: 1, backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '10px', marginBottom: '25px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>👤</span>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required 
                style={{ width: '100%', padding: '14px 14px 14px 45px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' }} 
                placeholder="Masukkan username..." 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '18px' }}>🔒</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
                style={{ width: '100%', padding: '14px 14px 14px 45px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' }} 
                placeholder="Masukkan password..." 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} 
            style={{ padding: '15px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px', boxShadow: '0 10px 20px -5px rgba(37,99,235,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading ? '⏳ Memeriksa...' : '🚀 Masuk Sekarang'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '35px', color: '#94a3b8', fontSize: '12px', position: 'relative', zIndex: 1 }}>
          &copy; {new Date().getFullYear()} Hak Cipta Dilindungi<br/>
          <span style={{ fontWeight: 'bold', color: '#64748b' }}>Developed by Iskandar Patue</span>
        </div>

      </div>
    </div>
  )
}
