import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import KartuMurid from './KartuMurid'
import * as XLSX from 'xlsx'

export default function DataMurid() {
  const [nama, setNama] = useState('')
  const [nisn, setNisn] = useState('')
  const [kelas, setKelas] = useState('')
  const [noHpOrtu, setNoHpOrtu] = useState('') // STATE BARU UNTUK NO WA
  const [foto, setFoto] = useState(null)
  
  const [isEdit, setIsEdit] = useState(false)
  const [nisnLama, setNisnLama] = useState('')

  const [daftarMurid, setDaftarMurid] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [muridTerpilihList, setMuridTerpilihList] = useState(null) 
  const [pilihanCetak, setPilihanCetak] = useState([]) 
  
  const [filterKelas, setFilterKelas] = useState('Semua Kelas')

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

    // UPDATE: Menambahkan no_hp_ortu ke dalam payload
    const payload = { 
      nama: nama, 
      nisn: nisn, 
      kelas: kelas, 
      barcode_data: nisn,
      no_hp_ortu: noHpOrtu // INI TAMBAHAN BARUNYA
    }
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
    setNama(murid.nama)
    setNisn(murid.nisn)
    setKelas(murid.kelas)
    setNoHpOrtu(murid.no_hp_ortu || '') // Ambil nomor HP jika ada
    setNisnLama(murid.nisn)
    setIsEdit(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const batalEdit = () => {
    setNama(''); setNisn(''); setKelas(''); setNoHpOrtu(''); setFoto(null); setIsEdit(false); setNisnLama('')
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
          barcode_data: String(row['NISN'] || row['nisn'] || ''),
          no_hp_ortu: String(row['No HP Ortu'] || row['no_hp_ortu'] || '') // Tangkap No HP dari Excel jika ada
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
      const unselectedVisible = muridTampil.filter(m => !pilihanCetak.find(p => p.nisn === m.nisn))
      setPilihanCetak([...pilihanCetak, ...unselectedVisible])
    } else {
      setPilihanCetak(pilihanCetak.filter(p => !muridTampil.find(m => m.nisn === p.nisn)))
    }
  }

  const handlePilihSatu = (murid) => {
    const sudahAda = pilihanCetak.find(p => p.nisn === murid.nisn)
    if (sudahAda) setPilihanCetak(pilihanCetak.filter(p => p.nisn !== murid.nisn))
    else setPilihanCetak([...pilihanCetak, murid])
  }

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
              <input type="file" accept="image/*" onChange={(e) => handlePengaturanFile(
