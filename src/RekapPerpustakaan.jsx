import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function RekapPerpustakaan() {
  const [dataKunjungan, setDataKunjungan] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Set default pencarian ke hari ini
  const tanggalHariIni = new Date().toLocaleDateString('en-CA')
  const [tanggalCari, setTanggalCari] = useState(tanggalHariIni)

  const ambilDataKunjungan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kunjungan_perpus')
      .select('*')
      .eq('tanggal', tanggalCari)
      .order('waktu_kunjung', { ascending: false }) // Yang terbaru di atas

    if (error) {
      console.error('Gagal memuat data:', error)
      alert('Gagal memuat rekap perpustakaan.')
    } else {
      setDataKunjungan(data || [])
    }
    setLoading(false)
  }

  // Otomatis mencari data tiap kali tanggal diubah
  useEffect(() => {
    ambilDataKunjungan()
  }, [tanggalCari])

  const formatJam = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString 
    return date.toLocaleTimeString('id-ID', { hour12: false })
  }

  const exportKeExcel = () => {
    if (dataKunjungan.length === 0) {
      alert('Tidak ada data untuk diekspor pada tanggal ini.')
      return
    }

    const dataExport = dataKunjungan.map((row, index) => ({
      'No': index + 1,
      'NISN': row.nisn,
      'Nama Murid': row.nama,
      'Kelas': row.kelas,
      'Tanggal': row.tanggal,
      'Waktu Kunjungan': formatJam(row.waktu_kunjung),
      'Tujuan': row.tujuan
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Perpustakaan")
    
    XLSX.writeFile(workbook, `Rekap_Perpus_SMAN1_${tanggalCari}.xlsx`)
  }

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '20px' }}>📉 Rekap Kunjungan Perpustakaan</h2>

      {/* --- PANEL PENCARIAN & EXPORT --- */}
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

      {/* --- TABEL DATA --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px', color: '#334155' }}>No</th>
              <th style={{ padding: '15px', color: '#334155' }}>Nama Lengkap</th>
              <th style={{ padding: '15px', color: '#334155' }}>Kelas</th>
              <th style={{ padding: '15px', color: '#334155', textAlign: 'center' }}>Waktu Kunjung</th>
              <th style={{ padding: '15px', color: '#334155', textAlign: 'center' }}>Tujuan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>Memuat data...</td></tr>
            ) : dataKunjungan.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Belum ada data kunjungan pada tanggal ini.</td></tr>
            ) : (
              dataKunjungan.map((row, index) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', color: '#64748b' }}>{index + 1}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#1e293b' }}>{row.nama}<br/><span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>{row.nisn}</span></td>
                  <td style={{ padding: '15px', color: '#475569' }}>{row.kelas}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                      {formatJam(row.waktu_kunjung)}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: row.tujuan === 'Membaca' ? '#dbeafe' : row.tujuan === 'Pinjam Buku' ? '#fef3c7' : '#dcfce7', 
                      color: row.tujuan === 'Membaca' ? '#1e40af' : row.tujuan === 'Pinjam Buku' ? '#92400e' : '#166534', 
                      padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' 
                    }}>
                      {row.tujuan}
                    </span>
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