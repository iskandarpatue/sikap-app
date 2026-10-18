import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function IdBuku() {
  const [dataBukuMentah, setDataBukuMentah] = useState([])
  const [dataEksemplar, setDataEksemplar] = useState([])
  const [pencarian, setPencarian] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  // State untuk Modal Edit
  const [itemEdit, setItemEdit] = useState(null)

  // State untuk Mode Stock Opname
  const [modeOpname, setModeOpname] = useState(false)
  const [scanOpname, setScanOpname] = useState('')
  const [hasilOpname, setHasilOpname] = useState([]) // Menyimpan ID yang berhasil di-scan

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
      
      data.forEach(buku => {
        const jumlahStok = buku.stok > 0 ? buku.stok : 0
        for (let i = 1; i <= jumlahStok; i++) {
          const kodeBarcode = buku.isbn ? `${buku.isbn}-${i}` : `B-${buku.id}-${i}`
          
          listEksemplar.push({
            master_id: buku.id, // ID asli di tabel buku
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

  // ========================================================
  // FITUR HAPUS & EDIT EKSEMPLAR
  // ========================================================
  const hapusEksemplar = async (master_id, id_buku, judul) => {
    if(!window.confirm(`Yakin ingin menghapus eksemplar [${id_buku}] untuk buku "${judul}"? \n(Ini akan mengurangi stok di katalog)`)) return
    
    setLoading(true)
    // Cari stok saat ini
    const { data } = await supabase.from('buku').select('stok').eq('id', master_id).single()
    
    if (data && data.stok > 0) {
      // Kurangi stok 1
      const { error } = await supabase.from('buku').update({ stok: data.stok - 1 }).eq('id', master_id)
      if (!error) {
        alert('Eksemplar berhasil dihapus dan stok telah diperbarui!')
        ambilDataEksemplar()
      } else {
        alert('Gagal menghapus eksemplar.')
      }
    }
    setLoading(false)
  }

  const simpanEdit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Menyimpan perubahan No Panggil ke katalog utama
    const { error } = await supabase.from('buku').update({ no_panggil: itemEdit.no_panggil }).eq('id', itemEdit.master_id)
    if (!error) {
      alert('Data eksemplar berhasil diperbarui!')
      setItemEdit(null)
      ambilDataEksemplar()
    }
    setLoading(false)
  }

  // ========================================================
  // FITUR STOCK OPNAME (INVENTARISASI RAK)
  // ========================================================
  const handleScanOpname = (e) => {
    e.preventDefault()
    if (!scanOpname) return

    // Cek apakah barcode ada di data eksemplar
    const cekBuku = dataEksemplar.find(item => item.id_buku.toLowerCase() === scanOpname.toLowerCase())
    
    if (cekBuku) {
      if (!hasilOpname.includes(cekBuku.id_buku)) {
        setHasilOpname([...hasilOpname, cekBuku.id_buku])
      }
      setScanOpname('') // Kosongkan input untuk scan berikutnya
    } else {
      alert(`Barcode [${scanOpname}] tidak ditemukan di sistem!`)
      setScanOpname('')
    }
  }

  // --- FILTER PENCARIAN ---
  const eksemplarTampil = dataEksemplar.filter(item => 
    item.judul.toLowerCase().includes(pencarian.toLowerCase()) || 
    item.id_buku.toLowerCase().includes(pencarian.toLowerCase()) ||
    item.no_panggil.toLowerCase().includes(pencarian.toLowerCase())
  )

  // ========================================================
  // FITUR CETAK LABEL & BARCODE
  // ========================================================
  const handleCetak = (tipe) => {
    if (eksemplarTampil.length === 0) { alert('Tidak ada data yang bisa dicetak!'); return }
    const printWindow = window.open('', '_blank')
    let htmlContent = `
      <html><head><title>Cetak ${tipe}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .stiker { border: 1px dashed #000; padding: 10px; text-align: center; width: 5cm; display: flex; flex-direction: column; justify-content: center; align-items: center; }
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
      const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.id_buku}&scale=2&height=10&includetext`
      if (tipe === 'label') {
        htmlContent += `<div class="stiker" style="height: 3cm;"><div class="no-panggil">${item.no_panggil}</div><div class="judul">${item.judul.substring(0, 35)}...</div></div>`
      } else if (tipe === 'barcode') {
        htmlContent += `<div class="stiker" style="height: 3cm;"><img src="${barcodeUrl}" class="barcode-img" alt="barcode" /><div class="judul">${item.judul.substring(0, 30)}</div></div>`
      } else if (tipe === 'label_barcode') {
        htmlContent += `<div class="stiker" style="height: 4.5cm;"><div class="no-panggil">${item.no_panggil}</div><img src="${barcodeUrl}" class="barcode-img" alt="barcode" /><div class="judul">${item.judul.substring(0, 35)}</div></div>`
      }
    })
    htmlContent += `</div><script>setTimeout(() => { window.print(); }, 1500);</script></body></html>`
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // ========================================================
  // FITUR MIGRASI SLiMS
  // ========================================================
  const klikMigrasiSLiMS = () => fileInputRef.current.click()
  const handleMigrasiFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
        const dataBersih = dataExcel.map(row => ({
          judul: row['Judul'] || row['Title'] || '',
          pengarang: row['Pengarang'] || row['Author'] || '',
          penerbit: row['Penerbit'] || row['Publisher'] || '',
          isbn: String(row['ISBN'] || row['ISBN/ISSN'] || ''),
          stok: parseInt(row['Salinan'] || row['Eksemplar'] || row['Copies']) || 1,
        })).filter(b => b.judul && b.isbn)

        if (dataBersih.length === 0) throw new Error('Format CSV/Excel SLiMS tidak dikenali.')
        
        const { error } = await supabase.from('buku').insert(dataBersih)
        if (error) throw error

        alert(`🚀 Migrasi Sukses! ${dataBersih.length} buku dari SLiMS berhasil dipindahkan.`)
        ambilDataEksemplar()
      } catch (err) { alert('Gagal migrasi: ' + err.message) } 
      finally { setLoading(false); e.target.value = null }
    }
    reader.readAsBinaryString(file)
  }

  // TAMPILAN MODE STOCK OPNAME
  if (modeOpname) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#fbbf24' }}>📦 Mode Stock Opname Aktif</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>Scan barcode fisik buku di rak. Sistem akan memverifikasi datanya.</p>
          </div>
          <button onClick={() => setModeOpname(false)} style={{ backgroundColor: '#ef4444', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Akhiri Opname</button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '300px' }}>
            <h3 style={{ marginTop: 0 }}>Arahkan Scanner ke Barcode</h3>
            <form onSubmit={handleScanOpname} style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={scanOpname} onChange={(e) => setScanOpname(e.target.value)} placeholder="Scan Barcode / Ketik ID Buku lalu Enter" style={{ flex: 1, padding: '15px', fontSize: '18px', border: '2px solid #3b82f6', borderRadius: '6px', outline: 'none' }} autoFocus />
              <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Proses</button>
            </form>
            
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div><div style={{ fontSize: '30px', fontWeight: 'bold', color: '#10b981' }}>{hasilOpname.length}</div><div style={{ fontSize: '12px', color: '#64748b' }}>Buku Ditemukan</div></div>
              <div><div style={{ fontSize: '30px', fontWeight: 'bold', color: '#ef4444' }}>{dataEksemplar.length - hasilOpname.length}</div><div style={{ fontSize: '12px', color: '#64748b' }}>Belum Discan</div></div>
            </div>
          </div>

          <div style={{ flex: 2, backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', minWidth: '400px', height: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Daftar Pengecekan Rak</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px' }}>ID Buku</th>
                  <th style={{ padding: '10px' }}>Judul</th>
                  <th style={{ padding: '10px' }}>Status Opname</th>
                </tr>
              </thead>
              <tbody>
                {dataEksemplar.map(item => {
                  const ditemukan = hasilOpname.includes(item.id_buku)
                  return (
                    <tr key={item.id_unik} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: ditemukan ? '#ecfdf5' : 'transparent' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.id_buku}</td>
                      <td style={{ padding: '10px' }}>{item.judul}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: ditemukan ? '#10b981' : '#ef4444' }}>
                        {ditemukan ? '✅ Ditemukan' : '❌ Belum / Hilang'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // TAMPILAN UTAMA KELOLA EKSEMPLAR
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <input type="file" accept=".csv, .xlsx, .xls" ref={fileInputRef} onChange={handleMigrasiFile} style={{ display: 'none' }} />

      {/* MODAL EDIT */}
      {itemEdit && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Data Eksemplar</h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Barcode: <strong>{itemEdit.id_buku}</strong><br/>Judul: {itemEdit.judul}</p>
            <form onSubmit={simpanEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nomor Panggil (Call Number)</label>
                <input type="text" value={itemEdit.no_panggil} onChange={(e) => setItemEdit({...itemEdit, no_panggil: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setItemEdit(null)} style={{ padding: '10px 15px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PANEL STOCK OPNAME */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', fontSize: '24px' }}>📦</div>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>Inventarisasi (Stock Opname)</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Pindai fisik buku untuk menyesuaikan data di rak dengan sistem.</p>
          </div>
        </div>
        <button onClick={() => setModeOpname(true)} style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏱️ Mulai Stock Opname Baru
        </button>
      </div>

      {/* KELOLA EKSEMPLAR */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Kelola Eksemplar (ID Buku)</h2>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => handleCetak('label_barcode')} style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ ‖‖ Label & Barcode</button>
            <button onClick={() => handleCetak('label')} style={{ backgroundColor: '#0d9488', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ Label</button>
            <button onClick={() => handleCetak('barcode')} style={{ backgroundColor: '#334155', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>‖‖ Barcode</button>
            <button onClick={klikMigrasiSLiMS} disabled={loading} style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              🚀 Migrasi SLiMS
            </button>
          </div>
        </div>

        {/* PENCARIAN */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" value={pencarian} onChange={(e) => setPencarian(e.target.value)} placeholder="Cari: Judul / ID Buku / No. Panggil..." style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '350px' }} />
          <button style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cari</button>
        </div>

        {/* TABEL EKSEMPLAR */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#0f172a' }}>ID Buku/Barcode</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>No. Panggil</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Judul Katalog</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Status</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Catatan</th>
                <th style={{ padding: '12px', color: '#0f172a', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {eksemplarTampil.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Data tidak ditemukan.</td></tr>
              ) : (
                eksemplarTampil.map(item => (
                  <tr key={item.id_unik} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#2563eb' }}>{item.id_buku}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.no_panggil}</td>
                    <td style={{ padding: '12px' }}>{item.judul}</td>
                    <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{item.status}</span></td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{item.catatan}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button onClick={() => setItemEdit(item)} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Edit</button>
                        <button onClick={() => hapusEksemplar(item.master_id, item.id_buku, item.judul)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Hapus</button>
                      </div>
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
