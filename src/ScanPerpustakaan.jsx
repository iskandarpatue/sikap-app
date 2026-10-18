import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function ScanPerpustakaan() {
  const [mode, setMode] = useState('kunjungan') // kunjungan, pinjam, kembali
  const [nisn, setNisn] = useState('')
  const [isbn, setIsbn] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState(null)
  const [riwayatHariIni, setRiwayatHariIni] = useState([])

  // State untuk Kamera
  const [kameraAktif, setKameraAktif] = useState(false)
  const [targetScan, setTargetScan] = useState('nisn') // 'nisn' atau 'isbn'

  const inputNisnRef = useRef(null)
  const inputIsbnRef = useRef(null)

  useEffect(() => {
    ambilRiwayatHariIni()
  }, [])

  // --- EFEK UNTUK MENGAKTIFKAN KAMERA ---
  useEffect(() => {
    let scanner = null;
    
    if (kameraAktif) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        // Jika berhasil scan, masukkan hasil ke input yang sesuai
        if (targetScan === 'nisn') {
          setNisn(decodedText)
          if (mode === 'pinjam') setTargetScan('isbn') // Pindah target ke ISBN jika mode pinjam
        } else {
          setIsbn(decodedText)
        }
        
        // Mainkan suara "beep" (opsional)
        const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-07.mp3')
        audio.play().catch(() => {})
        
        // Matikan kamera sejenak setelah berhasil scan
        setKameraAktif(false)
      }, (errorMessage) => {
        // Abaikan error saat kamera sedang mencari barcode
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Gagal mematikan scanner", error));
      }
    }
  }, [kameraAktif, targetScan, mode])

  // --- AMBIL RIWAYAT HARI INI ---
  const ambilRiwayatHariIni = async () => {
    const hariIni = new Date().toLocaleDateString('id-ID')
    const { data } = await supabase
      .from('sirkulasi_perpus')
      .select('*')
      .order('id', { ascending: false })
      .limit(10)
    
    if (data) setRiwayatHariIni(data)
  }

  const cariMurid = async (nisn_cari) => {
    const { data } = await supabase.from('students').select('*').eq('nisn', nisn_cari).single()
    return data
  }

  const cariBuku = async (isbn_cari) => {
    const { data } = await supabase.from('buku').select('*').eq('isbn', isbn_cari).single()
    return data
  }

  // --- PROSES SUBMIT ---
  const prosesScan = async (e) => {
    e.preventDefault()
    setLoading(true)
    setPesan(null)
    const tglSekarang = new Date().toLocaleString('id-ID')

    try {
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
        
        setPesan({ type: 'success', text: `Selamat datang, ${murid.nama}!` })
        setNisn('')
      }
      else if (mode === 'pinjam') {
        const murid = await cariMurid(nisn)
        if (!murid) throw new Error('Data murid tidak ditemukan!')
        
        const buku = await cariBuku(isbn)
        if (!buku) throw new Error('Data buku tidak ditemukan!')
        if (buku.stok <= 0) throw new Error('Stok buku habis.')

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

        await supabase.from('buku').update({ stok: buku.stok - 1 }).eq('isbn', buku.isbn)
        setPesan({ type: 'success', text: `"${buku.judul}" dipinjam oleh ${murid.nama}.` })
        setNisn(''); setIsbn(''); setTargetScan('nisn')
      }
      else if (mode === 'kembali') {
        const buku = await cariBuku(isbn)
        if (!buku) throw new Error('Data buku tidak dikenali!')

        const { data: dataPinjam } = await supabase
          .from('sirkulasi_perpus')
          .select('*')
          .eq('isbn_buku', isbn)
          .eq('status', 'Dipinjam')
          .order('id', { ascending: false })
          .limit(1)
          .single()

        if (!dataPinjam) throw new Error('Buku ini tidak sedang dipinjam.')

        const { error: errUpdate } = await supabase.from('sirkulasi_perpus').update({
          status: 'Dikembalikan',
          tgl_kembali: tglSekarang
        }).eq('id', dataPinjam.id)
        if (errUpdate) throw errUpdate

        await supabase.from('buku').update({ stok: buku.stok + 1 }).eq('isbn', buku.isbn)
        setPesan({ type: 'success', text: `"${buku.judul}" dikembalikan oleh ${dataPinjam.nama_murid}.` })
        setIsbn('')
      }
    } catch (err) {
      setPesan({ type: 'error', text: err.message })
    }
    
    setLoading(false)
    ambilRiwayatHariIni()
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* MODE NAVIGASI */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => { setMode('kunjungan'); setPesan(null); setTargetScan('nisn'); setKameraAktif(false) }} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: mode === 'kunjungan' ? '3px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: mode === 'kunjungan' ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>👋 Mode Kunjungan</button>
        <button onClick={() => { setMode('pinjam'); setPesan(null); setTargetScan('nisn'); setKameraAktif(false) }} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: mode === 'pinjam' ? '3px solid #f59e0b' : '1px solid #d1d5db', backgroundColor: mode === 'pinjam' ? '#fffbeb' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>📖 Mode Peminjaman</button>
        <button onClick={() => { setMode('kembali'); setPesan(null); setTargetScan('isbn'); setKameraAktif(false) }} style={{ flex: 1, padding: '15px', borderRadius: '10px', border: mode === 'kembali' ? '3px solid #10b981' : '1px solid #d1d5db', backgroundColor: mode === 'kembali' ? '#ecfdf5' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Mode Pengembalian</button>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* PANEL SCANNER */}
        <div style={{ flex: 1.5, minWidth: '350px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            
            {/* AREA KAMERA SCANNER */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setKameraAktif(!kameraAktif)}
                style={{ padding: '10px 20px', backgroundColor: kameraAktif ? '#ef4444' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
              >
                {kameraAktif ? '⏹️ Matikan Kamera' : '📷 Aktifkan Kamera HP/Laptop'}
              </button>
              
              {kameraAktif && (
                <div style={{ border: '2px dashed #cbd5e1', padding: '10px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#475569' }}>
                    Arahkan kamera ke Barcode/QR Code {targetScan === 'nisn' ? 'Kartu Murid' : 'Buku'}
                  </p>
                  <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
                </div>
              )}
            </div>

            <form onSubmit={prosesScan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(mode === 'kunjungan' || mode === 'pinjam') && (
                <div>
                  <label style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Scan/Ketik NISN Murid</span>
                    {mode === 'pinjam' && <button type="button" onClick={() => setTargetScan('nisn')} style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer' }}>Fokus Kamera ke Sini</button>}
                  </label>
                  <input ref={inputNisnRef} type="text" value={nisn} onChange={(e) => setNisn(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: targetScan === 'nisn' ? '3px solid #3b82f6' : '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
              )}

              {(mode === 'pinjam' || mode === 'kembali') && (
                <div>
                  <label style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Scan/Ketik ISBN Buku</span>
                    {mode === 'pinjam' && <button type="button" onClick={() => setTargetScan('isbn')} style={{ fontSize: '11px', padding: '2px 8px', cursor: 'pointer' }}>Fokus Kamera ke Sini</button>}
                  </label>
                  <input ref={inputIsbnRef} type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '20px', borderRadius: '8px', border: targetScan === 'isbn' ? '3px solid #f59e0b' : '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
              )}

              <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#1f2937', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                {loading ? 'Memproses...' : 'PROSES DATA'}
              </button>
            </form>

            {pesan && (
              <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: pesan.type === 'success' ? '#dcfce7' : '#fee2e2', color: pesan.type === 'success' ? '#166534' : '#991b1b' }}>
                {pesan.text}
              </div>
            )}
          </div>
        </div>

        {/* PANEL RIWAYAT AKTIVITAS TERAKHIR */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>🕒 Aktivitas Terakhir</h3>
          {riwayatHariIni.map((riwayat) => (
            <div key={riwayat.id} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{riwayat.nama_murid}</strong>
                <span>{riwayat.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>{riwayat.judul_buku || 'Kunjungan'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
