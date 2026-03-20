// ไฟล์: src/frontend/MyPalette.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Folder, ChevronDown, Layers, Palette,
    X,
    Plus, Check,ArrowUpRight, Grip
} from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import './MyPalette.css';

const MyPalette = ({ isOpen, onClose, userId }) => {
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [groupedPalettes, setGroupedPalettes] = useState({});
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isSavingCollection, setIsSavingCollection] = useState(false);
    const [expandedCols, setExpandedCols] = useState({});

    const toggleCollection = (colId) => {
        setExpandedCols(prev => ({
            ...prev,
            [colId]: !prev[colId] 
        }));
    };

    const fetchData = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // 1. ดึงข้อมูล Collections
            const { data: cols, error: colError } = await supabase
                .from('collection')
                .select('collection_id, collection_name, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (colError) throw colError;
            setCollections(cols || []);

            // ดึงข้อมูล Palettes
            const { data: pals, error: palError } = await supabase
                .from('palette')
                .select(`
                    palette_id,
                    palette_name,
                    collection_id,
                    moodtone ( mood_name ),
                    sourcetype ( source_name ),
                    paletteDetail ( * , color ( hex_value ) )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (palError) throw palError;

            // จัดกลุ่ม Palette ตาม collection_id
            const grouped = pals.reduce((acc, palette) => {
                const key = palette.collection_id || 'uncategorized';
                if (!acc[key]) acc[key] = [];
                acc[key].push(palette);
                return acc;
            }, {});

            setGroupedPalettes(grouped);
        } catch (error) {
            console.error("Error fetching data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen && userId) {
        fetchData();
        setIsCreatingCollection(false);
        setNewCollectionName('');
    } else if (isOpen && !userId) {
        // กรณีเปิด Modal แต่ยังไม่ได้ล็อกอิน ให้หยุดโหลด
        setLoading(false);
    }
}, [isOpen, userId, fetchData]);

    // ฟังก์ชันบันทึก Collection ลง Database
    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) {
            alert("กรุณาตั้งชื่อคอลเลกชัน");
            return;
        }

        setIsSavingCollection(true);
        try {
            const { error } = await supabase
                .from('collection')
                .insert([{
                    collection_name: newCollectionName.trim(),
                    user_id: userId
                }]);

            if (error) throw error;

            setIsCreatingCollection(false);
            setNewCollectionName('');
            fetchData();

        } catch (error) {
            console.error("Error creating collection:", error.message);
            alert("เกิดข้อผิดพลาดในการสร้างคอลเลกชัน");
        } finally {
            setIsSavingCollection(false);
        }
    };

    if (!isOpen) return null;

    // --- 🚀 ส่วนที่ปรับปรุงใหม่: แยกการเรนเดอร์เนื้อหาออกมาเพื่อลดความซับซ้อน ---
    const renderContent = () => {
        if (loading) {
            return <div className="loading-state">Loading your collections...</div>;
        }

        // 📍 1. ดึงข้อมูล Uncategorized ออกมาใส่ตัวแปรก่อนให้ชัดเจน
        const uncategorizedPalettes = groupedPalettes['uncategorized'] || [];
        const hasUncategorized = uncategorizedPalettes.length > 0;
        const isUncategorizedExpanded = expandedCols['uncategorized'] === true;
        
        // ถ้าไม่มีทั้งคอลเลกชัน และไม่มีจานสีที่ไม่ได้จัดหมวดหมู่เลย = ว่างเปล่า
        const isEmpty = collections.length === 0 && !hasUncategorized;

        if (isEmpty) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: '#71717a' }}>
                    <Palette size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <h3 style={{ margin: '0 0 8px 0', color: '#18181b', fontSize: '1.25rem' }}>ยังไม่มีจานสีที่บันทึกไว้</h3>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        คุณสามารถบันทึกจานสีที่ชอบ หรือกด + Create Collection<br />เพื่อเริ่มจัดระเบียบสีของคุณได้เลย!
                    </p>
                </div>
            );
        }

        return (
            <div style={{ paddingBottom: '20px' }}>
                {/* 📂 1. แสดงจานสีที่อยู่ใน Collection */}
                {collections.map(col => {
                    const isExpanded = expandedCols[col.collection_id] === true;
                    const palettesInCol = groupedPalettes[col.collection_id] || [];

                    return (
                        <section key={col.collection_id} style={{ marginBottom: '16px' }}>
                            <div 
                                className="collection-bar" 
                                onClick={() => toggleCollection(col.collection_id)}
                                style={{ cursor: 'pointer', backgroundColor: '#a3a3a3' }}
                            >
                                <div className="collection-info">
                                    <Folder size={20} /> {col.collection_name}
                                </div>
                                <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                            </div>
                            
                            {isExpanded && (
                                <div className="palette-grid" style={{ marginTop: '12px' }}>
                                    {palettesInCol.length > 0 ? (
                                        palettesInCol.map(palette => (
                                            <PaletteCard key={palette.palette_id} palette={palette} />
                                        ))
                                    ) : (
                                        <p style={{ padding: '0 10px', color: '#71717a', fontSize: '0.9rem' }}>ไม่มีจานสีในคอลเลกชันนี้</p>
                                    )}
                                </div>
                            )}
                        </section>
                    );
                })}

                {/* 📦 2. แสดงจานสีที่ "ไม่ได้อยู่ใน Collection" (Uncategorized) */}
                {/* 📍 ใช้เงื่อนไขแบบตรงไปตรงมา ไม่ต้องซ้อนฟังก์ชัน */}
                {hasUncategorized && (
                    <section style={{ marginBottom: '16px' }}>
                        <div 
                            className="collection-bar" 
                            onClick={() => toggleCollection('uncategorized')}
                            style={{ cursor: 'pointer', backgroundColor: '#52525b' }}
                        >
                            <div className="collection-info">
                                <Layers size={20} color="#ffffff" /> 
                                <span style={{ color: '#ffffff' }}>Uncategorized</span>
                            </div>
                            <ChevronDown size={20} color="#ffffff" style={{ transform: isUncategorizedExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                        </div>
                        
                        {isUncategorizedExpanded && (
                            <div className="palette-grid" style={{ marginTop: '12px' }}>
                                {uncategorizedPalettes.map(palette => (
                                    <PaletteCard key={palette.palette_id} palette={palette} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        );
    };
    // -------------------------------------------------------------

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* ส่วน Header */}
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="modal-title" style={{ margin: 0 }}>
                        <Palette size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        My Palette
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="create-collection-btn"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '1rem', fontWeight: '500'
                            }}
                            onClick={() => setIsCreatingCollection(!isCreatingCollection)}
                        >
                            <Plus size={18} /> Create Collection
                        </button>

                        <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* UI ช่องกรอกชื่อ Collection */}
                {isCreatingCollection && (
                    <div style={{
                        display: 'flex', gap: '8px', marginBottom: '16px',
                        padding: '12px', backgroundColor: '#f4f4f5', borderRadius: '8px'
                    }}>
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="ชื่อคอลเลกชันใหม่..."
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            disabled={isSavingCollection}
                            autoFocus
                        />
                        <button
                            onClick={handleCreateCollection}
                            disabled={isSavingCollection}
                            style={{
                                padding: '8px 16px', backgroundColor: '#18181b', color: 'white',
                                borderRadius: '4px', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            {isSavingCollection ? 'Saving...' : <><Check size={16} /> Save</>}
                        </button>
                    </div>
                )}

                {/* เรียกใช้ฟังก์ชัน Render Content ตรงนี้ */}
                <div className="modal-body">
                    {renderContent()}
                </div>

            </div>
        </div>
    );
};

// PaletteCard Component
const PaletteCard = ({ palette }) => {
    const moodText = palette.mood?.mood_name || 'Mix';
    const sourceText = palette.source?.source_name || 'Generate';
   return (
        <div className="palette-card">
            {/* ฝั่งซ้าย: ชื่อ และ แถบสี */}
            <div className="palette-left">
                <span className="palette-name">{palette.palette_name || 'My Palette'}</span>
                
                {/* 📍 แก้ไขส่วนแสดงผลสีตรงนี้ */}
                <div className="color-blocks">
                    {palette.paletteDetail?.map((detail, index) => {
                        // 1. เข้าถึง hex_value ที่ซ้อนอยู่ในตาราง color (ถ้าดึงไม่ได้ให้เป็นสีเทา CCCCCC)
                        const rawHex = detail.color?.hex_value || 'CCCCCC'; 
                        
                        // 2. เช็คว่ามีเครื่องหมาย # นำหน้าหรือยัง ถ้ายังให้เติมเข้าไป
                        const bgColor = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;

                        return (
                            <div
                                key={detail.detail_id || index}
                                className="color-block"
                                style={{ backgroundColor: bgColor }}
                                title={bgColor}
                            />
                        );
                    })}
                </div>
                {/* ------------------------- */}
                
            </div>

            {/* ฝั่งขวา: รายละเอียด และ ไอคอน */}
            <div className="palette-right">
                <div className="palette-meta">
                    Mood&Tone: {moodText} / From: {sourceText}
                </div>
                <div className="palette-actions">
                    <button className="action-btn" title="Export">
                        <ArrowUpRight size={22} strokeWidth={2} />
                    </button>
                    <button className="action-btn" title="Options">
                        <Grip size={22} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyPalette;