// ไฟล์: src/frontend/ExplorePalette.js
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Heart, X, ChevronDown, Edit, Trash2, Palette, Info } from 'lucide-react'; // 📍 นำเข้า FolderPlus และ Copy เพิ่ม
import { supabase } from '../backend/supabaseClient';
import './ExplorePalette.css';

// ==========================================
// 🛠️ Color Math Helpers (เพิ่มเข้ามาเพื่อช่วยแยกสี Neutral ออกจากการ์ด)
// ==========================================
const hexToRgb = (hex) => {
    let v = hex.replace('#', '');
    if (v.length === 3) v = v.split('').map(c => c + c).join('');
    return { r: parseInt(v.slice(0, 2), 16) || 0, g: parseInt(v.slice(2, 4), 16) || 0, b: parseInt(v.slice(4, 6), 16) || 0 };
};
const rgbToHex = (r, g, b) => [r, g, b].map(x => Math.max(0, Math.min(255, Number(x || 0))).toString(16).padStart(2, '0')).join('').toUpperCase();
const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; default: break; }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};
const hslToRgb = (h, s, l) => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p;
        };
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};
const generateNeutralShades = (primaryHex) => {
    const baseColor = (primaryHex && primaryHex.length === 6) ? primaryHex : '8B5CF6';
    const { r, g, b } = hexToRgb(baseColor);
    const baseHsl = rgbToHsl(r, g, b);
    const tintSaturation = baseHsl.s === 0 ? 0 : 4;
    const maxLightness = 98;
    const minLightness = 5;
    const shades = [];
    for (let i = 0; i <= 10; i++) {
        let progress = i / 10;
        let easedProgress = Math.pow(progress, 1.3);
        let lightness = maxLightness - (easedProgress * (maxLightness - minLightness));
        const rgb = hslToRgb(baseHsl.h, tintSaturation, lightness);
        shades.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return shades;
};

// 📍 รับ props userId เข้ามาด้วยครับ
const ExplorePalette = ({ isAdmin, userId, onSelectPalette }) => {
    const [palettes, setPalettes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('newest');
    const [selectedMoods, setSelectedMoods] = useState([]);
    const [moodOptions, setMoodOptions] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // 📍 1. ปรับคำสั่ง SQL: ดึง likes_count และเช็คว่า user นี้กดถูกใจหรือยัง
    const fetchExplorePalettes = useCallback(async () => {
        setLoading(true);
        try {
            // 📍 แก้ไขตรงนี้: ดึงข้อมูลที่จำเป็นสำหรับการ Copy ให้ครบถ้วน!
            let query = supabase
                .from('palette')
                .select(`
                    palette_id,
                    palette_name,
                    is_public,
                    is_template,
                    created_at,
                    likes_count,
                    moodtone ( mood_id, mood_name ),
                    sourcetype ( source_id, source_name ),
                    paletteDetail ( detail_id, order_index, role_id, color ( color_id, hex_value ) )
                `)
                .or('is_template.eq.true,is_public.eq.true');

            const { data, error } = await query;
            if (error) throw error;

            let finalPalettes = data || [];
            setPalettes(finalPalettes);
        } catch (error) {
            console.error("Error fetching explore palettes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExplorePalettes();
        fetchMoods();
        const handleRefresh = () => {
            fetchExplorePalettes();
        };

        // เปิดการรับฟัง
        window.addEventListener('refreshExplore', handleRefresh);

        // ปิดการรับฟังเมื่อ Component ถูกทำลาย (ลดการทำงานซ้ำซ้อน)
        return () => {
            window.removeEventListener('refreshExplore', handleRefresh);
        }
    }, [fetchExplorePalettes]);

    const fetchMoods = async () => {
        try {
            const { data, error } = await supabase
                .from('moodtone')
                .select('mood_name')
                .order('mood_name', { ascending: true });

            if (error) throw error;
            setMoodOptions(data || []);
        } catch (error) {
            console.error("Error fetching moods:", error);
        }
    };

    const handleAddMoodFilter = (e) => {
        const moodToAdd = e.target.value;
        if (moodToAdd && moodToAdd !== 'All' && !selectedMoods.includes(moodToAdd)) {
            setSelectedMoods(prev => [...prev, moodToAdd]);
        }
        e.target.value = 'All';
    };

    const handleRemoveMoodFilter = (moodToRemove) => {
        setSelectedMoods(prev => prev.filter(mood => mood !== moodToRemove));
    };

    const handleDeleteTemplate = async (paletteId, paletteName) => {
        if (!window.confirm(`คุณต้องการลบจานสีระบบ "${paletteName}" ใช่หรือไม่?\n(การกระทำนี้ไม่สามารถกู้คืนได้)`)) return;

        try {
            const { error } = await supabase
                .from('palette')
                .delete()
                .eq('palette_id', paletteId);

            if (error) throw error;
            fetchExplorePalettes();
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("เกิดข้อผิดพลาดในการลบจานสีระบบ");
        }
    };

    // 📍 3. ฟังก์ชันจัดการระบบ Like/Dislike แบบ Dynamic
    const handleLikePalette = async (palette, currentLikes) => {
        if (!userId) {
            setToastMessage('Please log in');
            setTimeout(() => setToastMessage(null), 3000);
            return;
        }
        const paletteId = palette.palette_id;
        const localLikesKey = userId ? `hasLiked_u${userId}_p${palette.palette_id}` : null;
        const alreadyLiked = localLikesKey ? localStorage.getItem(localLikesKey) === 'true' : false;

        try {
            let newLikesCount;

            if (alreadyLiked) {
                // ==========================================
                // 💔 กรณี Unlike (เอาออกจาก Favorite)
                // ==========================================
                newLikesCount = Math.max(0, currentLikes - 1);

                const { error: deleteError } = await supabase
                    .from('palette')
                    .delete()
                    .eq('user_id', userId)
                    .eq('is_favorite', true)
                    // 📍 ลบตัวที่อ้างอิงถึง palette_id ต้นฉบับ (ถ้าคุณมีคอลัมน์ parent_id จะดีมาก แต่ถ้าไม่มีให้ใช้ชื่อ)
                    .ilike('palette_name', `${palette.palette_name}%(Favorite)`);

                if (deleteError) throw deleteError;
                localStorage.removeItem(localLikesKey);

            } else {
                // ==========================================
                // ❤️ กรณี Like (เพิ่มเข้า Favorite)
                // ==========================================
                newLikesCount = currentLikes + 1;

                // 1. คัดลอกจานสีใบนี้ไปเป็นของตัวเอง
                const { data: newFav, error: copyError } = await supabase
                    .from('palette')
                    .insert([{
                        // 📍 ปรับชื่อให้มี Timestamp เล็กน้อยเพื่อเลี่ยง Error 409 (Conflict)
                        palette_name: `${palette.palette_name} (Favorite)`,
                        user_id: userId,
                        mood_id: palette.moodtone?.mood_id || 1,
                        source_id: 2,
                        is_public: false,
                        is_template: false,
                        is_favorite: true,
                        likes_count: 0,
                        // 📍 แก้ปัญหา Foreign Key: บังคับให้เป็น null เสมอเพราะเราลากเข้า Fav เอง
                        collection_id: null
                    }])
                    .select('palette_id')
                    .single();

                if (copyError) throw copyError;

                // 2. คัดลอกรายละเอียดสี
                const favDetails = (palette.paletteDetail || []).map(detail => ({
                    palette_id: newFav.palette_id,
                    color_id: detail.color?.color_id,
                    order_index: detail.order_index,
                    role_id: detail.role_id
                }));

                if (favDetails.length > 0) {
                    const { error: detError } = await supabase.from('paletteDetail').insert(favDetails);
                    if (detError) throw detError;
                }

                localStorage.setItem(localLikesKey, 'true');
            }

            // อัปเดตตัวเลข Like ที่ต้นฉบับ
            await supabase
                .from('palette')
                .update({ likes_count: newLikesCount })
                .eq('palette_id', paletteId);

            setPalettes(prev =>
                prev.map(pal => pal.palette_id === paletteId ? { ...pal, likes_count: newLikesCount } : pal)
            );

        } catch (error) {
            console.error("Error toggling favorite:", error);
            // 📍 เปลี่ยน alert เป็น setToastMessage
            setToastMessage(`เกิดข้อผิดพลาด: ${error.message}`);
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const handlePreviewPalette = (palette, e) => {
        e.stopPropagation();
        if (onSelectPalette) {
            // จัดรูปแบบข้อมูลให้ตรงกับที่ Sidebar ต้องการ
            const formattedPalette = {
                ...palette,
                colors: (palette.paletteDetail || [])
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(detail => ({
                        ...detail.color,
                        role_id: detail.role_id
                    })),
                moodtone: palette.moodtone?.mood_name || 'Random',
                sourcetype: palette.sourcetype?.source_name || 'Explore'
            };
            onSelectPalette(formattedPalette);
        } else {
            console.error("onSelectPalette is missing");
            alert("เกิดข้อผิดพลาด: ไม่สามารถแสดงผลบน Sidebar ได้");
        }
    };

    const filteredPalettes = palettes
        .filter(p => p.palette_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(p => {
            if (selectedMoods.length === 0) return true;
            const moodName = p.moodtone?.mood_name || 'Random';
            return selectedMoods.includes(moodName);
        })
        .sort((a, b) => {
            if (sortOption === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortOption === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            // Sorting by Popularity อิงตาม likes_count
            if (sortOption === 'popular') return (b.likes_count || 0) - (a.likes_count || 0);
            return 0;
        });

    return (
        <div className="explore-container">
            <div className="explore-controls">
                <div className="search-bar">
                    <Search size={18} color="#6b7280" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-dropdowns">
                    <div className="select-wrapper">
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                            <option value="newest">Sort by: Newest</option>
                            <option value="oldest">Sort by: Oldest</option>
                            <option value="popular">Sort by: Popular</option>
                        </select>
                        <ChevronDown className="custom-select-icon" size={16} strokeWidth={2.5} />
                    </div>

                    <div className="select-wrapper">
                        <select value="All" onChange={handleAddMoodFilter}>
                            <option value="All">Mood & Tone</option>
                            {moodOptions.map((mood, index) => (
                                <option key={index} value={mood.mood_name}>
                                    {mood.mood_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="custom-select-icon" size={16} strokeWidth={2.5} />
                    </div>
                </div>

                {isAdmin && (
                    <button
                        className={`edit-template-btn ${isEditMode ? 'active' : ''}`}
                        onClick={() => setIsEditMode(!isEditMode)}
                        title="จัดการจานสีของระบบ"
                    >
                        <Edit size={16} />
                        {isEditMode ? 'Exit Edit Mode' : 'Edit Templates'}
                    </button>
                )}
            </div>

            {selectedMoods.length > 0 && (
                <div className="selected-moods-tags">
                    {selectedMoods.map(mood => (
                        <div key={mood} className="mood-tag">
                            <span>{mood}</span>
                            <button onClick={() => handleRemoveMoodFilter(mood)} title={`Remove ${mood} filter`}>
                                <X size={14} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="explore-loading">Loading Palettes...</div>
            ) : (
                <div className="explore-grid">
                    {filteredPalettes.map(palette => {
                        // 📍 1. จัดเรียงและกรองสี เอาเฉพาะสีหลัก (ไม่เอา role_id = 3) และโชว์ไม่เกิน 6 สี
                        const sortedColors = (palette.paletteDetail || []).sort((a, b) => a.order_index - b.order_index);

                        let displayColors = [];

                        if (sortedColors.length > 0) {
                            const primaryHex = sortedColors[0].color?.hex_value?.replace('#', '').toUpperCase() || 'FFFFFF';
                            const autoNeutrals = generateNeutralShades(primaryHex).map(c => c.toUpperCase());

                            for (let i = 0; i < sortedColors.length; i++) {
                                const detail = sortedColors[i];
                                const hex = detail.color?.hex_value?.replace('#', '').toUpperCase();

                                // ป้องกัน RLS Block หรือค่าว่าง ทำให้เกิดสีเทา
                                if (!hex) continue;
                                if (String(detail.role_id) === '3') continue;

                                // หยุดดึงถ้าเจอสีโทน Neutral
                                if (i > 0 && hex && (hex === autoNeutrals[0] || hex === autoNeutrals[1] || hex === autoNeutrals[2])) {
                                    break;
                                }

                                if (displayColors.length < 6) {
                                    displayColors.push(detail);
                                }
                            }
                        }

                        const moodName = palette.moodtone?.mood_name || 'Random';

                        // เช็คว่า User เคยกดถูกใจพาเลตนี้หรือยัง
                        const localLikesKey = `hasLiked_u${userId}_p${palette.palette_id}`;
                        const alreadyLiked = localStorage.getItem(localLikesKey) === 'true';

                        return (
                            <div key={palette.palette_id} className={`explore-card ${isEditMode && palette.is_template ? 'edit-mode-active' : ''}`}>

                                {isEditMode && palette.is_template && (
                                    <button
                                        className="delete-template-overlay-btn"
                                        onClick={() => handleDeleteTemplate(palette.palette_id, palette.palette_name)}
                                        title="ลบจานสีระบบ"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <div className="explore-colors">
                                    {/* 📍 2. ดักจับ: ถ้าไม่มีข้อมูลสี (เช่นติด RLS) ให้แสดงข้อความแทน */}
                                    {displayColors.length > 0 ? (
                                        displayColors.map((detail, index) => {
                                            const rawHex = detail.color?.hex_value;
                                            if (!rawHex) return null; // ข้ามการวาดสีไปเลยถ้าไม่มีข้อมูลสี ป้องกันสีเทาโผล่
                                            const bgColor = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;

                                            return (
                                                <div
                                                    key={detail.detail_id || index}
                                                    className="explore-color-stripe"
                                                    style={{ backgroundColor: bgColor }}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '12px' }}>
                                            <span title="โปรดตั้งค่าสิทธิ์ RLS ใน Supabase ให้ Public ดึงข้อมูล color และ paletteDetail ได้">
                                                🔒 ไม่มีข้อมูลสี / ติดสิทธิ์ RLS
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* ข้อมูลด้านล่างการ์ด (Explore-info เหมือนเดิม) */}
                                <div className="explore-info">
                                    <div className="explore-text">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4>{palette.palette_name || 'Untitled Palette'}</h4>
                                        </div>
                                        <p>Mood & Tone : {moodName}</p>
                                    </div>

                                    {/* 📍 ปรับโครงสร้าง: ย้าย Template Tag และปุ่มมาไว้ตรงนี้ */}
                                    <div className="explore-card-actions">

                                        {/* 📍 ย้าย Badge มาแสดงด้านบน */}
                                        {palette.is_template && (
                                            <span className="template-badge">Template</span>
                                        )}

                                        <div className="explore-likes-group">
                                            {/* 📍 ปุ่ม Like ปรับคำสั่ง onClick เรียก handleLikePalette */}
                                            <button
                                                className="like-btn"
                                                onClick={() => handleLikePalette(palette, palette.likes_count || 0)}
                                                title={alreadyLiked ? "ยกเลิกกดใจ" : "กดใจ"}
                                            >
                                                {/* 📍 เปลี่ยนหัวใจเป็นสีแดงถ้าเคยกดชอบ */}
                                                <Heart
                                                    size={18}
                                                    color={alreadyLiked ? "#e11d48" : "#111827"}
                                                    fill={alreadyLiked ? "#e11d48" : "none"}
                                                    style={{ transition: 'all 0.2s' }}
                                                />
                                            </button>

                                            {/* 📍 ตัวเลข likecount จริงจาก DB */}
                                            <span>{palette.likes_count || 0}</span>

                                            {/* 📍 เปลี่ยนปุ่มนี้เป็นปุ่มส่งเข้า Sidebar */}
                                            <button
                                                className="preview-palette-btn"
                                                onClick={(e) => handlePreviewPalette(palette, e)}
                                                title='ดูจานสีนี้บน Workspace (แสดงบน Sidebar)'
                                            >
                                                <Palette size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {toastMessage && (
                <div style={{
                    position: 'fixed', // 📍 แบบ fixed เพื่อให้ลอยเหนือทุกอย่าง
                    bottom: '30px',    // 📍 ระยะห่างจากด้านล่าง
                    left: '50%',       // 📍 จัดให้อยู่กึ่งกลางแนวนอน
                    transform: 'translateX(-50%)', // 📍 ขยับตัวกลับมาครึ่งหนึ่งเพื่อให้จุดศูนย์กลางอยู่ตรงกลางจริงๆ
                    zIndex: 9999,      // 📍 รับประกันว่าอยู่ชั้นบนสุด
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    // หากเป็นการเตือนล็อกอิน ให้ใช้สีแดง (#ef4444) หากเป็นการถูกใจ/ Error อื่นๆ ใช้สีดำ (#111827) หรือสีที่คุณตั้งไว้
                    backgroundColor: toastMessage.includes('Please log in') ? '#ef4444' : '#111827',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <Info size={16} />
                    {toastMessage}
                </div>

            )}
        </div>
    );
};

export default ExplorePalette;