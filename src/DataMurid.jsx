import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import KartuMurid from './KartuMurid'
import * as XLSX from 'xlsx'

export default function DataMurid() {
  const [nama, setNama] = useState('')
  const [nisn, setNisn] = useState('')
  const [kelas, setKelas] = useState('')
  const [foto, setFoto] = useState(null)
  
  const [isEdit, setIsEdit] = useState(false)
  const [nisnLama, setNisnLama] = useState('')

  const [daftarMurid, setDaftarMurid] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [muridTerpilihList, setMuridTerpilihList] = useState(null) 
  const [pilihanCetak, setPilihanCetak] = useState([]) 
  
  // STATE BARU: Untuk Filter Kelas
  const [filterKelas, setFilterKelas] = useState('Semua Kelas')

  // State Pengaturan Global Kartu
  const [pengaturan, setPengaturan] = useState({
    kepsekNama: 'Nama Kepsek, S.Pd., M.Pd',
    kepsekNIP: '19700101 200001 1 001',
    perpusNama: 'Nama Perpus, S.Pd',
    perpusNIP: '19800101 200501 2 001',
    masaBerlaku: 'Juli 2027',
    logoProvinsi: null,
    logoSekolah: null,
    ttdKepsek: null,
    ttdPerpus: null
  })

  // --- FUNGSI LOAD DATA & TEMPLATE ---
  useEffect(() => {
    ambilData()
    try {
      const savedTemplate = localStorage.getItem('templateKartuSIKAP')
      if (savedTemplate) {
        setPengaturan(JSON.parse(savedTemplate))
      }
    } catch (error) {
      console.error('Gagal memuat template:', error)
    }
  }, [])

  const ambilData = async () => {
    const { data, error } = await supabase.from('students').select('*')
    if (error) console.error('Gagal mengambil data:', error)
    else setDaftarMurid(data || [])
  }

  // --- FUNGSI HANDLE INPUT PENGATURAN ---
  const handlePengaturanText = (e) => {
    setPengaturan(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePengaturanFile = (e, fieldName) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Ukuran gambar terlalu besar! Maksimal 1MB per gambar.')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setPengaturan(prev => ({ ...prev, [fieldName]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const simpanTemplate = () => {
    try {
      localStorage.setItem('templateKartuSIKAP', JSON.stringify(pengaturan))
      alert('✅ Template Kartu berhasil disimpan permanen!')
    } catch (error) {
      alert('❌ Gagal menyimpan template! Pastikan gambar tidak terlalu besar.')
      console.error(error)
    }
  }

  // --- FUNGSI SIMPAN, UPDATE & HAPUS DATA MURID ---
  const simpanData = async (e) => {
    e.preventDefault()
    setLoading(true)
    let fotoUrl = null

    if (foto) {
      const fileExt = foto.name.split('.').pop()
      const namaFileUnik = `${nisn}_${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('foto_murid').upload(namaFileUnik, foto)
      if (uploadError) { alert('Gagal mengunggah foto!'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('foto_murid').getPublicUrl(namaFileUnik)
      fotoUrl = urlData.publicUrl
    }

    const payload = { nama: nama, nisn: nisn, kelas: kelas, barcode_data: nisn }
    if (fotoUrl) payload.foto_url = fotoUrl 

    if (isEdit) {
      const { error: dbError } = await supabase.from('students').update(payload).eq('nisn', nisnLama)
      if (dbError) alert('Error Update: ' + dbError.message)
      else alert('Data berhasil diperbarui!')
    } else {
      const { error: dbError } = await supabase.from('students').insert([payload])
      if (dbError) alert('Error Simpan: ' + dbError.message)
      else alert('Data berhasil disimpan!')
    }

    setLoading(false); batalEdit(); ambilData()
  }

  const handleEdit = (murid) => {
    setNama(murid.nama); setNisn(murid.nisn); setKelas(murid.kelas); setNisnLama(murid.nisn)
    setIsEdit(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const batalEdit = () => {
    setNama(''); setNisn(''); setKelas(''); setFoto(null); setIsEdit(false); setNisnLama('')
    document.getElementById('input-foto').value = '' 
  }

  const hapusData = async (nisn_hapus) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus data murid dengan NISN: ${nisn_hapus}?`)
    if (!konfirmasi) return
    setLoading(true)
    const { error } = await supabase.from('students').delete().eq('nisn', nisn_hapus)
    setLoading(false)
    if (error) alert('Gagal menghapus data: ' + error.message)
    else { setPilihanCetak(pilihanCetak.filter(p => p.nisn !== nisn_hapus)); ambilData() }
  }

  // --- FUNGSI IMPORT EXCEL & CETAK ---
  const importExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const dataExcel = XLSX.utils.sheet_to_json(sheet)
        const dataSiapSimpan = dataExcel.map(row => ({
          nama: row['Nama'] || row['nama'] || '',
          nisn: String(row['NISN'] || row['nisn'] || ''),
          kelas: row['Kelas'] || row['kelas'] || '',
          barcode_data: String(row['NISN'] || row['nisn'] || '')
        })).filter(item => item.nama && item.nisn)

        if (dataSiapSimpan.length === 0) { alert('Data kosong atau format salah!'); setLoading(false); return }
        const { error } = await supabase.from('students').insert(dataSiapSimpan)
        if (error) alert('Gagal impor data!\n' + error.message)
        else { alert(`Berhasil mengimpor ${dataSiapSimpan.length} data murid!`); ambilData() }
      } catch (error) { alert('Error: ' + error.message) } 
      finally { setLoading(false); e.target.value = null }
    }
    reader.readAsBinaryString(file)
  }

  // --- LOGIKA FILTER KELAS ---
  const ringkasanKelas = daftarMurid.reduce((acc, curr) => {
    const kls = curr.kelas || 'Tanpa Kelas'
    acc[kls] = (acc[kls] || 0) + 1
    return acc
  }, {})

  const daftarKelasUnik = Object.keys(ringkasanKelas).sort()
  
  const muridTampil = filterKelas === 'Semua Kelas' 
    ? daftarMurid 
    : daftarMurid.filter(m => (m.kelas || 'Tanpa Kelas') === filterKelas)

  // --- LOGIKA PILIH CHECKBOX ---
  const handlePilihSemua = (e) => {
    if (e.target.checked) {
      // Hanya tambahkan murid yang TAMPIL di layar saat ini dan belum terpilih
      const unselectedVisible = muridTampil.filter(m => !pilihanCetak.find(p => p.nisn === m.nisn))
      setPilihanCetak([...pilihanCetak, ...unselectedVisible])
    } else {
      // Hapus murid yang TAMPIL di layar dari daftar terpilih
      setPilihanCetak(pilihanCetak.filter(p => !muridTampil.find(m => m.nisn === p.nisn)))
    }
  }

  const handlePilihSatu = (murid) => {
    const sudahAda = pilihanCetak.find(p => p.nisn === murid.nisn)
    if (sudahAda) setPilihanCetak(pilihanCetak.filter(p => p.nisn !== murid.nisn))
    else setPilihanCetak([...pilihanCetak, murid])
  }

  // Cek apakah SEMUA murid yang TAMPIL di layar saat ini sudah tercentang
  const isSemuaTampilTercentang = muridTampil.length > 0 && muridTampil.every(m => pilihanCetak.some(p => p.nisn === m.nisn))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1f2937', margin: 0 }}>Kelola Data Murid</h2>
        <label style={{ cursor: loading ? 'not-allowed' : 'pointer', padding: '10px 20px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', display: 'inline-block', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
          {loading ? 'Memproses...' : '📥 Import dari Excel'}
          <input type="file" accept=".xlsx, .xls" onChange={importExcel} style={{ display: 'none' }} disabled={loading} />
        </label>
      </div>

      {/* ======================================================== */}
      {/* 0. PANEL PENGATURAN GLOBAL KARTU (KOP & TTD)             */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#334155' }}>⚙️ Pengaturan Desain Kartu (Berlaku untuk semua cetakan)</h3>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Logo Provinsi (Kiri)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pengaturan.logoProvinsi && <img src={pengaturan.logoProvinsi} alt="L1" style={{ width: '32px', height: '32px', objectFit: 'contain', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px' }} />}
              <input type="file" accept="image/*" onChange={(e) => handlePengaturanFile(e, 'logoProvinsi')} style={{ fontSize: '11px', width: '100%', padding: '5px', background: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Logo Sekolah (Kanan)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pengaturan.logoSekolah && <img src={pengaturan.logoSekolah} alt="L2" style={{ width: '32px', height: '32px', objectFit: 'contain', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px' }} />}
              <input type="file" accept="image/*" onChange={(e) => handlePengaturanFile(e, 'logoSekolah')} style={{ fontSize: '11px', width: '100%', padding: '5px', background: 'white', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Masa Berlaku (Bln Thn)</label>
            <input type="text" name="masaBerlaku" value={pengaturan.masaBerlaku} onChange={handlePengaturanText} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tanda Tangan Kepala Sekolah</label>
            <input type="text" name="kepsekNama" value={pengaturan.kepsekNama} onChange={handlePengaturanText} placeholder="Nama Kepsek" style={{ width: '100%', padding: '6px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            <input type="text" name="kepsekNIP" value={pengaturan.kepsekNIP} onChange={handlePengaturanText} placeholder="NIP Kepsek" style={{ width: '100%', padding: '6px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              {pengaturan.ttdKepsek && <img src={pengaturan.ttdKepsek} alt="T1" style={{ height: '25px', objectFit: 'contain', border: '1px dotted #cbd5e1' }} />}
              <input type="file" accept="image/*" onChange={(e) => handlePengaturanFile(e, 'ttdKepsek')} style={{ fontSize: '11px', width: '100%' }} />
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tanda Tangan Kepala Perpustakaan</label>
            <input type="text" name="perpusNama" value={pengaturan.perpusNama} onChange={handlePengaturanText} placeholder="Nama Perpus" style={{ width: '100%', padding: '6px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            <input type="text" name="perpusNIP" value={pengaturan.perpusNIP} onChange={handlePengaturanText} placeholder="NIP Perpus" style={{ width: '100%', padding: '6px', marginBottom: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
              {pengaturan.ttdPerpus && <img src={pengaturan.ttdPerpus} alt="T2" style={{ height: '25px', objectFit: 'contain', border: '1px dotted #cbd5e1' }} />}
              <input type="file" accept="image/*" onChange={(e) => handlePengaturanFile(e, 'ttdPerpus')} style={{ fontSize: '11px', width: '100%' }} />
            </div>
          </div>

        </div>

        <div style={{ marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={simpanTemplate} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}>
            💾 Simpan Template Kartu
          </button>
        </div>
      </div>
      
      {/* ======================================================== */}
      {/* 1. FORM INPUT & EDIT DATA MURID                          */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: isEdit ? '#fffbeb' : 'white', padding: '20px', borderRadius: '8px', border: isEdit ? '2px solid #f59e0b' : 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px', transition: '0.3s' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: isEdit ? '#b45309' : '#374151' }}>
          {isEdit ? '✏️ Mode Edit Data Murid (Upload Foto)' : '➕ Tambah Data Murid Baru'}
        </h3>
        
        <form onSubmit={simpanData} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Nama Murid</label>
            <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Masukkan Nama..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>NISN</label>
            <input type="text" required value={nisn} onChange={(e) => setNisn(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Masukkan NISN..." disabled={isEdit} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '100px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Kelas</label>
            <input type="text" required value={kelas} onChange={(e) => setKelas(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Contoh: X-A" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Pas Foto (Opsional)</label>
            <input id="input-foto" type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} style={{ padding: '7px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9fafb' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: isEdit ? '#f59e0b' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '38px', minWidth: '120px' }}>
              {loading ? 'Menyimpan...' : isEdit ? 'Update Data' : 'Simpan Data'}
            </button>
            {isEdit && (
              <button type="button" onClick={batalEdit} style={{ padding: '10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: '38px' }}>Batal</button>
            )}
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. TABEL DATA MURID DENGAN FILTER                        */}
      {/* ======================================================== */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* Header dan Filter Kelas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f3f4f6', paddingBottom: '15px', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#374151' }}>Daftar Murid Terdaftar ({muridTampil.length} Murid)</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Total per Kelas:</span>
              {daftarKelasUnik.map(kls => (
                <span key={kls} style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  {kls}: {ringkasanKelas[kls]}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>Filter Kelas:</label>
              <select 
                value={filterKelas} 
                onChange={(e) => setFilterKelas(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', cursor: 'pointer', minWidth: '150px' }}
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {daftarKelasUnik.map(kls => (
                  <option key={kls} value={kls}>{kls}</option>
                ))}
              </select>
            </div>

            {pilihanCetak.length > 0 && (
              <button 
                onClick={() => setMuridTerpilihList(pilihanCetak)} 
                style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)' }}
              >
                🖨️ Cetak ({pilihanCetak.length}) Kartu
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', width: '40px', textAlign: 'center' }}>
                  {/* Kotak pilih semua sekarang hanya berlaku untuk murid yang sedang tampil di filter */}
                  <input type="checkbox" onChange={handlePilihSemua} checked={isSemuaTampilTercentang} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                </th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>NISN</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Nama Lengkap</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Kelas</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {muridTampil.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>Belum ada data murid di kelas ini.</td></tr>
              ) : (
                muridTampil.map((murid) => (
                  <tr key={murid.nisn} style={{ transition: '0.2s', backgroundColor: pilihanCetak.find(p => p.nisn === murid.nisn) ? '#f5f3ff' : 'transparent' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                      <input type="checkbox" checked={!!pilihanCetak.find(p => p.nisn === murid.nisn)} onChange={() => handlePilihSatu(murid)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', fontWeight: 'bold' }}>{murid.nisn}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      {murid.nama} 
                      {!murid.foto_url && <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '8px', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '10px' }}>(No Foto)</span>}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                        {murid.kelas}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setMuridTerpilihList([murid])} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Lihat Kartu</button>
                        <button onClick={() => handleEdit(murid)} style={{ padding: '6px 10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
                        <button onClick={() => hapusData(murid.nisn)} style={{ padding: '6px 10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KartuMurid muridList={muridTerpilihList} pengaturan={pengaturan} onClose={() => setMuridTerpilihList(null)} />
    </div>
  )
}