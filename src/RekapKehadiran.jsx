import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function RekapKehadiran() {
  const [dataKehadiran, setDataKehadiran] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Set default tanggal pencarian ke hari ini
  const tanggalHariIni = new Date().toLocaleDateString('en-CA')
  const [tanggalCari, setTanggalCari] = useState(tanggalHariIni)

  const ambilDataKehadiran = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kehadiran')
      .select('*')
      .eq('tanggal', tanggalCari)
      .order('waktu_datang', { ascending: false }) // Urutkan dari yang terbaru

    if (error) {
      console.error('Gagal memuat data:', error)
      alert('Gagal memuat rekap kehadiran.')
    } else {
      setDataKehadiran(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    ambilDataKehadiran()
  }, [tanggalCari]) // Otomatis muat ulang data saat tanggal diubah

  // Fungsi mengubah format ISO waktu dari database menjadi jam biasa (misal: 07:15:00)
  const formatJam = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    // Jika formatnya sudah jam biasa (bukan ISO), kembalikan apa adanya
    if (isNaN(date.getTime())) return isoString 
    return date.toLocaleTimeString('id-ID', { hour12: false })
  }

  const exportKeExcel = () => {
    if (dataKehadiran.length === 0) {
      alert('Tidak ada data untuk diekspor pada tanggal ini.')
      return
    }

    // Rapikan data sebelum diekspor
    const dataExport = dataKehadiran.map((row, index) => ({
      'No': index + 1,
      'NISN': row.nisn,
      'Nama Murid': row.nama,
      'Kelas': row.kelas,
      'Tanggal': row.tanggal,
      'Jam Datang': formatJam(row.waktu_datang),
      'Jam Pulang': formatJam(row.waktu_pulang),
      'Keterangan': row.waktu_pulang ? 'Selesai' : 'Belum Pulang/Bolos'
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Kehadiran")
    
    // Download file
    XLSX.writeFile(workbook, `Rekap_Kehadiran_SMAN1_${tanggalCari}.xlsx`)
  }

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>📊 Rekap Kehadiran Murid</h2>

      {/* Panel Kontrol Atas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>Pilih Tanggal:</label>
          <input 
            type="date" 
            value={tanggalCari} 
            onChange={(e) => setTanggalCari(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
          />
        </div>

        <button 
          onClick={exportKeExcel}
          style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}
        >
          📥 Export Excel
        </button>

      </div>

      {/* Tabel Data Kehadiran */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px', color: '#334155' }}>No</th>
              <th style={{ padding: '15px', color: '#334155' }}>Nama Lengkap</th>
              <th style={{ padding: '15px', color: '#334155' }}>Kelas</th>
              <th style={{ padding: '15px', color: '#334155', textAlign: 'center' }}>Jam Datang</th>
              <th style={{ padding: '15px', color: '#334155', textAlign: 'center' }}>Jam Pulang</th>
              <th style={{ padding: '15px', color: '#334155', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : dataKehadiran.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Belum ada data kehadiran pada tanggal ini.</td></tr>
            ) : (
              dataKehadiran.map((row, index) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                  <td style={{ padding: '15px', color: '#64748b' }}>{index + 1}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>{row.nama}<br/><span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>{row.nisn}</span></td>
                  <td style={{ padding: '15px', color: '#475569' }}>{row.kelas}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                      {formatJam(row.waktu_datang)}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {row.waktu_pulang ? (
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        {formatJam(row.waktu_pulang)}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    {row.waktu_pulang ? (
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>Selesai ✓</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>Belum Pulang</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}