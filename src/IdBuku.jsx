import { useState } from 'react'

export default function IdBuku() {
  const [dataEksemplar, setDataEksemplar] = useState([]) // Data dummy untuk awal

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
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
            <button style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ ‖‖ Label & Barcode</button>
            <button style={{ backgroundColor: '#0d9488', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🏷️ Label</button>
            <button style={{ backgroundColor: '#334155', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>‖‖ Barcode</button>
            <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Cetak Data</button>
            <button style={{ backgroundColor: '#6366f1', color: 'white', padding: '8px 15px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🚀 Migrasi SLiMS</button>
          </div>
        </div>

        {/* PENCARIAN */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Cari judul katalog (ketik lalu enter)" style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '250px' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>atau</span>
          <input type="text" placeholder="Cari: barcode / ID Buku / no. panggil" style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '250px' }} />
          <select style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
            <option>50/hal</option>
          </select>
          <button style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cari</button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Menampilkan {dataEksemplar.length} dari {dataEksemplar.length} eksemplar</p>

        {/* TABEL EKSEMPLAR */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#0f172a' }}>ID Buku/Barcode</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>No. Panggil</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Judul</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Lokasi</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Status</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Kondisi</th>
                <th style={{ padding: '12px', color: '#0f172a' }}>Catatan</th>
                <th style={{ padding: '12px', color: '#0f172a', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataEksemplar.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '20px', color: '#64748b' }}>Tidak ada eksemplar ditemukan.</td>
                </tr>
              ) : (
                dataEksemplar.map(item => (
                  <tr key={item.id}>
                    {/* Nanti diisi dengan data asli */}
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
