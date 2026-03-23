// ไฟล์: src/App.js
import './App.css';
import React, { useState, useEffect } from 'react'; // 📍 1. เพิ่ม useEffect ตรงนี้
import Navbar from './frontend/Navbar';
import GenerateSidebar from './frontend/GenerateSidebar';
import ImageSidebar from './frontend/ImageSidebar';
import PreviewDashboard from './frontend/PreviewDashboard';
import { ColorProvider } from './contexts/ColorContext';
import { supabase } from './backend/supabaseClient';
import MyPalette from './frontend/MyPalette';


function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('savedActiveTab');
    return savedTab ? savedTab : 'Generate';
  });
  // 📍 3. เพิ่ม State สำหรับจัดการ My Palette และโหมดแก้ไข
  const [userId, setUserId] = useState(null);
  const [isMyPaletteOpen, setIsMyPaletteOpen] = useState(false);
  const [selectedSavedPalette, setSelectedSavedPalette] = useState(null);

  // ดึงข้อมูล User
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);
  // ดึงข้อมูล User
  useEffect(() => {
    localStorage.setItem('savedActiveTab', activeTab);
  }, [activeTab]);

  // 📍 4. ฟังก์ชันเมื่อผู้ใช้คลิกเลือกจานสีใน MyPalette
  // 📍 4. ฟังก์ชันเมื่อผู้ใช้คลิกเลือกจานสีใน MyPalette
  const handleSelectSavedPalette = (palette) => {
    // 1. ดึงค่า Source Type อย่างปลอดภัย (รองรับทั้งแบบ Object และ Array)
    let sType = 'Generate';
    if (palette && palette.sourcetype) {
      if (Array.isArray(palette.sourcetype)) {
        sType = palette.sourcetype[0]?.source_name || 'Generate';
      } else {
        sType = palette.sourcetype.source_name || 'Generate';
      }
    }

    // 2. ปิดหน้าต่าง Modal ทันที
    setIsMyPaletteOpen(false);

    // 3. สลับ Tab อัตโนมัติไปที่หน้าที่ถูกต้อง
    if (sType.toLowerCase() === 'image') {
      setActiveTab('Image');
    } else {
      setActiveTab('Generate');
    }

    // 4. ส่งข้อมูลจานสีเข้าไปที่ Sidebar (ใช้ setTimeout เล็กน้อยเพื่อให้ระบบสลับ Tab เสร็จก่อน)
    setTimeout(() => {
      setSelectedSavedPalette(palette);
    }, 50);
  };
  return (
    // 📍 คลุมด้วย ColorProvider ตรงนี้
    <ColorProvider>
      <div className="app-container">
        {/* ส่งฟังก์ชันเปิดหน้าต่างไปให้ Navbar (ถ้าใน Navbar มีปุ่มเรียกใช้) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMyPalette={() => setIsMyPaletteOpen(true)}
        />

        <div className="main-content">
          {activeTab === 'Generate' ? (
            <GenerateSidebar
              paletteToEdit={selectedSavedPalette}
              onExitEditingMode={() => setSelectedSavedPalette(null)}
            />
          ) : (
            <ImageSidebar
              paletteToEdit={selectedSavedPalette}
              onExitEditingMode={() => setSelectedSavedPalette(null)}
            />
          )}

          <main className="workspace">
            <div className="workspace-controls">
              <button className="preview-btn active">Dashboard</button>
              <button className="preview-btn">Website</button>
              <button className="preview-btn">Mobile App</button>
              <button className="preview-btn">Components</button>

            </div>

            <div style={{ flex: 1, width: '100%', maxWidth: '1000px', height: '100%' }}>
              <PreviewDashboard mode={activeTab} />
            </div>
          </main>
        </div>
      </div>

      {/* 📍 7. วาง MyPalette Component ไว้ล่างสุด */}
      <MyPalette
        isOpen={isMyPaletteOpen}
        onClose={() => setIsMyPaletteOpen(false)}
        userId={userId}
        onSelectPalette={handleSelectSavedPalette}
      />
    </ColorProvider>
  );
}

export default App;