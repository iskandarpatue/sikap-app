import { useState } from 'react'
import DataMurid from './DataMurid'
import ScanKehadiran from './ScanKehadiran'
import RekapKehadiran from './RekapKehadiran'
import ScanPerpustakaan from './ScanPerpustakaan'
import KelolaAkun from './KelolaAkun'
import RekapPerpustakaan from './RekapPerpustakaan'
import DashboardPerpus from './DashboardPerpus'
import MenuPerpustakaan from './MenuPerpustakaan'
import KatalogBuku from './KatalogBuku'
import IdBuku from './IdBuku' // Import panel Kelola Eksemplar baru

export default function Dashboard({ user, onLogout }) {
  
  // ==========================================
  // 1. DASHBOARD KHUSUS ADMIN UTAMA
  // ==========================================
  if (user.role === 'admin') {
    const [menuAktif, setMenuAktif] = useState('datamurid')
    
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
        {/* SIDEBAR ADMIN */}
        <div style={{ width: '260px', backgroundColor: '#1e3a8a', color: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #3b82f6', textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Panel Admin</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#bfdbfe' }}>Sistem SIKAP SMAN 1</p>
          </div>
          <div style={{ padding: '20px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setMenuAktif('datamurid')} style={{ padding: '12px 15px', textAlign: 'left', backgroundColor: menuAktif === 'datamurid' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>🪪 Kelola Data & Kartu</button>
            <button onClick={() => setMenuAktif('akun')} style={{ padding: '12px 15px', textAlign: 'left', backgroundColor: menuAktif === 'akun' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>🔐 Kelola Akun Petugas</button>
          </div>
          <div style={{ padding: '20px' }}>
            <button onClick={onLogout} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 LOGOUT ADMIN</button>
          </div>
        </div>
        
        {/* KONTEN KANAN ADMIN */}
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
          {menuAktif === 'datamurid' ? <DataMurid /> : <KelolaAkun />}
        </div>
      </div>
    )
  }

  // ==========================================
  // 2. DASHBOARD KHUSUS GURU PIKET (KEHADIRAN)
  // ==========================================
  if (user.role === 'guru') {
    const [tabKehadiran, setTabKehadiran] = useState('scan')
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* HEADER GURU */}
        <div style={{ backgroundColor: '#2563eb', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>🏫 Dashboard Guru Piket (Kehadiran)</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#bfdbfe' }}>Selamat Bertugas, <strong>{user.nama_lengkap}</strong></p>
          </div>
          <button onClick={onLogout} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 LOGOUT</button>
        </div>
        
        {/* KONTEN UTAMA GURU */}
        <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setTabKehadiran('scan')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabKehadiran === 'scan' ? '#3b82f6' : 'transparent', color: tabKehadiran === 'scan' ? 'white' : '#475569' }}>📷 Panel Scanner Kehadiran</button>
            <button onClick={() => setTabKehadiran('rekap')} style={{ flex: 1, padding: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabKehadiran === 'rekap' ? '#3b82f6' : 'transparent', color: tabKehadiran === 'rekap' ? 'white' : '#475569' }}>📊 Laporan & Unduh Excel</button>
          </div>
          
          {tabKehadiran === 'scan' ? <ScanKehadiran /> : <RekapKehadiran />}
        </div>
      </div>
    )
  }

  // ==========================================
  // 3. DASHBOARD KHUSUS PETUGAS PERPUSTAKAAN
  // ==========================================
  if (user.role === 'perpus') {
    const [tabPerpus, setTabPerpus] = useState('dashboard') 
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* HEADER PERPUS */}
        <div style={{ backgroundColor: '#059669', padding: '15px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>📚 Sistem Informasi Perpustakaan</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#a7f3d0' }}>Selamat Bertugas, <strong>{user.nama_lengkap}</strong></p>
          </div>
          <button onClick={onLogout} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 LOGOUT</button>
        </div>
        
        {/* KONTEN UTAMA PERPUS */}
        <div style={{ padding: '20px 30px', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* MENU TAB NAVIGASI PERPUS LENGKAP */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setTabPerpus('dashboard')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'dashboard' ? '#10b981' : 'transparent', color: tabPerpus === 'dashboard' ? 'white' : '#475569', fontSize: '13px' }}
            >
              🏠 Dashboard
            </button>
            <button 
              onClick={() => setTabPerpus('profil')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'profil' ? '#10b981' : 'transparent', color: tabPerpus === 'profil' ? 'white' : '#475569', fontSize: '13px' }}
            >
              🏢 Profil
            </button>
            <button 
              onClick={() => setTabPerpus('katalog')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'katalog' ? '#10b981' : 'transparent', color: tabPerpus === 'katalog' ? 'white' : '#475569', fontSize: '13px' }}
            >
              📚 Katalog Buku
            </button>
            
            {/* TOMBOL TAB BARU: ID BUKU */}
            <button 
              onClick={() => setTabPerpus('eksemplar')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'eksemplar' ? '#10b981' : 'transparent', color: tabPerpus === 'eksemplar' ? 'white' : '#475569', fontSize: '13px' }}
            >
              🏷️ ID Buku
            </button>

            <button 
              onClick={() => setTabPerpus('scan')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'scan' ? '#10b981' : 'transparent', color: tabPerpus === 'scan' ? 'white' : '#475569', fontSize: '13px' }}
            >
              📷 Sirkulasi
            </button>
            <button 
              onClick={() => setTabPerpus('rekap')} 
              style={{ flex: 1, minWidth: '100px', padding: '10px', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: '0.2s', backgroundColor: tabPerpus === 'rekap' ? '#10b981' : 'transparent', color: tabPerpus === 'rekap' ? 'white' : '#475569', fontSize: '13px' }}
            >
              📉 Rekap Data
            </button>
          </div>
          
          {/* AREA TAMPILAN KONTEN BERDASARKAN TAB */}
          {tabPerpus === 'dashboard' && <DashboardPerpus />}
          {tabPerpus === 'profil' && <MenuPerpustakaan />}
          {tabPerpus === 'katalog' && <KatalogBuku />}
          {tabPerpus === 'eksemplar' && <IdBuku />}
          {tabPerpus === 'scan' && <ScanPerpustakaan />}
          {tabPerpus === 'rekap' && <RekapPerpustakaan />}
          
        </div>
      </div>
    )
  }

  return null
}
