import QRCode from 'react-qr-code'

export default function KartuMurid({ muridList, pengaturan, onClose }) {
  if (!muridList || muridList.length === 0) return null

  // Pastikan data pengaturan aman meskipun belum tersimpan dengan baik
  const { 
    kepsekNama = 'Nama Kepsek', 
    kepsekNIP = 'NIP', 
    perpusNama = 'Nama Perpus', 
    perpusNIP = 'NIP', 
    masaBerlaku = '', 
    logoProvinsi, 
    logoSekolah, 
    ttdKepsek, 
    ttdPerpus 
  } = pengaturan || {}

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #modal-overlay { position: absolute !important; top: 0 !important; left: 0 !important; background: white !important; overflow: visible !important; align-items: flex-start !important; }
          #modal-box { box-shadow: none !important; padding: 0 !important; max-height: none !important; overflow: visible !important; width: 100% !important; max-width: 100% !important; }
          #area-cetak, #area-cetak * { visibility: visible; }
          #area-cetak { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; padding: 0 !important; background: white !important; display: flex !important; flex-direction: column !important; gap: 15px !important; align-items: center !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 10mm; }
          .kartu-pasangan { page-break-inside: avoid !important; margin-bottom: 5px !important; }
        }
      `}</style>

      <div id="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
        <div id="modal-box" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '95vh', overflowY: 'auto', maxWidth: '900px', width: '95%' }}>
          
          <h3 className="no-print" style={{ margin: '0 0 15px 0', color: '#1f2937' }}>Preview {muridList.length} Kartu Siap Cetak</h3>
          
          <div id="area-cetak" style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#e5e7eb', padding: '20px', borderRadius: '8px', width: '100%', alignItems: 'center' }}>
            
            {muridList.map((murid, index) => (
              
              <div key={index} className="kartu-pasangan" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                
                {/* --- KARTU DEPAN --- */}
                <div style={{ width: '8.56cm', height: '5.4cm', border: '1px solid #9ca3af', borderRadius: '6px', overflow: 'hidden', position: 'relative', fontFamily: 'sans-serif', backgroundColor: 'white', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                  <div style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '4px 8px', borderBottom: '2px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'white', borderRadius: '3px', padding: '1px' }}>
                      {logoProvinsi ? <img src={logoProvinsi} alt="Provinsi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '5px', color: '#9ca3af', textAlign: 'center' }}>LOGO PROV</span>}
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <div style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: '1' }}>PEMERINTAH PROVINSI GORONTALO</div>
                      <div style={{ fontSize: '6px', letterSpacing: '0.5px', lineHeight: '1' }}>DINAS PENDIDIKAN DAN KEBUDAYAAN</div>
                      <div style={{ fontSize: '9.5px', fontWeight: 'bold', lineHeight: '1', marginTop: '1px' }}>SMAN 1 BATUDAA PANTAI</div>
                      <div style={{ fontSize: '7.5px', fontWeight: 'bold', fontStyle: 'italic', color: '#fbbf24', lineHeight: '1' }}>"Sekolah Bahari"</div>
                      <div style={{ fontSize: '4.5px', letterSpacing: '0.2px', lineHeight: '1', marginTop: '1px' }}>Jl. Buke Panai, Desa Bongo, Kec. Batudaa Pantai, Kab. Gorontalo</div>
                    </div>
                    <div style={{ width: '28px', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'white', borderRadius: '3px', padding: '1px' }}>
                      {logoSekolah ? <img src={logoSekolah} alt="Sekolah" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: '5px', color: '#9ca3af', textAlign: 'center' }}>LOGO SEK</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', padding: '6px 8px', flex: 1 }}>
                    <div style={{ width: '1.8cm', height: '2.4cm', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '10px', flexShrink: 0 }}>
                      {murid.foto_url ? <img src={murid.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '7px', color: '#9ca3af', textAlign: 'center' }}>PAS FOTO<br/>3x4</span>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '8px', lineHeight: '1.35', color: '#111827' }}>
                        <div style={{ display: 'flex' }}><strong style={{ width: '40px' }}>Nama</strong>: <span style={{ fontWeight: 'bold' }}>{murid.nama}</span></div>
                        <div style={{ display: 'flex' }}><strong style={{ width: '40px' }}>NISN</strong>: {murid.nisn}</div>
                        <div style={{ display: 'flex' }}><strong style={{ width: '40px' }}>Kelas</strong>: {murid.kelas}</div>
                        <div style={{ display: 'flex' }}><strong style={{ width: '40px' }}>Berlaku</strong>: {masaBerlaku}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                        <div style={{ padding: '2px', backgroundColor: 'white' }}>
                          <QRCode value={murid.barcode_data || '000'} size={40} />
                        </div>
                        <div style={{ textAlign: 'center', lineHeight: '1.1', width: '95px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '6px', color: '#374151' }}>Kepala Sekolah,</div>
                          <div style={{ height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                            {ttdKepsek ? <img src={ttdKepsek} alt="TTD" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <div style={{ height: '25px' }}></div>}
                          </div>
                          <div style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '6.5px', color: '#111827' }}>{kepsekNama}</div>
                          <div style={{ fontSize: '5.5px', color: '#374151' }}>NIP. {kepsekNIP}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- KARTU BELAKANG --- */}
                <div style={{ width: '8.56cm', height: '5.4cm', border: '1px solid #9ca3af', borderRadius: '6px', padding: '8px', position: 'relative', fontFamily: 'sans-serif', backgroundColor: 'white', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ textAlign: 'center', margin: '0 0 6px 0', fontSize: '10px', textDecoration: 'underline', color: '#1e3a8a' }}>TATA TERTIB PERPUSTAKAAN</h4>
                  <div style={{ flex: 1 }}>
                    <ol style={{ fontSize: '7.5px', paddingLeft: '12px', margin: 0, lineHeight: '1.4', textAlign: 'justify', color: '#374151' }}>
                      <li>Kartu ini wajib dibawa saat berkunjung dan meminjam buku.</li>
                      <li>Peminjaman buku maksimal 3 judul selama 1 minggu.</li>
                      <li>Keterlambatan pengembalian dikenakan sanksi/denda.</li>
                      <li>Buku yang hilang/rusak wajib diganti dengan judul yang sama.</li>
                      <li>Kartu ini tidak boleh dipindahtangankan kepada siapapun.</li>
                    </ol>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    <div style={{ padding: '2px', backgroundColor: 'white' }}>
                      <QRCode value={murid.barcode_data || '000'} size={40} />
                    </div>
                    <div style={{ textAlign: 'center', lineHeight: '1.1', width: '95px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: '6px', color: '#374151' }}>Kepala Perpustakaan,</div>
                      <div style={{ height: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '2px 0' }}>
                        {ttdPerpus ? <img src={ttdPerpus} alt="TTD" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} /> : <div style={{ height: '22px' }}></div>}
                      </div>
                      <div style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '6.5px', color: '#111827' }}>{perpusNama}</div>
                      <div style={{ fontSize: '5.5px', color: '#374151' }}>NIP. {perpusNIP}</div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => window.print()} style={{ padding: '12px 25px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)' }}>
              🖨️ Cetak {muridList.length} Kartu Sekarang
            </button>
            <button onClick={onClose} style={{ padding: '12px 25px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
              Tutup
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
