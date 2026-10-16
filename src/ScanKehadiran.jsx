import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from './supabase'

export default function ScanKehadiran() {
  const [mode, setMode] = useState('Datang')
  const [pesan, setPesan] = useState('Pilih mode, lalu scan kartu murid...')
  const [warnaPesan, setWarnaPesan] = useState('#64748b')
  const [ikonPesan, setIkonPesan] = useState('🏫')
  const [loading, setLoading] = useState(false)
  const [muridTerakhir, setMuridTerakhir] = useState(null)
  
  const [logHariIni, setLogHariIni] = useState([])
  const [filterKelas, setFilterKelas] = useState('Semua Kelas')
  
  const modeRef = useRef(mode)
  const scannerSudahAktif = useRef(false)

  useEffect(() => { modeRef.current = mode }, [mode])

  const ambilLogHariIni = async () => {
    const now = new Date()
    const tanggalHariIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('kehadiran')
      .select('*')
      .eq('tanggal', tanggalHariIni)
      .order('id', { ascending: false })
      
    if (data) setLogHariIni(data)
  }

  useEffect(() => { ambilLogHariIni() }, [])

  useEffect(() => {
    if (scannerSudahAktif.current) return
    scannerSudahAktif.current = true

    // Meningkatkan resolusi scanner untuk membantu kamera laptop
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
      false
    )

    scanner.render(async (decodedText) => {
      scanner.pause(true)
      await prosesScan(decodedText, modeRef.current)
      setTimeout(() => { try { scanner.resume() } catch(e) {} }, 3000)
    }, () => {})

    return () => {
      scannerSudahAktif.current = false
      scanner.clear().catch(e => console.log(e))
    }
  }, []) 

  const prosesScan = async (nisn_scan, modeSaatIni) => {
    if (loading) return
    setLoading(true)
    setPesan('Mencari data murid...')
    setWarnaPesan('#3b82f6')
    setIkonPesan('🔍')

    try {
      const { data: murid, error: errMurid } = await supabase.from('students').select('*').eq('barcode_data', nisn_scan).single()
      
      if (errMurid || !murid) {
        setPesan('Data murid tidak ditemukan di sistem!')
        setWarnaPesan('#ef4444')
        setIkonPesan('❌')
        setLoading(false)
        return
      }

      setMuridTerakhir(murid)

      const now = new Date()
      const tanggalHariIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const waktuLengkapSupabase = now.toISOString() 

      const { data: cekHadir } = await supabase.from('kehadiran').select('*').eq('nisn', murid.nisn).eq('tanggal', tanggalHariIni).maybeSingle()

      if (modeSaatIni === 'Datang') {
        if (cekHadir && cekHadir.waktu_hadir) {
          setPesan(`${murid.nama} SUDAH SCAN DATANG.`)
          setWarnaPesan('#f59e0b')
          setIkonPesan('⚠️')
        } else {
          let errProcess;
          if (cekHadir) {
             const { error } = await supabase.from('kehadiran').update({ waktu_hadir: waktuLengkapSupabase }).eq('id', cekHadir.id)
             errProcess = error
          } else {
             const { error } = await supabase.from('kehadiran').insert([{ nisn: murid.nisn, nama: murid.nama, kelas: murid.kelas, tanggal: tanggalHariIni, waktu_hadir: waktuLengkapSupabase }])
             errProcess = error
          }
          if (errProcess) throw errProcess
          
          setPesan(`DATANG BERHASIL: ${murid.nama}`)
          setWarnaPesan('#10b981')
          setIkonPesan('✅')
          ambilLogHariIni() 
        }
      } else if (modeSaatIni === 'Pulang') {
        if (!cekHadir) {
          const { error: errInsert } = await supabase.from('kehadiran').insert([{ nisn: murid.nisn, nama: murid.nama, kelas: murid.kelas, tanggal: tanggalHariIni, waktu_pulang: waktuLengkapSupabase }])
          if (errInsert) throw errInsert
          setPesan(`PULANG BERHASIL: ${murid.nama}`)
          setWarnaPesan('#10b981')
          setIkonPesan('✅')
          ambilLogHariIni()
        } else if (cekHadir.waktu_pulang) {
          setPesan(`${murid.nama} SUDAH SCAN PULANG.`)
          setWarnaPesan('#f59e0b')
          setIkonPesan('⚠️')
        } else {
          const { error: errUpdate } = await supabase.from('kehadiran').update({ waktu_pulang: waktuLengkapSupabase }).eq('id', cekHadir.id)
          if (errUpdate) throw errUpdate
          setPesan(`PULANG BERHASIL: ${murid.nama}`)
          setWarnaPesan('#10b981')
          setIkonPesan('✅')
          ambilLogHariIni()
        }
      }
    } catch (error) {
      console.error("Detail Error Supabase:", error)
      
      // Menangkap dan menampilkan error asli dari Supabase ke layar
      let pesanAsli = 'Error tidak diketahui';
      if (error && error.message) pesanAsli = error.message;
      else if (error && error.details) pesanAsli = error.details;
      
      setPesan(`DB Error: ${pesanAsli}`)
      setWarnaPesan('#ef4444')
      setIkonPesan('❌')
    }
    setLoading(false)
  }

  const hapusLog = async (id, namaMurid) => {
    if(!window.confirm(`Hapus data kehadiran ${namaMurid}?`)) return
    await supabase.from('kehadiran').delete().eq('id', id)
    ambilLogHariIni()
  }

  const formatJam = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return isNaN(date.getTime()) ? isoString : date.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })
  }

  const ringkasanKelas = logHariIni.reduce((acc, curr) => { acc[curr.kelas] = (acc[curr.kelas] || 0) + 1; return acc }, {})
  const daftarKelasUnik = Object.keys(ringkasanKelas).sort()
  const logTampil = filterKelas === 'Semua Kelas' ? logHariIni : logHariIni.filter(row => row.kelas === filterKelas)

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* HEADER HERO SECTION */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', padding: '25px', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)', marginBottom: '25px' }}>
        <div style={{ fontSize: '50px', backgroundColor: 'rgba(255,255,255,0.2)', width: '80px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%' }}>🏫</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '26px', letterSpacing: '0.5px' }}>Gerbang Kehadiran Murid</h2>
          <p style={{ margin: '5px 0 0 0', color: '#bfdbfe', fontSize: '15px' }}>Pilih mode Datang/Pulang sebelum melakukan scan kartu.</p>
        </div>
      </div>

      {/* PANEL TOMBOL DATANG / PULANG */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[ 
          { id: 'Datang', ikon: '🏫', warna: '#2563eb', bayangan: 'rgba(37,99,235,0.3)', teks: 'Scan Datang' },
          { id: 'Pulang', ikon: '🏠', warna: '#f59e0b', bayangan: 'rgba(245,158,11,0.3)', teks: 'Scan Pulang' }
        ].map((btn) => (
          <button 
            key={btn.id}
            onClick={() => { setMode(btn.id); setPesan(`Mode Aktif: ${btn.teks}`); setMuridTerakhir(null); setWarnaPesan(btn.warna); setIkonPesan(btn.ikon); }}
            style={{ 
              flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', 
              backgroundColor: mode === btn.id ? btn.warna : 'white', 
              color: mode === btn.id ? 'white' : '#475569', 
              boxShadow: mode === btn.id ? `0 8px 20px ${btn.bayangan}` : '0 4px 10px rgba(0,0,0,0.05)',
              border: mode === btn.id ? 'none' : '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <span style={{ fontSize: '22px' }}>{btn.ikon}</span> {btn.teks.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
        {/* PANEL KAMERA */}
        <div style={{ flex: 1, minWidth: '320px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '20px' }}>📷</span>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Kamera Scanner</h3>
          </div>
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: `3px dashed ${mode === 'Datang' ? '#bfdbfe' : '#fde68a'}` }}>
            <div id="reader" style={{ width: '100%', border: 'none' }}></div>
          </div>
        </div>

        {/* PANEL HASIL SCAN */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: `6px solid ${warnaPesan}`, transition: 'all 0.3s' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>{ikonPesan}</div>
            <h3 style={{ margin: '0 0 10px 0', color: warnaPesan, fontSize: '20px' }}>Status Pengecekan</h3>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#334155' }}>{pesan}</p>
          </div>

          {muridTerakhir && (
            <div style={{ background: 'linear-gradient(to right, #ffffff, #f8fafc)', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '90px', height: '115px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                {muridTerakhir.foto_url ? <img src={muridTerakhir.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👤</div>}
              </div>
              <div>
                <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '8px' }}>🎓 {muridTerakhir.kelas}</span>
                <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px' }}>{muridTerakhir.nama}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>NISN: <strong>{muridTerakhir.nisn}</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABEL LIVE */}
      <div style={{ marginTop: '30px', backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Daftar Hadir Hari Ini <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>({logHariIni.length} Siswa)</span></h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '8px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '14px' }}>🎯 Filter:</span>
            <select value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={{ padding: '6px', border: 'none', backgroundColor: 'transparent', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', outline: 'none', cursor: 'pointer' }}>
              <option value="Semua Kelas">Semua Kelas</option>
              {daftarKelasUnik.map(kls => <option key={kls} value={kls}>{kls}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px', color: '#475569' }}>No</th>
                <th style={{ padding: '15px', color: '#475569' }}>Nama Murid</th>
                <th style={{ padding: '15px', color: '#475569' }}>Kelas</th>
                <th style={{ padding: '15px', color: '#475569', textAlign: 'center' }}>Jam Datang</th>
                <th style={{ padding: '15px', color: '#475569', textAlign: 'center' }}>Jam Pulang</th>
                <th style={{ padding: '15px', color: '#475569', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logTampil.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada data kehadiran...</td></tr>
              ) : (
                logTampil.map((row, index) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>{row.nama}</td>
                    <td style={{ padding: '15px', color: '#475569' }}>{row.kelas}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        ⏱️ {formatJam(row.waktu_hadir)}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ backgroundColor: '#ffedd5', color: '#9a3412', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        🏠 {formatJam(row.waktu_pulang)}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <button onClick={() => hapusLog(row.id, row.nama)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }} title="Hapus Data">🗑️</button>
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
