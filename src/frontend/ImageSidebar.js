// ไฟล์: src/frontend/ImageSidebar.js
import React, { useState, useEffect, useRef } from 'react';
// 📍 เอา colorthief ออก เพราะเราจะใช้อัลกอริทึม Clustering ของเราเอง
import { Image as ImageIcon, Lock, Unlock, Minus, Plus, Palette, Pipette, Copy, PanelRightClose, PanelRightOpen, X, Shuffle } from 'lucide-react';

// นำเข้า CSS และ Component Modal
import './GenerateSidebar.css';
import './ImageSidebar.css';
import SavePaletteModal from '../frontend/SavePalette';
import { supabase } from '../backend/supabaseClient';


// ==========================================
// 🛠️ 1. อัลกอริทึม Color Clustering 
// ==========================================
const extractColorsFromImage = (imageElement, threshold) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // ลดขนาดรูปลงมาเพื่อความเร็วในการคำนวณ
    const MAX_SIZE = 400;
    let width = imageElement.naturalWidth || imageElement.width;
    let height = imageElement.naturalHeight || imageElement.height;

    if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height).data;
    const clusters = [];
    const step = 4; // เช็คทีละพิกเซล

    for (let i = 0; i < imgData.length; i += step * 3) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];

        let closestCluster = null;
        let minDistance = Infinity;

        for (let j = 0; j < clusters.length; j++) {
            const cluster = clusters[j];
            const dist = Math.sqrt(
                Math.pow(r - cluster.r, 2) + Math.pow(g - cluster.g, 2) + Math.pow(b - cluster.b, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                closestCluster = cluster;
            }
        }

        if (closestCluster && minDistance <= threshold) {
            closestCluster.sumR += r;
            closestCluster.sumG += g;
            closestCluster.sumB += b;
            closestCluster.count++;
            closestCluster.r = Math.round(closestCluster.sumR / closestCluster.count);
            closestCluster.g = Math.round(closestCluster.sumG / closestCluster.count);
            closestCluster.b = Math.round(closestCluster.sumB / closestCluster.count);
        } else {
            clusters.push({ r, g, b, sumR: r, sumG: g, sumB: b, count: 1 });
        }
    }

    // เรียงกลุ่มที่มีสีเยอะสุดขึ้นก่อน
    clusters.sort((a, b) => b.count - a.count);
    // const totalPixels = clusters.reduce((sum, c) => sum + c.count, 0);
    // const filteredClusters = clusters.filter(c => (c.count / totalPixels) > 0.01);
    const rgbToHex = (r, g, b) => [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
    return clusters.map(c => rgbToHex(c.r, c.g, c.b));
};

// ==========================================
// 🛠️ Color Math Helpers (สมการคำนวณสีเดิม)
// ==========================================
const getContrastColor = (hex) => {
    if (hex.length !== 6) return '#000000';
    const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 128 ? '#000000' : '#FFFFFF';
};

const hexToRgb = (hex) => {
    let v = hex.replace('#', '');
    if (v.length === 3) v = v.split('').map(c => c + c).join('');
    return { r: parseInt(v.slice(0, 2), 16) || 0, g: parseInt(v.slice(2, 4), 16) || 0, b: parseInt(v.slice(4, 6), 16) || 0 };
};

const rgbToHex = (r, g, b) => [r, g, b].map(x => Math.max(0, Math.min(255, Number(x || 0))).toString(16).padStart(2, '0')).join('').toUpperCase();

const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = max === 0 ? 0 : d / max, v = max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
            default: break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s, v };
};

const hsvToRgb = (h, s, v) => {
    h /= 360;
    let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const hsvToHex = (h, s, v) => {
    const { r, g, b } = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
};

const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break; default: break;
        }
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

const generateShades = (baseHex) => {
    if (baseHex.length !== 6) return Array(11).fill('000000');
    const mixColor = (color1, color2, weight) => {
        const c1 = hexToRgb(color1), c2 = hexToRgb(color2), w = weight / 100;
        return rgbToHex(Math.round(c1.r * w + c2.r * (1 - w)), Math.round(c1.g * w + c2.g * (1 - w)), Math.round(c1.b * w + c2.b * (1 - w)));
    };
    const shades = [];
    for (let i = 5; i > 0; i--) shades.push(mixColor('FFFFFF', baseHex, i * 16));
    shades.push(baseHex);
    for (let i = 1; i <= 5; i++) shades.push(mixColor('000000', baseHex, i * 16));
    return shades;
};

// ==========================================
// 🎨 Component ย่อย: หน้าต่าง Color Picker 
// ==========================================
const FloatingPicker = ({ hex, onChange }) => {
    const [format, setFormat] = useState('HEX');
    const boxRef = useRef(null);
    const [localHsv, setLocalHsv] = useState({ h: 0, s: 0, v: 1 });

    useEffect(() => {
        const { r, g, b } = hexToRgb(hex);
        const newHsv = rgbToHsv(r, g, b);
        setLocalHsv(prev => ({ h: newHsv.s === 0 ? prev.h : newHsv.h, s: newHsv.s, v: newHsv.v }));
    }, [hex]);

    const { r, g, b } = hsvToRgb(localHsv.h, localHsv.s, localHsv.v);
    const hsl = rgbToHsl(r, g, b);

    const handleColorPick = (e) => {
        if (!boxRef.current) return;
        const rect = boxRef.current.getBoundingClientRect();
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        let y = Math.max(0, Math.min(clientY - rect.top, rect.height));
        let s = x / rect.width, v = 1 - (y / rect.height);
        setLocalHsv(prev => ({ ...prev, s, v }));
        onChange(hsvToHex(localHsv.h, s, v));
    };

    const handleMouseDown = (e) => {
        handleColorPick(e);
        const handleMouseMove = (ev) => { ev.preventDefault(); handleColorPick(ev); };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove); document.removeEventListener('touchend', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove, { passive: false }); document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false }); document.addEventListener('touchend', handleMouseUp);
    };

    const handleEyeDropper = async (e) => {
        e.preventDefault();
        if (!window.EyeDropper) return alert("เบราว์เซอร์นี้ไม่รองรับหลอดดูดสีครับ");
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            onChange(result.sRGBHex.replace('#', '').toUpperCase());
        } catch (err) { }
    };

    return (
        <div className="floating-popover picker-popover" onClick={e => e.stopPropagation()}>
            <div className="picker-left">
                <div className="current-color-swatch" style={{ backgroundColor: `#${hex}` }}></div>
                <div className="picker-color-box" ref={boxRef} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown} style={{ background: `hsl(${localHsv.h}, 100%, 50%)` }}>
                    <div className="picker-color-overlay"></div>
                    <div className="picker-thumb-2d" style={{ left: `${localHsv.s * 100}%`, top: `${(1 - localHsv.v) * 100}%`, backgroundColor: `#${hsvToHex(localHsv.h, localHsv.s, localHsv.v)}` }}></div>
                </div>
            </div>

            <div className="picker-controls">
                <input type="range" className="slider hue-slider" min="0" max="360" value={localHsv.h}
                    onChange={(e) => {
                        const newH = parseInt(e.target.value);
                        setLocalHsv(prev => ({ ...prev, h: newH }));
                        onChange(hsvToHex(newH, localHsv.s, localHsv.v));
                    }} />

                <div className="format-controls">
                    <button className="pipette-btn" onClick={handleEyeDropper} title="ดูดสี"><Pipette size={14} /></button>
                    <div className="format-tabs">
                        <button className={format === 'HEX' ? 'active' : ''} onClick={() => setFormat('HEX')}>HEX</button>
                        <button className={format === 'RGB' ? 'active' : ''} onClick={() => setFormat('RGB')}>RGB</button>
                        <button className={format === 'HSL' ? 'active' : ''} onClick={() => setFormat('HSL')}>HSL</button>
                    </div>
                </div>

                <div className="picker-inputs">
                    {format === 'HEX' && (
                        <div className="single-input">
                            <input type="text" value={`#${hex}`} onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
                                onChange(val);
                            }} placeholder="#HEX" />
                        </div>
                    )}
                    {format === 'RGB' && (
                        <div className="multi-inputs">
                            <input type="number" min="0" max="255" value={r} onChange={(e) => onChange(rgbToHex(e.target.value, g, b))} placeholder="R" />
                            <input type="number" min="0" max="255" value={g} onChange={(e) => onChange(rgbToHex(r, e.target.value, b))} placeholder="G" />
                            <input type="number" min="0" max="255" value={b} onChange={(e) => onChange(rgbToHex(r, g, e.target.value))} placeholder="B" />
                        </div>
                    )}
                    {format === 'HSL' && (
                        <div className="multi-inputs">
                            <input type="number" min="0" max="360" value={hsl.h} onChange={(e) => { const newRgb = hslToRgb(e.target.value, hsl.s, hsl.l); onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b)); }} placeholder="H" />
                            <input type="number" min="0" max="100" value={hsl.s} onChange={(e) => { const newRgb = hslToRgb(hsl.h, e.target.value, hsl.l); onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b)); }} placeholder="S" />
                            <input type="number" min="0" max="100" value={hsl.l} onChange={(e) => { const newRgb = hslToRgb(hsl.h, hsl.s, e.target.value); onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b)); }} placeholder="L" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FloatingGradient = ({ baseHex, onCopy }) => (
    <div className="floating-popover gradient-popover" onClick={e => e.stopPropagation()}>
        <div className="shades-grid">
            {generateShades(baseHex).map((shade, index) => (
                <div
                    key={index}
                    className="shade-cell"
                    style={{ backgroundColor: `#${shade}`, cursor: 'pointer' }}
                    onClick={(e) => onCopy(e, shade)}
                    title={`Click to copy: #${shade}`}
                >
                    <span className="shade-text" style={{ color: getContrastColor(shade) }}>#{shade}</span>
                    {shade === baseHex && <div className="active-dot" style={{ backgroundColor: getContrastColor(shade) }}></div>}
                </div>
            ))}
            <div className="shade-cell empty-cell"></div>
        </div>
    </div>
);

// ==========================================
// 🎨 Component หลัก (Image Sidebar)
// ==========================================
const ImageSidebar = () => {
    const imgRef = useRef(null);

    const [uploadedImage, setUploadedImage] = useState(() => {
        const savedImage = localStorage.getItem('imgUploaded');
        return savedImage ? savedImage : null;
    });

    const [primary, setPrimary] = useState(() => {
        const saved = localStorage.getItem('imgPrimary');
        return saved ? JSON.parse(saved) : { value: '8B5CF6', isLocked: false };
    });

    const [secondary, setSecondary] = useState(() => {
        const saved = localStorage.getItem('imgSecondary');
        return saved ? JSON.parse(saved) : [
            { id: 1, value: 'F9FAFB', isLocked: false },
            { id: 2, value: '000000', isLocked: false },
            { id: 3, value: 'E5E7EB', isLocked: false },
        ];
    });

    const [openPopover, setOpenPopover] = useState({ type: null, id: null });
    const neutralShades = generateShades('6B7280');

    // 📍 2. เพิ่ม State สำหรับเก็บสีทั้งหมดที่ดูดได้ และไว้เปิด/ปิดหน้าต่างย่อย
    const [allExtractedColors, setAllExtractedColors] = useState([]);
    const [showAllColorsPanel, setShowAllColorsPanel] = useState(false);

    const [userId, setUserId] = useState(null);
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id || null);
        });
    }, []);

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const currentColors = [
        primary.value,
        ...secondary.map(s => s.value)
    ].filter(Boolean);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.floating-popover') && !event.target.closest('.color-circle-btn') && !event.target.closest('.action-icon')) {
                setOpenPopover({ type: null, id: null });
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (uploadedImage) {
            try {
                localStorage.setItem('imgUploaded', uploadedImage);
            } catch (error) {
                console.warn("รูปภาพมีขนาดใหญ่เกินไป (เกินโควต้าเบราว์เซอร์)");
            }
        } else {
            localStorage.removeItem('imgUploaded');
        }
    }, [uploadedImage]);

    useEffect(() => localStorage.setItem('imgPrimary', JSON.stringify(primary)), [primary]);
    useEffect(() => localStorage.setItem('imgSecondary', JSON.stringify(secondary)), [secondary]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => setUploadedImage(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const shuffleArray = (array) => {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const handleShuffleColors = () => {
        // ถ้ายังไม่ได้ดูดสี หรือไม่มีสีที่ดึงได้ ให้ข้ามไป
        if (allExtractedColors.length === 0) return;

        // สุ่มลำดับสีที่ดึงได้ทั้งหมดใหม่
        const randomColors = shuffleArray(allExtractedColors);
        let colorIndex = 0; // ตัวนับว่าใช้สีไปแล้วกี่สี

        // 1. อัปเดตสีในช่อง Primary (ถ้าไม่ได้ล็อก)
        setPrimary(prev => {
            if (prev.isLocked || colorIndex >= randomColors.length) return prev;
            const nextColor = randomColors[colorIndex++];
            return { ...prev, value: nextColor };
        });

        // 2. อัปเดตสีในช่อง Secondary (เฉพาะช่องที่ไม่ได้ล็อก)
        setSecondary(prev => {
            return prev.map(slot => {
                if (slot.isLocked || colorIndex >= randomColors.length) {
                    return slot;
                }
                const nextColor = randomColors[colorIndex++];
                return { ...slot, value: nextColor };
            });
        });
    };

    // 📍 3. ฟังก์ชันดึงสีจากรูป จะถูกเรียกเมื่อรูปโหลดเสร็จ (เรียกใช้อัลกอริทึม Clustering)
    const handleImageLoad = () => {
        try {
            // ดึงสีทั้งหมดด้วยอัลกอริทึมของเรา (Threshold = 20.0)
            const hexColors = extractColorsFromImage(imgRef.current, 20.0);

            // เก็บสีทั้งหมดไว้ใน State
            setAllExtractedColors(hexColors);

            if (hexColors.length === 0) return;

            // 📍 1. สุ่มสีที่ดึงมาทั้งหมดให้กระจายกัน
            const randomColors = shuffleArray(hexColors);
            let colorIndex = 0; // ตัวนับว่าใช้สีไปแล้วกี่สี

            // 📍 2. เอาสีที่สุ่มได้มาใส่ Primary (ถ้าไม่ได้ล็อก)
            setPrimary(prev => {
                if (prev.isLocked || colorIndex >= randomColors.length) return prev;
                const nextColor = randomColors[colorIndex++];
                return { ...prev, value: nextColor };
            });

            // 📍 3. เอาสีที่เหลือมาใส่ Secondary (ตามจำนวน Slot ที่มีอยู่ และถ้าไม่ได้ล็อก)
            setSecondary(prev => {
                return prev.map(slot => {
                    // ถ้าช่องนี้โดนล็อก หรือ สีที่สุ่มหมดแล้ว ให้ข้ามไป
                    if (slot.isLocked || colorIndex >= randomColors.length) {
                        return slot;
                    }
                    // ถ้ายังไม่ล็อก ให้เอาสีที่สุ่มลำดับถัดไปมาใส่
                    const nextColor = randomColors[colorIndex++];
                    return { ...slot, value: nextColor };
                });
            });

        } catch (error) {
            console.log("ไม่สามารถดึงสีได้จากรูปนี้", error);
        }
    };

    const handleInputHex = (val, callback) => {
        const validHex = val.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
        callback(validHex);
    };

    const updateColorValue = (id, newHex) => {
        if (id === 'primary') setPrimary({ ...primary, value: newHex });
        else setSecondary(prev => prev.map(s => s.id === id ? { ...s, value: newHex } : s));
    };

    const togglePopover = (type, id) => {
        setOpenPopover(prev => (prev.type === type && prev.id === id) ? { type: null, id: null } : { type, id });
    };

    const handleAddSecondary = () => { if (secondary.length < 5) setSecondary(prev => [...prev, { id: Date.now(), value: '000000', isLocked: false }]); };
    const handleRemoveSecondary = (id) => { setSecondary(prev => prev.filter(s => s.id !== id)); if (openPopover.id === id) setOpenPopover({ type: null, id: null }); };

    const handleCopy = (e, hexCode) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(hexCode).then(() => {
            console.log(`Copied: ${hexCode}`);
        }).catch(err => console.error('Failed to copy!', err));
    };

    return (
        <aside className="sidebar-container image-mode-sidebar" style={{ position: 'relative' }}>

            {/* --- Import Image Section --- */}
            <div className="sidebar-section import-section">
                <label className="image-import-box">
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    <div className="import-content">
                        {uploadedImage ? (
                            <img ref={imgRef} src={uploadedImage} alt="Uploaded" className="preview-image" onLoad={handleImageLoad} crossOrigin="anonymous" />
                        ) : (
                            <>
                                <ImageIcon size={48} color="#9ca3af" className="import-icon" />
                                <span className="import-text-main">Upload an image</span>
                                <span className="import-text-sub">Drag & drop or click to browse</span>
                            </>
                        )}
                    </div>
                </label>
            </div>

            {/* --- Palette Section --- */}
            <div className="sidebar-section palette-section">

                {/* 📍 4. ปุ่มกดเปิดหน้าต่างสีทั้งหมด (แสดงเมื่อดึงสีได้แล้ว) */}
                {allExtractedColors.length > 0 && (
                    <button
                        className={`toggle-all-colors-btn ${showAllColorsPanel ? 'active' : ''}`}
                        onClick={() => setShowAllColorsPanel(!showAllColorsPanel)}
                    >
                        {showAllColorsPanel ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                        {showAllColorsPanel ? "ซ่อนหน้าต่างสีทั้งหมด" : `ดูสีทั้งหมดที่ดึงได้ (${allExtractedColors.length} สี)`}
                    </button>
                )}

                {/* Primary Color */}
                <div className="color-group">
                    <label className="section-title">Primary Colors</label>
                    <div className="input-wrapper">
                        <button className="color-circle-btn" style={{ backgroundColor: `#${primary.value || 'FFF'}` }} onClick={() => togglePopover('picker', 'primary')} />
                        <span className="hex-prefix">#</span>
                        <input type="text" value={primary.value} onChange={(e) => handleInputHex(e.target.value, (val) => setPrimary({ ...primary, value: val }))} readOnly={primary.isLocked} className={primary.isLocked ? 'locked-input' : ''} />
                        <div className="action-group">
                            <button className="action-icon" onClick={() => togglePopover('gradient', 'primary')}><Palette size={16} /></button>
                            <button className="action-icon" onClick={(e) => handleCopy(e, primary.value)} title="Copy Hex"><Copy size={16} /></button>
                            <button className="action-icon" onClick={() => setPrimary({ ...primary, isLocked: !primary.isLocked })}>{primary.isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                        </div>
                        {openPopover.type === 'picker' && openPopover.id === 'primary' && <FloatingPicker hex={primary.value} onChange={(hex) => updateColorValue('primary', hex)} />}
                        {openPopover.type === 'gradient' && openPopover.id === 'primary' && <FloatingGradient baseHex={primary.value} onCopy={handleCopy} />}
                    </div>
                </div>

                {/* Secondary Colors */}
                <div className="color-group">
                    <label className="section-title">Secondary/ Accent Colors</label>
                    <div className="secondary-slots">
                        {secondary.map((slot) => (
                            <div key={slot.id} className="input-wrapper">
                                <button className="color-circle-btn" style={{ backgroundColor: `#${slot.value || 'FFF'}` }} onClick={() => togglePopover('picker', slot.id)} />
                                <span className="hex-prefix">#</span>
                                <input type="text" value={slot.value} onChange={(e) => handleInputHex(e.target.value, (val) => updateColorValue(slot.id, val))} readOnly={slot.isLocked} className={slot.isLocked ? 'locked-input' : ''} />
                                <div className="action-group">
                                    <button className="action-icon" onClick={() => handleRemoveSecondary(slot.id)}><Minus size={16} /></button>
                                    <button className="action-icon" onClick={() => togglePopover('gradient', slot.id)}><Palette size={16} /></button>
                                    <button className="action-icon" onClick={(e) => handleCopy(e, slot.value)} title="Copy Hex"><Copy size={16} /></button>
                                    <button className="action-icon" onClick={() => setSecondary(prev => prev.map(s => s.id === slot.id ? { ...s, isLocked: !s.isLocked } : s))}>{slot.isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                                </div>
                                {openPopover.type === 'picker' && openPopover.id === slot.id && <FloatingPicker hex={slot.value} onChange={(hex) => updateColorValue(slot.id, hex)} />}
                                {openPopover.type === 'gradient' && openPopover.id === slot.id && <FloatingGradient baseHex={slot.value} onCopy={handleCopy} />}
                            </div>
                        ))}
                        {[...Array(5 - secondary.length)].map((_, index) => <div key={`empty-${index}`} className="dashed-add-slot" onClick={handleAddSecondary}><Plus size={20} className="plus-icon" /></div>)}
                    </div>
                    {/* 📍 3. เพิ่มปุ่ม Shuffle สี ตรงด้านล่าง Secondary Slots นี้ */}
                    {allExtractedColors.length > 0 && (
                        <button
                            className="shuffle-btn"
                            onClick={handleShuffleColors}
                        >
                            <div className="gen-btn-text">
                                <Shuffle size={18} />
                                Shuffle Colors
                            </div>
                        </button>
                    )}
                </div>

                {/* Neutral */}
                <div className="color-group neutral-group">
                    <label className="section-title">Neutral Colors</label>
                    <div className="shades-grid neutral-grid">
                        {neutralShades.map((shade, index) => (
                            <div key={index} className="shade-cell" style={{ backgroundColor: `#${shade}`, cursor: 'pointer' }} onClick={(e) => handleCopy(e, shade)} title={`Click to copy: #${shade}`}>
                                <span className="shade-text always-visible" style={{ color: getContrastColor(shade) }}>#{shade}</span>
                            </div>
                        ))}
                        <div className="shade-cell empty-cell"></div>
                    </div>
                </div>

            </div>

            <button className="save-palette-btn" onClick={() => setIsSaveModalOpen(true)}>Save Palette</button>

            {/* 📍 5. หน้าต่างย่อยที่จะสไลด์ออกมาข้างๆ แสดงสีทั้งหมด */}
            {showAllColorsPanel && (
                <div className="all-colors-panel">
                    <div className="all-colors-header">
                        <h4>🎨 สีทั้งหมดที่ดึงได้</h4>
                        <button className="all-colors-close-btn" onClick={() => setShowAllColorsPanel(false)}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="all-colors-grid">
                        {allExtractedColors.map((hex, index) => (
                            <div
                                key={index}
                                className="all-color-item"
                                onClick={(e) => handleCopy(e, hex)}
                                title={`Click to copy #${hex}`}
                            >
                                <div className="color-swatch" style={{ backgroundColor: `#${hex}` }}></div>
                                <span>#{hex}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <SavePaletteModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} colors={currentColors} userId={userId} />
        </aside>
    );
};

export default ImageSidebar;