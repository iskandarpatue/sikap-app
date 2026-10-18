import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

export default function ScanPerpustakaan() {
  const [mode, setMode] = useState('kunjungan') // kunjungan, pinjam, kembali
  const [nisn, setNisn] = useState('')
  const [isbn, setIsbn] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState(null) // { type: 'success' | 'error', text: '' }
  const [riwayatHariIni, setRiwayatHariIni] = useState([])

  const inputNisnRef = useRef(null)
  const inputIsbnRef = useRef(null)

  useEffect(() => {
    ambilRiwayatHariIni()
    // Auto focus ke input saat mode berganti
    if (mode === 'kunjungan' || mode === 'pinjam') {
      setTimeout(() => inputNisnRef.current?.focus(), 100)
    } else {
      setTimeout(() => inputIsbnRef.current?.focus(), 100)
    }
  }, [mode])

  // --- AMBIL RIWAYAT HARI INI ---
  const ambilRiwayatHariIni = async () => {
    const hariIni = new Date().toLocaleDateString('id-ID')
    const { data } = await supabase
      .from('sirkulasi_perpus')
      .select('*')
      .order('id', { ascending: false })
      .limit(10) // Ambil 10 aktivitas terakhir
    
    if (data) setRiwayatHariIni(data)
  }

  // --- HELPER: CARI MURID & BUKU ---
  const cariMurid = async (nisn_cari) => {
    const { data } = await supabase.from('students').select('*').eq('nisn', nisn_cari).single()
    return data
  }

  const cariBuku = async (isbn_cari) => {
    const { data } = await supabase.from('buku').select('*').eq('isbn', isbn_cari).single()
    return data
  }

  // --- PROSES SUBMIT SCANNER ---
  const prosesScan = async (e) => {
    e.preventDefault()
    setLoading(true)
    setPesan(null)
    const tglSekarang = new Date().toLocaleString('id-ID')

    try {
      // 1. MODE KUNJUNGAN
      if (mode === 'kunjungan') {
        const murid = await cariMurid(nisn)
        if (!murid) throw new Error('Data murid tidak ditemukan!')

        const { error } = await supabase.from('sirkulasi_perpus').insert([{
          nisn_murid: murid.nisn,
          nama_murid: murid.nama,
          jenis_layanan: 'Kunjungan',
          status: 'Hadir',
          tgl_pinjam: tglSekarang
        }])
        if (error) throw error
        
        setPesan({ type: 'success', text: `Selamat datang di perpustakaan, ${murid.nama}!` })
        setNisn('')
        inputNisnRef.current?.focus()
      }

      // 2. MODE PEMINJAMAN
      else if (mode === 'pinjam') {
        const murid = await cariMurid(nisn)
        if (!murid) throw new Error('Data murid tidak ditemukan!')
        
        const buku = await cariBuku(isbn)
        if (!buku) throw new Error('Data buku tidak ditemukan di katalog!')
        if (buku.stok <= 0) throw new Error('Maaf, stok buku habis/sedang dipinjam semua.')

        // Catat di sirkulasi
        const { error: errSirkulasi } = await supabase.from('sirkulasi_perpus').insert([{
          nisn_murid: murid.nisn,
          nama_murid: murid.nama,
          isbn_buku: buku.isbn,
          judul_buku: buku.judul,
          jenis_layanan: 'Peminjaman',
          status: 'Dipinjam',
          tgl_pinjam: tglSekarang
        }])
        if (errSirkulasi) throw errSirkulasi

        // Kurangi stok buku
        await supabase.from('buku').update({ stok: buku.stok - 1 }).eq('isbn', buku.isbn)

        setPesan({ type: 'success', text: `Sukses! "${buku.judul}" berhasil dipinjam oleh ${murid.nama}.` })
        setNisn('')
        setIsbn('')
        inputNisnRef.current?.focus()
      }

      // 3. MODE PENGEMBALIAN
      else if (mode === 'kembali') {
        const buku = await cariBuku(isbn)
        if (!buku) throw new Error('Data buku tidak dikenali sistem!')

        // Cari data pinjaman yang masih aktif (belum dikembalikan)
        const { data: dataPinjam } = await supabase
          .from('sirkulasi_perpus')
          .select('*')
          .eq('isbn_buku', isbn)
          .eq('status', 'Dipinjam')
          .order('id', { ascending: false })
          .limit(1)
          .single()

        if (!dataPinjam) throw new Error('Buku ini tidak sedang dipinjam oleh siapapun.')

        // Update status di sirkulasi
        const { error: errUpdate } = await supabase.from('sirkulasi_perpus').update({
          status: 'Dikembalikan',
          tgl_kembali: tglSekarang
        }).eq('id', dataPinjam.id)
        if (errUpdate) throw errUpdate

        // Tambah kembali stok buku
        await supabase.from('buku').update({ stok: buku.stok + 1 }).eq('isbn', buku.isbn)

        setPesan({ type: 'success', text: `Buku "${buku.judul}" berhasil dikembalikan oleh ${dataPinjam.nama_murid}. Stok telah diupdate.` })
        setIsbn('')
        inputIsbnRef.current?.focus()
      }

    } catch (err) {
      setPesan({ type: 'error', text: err.message })
    }
    
    setLoading(false)
    ambilRiwayatHariIni()
  }

  // --- FUNGSI PINDAH FOKUS INPUT ---
  const handleNisnEnter = (e) => {
    // Jika di mode pinjam, saat tekan enter di NISN, pindah fokus ke ISBN
    if (e.key === 'Enter' && mode === 'pinjam' && nisn.trim() !== '') {
      e.preventDefault()
      inputIsbnRef.current?.focus()
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* KOTAK NAVIGASI MODE */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => { setMode('kunjungan'); setPesan(null) }} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: mode === 'kunjungan' ? '3px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: mode === 'kunjungan' ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
          <span style={{ fontSize: '30px' }}>👋</span>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: mode === 'kunjungan' ? '#1d4ed8' : '#4b5563' }}>Mode Kunjungan</span>
        </button>
        
        <button onClick={() => { setMode('pinjam'); setPesan(null) }} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: mode === 'pinjam' ? '3px solid #f59e0b' : '1px solid #d1d5db', backgroundColor: mode === 'pinjam' ? '#fffbeb' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
          <span style={{ fontSize: '30px' }}>📖</span>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: mode === 'pinjam' ? '#b45309' : '#4b5563' }}>Mode Peminjaman</span>
        </button>
        
        <button onClick={() => { setMode('kembali'); setPesan(null) }} style={{ flex: 1, padding: '20px', borderRadius: '10px', border: mode === 'kembali' ? '3px solid #10b981' : '1px solid #d1d5db', backgroundColor: mode === 'kembali' ? '#ecfdf5' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: '0.2s' }}>
          <span style={{ fontSize: '30px' }}>🔄</span>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: mode === 'kembali' ? '#047857' : '#4b5563' }}>Mode Pengembalian</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* PANEL SCANNER */}
        <div style={{ flex: 1.5, minWidth: '350px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#1f2937', textAlign: 'center' }}>
              {mode === 'kunjungan' && 'Arahkan Scanner ke Kartu Murid'}
              {mode === 'pinjam' && 'Scan Kartu Murid, Lalu Scan Buku'}
              {mode === 'kembali' && 'Arahkan Scanner ke Barcode Buku'}
            </h2>

            <form onSubmit={prosesScan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {(mode === 'kunjungan' || mode === 'pinjam') && (
                <div>
                  <label style={{ fontWeight: 'bold', color: '#4b5563', display: 'block', marginBottom: '8px' }}>Scan NISN Murid</label>
                  <input 
                    ref={inputNisnRef}
                    type="text" 
                    value={nisn} 
                    onChange={(e) => setNisn(e.target.value)}
                    onKeyDown={handleNisnEnter}
                    placeholder="Contoh: 0111121747..." 
                    style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '2px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', outlineColor: '#3b82f6' }} 
                    required 
                  />
                </div>
              )}

              {(mode === 'pinjam' || mode === 'kembali') && (
                <div>
                  <label style={{ fontWeight: 'bold', color: '#4b5563', display: 'block', marginBottom: '8px' }}>Scan ISBN / Kode Buku</label>
                  <input 
                    ref={inputIsbnRef}
                    type="text" 
                    value={isbn} 
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Contoh: 9786022828..." 
                    style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: '2px solid #cbd5e1', boxSizing: 'border-box', backgroundColor: '#f8fafc', outlineColor: '#f59e0b' }} 
                    required 
                  />
                </div>
              )}

              {/* Tombol Tersembunyi (Trigger dari Scanner Enter) */}
              <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
                {loading ? 'Memproses Data...' : 'PROSES (Atau Tekan Enter)'}
              </button>

            </form>

            {/* AREA PESAN FEEDBACK */}
            {pesan && (
              <div style={{ marginTop: '25px', padding: '15px', borderRadius: '8px', backgroundColor: pesan.type === 'success' ? '#dcfce7' : '#fee2e2', color: pesan.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${pesan.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pesan.type === 'success' ? '✅' : '❌'} {pesan.text}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL RIWAYAT AKTIVITAS TERAKHIR */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>🕒 Aktivitas Terakhir Hari Ini</h3>
          
          {riwayatHariIni.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', margin: '30px 0' }}>Belum ada aktivitas sirkulasi.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {riwayatHariIni.map((riwayat) => (
                <div key={riwayat.id} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>{riwayat.nama_murid}</span>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: riwayat.jenis_layanan === 'Kunjungan' ? '#e0f2fe' : riwayat.status === 'Dipinjam' ? '#fef3c7' : '#dcfce7', color: riwayat.jenis_layanan === 'Kunjungan' ? '#0369a1' : riwayat.status === 'Dipinjam' ? '#92400e' : '#166534', fontWeight: 'bold' }}>
                      {riwayat.jenis_layanan === 'Kunjungan' ? 'Tamu' : riwayat.status}
                    </span>
                  </div>
                  {riwayat.judul_buku && (
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#475569' }}>📖 {riwayat.judul_buku}</p>
                  )}
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{riwayat.tgl_kembali ? riwayat.tgl_kembali : riwayat.tgl_pinjam}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
