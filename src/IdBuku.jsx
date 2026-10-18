import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function IdBuku() {
  const [dataBukuMentah, setDataBukuMentah] = useState([])
  const [dataEksemplar, setDataEksemplar] = useState([])
  const [pencarian, setPencarian] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    ambilDataEksemplar()
  }, [])

  // --- AMBIL DATA DARI SUPABASE DAN PECAH JADI EKSEMPLAR ---
  const ambilDataEksemplar = async () => {
    setLoading(true)
    const { data } = await supabase.from('buku').select('*').order('id', { ascending: false })
    
    if (data) {
      setDataBukuMentah(data)
      let listEksemplar = []
      
      // Memecah katalog menjadi fisik eksemplar berdasarkan jumlah stok
      data.forEach(buku => {
        const jumlahStok = buku.stok > 0 ? buku.stok : 1 // Minimal 1 tampil
        for (let i = 1; i <= jumlahStok; i++) {
          // Membuat ID Barcode Unik (ISBN + Nomor Urut Copy)
          const kodeBarcode = buku.isbn ? `${buku.isbn}-${i}` : `B-${buku.id}-${i}`
          
          listEksemplar.push({
            id_unik: `${buku.id}-${i}`,
            id_buku: kodeBarcode,
            no_panggil: buku.no_panggil || '-',
            judul: buku.judul,
            lokasi: 'Rak Utama',
            status: 'Tersedia',
            kondisi: 'Baik',
            catatan: `Copy ${i} dari ${jumlahStok}`
          })
        }
      })
      setDataEksemplar(listEksemplar)
    }
    setLoading(false)
  }

  // --- FILTER PENCARIAN ---
  const eksemplarTampil = dataEksemplar.filter(item => 
    item.judul.toLowerCase().includes(pencarian.toLowerCase()) || 
    item.id_buku.toLowerCase().includes(pencarian.toLowerCase()) ||
    item.no_panggil.toLowerCase().includes(pencarian.toLowerCase())
  )

  // ========================================================
  // FITUR CETAK LABEL & BARCODE (Otomatis Buka Window Print)
  // ========================================================
  const handleCetak = (tipe) => {
    if (eksemplarTampil.length === 0) {
      alert('Tidak ada data yang bisa dicetak!')
      return
    }

    // Membuka Tab Baru untuk Print
    const printWindow = window.open('', '_blank')
    let htmlContent = `
      <html><head><title>Cetak ${tipe}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .stiker { 
          border: 1px dashed #000; padding: 10px; text-align: center; 
          width: 5cm; display: flex; flex-direction: column; justify-content: center; align-items: center;
        }
        .barcode-img { max-width: 100%; height: 40px; margin: 5px 0; }
        .no-panggil { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
        .judul { font-size: 11px; color: #333; line-height: 1.2; }
        @media print { .no-print { display: none; } }
      </style>
      </head><body>
      <button class="no-print" onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-bottom: 20px;">🖨️ Cetak Sekarang (Print)</button>
      <div class="grid">
    `

    eksemplarTampil.forEach(item => {
      // Menggunakan free API BWIP-JS untuk render Barcode
      const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.id_buku}&scale=2&height=10&includetext`
      
      if (tipe === 'label') {
        htmlContent += `
          <div class="stiker" style="height: 3cm;">
            <div class="no-panggil">${item.no_panggil}</div>
            <div class="judul">${item.judul.substring(0, 35)}...</div>
          </div>`
      } else if (tipe === 'barcode') {
        htmlContent += `
          <div class="stiker" style="height: 3cm;">
            <img src="${barcodeUrl}" class="barcode-img" alt="barcode" />
            <div class="judul">${item.judul.substring(0, 30)}</div>
          </div>`
      } else if (tipe === 'label_barcode') {
        htmlContent += `
          <div class="stiker" style="height: 4.5cm;">
            <div class="no-panggil">${item.no_panggil}</div>
            <img src="${barcodeUrl}" class="barcode-img" alt="barcode" />
            <div class="judul">${item.judul.substring(0, 35)}</div>
          </div>`
      }
    })

    htmlContent += `</div>
      <script>
        // Tunggu gambar barcode loading sebelum otomatis memunculkan dialog Print
        setTimeout(() => { window.print(); }, 1500);
      </script>
      </body></html>`

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // ========================================================
  // FITUR MIGRASI SLiMS (Upload CSV/XLSX dari Export SLiMS)
  // ========================================================
  const klikMigrasiSLiMS = () => {
    fileInputRef.current.click()
  }

  const handleMigrasiFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
        
        // Mapping kolom khas SLiMS ke Supabase SIKAP
        const dataBersih = dataExcel.map(row => ({
          judul: row['Judul'] || row['Title'] || '',
          pengarang: row['Pengarang'] || row['Author'] || '',
          penerbit: row['Penerbit'] || row['Publisher'] || '',
          tahun_terbit: String(row['Tahun Terbit'] || row['Publish Year'] || ''),
          isbn: String(row['ISBN'] || row['ISBN/ISSN'] || ''),
          stok: parseInt(row['Salinan'] || row['Eksemplar'] || row['Copies']) || 1,
          ddc: String(row['Klasifikasi'] || row['Classification'] || ''),
          no_panggil: String(row['Nomor Panggil'] || row['Call Number'] || ''),
          gmd: row['GMD'] || 'Text',
          bahasa: row['Bahasa'] || row['Language'] || 'Indonesia'
        })).filter(b => b.judul && b.isbn)

        if (dataBersih.length === 0) {
          alert('Format CSV/Excel SLiMS tidak dikenali. Pastikan ada kolom Judul dan ISBN.')
          setLoading(false); return
        }
        
        // Simpan ke Supabase secara massal
        const { error } = await supabase.from('buku').insert(dataBersih)
        if (error) throw error

        alert(`🚀 Migrasi Sukses! ${dataBersih.length} buku dari SLiMS berhasil dipindahkan ke SIKAP.`)
        ambilDataEksemplar() // Refresh tabel
      } catch (err) {
        alert('Gagal melakukan migrasi SLiMS: ' + err.message)
      } finally {
        setLoading(false)
        e.target.value = null // Reset input file
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Input File Tersembunyi untuk Migrasi SLiMS */}
      <input 
        type="file" 
        accept=".csv, .xlsx, .xls" 
        ref={fileInputRef} 
        onChange={handleMigrasiFile} 
        style={{ display: 'none' }} 
      />

      {/* PANEL STOCK OPNAME */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', fontSize: '24px' }}>📦</div>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Inventarisasi (Stock Opname)</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Pindai fisik buku untuk menyesuaikan data di rak dengan sistem.</p>
          </div>
        </div>
        <button style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏱️ Mulai Stock Opname Baru
        </button>
      </div>

      {/* KELOLA EKSEMPLAR */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Kelola Eksemplar (ID Buku)</h2>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => handleCetak('label_barcode')} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ ‖‖ Label & Barcode</button>
            <button onClick={() => handleCetak('label')} style={{ backgroundColor: '#0d9488', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ Label (Punggung)</button>
            <button onClick={() => handleCetak('barcode')} style={{ backgroundColor: '#334155', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>‖‖ Barcode</button>
            
            {/* Fitur Migrasi SLiMS */}
            <button onClick={klikMigrasiSLiMS} disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {loading ? '⏳ Memproses...' : '🚀 Migrasi SLiMS'}
            </button>
          </div>
        </div>

        {/* PENCARIAN */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" value={pencarian} onChange={(e) => setPencarian(e.target.value)} placeholder="Cari: Judul / ID Buku / No. Panggil..." style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '350px' }} />
          <button style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cari</button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Menampilkan <strong>{eksemplarTampil.length}</strong> dari {dataEksemplar.length} eksemplar fisik</p>

        {/* TABEL EKSEMPLAR */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#0f172a' }}>ID Buku/Barcode</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>No. Panggil</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Judul Katalog</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Lokasi</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Status</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {loading && dataEksemplar.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Memuat data eksemplar... ⏳</td></tr>
              ) : eksemplarTampil.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>Tidak ada eksemplar ditemukan.</td></tr>
              ) : (
                eksemplarTampil.map(item => (
                  <tr key={item.id_unik} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#2563eb' }}>{item.id_buku}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.no_panggil}</td>
                    <td style={{ padding: '12px' }}>{item.judul}</td>
                    <td style={{ padding: '12px' }}>{item.lokasi}</td>
                    <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>{item.status}</span></td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{item.catatan}</td>
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
