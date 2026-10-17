import { useState, useEffect } from 'react'

export default function DashboardPerpus() {
  // State dummy untuk simulasi data
  const [adminNama, setAdminNama] = useState('Iskandar Patue')
  const [namaPerpus, setNamaPerpus] = useState('Perpustakaan Bahari Samudera Ilmu')
  const [catatan, setCatatan] = useState('')

  // Simulasi tanggal hari ini
  const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* HEADER WELCOME */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '24px' }}>Selamat Datang, {adminNama} 👋</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>Berikut adalah ringkasan aktivitas di <strong>{namaPerpus}</strong> hari ini.</p>
      </div>

      {/* 4 KOTAK RINGKASAN ATAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', fontSize: '24px', color: '#3b82f6' }}>🚪</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>124</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Kunjungan</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '15px', borderRadius: '8px', fontSize: '24px', color: '#8b5cf6' }}>👤</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>5</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Anggota Baru Hari Ini</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '8px', fontSize: '24px', color: '#f59e0b' }}>👥</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>12</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Tamu</p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '8px', fontSize: '24px', color: '#10b981' }}>🪪</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>107</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>Anggota Berkunjung</p>
          </div>
        </div>

      </div>

      {/* BARIS TENGAH: TREN, STATUS KOLEKSI, DEMOGRAFI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        
        {/* PANEL TREN KUNJUNGAN */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>📈 Tren Kunjungan</h3>
            <select style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}>
              <option>Bulanan</option>
              <option>Mingguan</option>
            </select>
          </div>
          <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '5px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            {/* Simulasi Grafik Bar */}
            {[20, 40, 30, 70, 50, 90, 60, 80, 40, 50].map((tinggi, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: '#3b82f6', height: `${tinggi}%`, borderRadius: '3px 3px 0 0', opacity: 0.8 }}></div>
            ))}
          </div>
        </div>

        {/* PANEL STATUS KOLEKSI */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>📚 Status Koleksi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>1,250</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TOTAL JUDUL</p>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>3,400</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TOTAL EKSEMPLAR</p>
            </div>
            
            <div style={{ backgroundColor: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <h4 style={{ margin: 0, fontSize: '24px', color: '#b45309' }}>45</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#d97706', fontWeight: 'bold' }}>SEDANG DIPINJAM</p>
            </div>
            
            <div style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <h4 style={{ margin: 0, fontSize: '24px', color: '#b91c1c' }}>12</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>TERLAMBAT KEMBALI</p>
            </div>

          </div>
        </div>

        {/* PANEL DEMOGRAFI ANGGOTA */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Demografi Anggota</h3>
            <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>350 Total</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <span style={{ color: '#4b5563', fontSize: '14px' }}>Laki-laki</span>
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>150</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <span style={{ color: '#4b5563', fontSize: '14px' }}>Perempuan</span>
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>200</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>
              <span style={{ color: '#4b5563', fontSize: '14px' }}>Lainnya / Kosong</span>
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>0</span>
            </div>
          </div>
        </div>

      </div>

      {/* BARIS BAWAH: KALENDER & CATATAN */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* PANEL KALENDER (SIMULASI) */}
        <div style={{ flex: 1.5, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Kalender Kerja</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button style={{ border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>&lt;</button>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Oktober 2026</span>
              <button style={{ border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>&gt;</button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
            {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(hari => (
              <div key={hari} style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '10px' }}>{hari}</div>
            ))}
            {/* Simulasi Tanggal */}
            <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontWeight: 'bold' }}>4</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>5</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>6</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>7</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>8</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>9</div>
            <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontWeight: 'bold' }}>10</div>
            
            <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontWeight: 'bold' }}>11</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>12</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>13</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>14</div>
            <div style={{ padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>15</div>
            <div style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(59,130,246,0.3)' }}>16</div>
            <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontWeight: 'bold' }}>17</div>
          </div>
        </div>

        {/* PANEL CATATAN PUSTAKAWAN */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#fff1f2', padding: '20px', borderRadius: '10px', border: '1px solid #ffe4e6' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#be123c' }}>{hariIni}</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#e11d48' }}>Jadwal & Catatan Hari Ini</p>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#4c1d95', display: 'flex', alignItems: 'center', gap: '5px' }}>✏️ CATATAN PUSTAKAWAN</h4>
            <p style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>
              ℹ️ Ketik catatan lalu simpan. Catatan akan muncul sebagai pengingat agenda perpustakaan.
            </p>
            
            <textarea 
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis pengingat acara atau agenda..."
              style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'none', marginBottom: '15px' }}
            />
            
            <button style={{ width: '100%', padding: '10px', backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#be123c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e11d48'}
              onClick={() => alert('Catatan disimpan!')}
            >
              Simpan Catatan
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}