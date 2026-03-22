// ไฟล์: src/context/ColorContext.js
import React, { createContext, useState, useEffect } from 'react';

// 1. สร้าง Context
export const ColorContext = createContext();

// 2. สร้าง Provider สำหรับคลุมแอป
export const ColorProvider = ({ children }) => {
    // --- State สำหรับโหมด Generate ---
    const [genPrimary, setGenPrimary] = useState(() => {
        const saved = localStorage.getItem('genPrimary');
        return saved ? JSON.parse(saved) : { value: '8B5CF6', isLocked: false };
    });
    const [genSecondary, setGenSecondary] = useState(() => {
        const saved = localStorage.getItem('genSecondary');
        return saved ? JSON.parse(saved) : [{ id: 1, value: '1F2937', isLocked: false }];
    });

    // --- State สำหรับโหมด Image ---
    const [imgPrimary, setImgPrimary] = useState(() => {
        const saved = localStorage.getItem('imgPrimary');
        return saved ? JSON.parse(saved) : { value: '8B5CF6', isLocked: false };
    });
    const [imgSecondary, setImgSecondary] = useState(() => {
        const saved = localStorage.getItem('imgSecondary');
        return saved ? JSON.parse(saved) : [
            { id: 1, value: 'F9FAFB', isLocked: false },
            { id: 2, value: '000000', isLocked: false },
            { id: 3, value: 'E5E7EB', isLocked: false },
        ];
    });

    // Auto-save ลง LocalStorage เผื่อผู้ใช้รีเฟรชหน้าเว็บ
    useEffect(() => localStorage.setItem('genPrimary', JSON.stringify(genPrimary)), [genPrimary]);
    useEffect(() => localStorage.setItem('genSecondary', JSON.stringify(genSecondary)), [genSecondary]);
    useEffect(() => localStorage.setItem('imgPrimary', JSON.stringify(imgPrimary)), [imgPrimary]);
    useEffect(() => localStorage.setItem('imgSecondary', JSON.stringify(imgSecondary)), [imgSecondary]);

    return (
        <ColorContext.Provider value={{
            genPrimary, setGenPrimary,
            genSecondary, setGenSecondary,
            imgPrimary, setImgPrimary,
            imgSecondary, setImgSecondary
        }}>
            {children}
        </ColorContext.Provider>
    );
};