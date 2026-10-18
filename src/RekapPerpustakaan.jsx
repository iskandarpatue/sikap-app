import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function RekapPerpustakaan() {
  const [dataRekap, setDataRekap] = useState([])
  const [loading, setLoading] = useState(false)
  
  // State untuk Filter
  const [filterJenis, setFilterJenis] = useState('Semua')
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1) // 1-12
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())

  useEffect(() => {
    ambilDataRekap()
  }, [filterJenis, filterBulan, filterTahun])

  const ambilDataRekap = async () => {
    setLoading(true)
    
    // Tarik semua data dari Supabase (di aplikasi nyata yang datanya puluhan ribu, 
    // sebaiknya filter tanggal dilakukan langsung di query Supabase)
    let query = supabase.from('sirkulasi_perpus').select('*').order('id', { ascending: false })
    
    if (filterJenis !== 'Semua') {
      query = query.eq('jenis_layanan', filterJenis)
    }

    const { data, error } = await query
    
    if (data) {
      // Filter manual berdasarkan bulan & tahun dari string tanggal (DD/MM/YYYY, HH:MM:SS)
      const dataTerfilter = data.filter(item => {
        const tglStr = item.tgl_pinjam || ''
        // Ekstrak bulan dan tahun dari format "DD/MM/YYYY, HH:MM:SS"
        const parts = tglStr.split(',')[0].split('/')
        if (parts.length === 3) {
          const bulanItem = parseInt(parts[1], 10)
          const tahunItem = parseInt(parts[2], 10)
          return bulanItem === parseInt(filterBulan) && tahunItem === parseInt(filterTahun)
        }
        return true // Tampilkan jika format tanggal tidak standar
      })
      setDataRekap(dataTerfilter)
    } else if (error) {
      console.error("Gagal mengambil data rekap:", error)
    }
    
    setLoading(false)
  }

  // --- FUNGSI EXPORT KE EXCEL ---
  const unduhExcel = () => {
    if (dataRekap.length === 0) {
      alert('Tidak ada data untuk diunduh pada bulan ini.')
      return
    }

    // Merapikan data untuk Excel
    const dataSiapExport = dataRekap.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tgl_pinjam,
      'NISN': item.nisn_murid,
      'Nama Murid': item.nama_murid,
      'Jenis Layanan': item.jenis_layanan,
      'Status': item.status,
      'ISBN Buku': item.isbn_buku || '-',
      'Judul Buku': item.judul_buku || '-',
      'Tanggal Kembali': item.tgl_kembali || '-'
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataSiapExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Perpustakaan")
    
    // Menyimpan file
    const namaFile = `Laporan_Perpus_${filterBulan}_${filterTahun}.xlsx`
    XLSX.writeFile(workbook, namaFile)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER & FILTER */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '20px' }}>📉 Laporan & Rekapitulasi Data</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Pantau dan unduh riwayat sirkulasi perpustakaan sekolah.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Jenis */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Jenis Layanan</label>
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="Semua">Semua Aktivitas</option>
                <option value="Kunjungan">Hanya Kunjungan</option>
                <option value="Peminjaman">Hanya Peminjaman</option>
              </select>
            </div>

            {/* Filter Bulan */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Bulan</label>
              <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="1">Januari</option><option value="2">Februari</option><option value="3">Maret</option>
                <option value="4">April</option><option value="5">Mei</option><option value="6">Juni</option>
                <option value="7">Juli</option><option value="8">Agustus</option><option value="9">September</option>
                <option value="10">Oktober</option><option value="11">November</option><option value="12">Desember</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Tahun</label>
              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            {/* Tombol Export */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <button onClick={unduhExcel} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}>
                <span>⬇️</span> Unduh Excel
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* TABEL DATA REKAP */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#334155', fontSize: '16px' }}>Total Data: {dataRekap.length} Baris</h3>
          {loading && <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '14px' }}>Memuat data... ⏳</span>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', color: '#475569' }}>NO</th>
                <th style={{ padding: '12px', color: '#475569' }}>TANGGAL (WAKTU)</th>
                <th style={{ padding: '12px', color: '#475569' }}>NAMA MURID</th>
                <th style={{ padding: '12px', color: '#475569' }}>LAYANAN</th>
                <th style={{ padding: '12px', color: '#475569' }}>BUKU & STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dataRekap.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>📭</div>
                    Tidak ada catatan aktivitas pada periode ini.
                  </td>
                </tr>
              ) : (
                dataRekap.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '12px', color: '#334155' }}>{item.tgl_pinjam}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                      {item.nama_murid}
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>NISN: {item.nisn_murid}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                        backgroundColor: item.jenis_layanan === 'Kunjungan' ? '#e0f2fe' : '#fef3c7',
                        color: item.jenis_layanan === 'Kunjungan' ? '#0369a1' : '#b45309'
                      }}>
                        {item.jenis_layanan}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.jenis_layanan === 'Kunjungan' ? (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>- Baca di tempat -</span>
                      ) : (
                        <div>
                          <div style={{ color: '#334155', fontWeight: 'bold' }}>📖 {item.judul_buku}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                              backgroundColor: item.status === 'Dipinjam' ? '#fee2e2' : '#dcfce7',
                              color: item.status === 'Dipinjam' ? '#b91c1c' : '#15803d'
                            }}>
                              {item.status.toUpperCase()}
                            </span>
                            {item.tgl_kembali && <span style={{ fontSize: '11px', color: '#64748b' }}>Kembali: {item.tgl_kembali}</span>}
                          </div>
                        </div>
                      )}
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
