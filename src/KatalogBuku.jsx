import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import * as XLSX from 'xlsx'

export default function KatalogBuku() {
  const [tabAktif, setTabAktif] = useState('input_satuan')
  const [daftarBuku, setDaftarBuku] = useState([])
  const [loading, setLoading] = useState(false)
  const [pencarian, setPencarian] = useState('')

  // State Form Input Satuan Lengkap (Ala SLiMS)
  const [formData, setFormData] = useState({
    judul: '', subjudul: '', pengarang: '', penerbit: '', tahun_terbit: '', 
    isbn: '', stok: '1', kategori: '', cover_url: '',
    gmd: 'Text', bahasa: 'Indonesia', kota_terbit: '', jumlah_halaman: '',
    ddc: '', no_panggil: '', tinggi_buku: '', edisi_cetakan: '', 
    subjek_keyword: '', tipe_koleksi: 'Textbook'
  })
  const [fotoCover, setFotoCover] = useState(null)

  useEffect(() => { ambilDataBuku() }, [])

  const ambilDataBuku = async () => {
    setLoading(true)
    const { data } = await supabase.from('buku').select('*').order('id', { ascending: false })
    if (data) setDaftarBuku(data)
    setLoading(false)
  }

  const handleInputForm = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // --- SIMPAN INPUT SATUAN ---
  const simpanBuku = async (e) => {
    e.preventDefault()
    if (!formData.judul || !formData.isbn) { alert('Judul dan ISBN/ISSN wajib diisi!'); return }
    
    setLoading(true)
    let coverUrl = null

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
    
    if (error) alert('Gagal menyimpan buku: ' + error.message)
    else {
      alert('Katalog Buku (RDA) berhasil disimpan!')
      setFormData({ 
        judul: '', subjudul: '', pengarang: '', penerbit: '', tahun_terbit: '', 
        isbn: '', stok: '1', kategori: '', cover_url: '', gmd: 'Text', bahasa: 'Indonesia', 
        kota_terbit: '', jumlah_halaman: '', ddc: '', no_panggil: '', 
        tinggi_buku: '', edisi_cetakan: '', subjek_keyword: '', tipe_koleksi: 'Textbook' 
      })
      setFotoCover(null)
      ambilDataBuku()
    }
    setLoading(false)
  }

  const hapusBuku = async (id, judul) => {
    if(!window.confirm(`Hapus buku "${judul}"?`)) return
    setLoading(true)
    await supabase.from('buku').delete().eq('id', id)
    ambilDataBuku()
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
        <button onClick={() => setTabAktif('input_satuan')} style={{ padding: '10px 15px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: tabAktif === 'input_satuan' ? '#e5e7eb' : 'white', cursor: 'pointer', fontWeight: 'bold' }}>📝 Input Satuan</button>
        <button onClick={() => setTabAktif('daftar_katalog')} style={{ padding: '10px 15px', borderRadius: '4px', border: '1px solid #10b981', backgroundColor: '#dcfce7', color: '#166534', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>📚 Lihat Daftar Katalog</button>
      </div>

      {/* PANEL INPUT SATUAN (Gaya SLiMS) */}
      {tabAktif === 'input_satuan' && (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '30px', maxWidth: '1000px' }}>
          <h2 style={{ margin: '0 0 25px 0', fontSize: '18px', color: '#1f2937', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>Input metode "Satuan" (RDA)</h2>
          
          <form onSubmit={simpanBuku} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* Judul & Subjudul */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <input type="text" name="judul" required value={formData.judul} onChange={handleInputForm} placeholder="Judul *" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <button type="button" style={{ padding: '0 20px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>🔍 Cek Katalog</button>
            </div>
            <input type="text" name="subjudul" value={formData.subjudul} onChange={handleInputForm} placeholder="Subjudul" style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />

            {/* Pengarang */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '15px', backgroundColor: '#f8fafc' }}>
              <label style={{ fontWeight: 'bold', color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                Daftar Penulis/Pengarang
                <span style={{ color: '#2563eb', cursor: 'pointer', fontSize: '13px' }}>+ Kelola Penulis</span>
              </label>
              <input type="text" name="pengarang" value={formData.pengarang} onChange={handleInputForm} placeholder="Nama pengarang..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
            </div>

            {/* GMD & Bahasa */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>GMD</label>
                <select name="gmd" value={formData.gmd} onChange={handleInputForm} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Text">Text</option><option value="Cartographic Material">Cartographic Material</option><option value="Computer Software">Computer Software</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Bahasa</label>
                <select name="bahasa" value={formData.bahasa} onChange={handleInputForm} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Indonesia">Indonesia</option><option value="English">English</option><option value="Arabic">Arabic</option>
                </select>
              </div>
            </div>

            {/* Penerbitan */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Kota Terbit</label>
                <input type="text" name="kota_terbit" value={formData.kota_terbit} onChange={handleInputForm} placeholder="Kota Terbit" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Penerbit</label>
                <input type="text" name="penerbit" value={formData.penerbit} onChange={handleInputForm} placeholder="Penerbit" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Fisik Buku */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Tahun</label>
                <input type="text" name="tahun_terbit" value={formData.tahun_terbit} onChange={handleInputForm} placeholder="Tahun" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Jumlah Halaman</label>
                <input type="text" name="jumlah_halaman" value={formData.jumlah_halaman} onChange={handleInputForm} placeholder="Misal: 230 halaman" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Klasifikasi & Kode */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>ISBN/ISSN *</label>
                <input type="text" name="isbn" required value={formData.isbn} onChange={handleInputForm} placeholder="ISBN/ISSN" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>DDC (Klasifikasi)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" name="ddc" value={formData.ddc} onChange={handleInputForm} placeholder="DDC" style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  <button type="button" style={{ backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', fontWeight: 'bold' }}>AI</button>
                  <button type="button" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px', fontWeight: 'bold' }}>e-DDC</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Tinggi (Misal: 23 cm)</label>
                <input type="text" name="tinggi_buku" value={formData.tinggi_buku} onChange={handleInputForm} placeholder="Tinggi" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Edisi/Cetakan</label>
                <input type="text" name="edisi_cetakan" value={formData.edisi_cetakan} onChange={handleInputForm} placeholder="Misal: Cetakan 4" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Subjek & Tipe Koleksi */}
            <div>
              <label style={{ fontSize: '12px', color: '#64748b' }}>Subjek/Keyword (pisahkan dengan koma)</label>
              <textarea name="subjek_keyword" value={formData.subjek_keyword} onChange={handleInputForm} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', height: '60px', boxSizing: 'border-box' }}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Tipe Koleksi</label>
                <select name="tipe_koleksi" value={formData.tipe_koleksi} onChange={handleInputForm} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Textbook">Textbook</option><option value="Reference">Reference</option><option value="Fiction">Fiction</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Jumlah Stok Awal</label>
                <input type="number" name="stok" value={formData.stok} onChange={handleInputForm} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Unggah Cover (Opsional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFotoCover(e.target.files[0])} style={{ display: 'block', padding: '9px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', boxSizing: 'border-box', backgroundColor: 'white' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '15px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)' }}>
              {loading ? 'Menyimpan...' : 'Simpan Katalog RDA'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL DAFTAR KATALOG */}
      {tabAktif === 'daftar_katalog' && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1f2937' }}>Katalog Perpustakaan</h2>
            <input type="text" placeholder="🔍 Cari judul, penulis, ISBN..." value={pencarian} onChange={(e) => setPencarian(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '250px' }} />
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>NO</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>JUDUL BUKU</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>PENULIS</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>ISBN</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>STOK</th>
                <th style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {bukuTampil.map((buku, index) => (
                <tr key={buku.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{buku.judul}</td>
                  <td style={{ padding: '12px' }}>{buku.pengarang || '-'}</td>
                  <td style={{ padding: '12px' }}>{buku.isbn}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{buku.stok}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => hapusBuku(buku.id, buku.judul)} style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
