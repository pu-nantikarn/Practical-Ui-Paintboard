// ไฟล์: src/frontend/MyPalette.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Folder, ChevronDown, Layers, Palette,
    X, Trash2,
    Plus, Check, Grip
} from 'lucide-react';
import { supabase } from '../backend/supabaseClient';
import './MyPalette.css';

const MyPalette = ({ isOpen, onClose, userId, onSelectPalette }) => {
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [groupedPalettes, setGroupedPalettes] = useState({});
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isSavingCollection, setIsSavingCollection] = useState(false);
    const [expandedCols, setExpandedCols] = useState({});

    // 📍 ประกาศตัวแปรเก็บตำแหน่งการลาก
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

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

    // 📍 ฟังก์ชัน 1: ลบคอลเลกชัน (ย้ายจานสีไป Uncategorized)
    const handleDeleteCollection = async (e, colId, colName) => {
        e.stopPropagation(); // ป้องกันไม่ให้การคลิกปุ่มไปกระตุ้นการพับ/กางของแถบคอลเลกชัน

        if (!window.confirm(`คุณต้องการลบคอลเลกชัน "${colName}" ใช่หรือไม่?\n(จานสีที่อยู่ด้านในจะไม่ถูกลบ และจะถูกย้ายไปที่ Uncategorized)`)) return;

        try {
            // 1. ปลดจานสีทั้งหมดที่อยู่ในคอลเลกชันนี้ให้เป็น null ก่อน
            const { error: updateError } = await supabase
                .from('palette')
                .update({ collection_id: null })
                .eq('collection_id', colId);

            if (updateError) throw updateError;

            // 2. ลบตัวคอลเลกชันทิ้ง
            const { error: deleteError } = await supabase
                .from('collection')
                .delete()
                .eq('collection_id', colId);

            if (deleteError) throw deleteError;

            // 3. รีโหลดข้อมูลใหม่
            fetchData();
        } catch (error) {
            console.error("Error deleting collection:", error);
            alert("เกิดข้อผิดพลาดในการลบคอลเลกชัน: " + error.message);
        }
    };

    // 📍 ฟังก์ชัน 2: ลบจานสี
    const handleDeletePalette = async (paletteId, paletteName) => {
        if (!window.confirm(`คุณต้องการลบจานสี "${paletteName}" ใช่หรือไม่?`)) return;

        try {
            const { error } = await supabase
                .from('palette')
                .delete()
                .eq('palette_id', paletteId);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error("Error deleting palette:", error);
            alert("เกิดข้อผิดพลาดในการลบจานสี: " + error.message);
        }
    };

    // 📍 1. ฟังก์ชันเริ่มลาก (เพิ่มการส่งข้อมูล palette ตัวที่ถูกลากเข้ามาด้วย)
    const handleDragStart = (index, collectionKey, palette) => {
        dragItem.current = { index, collectionKey, palette };
    };

    // 📍 2. ฟังก์ชันเมื่อลากไปทับ
    const handleDragEnter = (index, collectionKey) => {
        dragOverItem.current = { index, collectionKey };
    };

    // 📍 3. ฟังก์ชันเมื่อปล่อยเมาส์ (ย้ายข้ามหมวดหมู่ และบันทึกลง Database)
    const handleDragEnd = async () => {
        if (!dragItem.current || !dragOverItem.current) return;

        const { index: sourceIndex, collectionKey: sourceCol, palette } = dragItem.current;
        const { index: destIndex, collectionKey: destCol } = dragOverItem.current;

        // ถ้าลากปล่อยที่เดิมเป๊ะๆ ไม่ต้องทำอะไร
        if (sourceCol === destCol && sourceIndex === destIndex) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }

        // ==========================================
        // 🔄 กรณีลากข้ามคอลเลกชัน (Cross-Collection)
        // ==========================================
        if (sourceCol !== destCol) {
            // 1. อัปเดตหน้าจอทันที (Optimistic UI) ให้ดูสมูท
            setGroupedPalettes(prev => {
                const newGrouped = { ...prev };
                const sourceList = [...(newGrouped[sourceCol] || [])];
                const destList = [...(newGrouped[destCol] || [])];

                const [draggedItem] = sourceList.splice(sourceIndex, 1);
                draggedItem.collection_id = destCol === 'uncategorized' ? null : destCol; // อัปเดต id ชั่วคราวบนหน้าจอ
                destList.splice(destIndex, 0, draggedItem);

                newGrouped[sourceCol] = sourceList;
                newGrouped[destCol] = destList;
                return newGrouped;
            });

            // 2. อัปเดตฐานข้อมูล (Supabase)
            try {
                const newCollectionId = destCol === 'uncategorized' ? null : destCol;
                const { error } = await supabase
                    .from('palette')
                    .update({ collection_id: newCollectionId })
                    .eq('palette_id', palette.palette_id);

                if (error) throw error;
            } catch (error) {
                console.error("Error updating collection:", error);
                alert("เกิดข้อผิดพลาดในการย้ายคอลเลกชัน");
                fetchData(); // ถ้าย้ายไม่สำเร็จ ให้โหลดข้อมูลเดิมกลับมา
            }
        }
        // ==========================================
        // ↕️ กรณีสลับตำแหน่งในคอลเลกชันเดิม (Same-Collection)
        // ==========================================
        else if (sourceCol === destCol && sourceIndex !== destIndex) {
            setGroupedPalettes(prev => {
                const newGrouped = { ...prev };
                const list = [...newGrouped[sourceCol]];
                const [draggedItem] = list.splice(sourceIndex, 1);
                list.splice(destIndex, 0, draggedItem);
                newGrouped[sourceCol] = list;
                return newGrouped;
            });
        }

        // รีเซ็ตค่าหลังจากปล่อยเมาส์
        dragItem.current = null;
        dragOverItem.current = null;
    };

    // --- 🚀 ส่วนที่ปรับปรุงใหม่: แยกการเรนเดอร์เนื้อหาออกมาเพื่อลดความซับซ้อน ---
    const renderContent = () => {
        if (loading) return <div className="loading-state">Loading your collections...</div>;

        const uncategorizedPalettes = groupedPalettes['uncategorized'] || [];
        const hasUncategorized = uncategorizedPalettes.length > 0;
        const isUncategorizedExpanded = expandedCols['uncategorized'] === true;

        const isEmpty = collections.length === 0 && !hasUncategorized;

        // 📍 แสดง Uncategorized เสมอ ถ้ามีคอลเลกชันอยู่ เพื่อให้ลากของออกจากโฟลเดอร์มาทิ้งไว้ได้
        const showUncategorized = hasUncategorized || collections.length > 0;

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
                                onDragOver={(e) => e.preventDefault()} // 📍 ยอมรับการ Drop ลงบนหัวข้อโฟลเดอร์
                                onDragEnter={() => handleDragEnter(palettesInCol.length, col.collection_id)} // 📍 ให้ไปต่อท้ายสุดของโฟลเดอร์นี้
                                style={{ cursor: 'pointer', backgroundColor: '#a3a3a3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div className="collection-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Folder size={20} /> {col.collection_name} ({palettesInCol.length})
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        className="col-delete-btn"
                                        onClick={(e) => handleDeleteCollection(e, col.collection_id, col.collection_name)}
                                        title="Delete Collection"
                                        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 0 }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="palette-grid" style={{ marginTop: '12px' }}>
                                    {palettesInCol.length > 0 ? (
                                        palettesInCol.map((palette, index) => (
                                            <PaletteCard
                                                key={palette.palette_id}
                                                palette={palette}
                                                onDelete={() => handleDeletePalette(palette.palette_id, palette.palette_name)}
                                                onDragStart={() => handleDragStart(index, col.collection_id, palette)}
                                                onDragEnter={() => handleDragEnter(index, col.collection_id)}
                                                onDragEnd={handleDragEnd}
                                                onSelectPalette={onSelectPalette}
                                            />
                                        ))
                                    ) : (
                                        <div
                                            style={{ padding: '24px 10px', color: '#71717a', fontSize: '0.9rem', border: '1.5px dashed #d1d5db', borderRadius: '12px', textAlign: 'center' }}
                                            onDragOver={(e) => e.preventDefault()} // 📍 ให้พื้นที่ว่างรับการวางได้
                                            onDragEnter={() => handleDragEnter(0, col.collection_id)}
                                        >
                                            ไม่มีจานสีในคอลเลกชันนี้ (ลากจานสีมาวางที่นี่ได้)
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    );
                })}

                {/* 📦 2. แสดงจานสีที่ "ไม่ได้อยู่ใน Collection" (Uncategorized) */}
                {showUncategorized && (
                    <section style={{ marginBottom: '16px' }}>
                        <div
                            className="collection-bar"
                            onClick={() => toggleCollection('uncategorized')}
                            onDragOver={(e) => e.preventDefault()} // 📍 ยอมรับการ Drop
                            onDragEnter={() => handleDragEnter(uncategorizedPalettes.length, 'uncategorized')}
                            style={{ cursor: 'pointer', backgroundColor: '#52525b' }}
                        >
                            <div className="collection-info">
                                <Layers size={20} color="#ffffff" />
                                <span style={{ color: '#ffffff' }}>Uncategorized ({uncategorizedPalettes.length})</span>
                            </div>
                            <ChevronDown size={20} color="#ffffff" style={{ transform: isUncategorizedExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                        </div>

                        {isUncategorizedExpanded && (
                            <div className="palette-grid" style={{ marginTop: '12px' }}>
                                {uncategorizedPalettes.length > 0 ? (
                                    uncategorizedPalettes.map((palette, index) => (
                                        <PaletteCard
                                            key={palette.palette_id}
                                            palette={palette}
                                            onDelete={() => handleDeletePalette(palette.palette_id, palette.palette_name)}
                                            onDragStart={() => handleDragStart(index, 'uncategorized', palette)}
                                            onDragEnter={() => handleDragEnter(index, 'uncategorized')}
                                            onDragEnd={handleDragEnd}
                                            onSelectPalette={onSelectPalette}
                                        />
                                    ))
                                ) : (
                                    <div
                                        style={{ padding: '24px 10px', color: '#71717a', fontSize: '0.9rem', border: '1.5px dashed #d1d5db', borderRadius: '12px', textAlign: 'center' }}
                                        onDragOver={(e) => e.preventDefault()} // 📍 ให้พื้นที่ว่างรับการวางได้
                                        onDragEnter={() => handleDragEnter(0, 'uncategorized')}
                                    >
                                        ลากจานสีจากคอลเลกชันอื่นมาวางที่นี่ เพื่อนำออกจากโฟลเดอร์
                                    </div>
                                )}
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
const PaletteCard = ({ palette, onDelete, onDragStart, onDragEnter, onDragEnd, onSelectPalette }) => {
    const [isDraggable, setIsDraggable] = useState(false);

    // ดึงข้อมูลชื่อมู้ดและโหมดแบบปลอดภัย
    const moodText = palette.moodtone?.mood_name || (Array.isArray(palette.moodtone) ? palette.moodtone[0]?.mood_name : 'Random');
    const sourceText = palette.sourcetype?.source_name || (Array.isArray(palette.sourcetype) ? palette.sourcetype[0]?.source_name : 'Generate');

    const sortedColors = (palette.paletteDetail || [])
        .sort((a, b) => a.order_index - b.order_index);

    let displayColors = sortedColors.filter(detail => String(detail.role_id) !== '3');

    if (displayColors.length >= 12) {
        displayColors = displayColors.slice(0, displayColors.length - 11);
    }

    return (
        <div
            className="palette-card"
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => {
                if (onSelectPalette) onSelectPalette(palette);
            }}
            style={{ cursor: isDraggable ? 'grab' : 'pointer' }}
        >
            {/* ฝั่งซ้าย: ชื่อ และ แถบสี */}
            <div className="palette-left">
                <span className="palette-name">{palette.palette_name || 'My Palette'}</span>

                <div className="color-blocks">
                    {displayColors.map((detail, index) => {
                        const rawHex = detail.color?.hex_value || 'CCCCCC';
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
            </div>

            {/* ฝั่งขวา: รายละเอียด และ ไอคอน */}
            <div className="palette-right">
                <div className="palette-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <span>Mood&Tone: {moodText} / From: {sourceText}</span>

                    {/* ไอคอน Grip สำหรับจับลาก */}
                    <div
                        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#9ca3af', padding: '4px' }}
                        title="Drag to reorder"
                        onMouseEnter={() => setIsDraggable(true)}
                        onMouseLeave={() => setIsDraggable(false)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Grip size={16} />
                    </div>
                </div>

                <div className="palette-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        className="action-btn"
                        title="Open Palette"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); 
                            if (onSelectPalette) onSelectPalette(palette);
                        }}
                        style={{
                            backgroundColor: '#18181b', color: '#ffffff',
                            padding: '6px 16px', borderRadius: '6px',
                            fontSize: '0.85rem', fontWeight: '600'
                        }}
                    >
                        Open
                    </button>

                    <button
                        className="action-btn delete-btn"
                        title="Delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 size={22} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};
export default MyPalette;