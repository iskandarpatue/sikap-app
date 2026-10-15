import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from './supabase'

export default function ScanKehadiran() {
  const [mode, setMode] = useState('datang')
  const [pesan, setPesan] = useState('Silakan scan QR Code pada Kartu Murid')
  const [warnaPesan, setWarnaPesan] = useState('#374151')
  const [loading, setLoading] = useState(false)
  const [muridTerakhir, setMuridTerakhir] = useState(null)
  
  // STATE TABEL LIVE
  const [logHariIni, setLogHariIni] = useState([])
  const [filterKelas, setFilterKelas] = useState('Semua Kelas') // State untuk filter

  const modeRef = useRef(mode)
  const scannerSudahAktif = useRef(false)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  // --- MENGAMBIL DATA KEHADIRAN HARI INI ---
  const ambilLogHariIni = async () => {
    const now = new Date()
    const tahun = now.getFullYear()
    const bulan = String(now.getMonth() + 1).padStart(2, '0')
    const hari = String(now.getDate()).padStart(2, '0')
    const tanggalHariIni = `${tahun}-${bulan}-${hari}` 

    const { data } = await supabase
      .from('kehadiran')
      .select('*')
      .eq('tanggal', tanggalHariIni)
      .order('id', { ascending: false })
      
    if (data) setLogHariIni(data)
  }

  useEffect(() => {
    ambilLogHariIni()
  }, [])

  // --- KODE SCANNER BAPAK YANG SUDAH BERHASIL ---
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
      await prosesAbsen(decodedText, modeRef.current)
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

  const prosesAbsen = async (nisn_scan, modeSaatIni) => {
    if (loading) return
    setLoading(true)
    setPesan('Memproses data...')
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

      const { data: cekHadir, error: errCek } = await supabase
        .from('kehadiran')
        .select('*')
        .eq('nisn', nisn_scan)
        .eq('tanggal', tanggalHariIni)
        .maybeSingle()

      if (modeSaatIni === 'datang') {
        if (cekHadir) {
          setPesan(`⚠️ SUDAH ABSEN! ${murid.nama} sudah absen datang hari ini.`)
          setWarnaPesan('#f59e0b')
        } else {
          const { error: errInsert } = await supabase.from('kehadiran').insert([{
            nisn: murid.nisn,
            nama: murid.nama,
            kelas: murid.kelas,
            tanggal: tanggalHariIni,
            waktu_datang: waktuLengkapSupabase, 
            status: 'Hadir'
          }])
          if (errInsert) throw errInsert
          setPesan(`✅ BERHASIL: ${murid.nama} Absen Datang Pukul ${jamTampil}`)
          setWarnaPesan('#10b981')
          ambilLogHariIni() // Refresh tabel
        }
      } else if (modeSaatIni === 'pulang') {
        if (!cekHadir) {
          setPesan(`❌ GAGAL: ${murid.nama} belum absen datang!`)
          setWarnaPesan('#ef4444')
        } else if (cekHadir.waktu_pulang) {
          setPesan(`⚠️ SUDAH PULANG: ${murid.nama} sudah melakukan absen pulang sebelumnya.`)
          setWarnaPesan('#f59e0b')
        } else {
          const { error: errUpdate } = await supabase
            .from('kehadiran')
            .update({ waktu_pulang: waktuLengkapSupabase }) 
            .eq('id', cekHadir.id)
          if (errUpdate) throw errUpdate
          setPesan(`✅ BERHASIL: ${murid.nama} Absen Pulang Pukul ${jamTampil}`)
          setWarnaPesan('#10b981')
          ambilLogHariIni() // Refresh tabel
        }
      }
    } catch (error) {
      setPesan('❌ Terjadi kesalahan Server: ' + error.message)
      setWarnaPesan('#ef4444')
    }
    setLoading(false)
  }

  // --- FUNGSI MENGHAPUS LOG ---
  const hapusLog = async (id, namaMurid) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus data absen milik ${namaMurid}?`)
    if (!konfirmasi) return

    const { error } = await supabase.from('kehadiran').delete().eq('id', id)
    if (error) {
      alert('Gagal menghapus data: ' + error.message)
    } else {
      ambilLogHariIni() // Otomatis refresh setelah dihapus
    }
  }

  // --- LOGIKA FILTER & RINGKASAN JUMLAH ---
  const formatJam = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString 
    return date.toLocaleTimeString('id-ID', { hour12: false })
  }

  // 1. Hitung jumlah murid per kelas (hanya dari yang sudah hadir)
  const ringkasanKelas = logHariIni.reduce((acc, curr) => {
    acc[curr.kelas] = (acc[curr.kelas] || 0) + 1
    return acc
  }, {})

  // 2. Dapatkan daftar nama kelas unik untuk dropdown
  const daftarKelasUnik = Object.keys(ringkasanKelas).sort()

  // 3. Filter data yang mau ditampilkan di tabel
  const logTampil = filterKelas === 'Semua Kelas' 
    ? logHariIni 
    : logHariIni.filter(row => row.kelas === filterKelas)

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>📷 Scan Kehadiran Murid</h2>

      {/* --- PANEL TOMBOL MODE --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setMode('datang'); setPesan('Silakan scan QR Code (Mode Datang)'); setMuridTerakhir(null); }}
          style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: mode === 'datang' ? '#3b82f6' : '#e5e7eb', color: mode === 'datang' ? 'white' : '#6b7280', boxShadow: mode === 'datang' ? '0 4px 6px rgba(59, 130, 246, 0.4)' : 'none' }}
        >
          🌅 MODE ABSEN DATANG
        </button>
        <button 
          onClick={() => { setMode('pulang'); setPesan('Silakan scan QR Code (Mode Pulang)'); setMuridTerakhir(null); }}
          style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: mode === 'pulang' ? '#10b981' : '#e5e7eb', color: mode === 'pulang' ? 'white' : '#6b7280', boxShadow: mode === 'pulang' ? '0 4px 6px rgba(16, 185, 129, 0.4)' : 'none' }}
        >
          🌇 MODE ABSEN PULANG
        </button>
      </div>

      {/* --- PANEL KAMERA DAN HASIL SCAN --- */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div id="reader" style={{ width: '100%', border: 'none' }}></div>
        </div>

        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', border: `2px solid ${warnaPesan}` }}>
            <h3 style={{ margin: '0 0 10px 0', color: warnaPesan, fontSize: '18px' }}>Status Scan</h3>
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

      {/* --- PANEL TABEL LOG KEHADIRAN LIVE --- */}
      <div style={{ marginTop: '25px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* Header dan Ringkasan */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>📋 Log Kehadiran Hari Ini ({logHariIni.length} Murid)</h3>
          
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

        {/* Ringkasan per Kelas */}
        {daftarKelasUnik.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Hadir:</span>
            {daftarKelasUnik.map(kls => (
              <span key={kls} style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {kls} : {ringkasanKelas[kls]}
              </span>
            ))}
          </div>
        )}

        {/* Tabel Data */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#334155' }}>No</th>
                <th style={{ padding: '12px', color: '#334155' }}>Nama Lengkap</th>
                <th style={{ padding: '12px', color: '#334155' }}>Kelas</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Jam Datang</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Jam Pulang</th>
                <th style={{ padding: '12px', color: '#334155', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logTampil.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Belum ada data absensi untuk kelas ini.</td>
                </tr>
              ) : (
                logTampil.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{row.nama}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{row.kelas}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {formatJam(row.waktu_datang)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {row.waktu_pulang ? (
                        <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {formatJam(row.waktu_pulang)}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => hapusLog(row.id, row.nama)} 
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