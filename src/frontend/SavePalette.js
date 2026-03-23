// ไฟล์: src/frontend/SavePalette.js
import React, { useState, useEffect, useCallback } from 'react';
import { Folder, ChevronDown } from 'lucide-react';
import { supabase } from '../backend/supabaseClient'; 
import './SavePalette.css'; 

const SavePalette = ({
    isOpen,
    onClose,
    colors, // colors ปัจจุบันที่แสดงผลอยู่ใน Sidebar (ซึ่งอาจจะถูกแก้ไขแล้ว)
    neutralColors = [],
    userId,
    sourceMode = 'Generate',
    activeMood = 'Random', 
    // ====== 📍 ส่วนที่เพิ่มเข้ามาใหม่สำหรับโหมด Update ======
    paletteToEdit = null,        // ข้อมูลจานสีเดิมจาก DB
    isUpdateMode = false,        // บอกว่าตอนนี้คือโหมดอัปเดต
    onUpdateSuccess = null      // callback ฟังก์ชันหลังจากอัปเดตสำเร็จ
    // ===================================================
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
                await fetchCollections();
                
                // ====== 📍 กำหนดค่าเริ่มต้นตามโหมด (New/Update) ======
                if (isUpdateMode && paletteToEdit) {
                    setPaletteName(paletteToEdit.palette_name);
                    setSelectedCollection(paletteToEdit.collection_id);
                } else {
                    setPaletteName('My Palette');
                    setSelectedCollection(null);
                }
                // ====================================================
            }
        };
        refreshData();
    }, [isOpen, userId, fetchCollections, isUpdateMode, paletteToEdit]);

    const handleOverlayClick = (e) => {
        if (e.target.className === 'save-modal-overlay') onClose();
    };

    const handleToggleCollection = (id) => {
        setSelectedCollection(selectedCollection === id ? null : id);
    };

    const handleSave = async () => {
        if (!paletteName.trim()) return alert("กรุณาตั้งชื่อจานสี");
        if (!colors || colors.length === 0) return alert("ไม่พบข้อมูลสีที่จะบันทึก");

        setSaving(true);
        try {
            const allColorsToSave = [...colors, ...neutralColors];

            const fullColorPayload = allColorsToSave.map(c => {
                const rawHex = typeof c === 'string' ? c : (c?.hex || '000000');
                const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
                let tempHex = cleanHex.replace('#', '');
                
                const r = parseInt(tempHex.substring(0, 2), 16) || 0;
                const g = parseInt(tempHex.substring(2, 4), 16) || 0;
                const b = parseInt(tempHex.substring(4, 6), 16) || 0;

                let rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
                let max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
                let l = (max + min) / 2;
                let h = 0, s = 0;

                if (max !== min) {
                    let d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                        case gNorm: h = (bNorm - rNorm) / d + 2; break;
                        case bNorm: h = (rNorm - gNorm) / d + 4; break;
                        default: break;
                    }
                    h /= 6;
                }

                return {
                    hex_value: cleanHex,
                    h_value: Math.round(h * 360),
                    s_value: Math.round(s * 100),
                    l_value: Math.round(l * 100),
                    r_value: r,
                    g_value: g,
                    b_value: b
                };
            });

            // 1. ค้นหา source_id และ role_id ทั้งหมด (Dynamic Fetching)
            let sourceId = 1; 
            const { data: sourceData } = await supabase.from('sourcetype').select('source_id').ilike('source_name', sourceMode).maybeSingle();
            if (sourceData) sourceId = sourceData.source_id;

            const { data: roleData, error: roleError } = await supabase.from('role').select('role_id, role_name');
            if (roleError) throw roleError;

            // 2. 🧠 Smart Mood Analyzer (วิเคราะห์มู้ดใหม่ตามสีปัจจุบันที่บันทึก)
            let finalMoodId = 1; 
            const { data: allMoods } = await supabase.from('moodtone').select('*');
            const { data: allRanges } = await supabase.from('moodtoneRange').select('*');

            if (allMoods && allRanges) {
                let bestMoodId = 1;
                let maxMatches = 0;
                const mainColorsOnly = fullColorPayload.slice(0, colors.length);
                allMoods.forEach(mood => {
                    if (mood.mood_id === 1) return; 
                    const moodRanges = allRanges.filter(r => r.mood_id === mood.mood_id);
                    if (moodRanges.length === 0) return;
                    let matchCount = 0;
                    mainColorsOnly.forEach(color => {
                        const isMatch = moodRanges.some(r => color.h_value >= r.h_min && color.h_value <= r.h_max && color.s_value >= r.s_min && color.s_value <= r.s_max && color.l_value >= r.l_min && color.l_value <= r.l_max);
                        if (isMatch) matchCount++;
                    });
                    if (matchCount > maxMatches) { maxMatches = matchCount; bestMoodId = mood.mood_id; }
                });
                const threshold = Math.ceil(mainColorsOnly.length / 2);
                if (maxMatches >= threshold) { finalMoodId = bestMoodId; }
            }

            // 3. บันทึกสีลงตาราง 'color' (ป้องกันซ้ำ)
            const uniqueColorPayload = Object.values(fullColorPayload.reduce((acc, current) => { acc[current.hex_value] = current; return acc; }, {}));
            const { data: upsertedColors, error: colorError } = await supabase.from('color').upsert(uniqueColorPayload, { onConflict: 'hex_value' }).select('color_id, hex_value'); 
            if (colorError) throw colorError;

            // ==========================================
            // 🚀 ส่วนที่แก้ไข: จัดการโหมด INSERT หรือ UPDATE
            // ==========================================
            let paletteIdToUse;

            if (isUpdateMode && paletteToEdit) {
                // 📍 โหมดอัปเดต: UPDATE ลงตาราง 'palette'
                paletteIdToUse = paletteToEdit.palette_id;
                const { error: updatePaletteError } = await supabase
                    .from('palette')
                    .update({
                        palette_name: paletteName.trim(),
                        collection_id: selectedCollection,
                        mood_id: finalMoodId // อัปเดตมู้ดใหม่
                        // user_id และ source_id ไม่ควรเปลี่ยน
                    })
                    .eq('palette_id', paletteIdToUse);

                if (updatePaletteError) throw updatePaletteError;

                // 📍 โหมดอัปเดต: ลบ paletteDetail เดิมทิ้งก่อน แล้วค่อย INSERT ใหม่ (เพื่อรองรับการเพิ่ม/ลดช่องสี)
                const { error: deleteDetailsError } = await supabase
                    .from('paletteDetail')
                    .delete()
                    .eq('palette_id', paletteIdToUse);
                
                if (deleteDetailsError) throw deleteDetailsError;

            } else {
                // 📍 โหมดสร้างใหม่: INSERT ลงตาราง 'palette' (โค้ดเดิม)
                const { data: newPalette, error: paletteError } = await supabase
                    .from('palette')
                    .insert([{
                        palette_name: paletteName.trim(),
                        user_id: userId,
                        collection_id: selectedCollection,
                        source_id: sourceId,
                        mood_id: finalMoodId 
                    }])
                    .select('palette_id')
                    .single();

                if (paletteError) throw paletteError;
                paletteIdToUse = newPalette.palette_id;
            }

            // 4. บันทึกรายการสีลง 'paletteDetail' (กำหนด Role แบบ Dynamic) -> ใช้ paletteIdToUse ตัวเดียวกัน
            const detailPayload = allColorsToSave.map((c, index) => {
                const rawHex = typeof c === 'string' ? c : (c?.hex || '000000');
                const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
                const matchedColor = upsertedColors.find(uc => uc.hex_value === cleanHex);

                let roleNameTarget = 'Secondary'; 
                let proportion = 5;

                if (index === 0) {
                    roleNameTarget = 'Primary'; proportion = 60;
                } else if (index > 0 && index < colors.length) {
                    roleNameTarget = 'Secondary';
                    if (index === 1) proportion = 20; else if (index === 2) proportion = 10; else if (index === 3) proportion = 5; else proportion = 5;
                } else {
                    roleNameTarget = 'Neutral'; proportion = 0; 
                }

                const matchedRole = roleData?.find(r => r.role_name.toLowerCase() === roleNameTarget.toLowerCase());
                const roleIdToSave = matchedRole ? matchedRole.role_id : 2; 

                return {
                    palette_id: paletteIdToUse, // 📍 ใช้ ID ที่ถูกต้อง
                    color_id: matchedColor?.color_id,
                    order_index: index + 1,       
                    role_id: roleIdToSave, 
                    custom_propprtion: proportion
                };
            });

            const { error: detailError } = await supabase.from('paletteDetail').insert(detailPayload);
            if (detailError) throw detailError;

            // ==========================================
            // 🎉 ส่วนที่แก้ไข: สำเร็จและเรียก callback
            // ==========================================
            const actionText = isUpdateMode ? 'อัปเดต' : 'บันทึก';
            alert(`${actionText}จานสี "${paletteName}" สำเร็จ!`);
            
            if (isUpdateMode && onUpdateSuccess) {
                // เรียก callback เพื่อให้ Parent รู้ว่าข้อมูลเปลี่ยนแล้ว (เช่น เพื่อโหลดข้อมูลใหม่ใน MyPalette)
                onUpdateSuccess();
            }
            onClose();

        } catch (error) {
            console.error("Error saving/updating palette transaction:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="save-modal-overlay" onClick={handleOverlayClick}>
            <div className="save-modal-content">
                {/* 📍 เปลี่ยนหัวข้อตามโหมด */}
                <h2 className="save-modal-title">{isUpdateMode ? 'Update Palette' : 'Save Palette'}</h2>

                <div className="color-preview-container">
                    <div className="color-preview-bar">
                        {colors && colors.map((c, index) => {
                            const hexValue = typeof c === 'string' ? c : c?.hex || '';
                            const bgColor = hexValue.startsWith('#') ? hexValue : `#${hexValue}`;
                            return <div key={index} className="color-preview-block" style={{ backgroundColor: bgColor }} />;
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
                                    <span style={{ color: selectedCollection === col.collection_id ? "#000" : "#fff", fontWeight: 500 }}>
                                        {col.collection_name}
                                    </span>
                                </div>
                                <ChevronDown size={20} color={selectedCollection === col.collection_id ? "#000" : "#fff"} />
                            </div>
                        ))
                    )}
                </div>

                <div className="save-modal-actions">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
                    {/* 📍 เปลี่ยนข้อความปุ่มกดบันทึก */}
                    <button className="btn-save-new" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : (isUpdateMode ? 'Update Palette' : 'Save New Palette')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SavePalette;