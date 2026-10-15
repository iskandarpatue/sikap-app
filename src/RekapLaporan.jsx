import { useState } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function RekapLaporan() {
  const [loading, setLoading] = useState(false)

  // Fungsi Cetak Rekap Kehadiran
  const cetakKehadiran = async () => {
    setLoading(true)
    // Tarik data kehadiran dan gabungkan dengan nama murid
    const { data, error } = await supabase
      .from('kehadiran')
      .select(`
        tanggal, 
        jam_datang, 
        jam_pulang,
        students (nisn, nama, kelas)
      `)
      .order('tanggal', { ascending: false })

    setLoading(false)

    if (error) {
      alert('Gagal mengambil data kehadiran!')
      return
    }

    // Rapikan format data untuk Excel
    const dataExcel = data.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tanggal,
      'NISN': item.students?.nisn || '-',
      'Nama Murid': item.students?.nama || '-',
      'Kelas': item.students?.kelas || '-',
      'Jam Datang': item.jam_datang ? new Date(item.jam_datang).toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar' }) : 'Belum Datang',
      'Jam Pulang': item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString('id-ID', { timeZone: 'Asia/Makassar' }) : 'Belum Pulang'
    }))

    // Proses pembuatan file Excel
    const worksheet = XLSX.utils.json_to_sheet(dataExcel)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kehadiran")
    XLSX.writeFile(workbook, "Rekap_Kehadiran_SMAN1_Batudaa_Pantai.xlsx")
  }

  // Fungsi Cetak Rekap Perpustakaan
  const cetakPerpustakaan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('library_transactions')
      .select(`
        waktu_transaksi, 
        judul_buku, 
        jumlah, 
        tipe_transaksi,
        students (nisn, nama, kelas)
      `)
      .order('waktu_transaksi', { ascending: false })

    setLoading(false)

    if (error) {
      alert('Gagal mengambil data perpustakaan!')
      return
    }

    const dataExcel = data.map((item, index) => ({
      'No': index + 1,
      'Waktu Transaksi': new Date(item.waktu_transaksi).toLocaleString('id-ID', { timeZone: 'Asia/Makassar' }),
      'NISN': item.students?.nisn || '-',
      'Nama Murid': item.students?.nama || '-',
      'Kelas': item.students?.kelas || '-',
      'Judul Buku': item.judul_buku,
      'Jumlah': item.jumlah,
      'Jenis Transaksi': item.tipe_transaksi.toUpperCase()
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataExcel)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Perpustakaan")
    XLSX.writeFile(workbook, "Rekap_Perpustakaan_SMAN1_Batudaa_Pantai.xlsx")
  }

  return (
    <div>
      <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>Rekap Laporan & Unduh Excel</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Card Kehadiran */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>Laporan Kehadiran</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Unduh seluruh riwayat jam datang dan jam pulang murid dalam format Excel (.xlsx).</p>
          <button onClick={cetakKehadiran} disabled={loading} style={{ padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? 'Memproses...' : '📥 Download Excel Kehadiran'}
          </button>
        </div>

        {/* Card Perpustakaan */}
        <div style={{ flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, color: '#374151' }}>Laporan Perpustakaan</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Unduh seluruh riwayat peminjaman dan pengembalian buku dalam format Excel (.xlsx).</p>
          <button onClick={cetakPerpustakaan} disabled={loading} style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? 'Memproses...' : '📥 Download Excel Perpustakaan'}
          </button>
        </div>

      </div>
    </div>
  )
}