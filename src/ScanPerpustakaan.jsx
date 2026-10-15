import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from './supabase'

export default function ScanPerpustakaan() {
  const [mode, setMode] = useState('Membaca') 
  const [pesan, setPesan] = useState('Silakan scan QR Code pada Kartu Murid')
  const [warnaPesan, setWarnaPesan] = useState('#374151')
  const [loading, setLoading] = useState(false)
  const [muridTerakhir, setMuridTerakhir] = useState(null)
  
  // STATE TABEL LIVE
  const [logHariIni, setLogHariIni] = useState([])
  const [filterKelas, setFilterKelas] = useState('Semua Kelas')

  const modeRef = useRef(mode)
  const scannerSudahAktif = useRef(false) // Gembok kamera

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // --- MENGAMBIL DATA KUNJUNGAN HARI INI ---
  const ambilLogHariIni = async () => {
    const now = new Date()
    const tahun = now.getFullYear()
    const bulan = String(now.getMonth() + 1).padStart(2, '0')
    const hari = String(now.getDate()).padStart(2, '0')
    const tanggalHariIni = `${tahun}-${bulan}-${hari}` 

    const { data } = await supabase
      .from('kunjungan_perpus')
      .select('*')
      .eq('tanggal', tanggalHariIni)
      .order('id', { ascending: false }) // Urutan terbaru di atas
      
    if (data) setLogHariIni(data)
  }

  // Panggil tabel saat web pertama kali dibuka
  useEffect(() => {
    ambilLogHariIni()
  }, [])

  // --- KODE SCANNER ---
  useEffect(() => {
    if (scannerSudahAktif.current) return
    scannerSudahAktif.current = true

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 5, qrbox: { width: 250, height: 250 } },
      false
    )

    scanner.render(async (decodedText) => {
      scanner.pause(true)
      await prosesScan(decodedText, modeRef.current)
      setTimeout(() => {
        try { scanner.resume() } catch(e) {}
      }, 3000)
    }, (error) => {
      // Abaikan error saat tidak ada QR
    })

    return () => {
      scannerSudahAktif.current = false
      scanner.clear().catch(error => console.log("Gagal mematikan scanner", error))
    }
  }, []) 

  const prosesScan = async (nisn_scan, tujuanSaatIni) => {
    if (loading) return
    setLoading(true)
    setPesan('Memproses data perpustakaan...')
    setWarnaPesan('#3b82f6')

    try {
      const { data: murid, error: errMurid } = await supabase
        .from('students')
        .select('*')
        .eq('barcode_data', nisn_scan)
        .single()
      
      if (errMurid || !murid) {
        setPesan('❌ Gagal: Data murid tidak ditemukan di sistem!')
        setWarnaPesan('#ef4444')
        setLoading(false)
        return
      }

      setMuridTerakhir(murid)

      const now = new Date()
      const tahun = now.getFullYear()
      const bulan = String(now.getMonth() + 1).padStart(2, '0')
      const hari = String(now.getDate()).padStart(2, '0')
      const tanggalHariIni = `${tahun}-${bulan}-${hari}` 
      
      const jamTampil = now.toLocaleTimeString('id-ID', { hour12: false }) 
      const waktuLengkapSupabase = now.toISOString() 

      // Menyimpan data ke Supabase (Tabel kunjungan_perpus)
      const { error: errInsert } = await supabase.from('kunjungan_perpus').insert([{
        nisn: murid.nisn,
        nama: murid.nama,
        kelas: murid.kelas,
        tanggal: tanggalHariIni,
        waktu_kunjung: waktuLengkapSupabase, 
        tujuan: tujuanSaatIni 
      }])
      
      if (errInsert) throw errInsert
      
      setPesan(`✅ BERHASIL: ${murid.nama} (${tujuanSaatIni}) Pukul ${jamTampil}`)
      setWarnaPesan('#10b981')
      
      // REFRESH TABEL DI BAWAH SECARA OTOMATIS
      ambilLogHariIni() 

    } catch (error) {
      setPesan('❌ Terjadi kesalahan Server: ' + error.message)
      setWarnaPesan('#ef4444')
    }
    setLoading(false)
  }

  // --- FUNGSI MENGHAPUS LOG KUNJUNGAN ---
  const hapusLog = async (id, namaMurid, tujuan) => {
    const konfirmasi = window.confirm(`Hapus data ${tujuan} milik ${namaMurid}?`)
    if (!konfirmasi) return

    const { error } = await supabase.from('kunjungan_perpus').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus data: ' + error.message)
    } else {
      ambilLogHariIni() 
    }
  }

  // --- LOGIKA FILTER & FORMAT TAMPILAN ---
  const formatJam = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString 
    return date.toLocaleTimeString('id-ID', { hour12: false })
  }

  const ringkasanKelas = logHariIni.reduce((acc, curr) => {
    acc[curr.kelas] = (acc[curr.kelas] || 0) + 1
    return acc
  }, {})

  const daftarKelasUnik = Object.keys(ringkasanKelas).sort()

  const logTampil = filterKelas === 'Semua Kelas' 
    ? logHariIni 
    : logHariIni.filter(row => row.kelas === filterKelas)

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>📚 Scan Kunjungan Perpustakaan</h2>

      {/* --- PANEL TOMBOL TUJUAN KUNJUNGAN --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => { setMode('Membaca'); setPesan('Mode: Membaca di Tempat'); setMuridTerakhir(null); }}
          style={{ flex: 1, padding: '15px', fontSize: '15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: mode === 'Membaca' ? '#3b82f6' : '#e5e7eb', color: mode === 'Membaca' ? 'white' : '#6b7280', boxShadow: mode === 'Membaca' ? '0 4px 6px rgba(59, 130, 246, 0.4)' : 'none' }}
        >
          📖 MEMBACA DI TEMPAT
        </button>
        <button 
          onClick={() => { setMode('Pinjam Buku'); setPesan('Mode: Meminjam Buku'); setMuridTerakhir(null); }}
          style={{ flex: 1, padding: '15px', fontSize: '15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: mode === 'Pinjam Buku' ? '#f59e0b' : '#e5e7eb', color: mode === 'Pinjam Buku' ? 'white' : '#6b7280', boxShadow: mode === 'Pinjam Buku' ? '0 4px 6px rgba(245, 158, 11, 0.4)' : 'none' }}
        >
          📤 PINJAM BUKU
        </button>
        <button 
          onClick={() => { setMode('Kembalikan Buku'); setPesan('Mode: Mengembalikan Buku'); setMuridTerakhir(null); }}
          style={{ flex: 1, padding: '15px', fontSize: '15px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: mode === 'Kembalikan Buku' ? '#10b981' : '#e5e7eb', color: mode === 'Kembalikan Buku' ? 'white' : '#6b7280', boxShadow: mode === 'Kembalikan Buku' ? '0 4px 6px rgba(16, 185, 129, 0.4)' : 'none' }}
        >
          📥 KEMBALIKAN BUKU
        </button>
      </div>

      {/* --- PANEL KAMERA DAN HASIL SCAN --- */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div id="reader" style={{ width: '100%', border: 'none' }}></div>
        </div>

        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', border: `2px solid ${warnaPesan}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: warnaPesan, fontSize: '18px' }}>Status Scan Perpustakaan</h3>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#1f2937' }}>{pesan}</p>
          </div>

          {muridTerakhir && (
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '80px', height: '100px', backgroundColor: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                {muridTerakhir.foto_url ? (
                  <img src={muridTerakhir.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>Belum Ada Foto</div>
                )}
              </div>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#1e3a8a', fontSize: '18px' }}>{muridTerakhir.nama}</h4>
                <p style={{ margin: '0 0 3px 0', fontSize: '14px', color: '#4b5563' }}><strong>NISN:</strong> {muridTerakhir.nisn}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}><strong>Kelas:</strong> {muridTerakhir.kelas}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PANEL TABEL LOG KUNJUNGAN LIVE --- */}
      <div style={{ marginTop: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>📋 Log Perpustakaan Hari Ini ({logHariIni.length} Pengunjung)</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>Filter Kelas:</label>
            <select 
              value={filterKelas} 
              onChange={(e) => setFilterKelas(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {daftarKelasUnik.map(kls => (
                <option key={kls} value={kls}>{kls}</option>
              ))}
            </select>
          </div>
        </div>

        {daftarKelasUnik.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Total per Kelas:</span>
            {daftarKelasUnik.map(kls => (
              <span key={kls} style={{ backgroundColor: '#ffedd5', color: '#9a3412', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {kls} : {ringkasanKelas[kls]}
              </span>
            ))}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#334155' }}>No</th>
                <th style={{ padding: '12px', color: '#334155' }}>Nama Lengkap</th>
                <th style={{ padding: '12px', color: '#334155' }}>Kelas</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Waktu</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Tujuan</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logTampil.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Belum ada pengunjung dari kelas ini hari ini.</td>
                </tr>
              ) : (
                logTampil.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{row.nama}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{row.kelas}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#166534' }}>
                      {formatJam(row.waktu_kunjung)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        backgroundColor: row.tujuan === 'Membaca' ? '#dbeafe' : row.tujuan === 'Pinjam Buku' ? '#fef3c7' : '#dcfce7', 
                        color: row.tujuan === 'Membaca' ? '#1e40af' : row.tujuan === 'Pinjam Buku' ? '#92400e' : '#166534', 
                        padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' 
                      }}>
                        {row.tujuan}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => hapusLog(row.id, row.nama, row.tujuan)} 
                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}