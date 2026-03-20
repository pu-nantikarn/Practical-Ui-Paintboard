// ไฟล์: src/frontend/SavePalette.js
import React, { useState, useEffect, useCallback } from 'react';
import { Folder, ChevronDown } from 'lucide-react';
import { supabase } from '../backend/supabaseClient'; // อ้างอิง Path ให้ถูกต้อง
import './SavePalette.css'; // อ้างอิงชื่อไฟล์ CSS ให้ตรง

const SavePalette = ({
    isOpen,
    onClose,
    colors,
    userId,
    sourceId = 1,
    moodId = null
}) => {
    const [paletteName, setPaletteName] = useState('My Palette');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [collections, setCollections] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchCollections = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('collection')
                .select('collection_id, collection_name')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCollections(data || []);
        } catch (error) {
            console.error('Error fetching collections:', error.message);
        }
    }, [userId]);

    useEffect(() => {
        const refreshData = async () => {
        if (isOpen && userId) {
            console.log("Refreshing collections for SavePalette..."); // ไว้สำหรับเช็คใน Console
            await fetchCollections(); // 👈 สั่งดึงข้อมูลคอลเลกชันใหม่จาก DB
            setPaletteName('My Palette');
            setSelectedCollection(null);
        }
    };

    refreshData();
}, [isOpen, userId, fetchCollections]);

    const handleOverlayClick = (e) => {
        if (e.target.className === 'save-modal-overlay') onClose();
    };

    const handleToggleCollection = (id) => {
        if (selectedCollection === id) {
            setSelectedCollection(null);
        } else {
            setSelectedCollection(id);
        }
    };

    // 🚀 ฟังก์ชันหลักสำหรับบันทึกข้อมูล
   // 🚀 ฟังก์ชันหลักสำหรับบันทึกข้อมูล
    // 🚀 ฟังก์ชันหลักสำหรับบันทึกข้อมูล
    const handleSave = async () => {
        if (!paletteName.trim()) {
            alert("กรุณาตั้งชื่อจานสี");
            return;
        }
        if (!colors || colors.length === 0) {
            alert("ไม่พบข้อมูลสีที่จะบันทึก");
            return;
        }

        setSaving(true);
        try {
            // ==========================================
            // STEP 1: เตรียมข้อมูลสีทั้งหมด
            // ==========================================
            const fullColorPayload = colors.map(c => {
                const rawHex = typeof c === 'string' ? c : (c?.hex || '000000');
                const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
                
                let r = c?.r, g = c?.g, b = c?.b;
                let h = c?.h, s = c?.s, l = c?.l;

                if (r === undefined || h === undefined) {
                    let tempHex = cleanHex.replace('#', '');
                    if(tempHex.length === 3) tempHex = tempHex.split('').map(char => char + char).join('');
                    
                    r = parseInt(tempHex.substring(0, 2), 16) || 0;
                    g = parseInt(tempHex.substring(2, 4), 16) || 0;
                    b = parseInt(tempHex.substring(4, 6), 16) || 0;

                    let rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
                    let max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
                    l = (max + min) / 2;
                    if (max === min) {
                        h = s = 0;
                    } else {
                        let d = max - min;
                        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                        switch (max) {
                            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                            case gNorm: h = (bNorm - rNorm) / d + 2; break;
                            case bNorm: h = (rNorm - gNorm) / d + 4; break;
                            default: h = 0; break;
                        }
                        h /= 6;
                    }
                    h = Math.round(h * 360);
                    s = Math.round(s * 100);
                    l = Math.round(l * 100);
                }

                return {
                    hex_value: cleanHex,
                    h_value: h,
                    s_value: s,
                    l_value: l,
                    r_value: r,
                    g_value: g,
                    b_value: b
                };
            });

            // 📍 จุดที่เพิ่มเข้ามา: กรองสีที่ซ้ำกันออก (Deduplicate)
            // ถ้ามี #FFFFFF 2 อัน จะถูกยุบรวมเหลือแค่อันเดียว เพื่อไม่ให้ Database สับสน
            const uniqueColorPayload = Object.values(
                fullColorPayload.reduce((acc, current) => {
                    acc[current.hex_value] = current;
                    return acc;
                }, {})
            );

            // ส่งข้อมูลที่กรองแล้วไป Upsert
            const { data: upsertedColors, error: colorError } = await supabase
                .from('color')
                .upsert(uniqueColorPayload, { onConflict: 'hex_value' })
                .select('color_id, hex_value'); 

            if (colorError) throw colorError;

            // ==========================================
            // STEP 2: บันทึกข้อมูลลงตาราง 'palette'
            // ==========================================
            const { data: newPalette, error: paletteError } = await supabase
                .from('palette')
                .insert([{
                    palette_name: paletteName,
                    user_id: userId,
                    collection_id: selectedCollection,
                    source_id: sourceId,
                    mood_id: moodId
                }])
                .select('palette_id')
                .single();

            if (paletteError) throw paletteError;

            // ==========================================
            // STEP 3: ประกอบร่างข้อมูลและบันทึกลง 'paletteDetail'
            // ==========================================
            // ตรงนี้เรายังใช้ตัวแปร `colors` ตัวเดิม เพื่อให้บันทึกครบทุกช่อง (แม้สีจะซ้ำกัน)
            const detailPayload = colors.map((c, index) => {
                const rawHex = typeof c === 'string' ? c : (c?.hex || '000000');
                const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;

                // ดึง color_id จากตาราง color กลับมาจับคู่
                const matchedColor = upsertedColors.find(uc => uc.hex_value === cleanHex);

                let prop = 0;
                let rId = (typeof c === 'object' && c.roleId) ? c.roleId : 1;
                
                if (rId === 1) prop = 30;      
                else if (rId === 2) prop = 10; 
                else if (rId === 3) prop = 54; 
                else if (rId === 4) prop = 6;  

                return {
                    palette_id: newPalette.palette_id,
                    color_id: matchedColor?.color_id,
                    order_index: index + 1,
                    role_id: rId,
                    custom_propprtion: prop
                };
            });

            const { error: detailError } = await supabase
                .from('paletteDetail')
                .insert(detailPayload);

            if (detailError) throw detailError;

            alert(`บันทึกจานสี "${paletteName}" สำเร็จ!`);
            onClose();

        } catch (error) {
            console.error("Error saving palette transaction:", error.message);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="save-modal-overlay" onClick={handleOverlayClick}>
            <div className="save-modal-content">
                <h2 className="save-modal-title">Save Palette</h2>

                {/* แถบพรีวิวสี */}
                <div className="color-preview-container">
                    <div className="color-preview-bar">
                        {colors && colors.map((c, index) => {
                            // 📍 เช็คแบบปลอดภัย: ถ้าเป็น String ใช้ c ได้เลย ถ้าเป็น Object ให้ดึง c.hex
                            const hexValue = typeof c === 'string' ? c : c?.hex || '';
                            const bgColor = hexValue.startsWith('#') ? hexValue : `#${hexValue}`;

                            return (
                                <div
                                    key={index}
                                    className="color-preview-block"
                                    style={{ backgroundColor: bgColor }}
                                />
                            );
                        })}
                    </div>
                </div>

                <input
                    type="text"
                    className="palette-name-input"
                    value={paletteName}
                    onChange={(e) => setPaletteName(e.target.value)}
                    placeholder="ตั้งชื่อจานสีของคุณ..."
                    disabled={saving}
                />

                <div className="save-modal-divider"></div>

                <div className="collection-section-title">Choose Collection</div>
                <div className="collection-list">
                    {collections.length === 0 ? (
                        <p style={{ color: '#71717a', fontSize: '0.9rem' }}>คุณยังไม่มีคอลเลกชัน</p>
                    ) : (
                        collections.map(col => (
                            <div
                                key={col.collection_id}
                                className={`collection-bar-save ${selectedCollection === col.collection_id ? 'selected' : ''}`}
                                onClick={() => handleToggleCollection(col.collection_id)}
                            >
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Folder size={20} color={selectedCollection === col.collection_id ? "#000" : "#fff"} />
                                    <span style={{ 
                                        color: selectedCollection === col.collection_id ? "#000" : "#fff",
                                        fontWeight: 500
                                    }}>
                                        {col.collection_name}
                                    </span>
                                </div>
                                <ChevronDown size={20} color={selectedCollection === col.collection_id ? "#000" : "#fff"} />
                            </div>
                        ))
                    )}
                </div>

                <div className="save-modal-actions">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="btn-save-new" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save New Palette'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SavePalette;