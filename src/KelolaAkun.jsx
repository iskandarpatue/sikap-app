import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export default function KelolaAkun() {
  const [daftarAkun, setDaftarAkun] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [role, setRole] = useState('guru')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ambilDataAkun()
  }, [])

  const ambilDataAkun = async () => {
    const { data } = await supabase.from('akun_petugas').select('*').order('id', { ascending: false })
    if (data) setDaftarAkun(data)
  }

  const simpanAkun = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Cek apakah username sudah dipakai
    const { data: cek } = await supabase.from('akun_petugas').select('username').eq('username', username).maybeSingle()
    if (cek) {
      alert('Username sudah digunakan! Pilih username lain.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('akun_petugas').insert([{
      username, password, nama_lengkap: namaLengkap, role
    }])

    if (error) alert('Gagal membuat akun: ' + error.message)
    else {
      alert('Akun berhasil dibuat!')
      setUsername(''); setPassword(''); setNamaLengkap(''); setRole('guru')
      ambilDataAkun()
    }
    setLoading(false)
  }

  const hapusAkun = async (id, nama) => {
    if(!window.confirm(`Hapus akun milik ${nama}?`)) return
    await supabase.from('akun_petugas').delete().eq('id', id)
    ambilDataAkun()
  }

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>🔐 Kelola Akun Petugas & Guru</h2>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Buat Akun Baru</h3>
        <form onSubmit={simpanAkun} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nama Lengkap</label>
            <input type="text" required value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Contoh: Budi Santoso, S.Pd" />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="tanpa spasi" />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label>
            <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Hak Akses (Role)</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="guru">Guru (Akses Kehadiran)</option>
              <option value="perpus">Petugas Perpus (Akses Perpustakaan)</option>
            </select>
          </div>
          <button type="submit" disabled={loading} style={{ padding: '9px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Menyimpan...' : 'Tambah Akun'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>Nama Lengkap</th>
              <th style={{ padding: '12px' }}>Username</th>
              <th style={{ padding: '12px' }}>Password</th>
              <th style={{ padding: '12px' }}>Hak Akses</th>
              <th style={{ padding: '12px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftarAkun.map(akun => (
              <tr key={akun.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{akun.nama_lengkap}</td>
                <td style={{ padding: '12px' }}>{akun.username}</td>
                <td style={{ padding: '12px', color: '#ef4444' }}>{akun.password}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: akun.role === 'guru' ? '#dbeafe' : '#fef3c7', color: akun.role === 'guru' ? '#1e40af' : '#92400e', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>
                    {akun.role === 'guru' ? 'Guru' : 'Perpus'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => hapusAkun(akun.id, akun.nama_lengkap)} style={{ padding: '5px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}