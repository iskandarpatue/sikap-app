import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function KatalogBuku() {
  const [tabAktif, setTabAktif] = useState('input_satuan')
  const [daftarBuku, setDaftarBuku] = useState([])
  const [loading, setLoading] = useState(false)
  const [pencarian, setPencarian] = useState('')

  // State Form Input Satuan
  const [formData, setFormData] = useState({
    judul: '', subjudul: '', pengarang: '', penerbit: '', tahun_terbit: '', isbn: '', stok: '', kategori: '', cover_url: ''
  })
  const [fotoCover, setFotoCover] = useState(null)

  // Load Data
  useEffect(() => { ambilDataBuku() }, [])

  const ambilDataBuku = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('buku').select('*').order('id', { ascending: false })
    if (!error && data) setDaftarBuku(data)
    setLoading(false)
  }

  const handleInputForm = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // --- SIMPAN INPUT SATUAN ---
  const simpanBuku = async (e) => {
    e.preventDefault()
    if (!formData.judul || !formData.isbn) { alert('Judul dan ISBN wajib diisi!'); return }
    
    setLoading(true)
    let coverUrl = null

    // Upload Cover jika ada
    if (fotoCover) {
      const fileExt = fotoCover.name.split('.').pop()
      const namaFile = `cover_${formData.isbn}_${Date.now()}.${fileExt}`
      const { error: uploadErr } = await supabase.storage.from('cover_buku').upload(namaFile, fotoCover)
      if (!uploadErr) {
        const { data } = supabase.storage.from('cover_buku').getPublicUrl(namaFile)
        coverUrl = data.publicUrl
      }
    }

    const payload = { ...formData, cover_url: coverUrl, stok: parseInt(formData.stok) || 1 }
    
    const { error } = await supabase.from('buku').insert([payload])
    
    if (error) {
      alert('Gagal menyimpan buku: ' + error.message)
    } else {
      alert('Buku berhasil disimpan!')
      setFormData({ judul: '', subjudul: '', pengarang: '', penerbit: '', tahun_terbit: '', isbn: '', stok: '', kategori: '', cover_url: '' })
      setFotoCover(null)
      ambilDataBuku()
    }
    setLoading(false)
  }

  // --- HAPUS BUKU ---
  const hapusBuku = async (id, judul) => {
    if(!window.confirm(`Hapus buku "${judul}"?`)) return
    setLoading(true)
    await supabase.from('buku').delete().eq('id', id)
    ambilDataBuku()
  }

  // --- IMPORT EXCEL ---
  const handleImportExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
        
        const dataBersih = dataExcel.map(row => ({
          judul: row['Judul'] || row['judul'] || '',
          pengarang: row['Pengarang'] || row['Penulis'] || '',
          penerbit: row['Penerbit'] || '',
          tahun_terbit: String(row['Tahun'] || row['tahun_terbit'] || ''),
          isbn: String(row['ISBN'] || row['isbn'] || ''),
          stok: parseInt(row['Stok'] || row['stok']) || 1,
          kategori: row['Kategori'] || 'Umum'
        })).filter(b => b.judul && b.isbn)

        if(dataBersih.length === 0) { alert('Format tidak sesuai atau data kosong (Pastikan ada kolom Judul & ISBN)'); setLoading(false); return }
        
        const { error } = await supabase.from('buku').insert(dataBersih)
        if(error) alert('Error import: ' + error.message)
        else { alert(`${dataBersih.length} buku berhasil diimpor!`); ambilDataBuku() }
      } catch (err) { alert('Gagal membaca file Excel.') }
      finally { setLoading(false); e.target.value = null; setTabAktif('input_satuan') }
    }
    reader.readAsBinaryString(file)
  }

  // Filter Tabel
  const bukuTampil = daftarBuku.filter(b => 
    b.judul?.toLowerCase().includes(pencarian.toLowerCase()) || 
    b.pengarang?.toLowerCase().includes(pencarian.toLowerCase()) || 
    b.isbn?.includes(pencarian)
  )

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER TAB */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setTabAktif('input_satuan')} style={{ padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: tabAktif === 'input_satuan' ? '#e5e7eb' : 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📝 Input Satuan
        </button>
        <button onClick={() => setTabAktif('impor_excel')} style={{ padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: tabAktif === 'impor_excel' ? '#e5e7eb' : 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ⬇️ Impor Excel
        </button>
        <button onClick={() => setTabAktif('paste_excel')} style={{ padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: tabAktif === 'paste_excel' ? '#e5e7eb' : 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📋 Copy-Paste Excel
        </button>
        <div style={{ flex: 1 }}></div>
        <button onClick={() => window.scrollTo(0, document.body.scrollHeight)} style={{ padding: '10px 15px', border: '1px solid #10b981', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          📚 Lihat Daftar Katalog
        </button>
      </div>

      {/* PANEL INPUT SATUAN */}
      {tabAktif === 'input_satuan' && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1f2937' }}>Input metode "Satuan"</h2>
          <form onSubmit={simpanBuku} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" name="judul" required value={formData.judul} onChange={handleInputForm} placeholder="Judul Buku *" style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <button type="button" style={{ padding: '10px 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🔍 Cek Katalog</button>
            </div>
            
            <input type="text" name="subjudul" value={formData.subjudul} onChange={handleInputForm} placeholder="Subjudul (Opsional)" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
            
            <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', color: '#374151' }}>Daftar Penulis/Pengarang</span>
              </div>
              <input type="text" name="pengarang" value={formData.pengarang} onChange={handleInputForm} placeholder="Nama Pengarang..." style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input type="text" name="penerbit" value={formData.penerbit} onChange={handleInputForm} placeholder="Penerbit" style={{ flex: 1, minWidth: '200px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="text" name="tahun_terbit" value={formData.tahun_terbit} onChange={handleInputForm} placeholder="Tahun Terbit" style={{ flex: 1, minWidth: '150px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <input type="text" name="isbn" required value={formData.isbn} onChange={handleInputForm} placeholder="ISBN/Kode Barcode *" style={{ flex: 1, minWidth: '200px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="number" name="stok" value={formData.stok} onChange={handleInputForm} placeholder="Jumlah Stok (Eksemplar)" style={{ width: '200px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              <select name="kategori" value={formData.kategori} onChange={handleInputForm} style={{ width: '200px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <option value="">Pilih Kategori...</option>
                <option value="Buku Paket">Buku Paket / Textbook</option>
                <option value="Fiksi">Fiksi</option>
                <option value="Referensi">Referensi</option>
              </select>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Cover Buku (Opsional):</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoCover(e.target.files[0])} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
              {loading ? 'Menyimpan...' : 'Simpan Katalog Buku'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL IMPOR EXCEL */}
      {tabAktif === 'impor_excel' && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1f2937' }}>Input metode "Impor dari Excel"</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ padding: '10px 20px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              ⬆️ Unggah Katalog (XLSX)
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
            <button style={{ padding: '10px 20px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
              Unduh Template Excel
            </button>
          </div>
        </div>
      )}

      {/* PANEL COPY PASTE EXCEL */}
      {tabAktif === 'paste_excel' && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1f2937' }}>Input metode "Copy paste dari excel/tabel"</h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            <strong>Hanya Judul dan ISBN yang wajib diisi.</strong> Kolom lainnya boleh kosong.<br/>
            Salin langsung dari Excel atau Google Sheets, kemudian paste di bawah.
          </p>
          <textarea placeholder="Paste data dari excel/tabel/spreadsheet di sini..." style={{ width: '100%', height: '150px', padding: '15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical', marginBottom: '15px' }}></textarea>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Preview Data</button>
            <button onClick={() => setTabAktif('input_satuan')} style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
          </div>
        </div>
      )}

      {/* TABEL KATALOG PERPUSTAKAAN */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1f2937' }}>Katalog Perpustakaan</h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>Menampilkan <strong>{bukuTampil.length}</strong> dari <strong>{daftarBuku.length}</strong> judul</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="text" placeholder="🔍 Cari judul, penulis, ISBN..." value={pencarian} onChange={(e) => setPencarian(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '250px' }} />
          </div>
          <button style={{ padding: '8px 15px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            ⬇️ Export
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>NO</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>JUDUL BUKU</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>PENULIS</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>ISBN</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>STOK</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {bukuTampil.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: '30px', marginBottom: '10px' }}>📦</div>
                    Tidak ada buku ditemukan sesuai kriteria.
                  </td>
                </tr>
              ) : (
                bukuTampil.map((buku, index) => (
                  <tr key={buku.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px' }}>{index + 1}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {buku.cover_url && <img src={buku.cover_url} alt="Cover" style={{ width: '30px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />}
                        {buku.judul}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{buku.pengarang || '-'}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{buku.isbn}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}><span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{buku.stok}</span></td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button onClick={() => hapusBuku(buku.id, buku.judul)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Hapus</button>
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
