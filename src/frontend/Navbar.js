// ไฟล์: src/components/Navbar.js
import React, { useState } from 'react';
import { Eye, Moon, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    // สร้าง State ไว้เก็บว่าตอนนี้ผู้ใช้เลือกโหมดไหนอยู่ (Generate หรือ Image)
    const [activeMode, setActiveMode] = useState('Generate');

    return (
        <nav className="navbar">
            {/* โซนซ้าย: โลโก้แบรนด์ */}
            <div className="navbar-brand">
                UI PaintBoard
            </div>

            {/* โซนกลาง: สวิตช์สลับโหมด */}
            <div className="navbar-center">
                <div className="toggle-container">
                    {/* 📍 เพิ่มก้อนสีขาวสำหรับสไลด์ตรงนี้ */}
                    <div className={`slide-bg ${activeMode === 'Image' ? 'slide-right' : ''}`}></div>

                    <button
                        className={`toggle-btn ${activeMode === 'Generate' ? 'active' : ''}`}
                        onClick={() => setActiveMode('Generate')}
                    >
                        Generate
                    </button>
                    <button
                        className={`toggle-btn ${activeMode === 'Image' ? 'active' : ''}`}
                        onClick={() => setActiveMode('Image')}
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