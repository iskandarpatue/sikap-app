import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from './supabase'

export default function Perpustakaan() {
  const [muridTerpilih, setMuridTerpilih] = useState(null)
  const [judulBuku, setJudulBuku] = useState('')
  const [jumlahBuku, setJumlahBuku] = useState(1)
  const [tipeTransaksi, setTipeTransaksi] = useState('pinjam')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannerInstance, setScannerInstance] = useState(null)

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader-perpus",
      { fps: 10, qrbox: { width: 250, height: 100 } },
      false
    )
    setScannerInstance(scanner)

    const onScanSuccess = async (decodedText) => {
      if (loading) return
      setLoading(true)
      scanner.pause() // Jeda kamera saat data ditemukan

      try {
        const { data: murid, error } = await supabase
          .from('students')
          .select('*')
          .eq('nisn', decodedText)
          .single()

        if (error || !murid) {
          setPesan(`❌ Data tidak ditemukan untuk NISN: ${decodedText}`)
          setTimeout(() => { scanner.resume(); setLoading(false); setPesan('') }, 3000)
        } else {
          setMuridTerpilih(murid)
          setPesan('')
          setLoading(false)
        }
      } catch (err) {
        setPesan('Terjadi kesalahan sistem.')
        setLoading(false)
      }
    }

    scanner.render(onScanSuccess, () => {})

    return () => {
      scanner.clear()
    }
  }, []) // Hanya dijalankan sekali saat komponen dimuat

  const simpanTransaksi = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('library_transactions').insert([
      {
        student_nisn: muridTerpilih.nisn,
        judul_buku: judulBuku,
        jumlah: jumlahBuku,
        tipe_transaksi: tipeTransaksi,
        waktu_transaksi: new Date().toISOString() // Otomatis menyesuaikan zona waktu lokal (WITA)
      }
    ])

    setLoading(false)

    if (error) {
      alert('Gagal menyimpan transaksi!')
    } else {
      alert(`Berhasil menyimpan transaksi ${tipeTransaksi} untuk ${muridTerpilih.nama}!`)
      // Reset form dan aktifkan kamera lagi
      setMuridTerpilih(null)
      setJudulBuku('')
      setJumlahBuku(1)
      setTipeTransaksi('pinjam')
      if (scannerInstance) scannerInstance.resume()
    }
  }

  const batalTransaksi = () => {
    setMuridTerpilih(null)
    if (scannerInstance) scannerInstance.resume()
  }

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>Panel Perpustakaan</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Kolom Kiri: Kamera Scanner */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '15px', fontSize: '14px' }}>
            Scan kartu murid untuk memulai transaksi peminjaman atau pengembalian.
          </p>
          <div id="reader-perpus" style={{ width: '100%', border: 'none', borderRadius: '8px', overflow: 'hidden' }}></div>
          {pesan && <div style={{ marginTop: '10px', color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{pesan}</div>}
        </div>

        {/* Kolom Kanan: Form Transaksi (Muncul setelah scan berhasil) */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', opacity: muridTerpilih ? 1 : 0.5, pointerEvents: muridTerpilih ? 'auto' : 'none' }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Detail Transaksi</h3>
          
          {muridTerpilih ? (
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 5px 0' }}><strong>Nama:</strong> {muridTerpilih.nama}</p>
              <p style={{ margin: '0 0 5px 0' }}><strong>NISN:</strong> {muridTerpilih.nisn}</p>
              <p style={{ margin: 0 }}><strong>Kelas:</strong> {muridTerpilih.kelas}</p>
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Silakan scan kartu murid terlebih dahulu...</p>
          )}

          <form onSubmit={simpanTransaksi} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Judul Buku</label>
              <input type="text" required value={judulBuku} onChange={(e) => setJudulBuku(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} placeholder="Masukkan judul buku..." />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Jumlah</label>
                <input type="number" min="1" required value={jumlahBuku} onChange={(e) => setJumlahBuku(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Jenis Transaksi</label>
                <select value={tipeTransaksi} onChange={(e) => setTipeTransaksi(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}>
                  <option value="pinjam">Pinjam Buku</option>
                  <option value="kembali">Kembalikan Buku</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={loading || !muridTerpilih} style={{ flex: 2, padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
              <button type="button" onClick={batalTransaksi} disabled={!muridTerpilih} style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Batal
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}