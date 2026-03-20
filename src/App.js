// ไฟล์: src/App.js
import './App.css';
import React, { useState, useEffect } from 'react'; // 📍 1. เพิ่ม useEffect ตรงนี้
import Navbar from './frontend/Navbar';
import GenerateSidebar from './frontend/GenerateSidebar';
import ImageSidebar from './frontend/ImageSidebar';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('savedActiveTab');
    return savedTab ? savedTab : 'Generate';
  });

  // 📍 2. เพิ่ม useEffect เพื่อบันทึกค่าทุกครั้งที่ activeTab เปลี่ยน
  useEffect(() => {
    localStorage.setItem('savedActiveTab', activeTab);
  }, [activeTab]);
  
  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        {activeTab === 'Generate' ? (
          <>
            <GenerateSidebar />
            <main className="workspace">
              <div className="workspace-controls">
                <button className="preview-btn active">Dashboard</button>
                <button className="preview-btn">Website</button>
                <button className="preview-btn">Mobile App</button>
                <button className="preview-btn">Components</button>
              </div>
            </main>
          </>
        ) : (
          <ImageSidebar />
        )}
      </div>
    </div>
  );
}

export default App;