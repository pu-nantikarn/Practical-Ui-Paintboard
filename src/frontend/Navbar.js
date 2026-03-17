// ไฟล์: src/frontend/Navbar.js (หรือ src/components/Navbar.js ตามที่คุณตั้งไว้)
import React from 'react'; // 📍 ไม่ต้องใช้ useState ในหน้านี้แล้ว
import { Eye, Moon, User } from 'lucide-react';
import './Navbar.css';

// 📍 รับค่า activeTab และ setActiveTab ที่ส่งมาจาก App.js
const Navbar = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="navbar">
            {/* โซนซ้าย: โลโก้แบรนด์ */}
            <div className="navbar-brand">
                UI PaintBoard
            </div>

            {/* โซนกลาง: สวิตช์สลับโหมด */}
            <div className="navbar-center">
                <div className="toggle-container">
                    {/* 📍 ใช้ activeTab แทน activeMode เพื่อให้ซิงค์กับ App.js */}
                    <div className={`slide-bg ${activeTab === 'Image' ? 'slide-right' : ''}`}></div>

                    <button
                        className={`toggle-btn ${activeTab === 'Generate' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Generate')}
                    >
                        Generate
                    </button>
                    <button
                        className={`toggle-btn ${activeTab === 'Image' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Image')}
                    >
                        Image
                    </button>
                </div>
            </div>

            {/* โซนขวา: เครื่องมือและการตั้งค่า */}
            <div className="navbar-right">
                <button className="vision-btn">
                    <Eye size={18} />
                    <span className="vision-text">Normal Vision</span>
                </button>

                <button className="icon-btn">
                    <Moon size={20} fill="currentColor" />
                </button>

                <button className="icon-btn profile-btn">
                    <User size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;