// ไฟล์: src/App.js
import './App.css';
import React, { useState, useEffect } from 'react';
import Navbar from './frontend/Navbar';
import GenerateSidebar from './frontend/GenerateSidebar';
import ImageSidebar from './frontend/ImageSidebar';
import PreviewDashboard from './frontend/PreviewDashboard';
import PreviewWebsite from './frontend/PreviewWebsite';
import PreviewMobile from './frontend/PreviewMobile';
import PreviewComponent from './frontend/PreviewComponent';
import { ColorProvider } from './contexts/ColorContext';
import { supabase } from './backend/supabaseClient';
import MyPalette from './frontend/MyPalette';
import ExplorePalette from './frontend/ExplorePalette';


function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('savedActiveTab');
    return savedTab ? savedTab : 'Generate';
  });

  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMyPaletteOpen, setIsMyPaletteOpen] = useState(false);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [selectedSavedPalette, setSelectedSavedPalette] = useState(null);
  const [previewMode, setPreviewMode] = useState('Dashboard');

  // 📍 1. โค้ดดึงข้อมูล User และสถานะ Admin ที่แก้ไขให้ถูกต้อง 100%
  useEffect(() => {
    const checkUserAndAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        setUserId(user?.id || null);

        if (user) {
          const { data, error } = await supabase
            .from('user') //เปลี่ยนเป็นชื่อตาราง user ของคุณ
            .select('is_admin')
            .eq('user_id', user.id)
            .single();

          // 📍 นำตัวแปร error มาใช้งาน (ถ้าดึงข้อมูลไม่สำเร็จให้โชว์แจ้งเตือนใน Console)
          if (error) {
            console.error("Error fetching admin status:", error);
          }

          if (data && data.is_admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setIsAdmin(false);
      }
    };

    checkUserAndAdminStatus();
  }, []);

  // บันทึก Tab ล่าสุด
  useEffect(() => {
    localStorage.setItem('savedActiveTab', activeTab);
  }, [activeTab]);

  // ฟังก์ชันจัดการเมื่อกดปุ่ม Open จานสี
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
          isExploreMode={isExploreMode}
          setIsExploreMode={setIsExploreMode}
        />

        <div className="main-content">
          {/* เปลี่ยน key เพื่อบังคับ React รีเฟรชหน้าต่างใหม่เสมอ */}
          {activeTab === 'Generate' ? (
            <GenerateSidebar
              key={`gen-${selectedSavedPalette?.palette_id || 'default'}`}
              paletteToEdit={selectedSavedPalette}
              onExitEditingMode={() => setSelectedSavedPalette(null)}
              isAdmin={isAdmin}
            />
          ) : (
            <ImageSidebar
              key={`img-${selectedSavedPalette?.palette_id || 'default'}`}
              paletteToEdit={selectedSavedPalette}
              onExitEditingMode={() => setSelectedSavedPalette(null)}
              isAdmin={isAdmin}
            />
          )}

          <main className="workspace">
            {/* 📍 ซ่อนกลุ่มปุ่ม Dashboard/Website เมื่อเข้าสู่โหมด Explore */}
            {!isExploreMode && (
              <div className="workspace-controls">
                <button
                  className={`preview-btn ${previewMode === 'Dashboard' ? 'active' : ''}`}
                  onClick={() => {
                    setIsExploreMode(false);
                    setPreviewMode('Dashboard')
                  }}
                >Dashboard</button>

                <button
                  className={`preview-btn ${previewMode === 'Website' ? 'active' : ''}`}
                  onClick={() => {
                    setIsExploreMode(false);
                    setPreviewMode('Website')
                  }}
                >Website</button>

                <button
                  className={`preview-btn ${previewMode === 'Mobile' ? 'active' : ''}`}
                  onClick={() => {
                    setIsExploreMode(false);
                    setPreviewMode('Mobile');
                  }}
                >Mobile App</button>
                <button
                  className={`preview-btn ${previewMode === 'Components' ? 'active' : ''}`}
                  onClick={() => {
                    setIsExploreMode(false);
                    setPreviewMode('Components');
                  }}
                >Components</button>
              </div>
            )}

            <div style={{ flex: 1, width: '100%', maxWidth: '1000px', height: '100%', overflowY: 'auto' }}>
              {isExploreMode ? (
                <ExplorePalette isAdmin={isAdmin} userId={userId} onSelectPalette={handleSelectSavedPalette} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  {previewMode === 'Mobile' ? (
                    <PreviewMobile mode={activeTab} />
                  ) : previewMode === 'Website' ? (
                    <PreviewWebsite mode={activeTab} />
                  ) : previewMode === 'Components' ? (
                    <PreviewComponent mode={activeTab} />
                  ) : (
                    <PreviewDashboard mode={activeTab} />
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

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