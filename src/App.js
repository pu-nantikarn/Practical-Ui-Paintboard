// ไฟล์: src/App.js (หรือไฟล์หลักของคุณ)
import './App.css';
import React, { useState } from 'react';
import Navbar from './frontend/Navbar';
import GenerateSidebar from './frontend/GenerateSidebar';
import ImageSidebar from './frontend/ImageSidebar';

function App() {
  const [activeTab, setActiveTab] = useState('Generate');
  
  return (
    <div className="app-container">
      {/* 📍 1. ส่ง activeTab และ setActiveTab เข้าไปใน Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 📍 สังเกตว่าบล็อก <div className="top-tab-bar">...</div> ถูกลบทิ้งไปแล้ว */}

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