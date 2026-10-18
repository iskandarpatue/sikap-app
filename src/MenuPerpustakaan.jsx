import { useState } from 'react'

export default function MenuPerpustakaan() {
  // State untuk berpindah layar: 'ringkasan' atau 'editor'
  const [layarAktif, setLayarAktif] = useState('ringkasan')
  
  // State Data Perpustakaan (Dummy / Siap disambung ke Supabase)
  const [isPublished, setIsPublished] = useState(true)
  const [dataPerpus, setDataPerpus] = useState({
    nama: 'Perpustakaan Bahari Samudera Ilmu',
    jenis: 'SMA/MA/SMK',
    npp: '7501051E0000001',
    alamat: 'Jl. Buke Panai, Desa Bongo, Kec. Batudaa Pantai',
    provinsi: 'GORONTALO',
    kabupaten: 'KABUPATEN GORONTALO',
    url: 'perpustakaan-bahari-samudera-ilmu',
    logo: null
  })

  // State untuk Tab Editor
  const [tabEditor, setTabEditor] = useState('identitas')

  const handleInput = (e) => {
    setDataPerpus({ ...dataPerpus, [e.target.name]: e.target.value })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDataPerpus({ ...dataPerpus, logo: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  // ==========================================
  // LAYAR 1: RINGKASAN & PILIH PERPUSTAKAAN
  // ==========================================
  if (layarAktif === 'ringkasan') {
    return (
      <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        
        {/* KOLOM KIRI */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1f2937' }}>Buat Perpustakaan Baru</h3>
            <input type="text" placeholder="Nama perpustakaan" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <button style={{ padding: '8px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Buat</button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1f2937' }}>Perpustakaan Anda</h3>
            <div style={{ border: '1px solid #e5e7eb', padding: '15px', borderRadius: '6px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {dataPerpus.logo ? <img src={dataPerpus.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{ fontSize: '24px' }}>🏫</span>}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#1f2937' }}>{dataPerpus.nama}</h4>
                <p style={{ margin: '3px 0 10px 0', fontSize: '12px', color: '#6b7280' }}>{dataPerpus.alamat}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '4px 12px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Pilih</button>
                  <button style={{ padding: '4px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Hapus</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div style={{ flex: 2, minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>Profil Perpustakaan Aktif</h3>
            <button 
              onClick={() => setIsPublished(!isPublished)}
              style={{ padding: '8px 20px', backgroundColor: isPublished ? '#d97706' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            
            {/* Info Utama */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {dataPerpus.logo ? <img src={dataPerpus.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{ fontSize: '40px' }}>🏫</span>}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', color: '#111827' }}>{dataPerpus.nama}</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>PERPUSTAKAAN {dataPerpus.jenis}</span>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>✓ NPP: {dataPerpus.npp}</span>
                  </div>
                </div>
              </div>
              <button style={{ padding: '8px 15px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                ↗️ Lihat Profil Publik
              </button>
            </div>

            {/* Buka Editor */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                ✨
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111827' }}>Editor Profil & Website</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>Kelola tampilan publik perpustakaan Anda. Atur Visi Misi, Jam Buka, Media Sosial, FAQ, dan widget lainnya agar terlihat profesional.</p>
              </div>
              <button onClick={() => setLayarAktif('editor')} style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                📝 Buka Editor
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // LAYAR 2: EDITOR PROFIL & WEBSITE
  // ==========================================
  return (
    <div style={{ padding: '0', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER EDITOR */}
      <div style={{ backgroundColor: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setLayarAktif('ringkasan')} style={{ padding: '8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>⬅️</button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Editor Profil</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Kelola tampilan publik website</p>
          </div>
        </div>
        <select style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}>
          <option>{dataPerpus.nama}</option>
        </select>
      </div>

      {/* TAB MENU EDITOR */}
      <div style={{ backgroundColor: 'white', padding: '0 30px', display: 'flex', gap: '30px', borderBottom: '1px solid #e5e7eb' }}>
        {['1. Identitas Utama', '2. Profil & Akreditasi', '3. Layanan & Jam Buka', '4. FAQ & Media Sosial'].map((tab, idx) => {
          const tabId = tab.split(' ')[1].toLowerCase()
          return (
            <button 
              key={idx}
              onClick={() => setTabEditor(tabId)}
              style={{ 
                padding: '15px 0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                color: tabEditor === tabId ? '#4f46e5' : '#6b7280',
                borderBottom: tabEditor === tabId ? '3px solid #4f46e5' : '3px solid transparent'
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* KONTEN TAB IDENTITAS UTAMA */}
      {tabEditor === 'identitas' && (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* BOX KIRI: NAMA & LOGO */}
            <div style={{ flex: 2, backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>LOGO</span>
                <div style={{ width: '100px', height: '100px', backgroundColor: '#f3f4f6', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {dataPerpus.logo ? <img src={dataPerpus.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span>Logo</span>}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '11px', width: '120px' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>NAMA PERPUSTAKAAN</label>
                  <input type="text" name="nama" value={dataPerpus.nama} onChange={handleInput} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>JENIS</label>
                  <select name="jenis" value={dataPerpus.jenis} onChange={handleInput} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                    <option>SMA/MA/SMK</option>
                    <option>SMP/MTs</option>
                    <option>SD/MI</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BOX KANAN: URL */}
            <div style={{ flex: 1, backgroundColor: '#f5f3ff', padding: '25px', borderRadius: '8px', border: '1px solid #ede9fe', minWidth: '250px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4c1d95', display: 'block', marginBottom: '10px' }}>URL WEBSITE</label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 10px', marginBottom: '10px' }}>
                <input type="text" name="url" value={dataPerpus.url} onChange={handleInput} style={{ border: 'none', outline: 'none', flex: 1, fontSize: '14px' }} />
                <span style={{ color: '#9ca3af' }}>🔗</span>
              </div>
              <p style={{ fontSize: '11px', color: '#6d28d9', margin: '0 0 15px 0', wordBreak: 'break-all' }}>pustakawan.org/{dataPerpus.url}</p>
              <button style={{ padding: '8px 15px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cek Ketersediaan</button>
            </div>
          </div>

          {/* LOKASI & KONTAK */}
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>PROVINSI</label>
                <select name="provinsi" value={dataPerpus.provinsi} onChange={handleInput} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  <option>GORONTALO</option>
                  <option>SULAWESI UTARA</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>KABUPATEN/KOTA</label>
                <select name="kabupaten" value={dataPerpus.kabupaten} onChange={handleInput} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                  <option>KABUPATEN GORONTALO</option>
                  <option>KOTA GORONTALO</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>ALAMAT LENGKAP</label>
              <textarea name="alamat" value={dataPerpus.alamat} onChange={handleInput} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', height: '80px', resize: 'none', boxSizing: 'border-box' }}></textarea>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', display: 'block', marginBottom: '5px' }}>KONTAK</label>
              <input type="text" placeholder="No HP/Telp" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>

        </div>
      )}

      {/* TOMBOL SIMPAN MELAYANG */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px' }}>
        <button onClick={() => alert('Data Profil Disimpan!')} style={{ padding: '15px 30px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          💾 Simpan Semua
        </button>
      </div>

    </div>
  )
}