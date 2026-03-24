// ไฟล์: src/App.js
import './App.css';
import React, { useState, useEffect } from 'react';
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

  const [userId, setUserId] = useState(null);
  const [isMyPaletteOpen, setIsMyPaletteOpen] = useState(false);
  const [selectedSavedPalette, setSelectedSavedPalette] = useState(null);

  // ดึงข้อมูล User
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // บันทึก Tab ล่าสุด
  useEffect(() => {
    localStorage.setItem('savedActiveTab', activeTab);
  }, [activeTab]);

  // 📍 ฟังก์ชันพระเอก: จัดการเมื่อกดปุ่ม Open จานสี
  const handleSelectSavedPalette = (palette) => {
    try {
      let mode = 'Generate';
      if (palette?.sourcetype) {
        if (Array.isArray(palette.sourcetype)) {
          mode = palette.sourcetype[0]?.source_name || 'Generate';
        } else {
          mode = palette.sourcetype?.source_name || 'Generate';
        }
      }

      const targetTab = String(mode).toLowerCase() === 'image' ? 'Image' : 'Generate';

      // สั่งเปลี่ยนสถานะทั้งหมด
      setIsMyPaletteOpen(false);
      setActiveTab(targetTab);
      setSelectedSavedPalette(palette);

    } catch (error) {
      // เปลี่ยนจาก alert หน้าจอ เป็นการบันทึกเงียบๆ ใน Console แทน
      console.error("🔴 เกิดข้อผิดพลาดใน App.js:", error);
    }
  }

  return (
    <ColorProvider>
      <div className="app-container">

        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openMyPalette={() => setIsMyPaletteOpen(true)}
        />

        <div className="main-content">
          {/* 📍 เปลี่ยน key ให้เปลี่ยนไปตาม ID ของจานสี เพื่อบังคับ React รีเฟรชหน้าต่างใหม่เสมอ */}
          {activeTab === 'Generate' ? (
            <GenerateSidebar
              key={`gen-${selectedSavedPalette?.palette_id || 'default'}`}
              paletteToEdit={selectedSavedPalette}
              onExitEditingMode={() => setSelectedSavedPalette(null)}
            />
          ) : (
            <ImageSidebar
              key={`img-${selectedSavedPalette?.palette_id || 'default'}`}
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

      <MyPalette
        isOpen={isMyPaletteOpen}
        onClose={() => setIsMyPaletteOpen(false)}
        userId={userId}
        // 📍 บรรทัดนี้สำคัญมาก! ถ้าไม่มีบรรทัดนี้ หรือพิมพ์ผิด จะทำให้เกิด Error สีเหลืองที่คุณเจอครับ
        onSelectPalette={handleSelectSavedPalette}
      />
    </ColorProvider>
  );
}

export default App;