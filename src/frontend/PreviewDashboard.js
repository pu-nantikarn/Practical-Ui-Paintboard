// ไฟล์: src/frontend/PreviewDashboard.js
import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { TrendingUp, Zap, Heart, Clock, Upload, User, CheckCircle, Send, Megaphone, Target, HardDrive, Shuffle } from 'lucide-react';
import './PreviewDashboard.css';
import { ColorContext } from '../contexts/ColorContext';

// ==========================================
// 🛠️ Color Math Helpers
// ==========================================
const hexToRgb = (hex) => {
    if (!hex || !hex.startsWith('#')) return { r: 0, g: 0, b: 0 };
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
    const tintSaturation = baseHsl.s === 0 ? 0 : 8;
    const maxLightness = 99;
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

const generateColorShades = (hex) => {
    if (!hex || !hex.startsWith('#')) return [];
    const { r, g, b } = hexToRgb(hex);
    const baseHsl = rgbToHsl(r, g, b);
    const shades = [];
    for (let i = 0; i < 10; i++) {
        let lightness = 95 - (i * 8.5);
        const rgb = hslToRgb(baseHsl.h, baseHsl.s, lightness);
        shades.push(rgbToHex(rgb.r, rgb.g, rgb.b));
    }
    return shades.map(c => `#${c}`);
};

const getLuminance = (hex) => {
    if (!hex || !hex.startsWith('#')) return 0;
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrast = (hex1, hex2) => {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

const PreviewDashboard = ({ mode = 'Generate' }) => {
    const [shuffleSeed, setShuffleSeed] = useState(0);
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    const [overrides, setOverrides] = useState({});
    const tooltipRef = useRef(null);
    const [hoverHex, setHoverHex] = useState(null);
    const [activePicker, setActivePicker] = useState(null);

    const primaryState = mode === 'Generate' ? genPrimary : imgPrimary;
    const secondaryState = mode === 'Generate' ? genSecondary : imgSecondary;

    const pColor = `#${primaryState.value}`;
    const sColors = secondaryState.map(c => `#${c.value}`);
    const sColorsString = sColors.join(',');

    useEffect(() => {
        setOverrides({});
    }, [pColor, sColorsString]);

    const neutral = useMemo(() => {
        if (!pColor || pColor === '#') {
            return ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#000000'];
        }
        const shades = generateNeutralShades(pColor);
        return shades.map(s => s.startsWith('#') ? s : `#${s}`);
    }, [pColor]);

    const bgApp = neutral[1];
    const bgCard = neutral[0];
    const textMain = neutral[9];
    const textMuted = neutral[5];
    const borderColor = neutral[3];

    const accents = useMemo(() => {
        const dummySeed = shuffleSeed * 0; 
        const currentSecondary = sColorsString.split(',').filter(c => c && c !== '#');
        
        const primaryColor = pColor;
        const pShades = generateColorShades(primaryColor);
        
        const secondaryColor = currentSecondary[0] || pColor; 
        const sShades = generateColorShades(secondaryColor);
        
        let accentColor = secondaryColor;
        let maxContrast = 0;
        
        currentSecondary.forEach(color => {
            const contrast = getContrast(primaryColor, color);
            // ถ้าเจอสีที่ตัดกันมากกว่าเดิม ให้สลับไปใช้สีนั้นเป็นสีเน้น
            if (contrast > maxContrast) {
                maxContrast = contrast;
                accentColor = color;
            }
        });

        const colorPool = [
            primaryColor, primaryColor, primaryColor, primaryColor, 
            pShades[4] || primaryColor, pShades[7] || primaryColor, 

            secondaryColor, secondaryColor, 
            sShades[4] || secondaryColor, 
                        
            accentColor                                                                         
        ];
        
        const randomColors = [];
        let lastColor = null;       // 📍 ความจำระยะสั้น: เก็บสีล่าสุด
        let secondLastColor = null; // 📍 ความจำระยะสั้น: เก็บสีก่อนหน้าล่าสุด

        for (let i = 0; i < 50; i++) {
            let nextColor;
            let attempts = 0;
            const maxAttempts = 5; // ให้โอกาสสุ่มใหม่สูงสุด 5 ครั้งเพื่อกันโค้ดค้าง

            do {
                // สุ่มสีขึ้นมา 1 สี
                nextColor = colorPool[Math.floor(Math.random() * colorPool.length) + dummySeed];
                attempts++;
                
                // 📍 เช็คเงื่อนไข: ถ้าสีซ้ำกับ 2 จุดล่าสุด ให้สุ่มใหม่ (วนลูป do-while)
            } while (
                (nextColor === lastColor || nextColor === secondLastColor) 
                && attempts < maxAttempts
            );

            // เมื่อได้สีที่ไม่ซ้ำ (หรือพยายามครบ 5 ครั้งแล้ว) ก็บันทึกสีนั้นลง Array
            randomColors.push(nextColor);
            
            // อัปเดตความจำระยะสั้น
            secondLastColor = lastColor;
            lastColor = nextColor;
        }
        return randomColors;
    }, [pColor, sColorsString, shuffleSeed]);

    const barHeights = useMemo(() => {
        const dummySeed = shuffleSeed * 0; // 📍 ทริกแก้ ESLint
        return Array.from({ length: 7 }, () => `${Math.floor(Math.random() * 60 + 20) + dummySeed}%`);
    }, [shuffleSeed]);

    // ==========================================
    // 🎯 Interaction Engine
    // ==========================================
    const getColor = (key, fallback) => overrides[key] || fallback;

    const cProps = (key, fallbackHex, styleObj = {}) => {
        const hex = getColor(key, fallbackHex);
        return {
            onMouseOver: (e) => {
                e.stopPropagation();
                setHoverHex(hex);
                if (tooltipRef.current) {
                    tooltipRef.current.style.left = `${e.clientX}px`;
                    tooltipRef.current.style.top = `${e.clientY - 20}px`;
                }
            },
            onMouseMove: (e) => {
                e.stopPropagation();
                if (tooltipRef.current) {
                    tooltipRef.current.style.left = `${e.clientX}px`;
                    tooltipRef.current.style.top = `${e.clientY - 20}px`;
                }
            },
            onMouseOut: (e) => {
                e.stopPropagation();
                setHoverHex(null);
            },
            onClick: (e) => {
                e.stopPropagation();
                e.preventDefault();
                let px = e.clientX;
                let py = e.clientY + 15;
                if (px + 380 > window.innerWidth) px = window.innerWidth - 380;
                if (py + 200 > window.innerHeight) py = e.clientY - 200;

                setActivePicker({ x: px, y: py, key, currentHex: hex });
                setHoverHex(null);
            },
            style: { cursor: 'pointer', transition: 'all 0.2s ease', ...styleObj }
        };
    };

    const renderColorDot = (color, size = '24px') => {
        if (!color) return null;

        // 📍 เปรียบเทียบกับ currentHex ตรงๆ เลย ไม่ต้องผ่าน getColor() อีกรอบ
        const isCurrent = activePicker && color.toLowerCase() === activePicker.currentHex?.toLowerCase();

        let dotColor = '#ffffff';
        if (color.startsWith('#')) {
            const rgb = hexToRgb(color);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            if (brightness > 128) dotColor = '#000000';
        }

        return (
            <div
                key={color}
                onClick={(e) => {
                    e.stopPropagation();
                    setOverrides(prev => ({ ...prev, [activePicker.key]: color }));
                    setActivePicker(null);
                }}
                style={{
                    width: size, height: size, borderRadius: '50%', backgroundColor: color,
                    cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)',
                    transition: 'transform 0.1s', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={color.toUpperCase()}
            >
                {isCurrent && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor }}></div>}
            </div>
        );
    };

    // ==========================================
    // 📊 Data Collections
    // ==========================================
    const kpiData = [
        { id: 'kpi1', title: 'TOTAL REVENUE', val: '$128,430', icon: TrendingUp, trend: '+ 12.5%', trColor: '#10B981', acc: 0 },
        { id: 'kpi2', title: 'ACTIVE USERS', val: '14,202', icon: Zap, trend: '+ 8.2%', trColor: '#10B981', acc: 1 },
        { id: 'kpi3', title: 'CONVERSION RATE', val: '3.42%', icon: Heart, trend: '- 0.8%', trColor: '#EF4444', acc: 2 },
        { id: 'kpi4', title: 'AVG. SESSION', val: '4m 32s', icon: Clock, trend: '+ 14%', trColor: '#10B981', acc: 3 }
    ];

    const tmData = [
        { id: 'tm1', name: 'Cat A', val: '45%', cls: 'tm-large', acc: 9 },
        { id: 'tm2', name: 'Cat B', val: '22%', cls: 'tm-wide', acc: 10 },
        { id: 'tm3', name: 'C', val: '12%', cls: 'tm-small', acc: 11 },
        { id: 'tm4', name: 'D', val: '8%', cls: 'tm-small', acc: 12 },
        { id: 'tm5', name: 'E', val: '13%', cls: 'tm-wide', acc: 13 }
    ];

    const ganttData = [
        { id: 'g1', phase: 'PHASE 1', name: 'Research', left: '10%', width: '30%', acc: 20 },
        { id: 'g2', phase: 'PHASE 2', name: 'Design System', left: '35%', width: '40%', acc: 21 },
        { id: 'g3', phase: 'PHASE 3', name: 'Development', left: '60%', width: '25%', acc: 22 },
        { id: 'g4', phase: 'PHASE 4', name: 'QA / Testing', left: '75%', width: '15%', acc: 23 },
        { id: 'g5', phase: 'LAUNCH', name: 'Deployment', left: '85%', width: '10%', acc: 24 },
    ];

    const activities = [
        { id: 'act1', title: 'Project Beta', action: 'updated', time: '12 mins ago', icon: Upload, acc: 34 },
        { id: 'act2', title: 'New user', action: 'joined team', time: '2 hours ago', icon: User, acc: 35 },
        { id: 'act3', title: 'Task completed', action: '', time: 'Yesterday', icon: CheckCircle, acc: 36 }
    ];

    const quickActions = [
        { id: 'qa1', title: 'Add User', icon: User },
        { id: 'qa2', title: 'Export', icon: Upload },
        { id: 'qa3', title: 'Invoice', icon: Send },
        { id: 'qa4', title: 'Announce', icon: Megaphone }
    ];

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>

            {/* 📍 Tooltip */}
            <div ref={tooltipRef} style={{
                position: 'fixed', transform: 'translate(-50%, -100%)',
                backgroundColor: '#1F2937', color: '#fff', padding: '6px 10px', borderRadius: '8px',
                fontSize: '12px', fontWeight: '600', display: hoverHex ? 'flex' : 'none', alignItems: 'center', gap: '8px',
                zIndex: 9999, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: hoverHex || '#000', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                {hoverHex && (hoverHex.startsWith('#') ? hoverHex.toUpperCase() : hoverHex)}
            </div>

            {/* 📍 Popup แบบตาราง */}
            {activePicker && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setActivePicker(null)}></div>
                    <div style={{
                        position: 'fixed', left: activePicker.x, top: activePicker.y,
                        backgroundColor: bgCard, border: `1px solid ${borderColor}`, padding: '12px',
                        borderRadius: '10px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
                    }}>
                        {[pColor, ...sColors.filter(c => c && c !== '#')].map((baseColor, i) => (
                            <div key={`group-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {renderColorDot(baseColor, '26px')}
                                <div style={{ width: '1px', height: '18px', backgroundColor: borderColor, margin: '0 4px' }}></div>
                                {generateColorShades(baseColor).map(shade => renderColorDot(shade, '22px'))}
                            </div>
                        ))}
                        <div style={{ height: '1px', backgroundColor: borderColor, width: '100%', margin: '2px 0' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {neutral.map(nColor => renderColorDot(nColor, '22px'))}
                        </div>
                    </div>
                </>
            )}

            {/* 📍 แก้ปุ่ม Shuffle ไม่ให้โดน Overwrite เพื่อให้คำสั่งสุ่มทำงานได้ */}
            <button
                onClick={() => { setShuffleSeed(prev => prev + 1); setOverrides({}); }}
                style={{
                    position: 'absolute', top: '8px', left: '24px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: bgCard, color: textMain,
                    border: `1px solid ${borderColor}`, borderRadius: '24px',
                    padding: '8px 16px', fontSize: '13px', fontWeight: '600', zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = neutral[2]}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = bgCard}
            >
                <Shuffle size={16} /> <span>Shuffle</span>
            </button>

            {/* =========================================================
                ✨ DASHBOARD AREA (ALL ELEMENTS INDIVIDUALLY BINDED)
            ========================================================= */}
            <div className="preview-dashboard" {...cProps('bgApp', bgApp, { backgroundColor: getColor('bgApp', bgApp), position: 'relative' })}>

                {/* 1. KPI Cards */}
                <div className="dash-row kpi-row" style={{ marginTop: '30px' }}>
                    {kpiData.map(k => (
                        <div key={k.id} className="dash-card kpi-card" {...cProps(`${k.id}-bg`, bgCard, { backgroundColor: getColor(`${k.id}-bg`, bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <div className="kpi-header">
                                <div className="kpi-icon" {...cProps(`${k.id}-icon`, accents[k.acc], { backgroundColor: `${getColor(`${k.id}-icon`, accents[k.acc])}15`, color: getColor(`${k.id}-icon`, accents[k.acc]) })}>
                                    <k.icon size={16} />
                                </div>
                                <span className="trend positive" {...cProps(`${k.id}-tr`, k.trColor, { backgroundColor: `${getColor(`${k.id}-tr`, k.trColor)}15`, color: getColor(`${k.id}-tr`, k.trColor) })}>
                                    <TrendingUp size={12} style={k.trend.includes('-') ? { transform: 'scaleY(-1)' } : {}} /> {k.trend}
                                </span>
                            </div>
                            <p className="kpi-title" {...cProps(`${k.id}-tit`, textMuted, { color: getColor(`${k.id}-tit`, textMuted) })}>{k.title}</p>
                            <h2 className="kpi-value" {...cProps(`${k.id}-val`, textMain, { color: getColor(`${k.id}-val`, textMain) })}>{k.val}</h2>
                        </div>
                    ))}
                </div>

                <div className="dash-grid">
                    <div className="dash-col-left">

                        {/* 2. Line Chart */}
                        <div className="dash-card" {...cProps('line-bg', bgCard, { backgroundColor: getColor('line-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <div className="card-header">
                                <div>
                                    <h3 {...cProps('line-tit', textMain, { color: getColor('line-tit', textMain) })}>Revenue Trends</h3>
                                    <p {...cProps('line-sub', textMuted, { color: getColor('line-sub', textMuted), fontSize: '11px' })}>Detailed performance comparison</p>
                                </div>
                                <div className="toggle-group" {...cProps('line-tog-bg', neutral[2], { backgroundColor: getColor('line-tog-bg', neutral[2]) })}>
                                    {['Week', 'Month', 'Year'].map((t, i) => (
                                        <button key={t} {...cProps(`line-tog-${i}`, i === 1 ? accents[4] : bgApp, { backgroundColor: getColor(`line-tog-${i}`, i === 1 ? accents[4] : 'transparent'), color: getColor(`line-tog-txt-${i}`, i === 1 ? '#fff' : textMuted) })}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <svg className="mock-line-chart" viewBox="0 0 100 40" preserveAspectRatio="none">
                                {[5, 6, 7, 8].map((acc, i) => {
                                    const pts = ["0,35 20,28 40,32 60,15 80,25 100,10", "0,20 20,25 40,15 60,20 80,10 100,5", "0,30 20,35 40,20 60,10 80,15 100,20", "0,10 20,15 40,25 60,30 80,15 100,25"];
                                    return <polyline key={i} {...cProps(`line-p-${i}`, accents[acc], { stroke: getColor(`line-p-${i}`, accents[acc]) })} points={pts[i]} fill="none" strokeWidth="1.5" strokeLinejoin="round" />
                                })}
                            </svg>
                            <div className="chart-x-axis" {...cProps('line-x', textMuted, { color: getColor('line-x', textMuted) })}>
                                <span>01 Nov</span><span>07 Nov</span><span>14 Nov</span><span>21 Nov</span><span>28 Nov</span>
                            </div>
                        </div>

                        <div className="dash-row inner-row">
                            {/* 3. Treemap */}
                            <div className="dash-card treemap-card" {...cProps('tm-bg', bgCard, { backgroundColor: getColor('tm-bg', bgCard), borderColor: getColor('g-border', borderColor), flex: 1 })}>
                                <h3 {...cProps('tm-tit', textMain, { color: getColor('tm-tit', textMain), marginBottom: '12px', fontSize: '13px' })}>Inventory Distribution</h3>
                                <div className="mock-treemap">
                                    {tmData.map(tm => (
                                        <div key={tm.id} className={`tm-box ${tm.cls}`} {...cProps(tm.id, accents[tm.acc], { backgroundColor: getColor(tm.id, accents[tm.acc]) })}>
                                            <span {...cProps(`${tm.id}-txt`, '#ffffff', { color: getColor(`${tm.id}-txt`, '#ffffff') })}>{tm.name}<br />{tm.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Resource Allocation */}
                            <div className="dash-card resource-card" {...cProps('res-bg', bgCard, { backgroundColor: getColor('res-bg', bgCard), borderColor: getColor('g-border', borderColor), flex: 1 })}>
                                <h3 {...cProps('res-tit', textMain, { color: getColor('res-tit', textMain), marginBottom: '12px', fontSize: '13px' })}>Resource Allocation</h3>
                                <div className="stacked-bar-group">
                                    {['Alpha', 'Beta', 'Gamma', 'Delta'].map((proj, i) => (
                                        <div key={proj} className="sb-item">
                                            <div className="sb-label">
                                                <span {...cProps(`res-p-${i}`, textMuted, { color: getColor(`res-p-${i}`, textMuted) })}>Project {proj}</span>
                                                <span {...cProps(`res-v-${i}`, textMuted, { color: getColor(`res-v-${i}`, textMuted) })}>{80 - (i * 8)}%</span>
                                            </div>
                                            <div className="sb-track" {...cProps(`res-tr-${i}`, neutral[2], { backgroundColor: getColor(`res-tr-${i}`, neutral[2]) })}>
                                                <div className="sb-fill" {...cProps(`res-f1-${i}`, accents[14 + i % 5], { width: '40%', backgroundColor: getColor(`res-f1-${i}`, accents[14 + i % 5]) })}></div>
                                                <div className="sb-fill" {...cProps(`res-f2-${i}`, accents[15 + i % 5], { width: '25%', backgroundColor: getColor(`res-f2-${i}`, accents[15 + i % 5]) })}></div>
                                                <div className="sb-fill" {...cProps(`res-f3-${i}`, accents[16 + i % 5], { width: `${15 - i * 2}%`, backgroundColor: getColor(`res-f3-${i}`, accents[16 + i % 5]) })}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. Gantt Chart */}
                        <div className="dash-card gantt-card" {...cProps('gt-bg', bgCard, { backgroundColor: getColor('gt-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <h3 {...cProps('gt-tit', textMain, { color: getColor('gt-tit', textMain), marginBottom: '12px', fontSize: '13px' })}>Project Timeline</h3>
                            <div className="mock-gantt">
                                {ganttData.map(g => (
                                    <div key={g.id} className="g-row">
                                        <span {...cProps(`${g.id}-lbl`, textMuted, { color: getColor(`${g.id}-lbl`, textMuted) })}>{g.phase}</span>
                                        <div className="g-track" {...cProps(`${g.id}-tr`, neutral[2], { backgroundColor: getColor(`${g.id}-tr`, neutral[2]) })}>
                                            <div className="g-bar" {...cProps(`${g.id}-bar`, accents[g.acc], { left: g.left, width: g.width, backgroundColor: getColor(`${g.id}-bar`, accents[g.acc]) })}>
                                                <span {...cProps(`${g.id}-txt`, '#ffffff', { color: getColor(`${g.id}-txt`, '#ffffff') })}>{g.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 6. Radar Chart */}
                        <div className="dash-card radar-card" {...cProps('rd-bg', bgCard, { backgroundColor: getColor('rd-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <div className="card-header-sm">
                                <h3 {...cProps('rd-tit', textMain, { color: getColor('rd-tit', textMain), fontSize: '13px' })}>Product Performance Metrics</h3>
                                <div className="kpi-icon-sm" {...cProps('rd-ico', accents[25], { backgroundColor: `${getColor('rd-ico', accents[25])}15`, color: getColor('rd-ico', accents[25]) })}><Target size={14} /></div>
                            </div>
                            <div className="radar-container">
                                <svg viewBox="0 0 100 100" className="mock-radar-chart">
                                    <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke={getColor('g-border', borderColor)} strokeWidth="0.5" />
                                    <polygon points="50,27.5 72.5,38.75 72.5,61.25 50,72.5 27.5,61.25 27.5,38.75" fill="none" stroke={getColor('g-border', borderColor)} strokeWidth="0.5" strokeDasharray="1 1" />
                                    <polygon {...cProps('rd-p1', accents[26], { fill: `${getColor('rd-p1', accents[26])}40`, stroke: getColor('rd-p1', accents[26]) })} points="50,15 85,35 80,65 50,75 20,60 25,30" strokeWidth="1.5" />
                                    <polygon {...cProps('rd-p2', accents[27], { fill: 'none', stroke: getColor('rd-p2', accents[27]) })} points="50,25 75,40 70,60 50,85 30,70 35,45" strokeWidth="1" strokeDasharray="2 2" />
                                </svg>
                            </div>
                            <div className="radar-legend">
                                <div><span {...cProps('rd-leg1', accents[26], { backgroundColor: getColor('rd-leg1', accents[26]) })}></span> <p {...cProps('rd-l1', textMuted, { color: getColor('rd-l1', textMuted) })}>Current</p></div>
                                <div><span {...cProps('rd-leg2', accents[27], { borderColor: getColor('rd-leg2', accents[27]) })} className="legend-target"></span> <p {...cProps('rd-l2', textMuted, { color: getColor('rd-l2', textMuted) })}>Target</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="dash-col-right">

                        {/* 7. Donut Chart */}
                        <div className="dash-card donut-card" {...cProps('dn-bg', bgCard, { backgroundColor: getColor('dn-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <h3 {...cProps('dn-tit', textMain, { color: getColor('dn-tit', textMain), marginBottom: '16px', fontSize: '13px' })}>Task Distribution</h3>
                            <div className="donut-container">
                                
                                {/* 📍 ใช้ SVG วาดกราฟแทน conic-gradient เพื่อให้แต่ละเส้นรับ Event การชี้และคลิกได้ */}
                                <div className="mock-donut">
                                    <svg width="100%" height="100%" viewBox="0 0 42 42" style={{ position: 'absolute', transform: 'rotate(-90deg)', inset: 0 }}>
                                        {[
                                            { id: 'dn-l1', val: 40, offset: 0, a: 28 },
                                            { id: 'dn-l2', val: 25, offset: -40, a: 29 },
                                            { id: 'dn-l3', val: 15, offset: -65, a: 30 },
                                            { id: 'dn-l4', val: 12, offset: -80, a: 31 },
                                            { id: 'dn-l5', val: 8, offset: -92, a: 32 }
                                        ].map(seg => (
                                            <circle
                                                key={seg.id}
                                                cx="21" cy="21" r="15.915494309189533"
                                                fill="transparent"
                                                strokeWidth="8"
                                                strokeDasharray={`${seg.val} 100`}
                                                strokeDashoffset={seg.offset}
                                                {...cProps(seg.id, accents[seg.a], { stroke: getColor(seg.id, accents[seg.a]) })}
                                            />
                                        ))}
                                    </svg>

                                    {/* 📍 วงกลมตรงกลางทับเส้น SVG เพื่อให้ดูเป็นโดนัท */}
                                    <div className="donut-inner" {...cProps('dn-in', bgCard, { backgroundColor: getColor('dn-in', bgCard), position: 'relative', zIndex: 10 })}>
                                        <h2 {...cProps('dn-val', textMain, { color: getColor('dn-val', textMain) })}>320</h2>
                                        <p {...cProps('dn-lbl', textMuted, { color: getColor('dn-lbl', textMuted) })}>TOTAL TASKS</p>
                                    </div>
                                </div>

                                <div className="donut-legend">
                                    {[ 
                                        { id: 'dn-l1', t: 'Dev', a: 28 }, 
                                        { id: 'dn-l2', t: 'Design', a: 29 }, 
                                        { id: 'dn-l3', t: 'QA', a: 30 },
                                        { id: 'dn-l4', t: 'Marketing', a: 31 },
                                        { id: 'dn-l5', t: 'Sales', a: 32 }
                                    ].map(d => (
                                        <div key={d.id}>
                                            <span {...cProps(d.id, accents[d.a], { backgroundColor: getColor(d.id, accents[d.a]) })}></span>
                                            <p {...cProps(`${d.id}-t`, textMuted, { color: getColor(`${d.id}-t`, textMuted) })}>{d.t}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 8. Growth Bar Chart */}
                        <div className="dash-card growth-card" {...cProps('gr-bg', bgCard, { backgroundColor: getColor('gr-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <h3 {...cProps('gr-tit', textMain, { color: getColor('gr-tit', textMain), marginBottom: '16px', fontSize: '13px' })}>Weekly Growth</h3>
                            <div className="mock-bar-chart">
                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                                    <div key={day} className="bar-col">
                                        <div className="bar-wrapper">
                                            <div className="bar-fill" {...cProps(`gr-b-${i}`, i === 3 ? accents[33] : neutral[2], { height: barHeights[i], backgroundColor: getColor(`gr-b-${i}`, i === 3 ? accents[33] : neutral[2]) })}></div>
                                        </div>
                                        <span {...cProps(`gr-t-${i}`, textMuted, { color: getColor(`gr-t-${i}`, textMuted) })}>{day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 9. Activity Feed */}
                        <div className="dash-card activity-card" {...cProps('act-bg', bgCard, { backgroundColor: getColor('act-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <h3 {...cProps('act-tit', textMain, { color: getColor('act-tit', textMain), marginBottom: '16px', fontSize: '13px' })}>Activity Feed</h3>
                            <div className="activity-list">
                                {activities.map(act => (
                                    <div key={act.id} className="act-item">
                                        <div className="act-icon" {...cProps(`${act.id}-ico`, accents[act.acc], { backgroundColor: `${getColor(`${act.id}-ico`, accents[act.acc])}20`, color: getColor(`${act.id}-ico`, accents[act.acc]) })}>
                                            <act.icon size={14} />
                                        </div>
                                        <div className="act-text">
                                            <p {...cProps(`${act.id}-t1`, textMain, { color: getColor(`${act.id}-t1`, textMain) })}><strong>{act.title}</strong> {act.action}</p>
                                            <span {...cProps(`${act.id}-t2`, textMuted, { color: getColor(`${act.id}-t2`, textMuted) })}>{act.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 10. Storage Usage */}
                        <div className="dash-card storage-card" {...cProps('st-bg', bgCard, { backgroundColor: getColor('st-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <div className="card-header-sm">
                                <h3 {...cProps('st-tit', textMain, { color: getColor('st-tit', textMain), fontSize: '13px' })}>Storage Usage</h3>
                                <div className="kpi-icon-sm" {...cProps('st-ico', accents[37], { backgroundColor: `${getColor('st-ico', accents[37])}15`, color: getColor('st-ico', accents[37]) })}><HardDrive size={14} /></div>
                            </div>

                            <div className="gauge-container">
                                <svg viewBox="0 0 100 50" className="mock-gauge-chart">
                                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={getColor('g-border', neutral[2])} strokeWidth="12" strokeLinecap="round" />
                                    <path {...cProps('st-path', accents[38], { stroke: getColor('st-path', accents[38]) })} d="M 10 50 A 40 40 0 0 1 90 50" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="30" />
                                </svg>
                                <div className="gauge-center-text">
                                    <h2 {...cProps('st-v1', textMain, { color: getColor('st-v1', textMain) })}>75%</h2>
                                    <p {...cProps('st-v2', textMuted, { color: getColor('st-v2', textMuted) })}>Used of 1TB</p>
                                </div>
                            </div>

                            <div className="storage-details">
                                <div className="storage-item">
                                    <span className="dot" {...cProps('st-d1', accents[38], { backgroundColor: getColor('st-d1', accents[38]) })}></span>
                                    <span {...cProps('st-l1', textMuted, { color: getColor('st-l1', textMuted) })}>Documents</span>
                                    <strong {...cProps('st-b1', textMain, { color: getColor('st-b1', textMain) })}>450 GB</strong>
                                </div>
                                <div className="storage-item">
                                    <span className="dot" {...cProps('st-d2', neutral[3], { backgroundColor: getColor('st-d2', neutral[3]) })}></span>
                                    <span {...cProps('st-l2', textMuted, { color: getColor('st-l2', textMuted) })}>Free Space</span>
                                    <strong {...cProps('st-b2', textMain, { color: getColor('st-b2', textMain) })}>250 GB</strong>
                                </div>
                            </div>
                        </div>

                        {/* 11. Quick Actions */}
                        <div className="dash-card quick-card" {...cProps('qa-bg', bgCard, { backgroundColor: getColor('qa-bg', bgCard), borderColor: getColor('g-border', borderColor) })}>
                            <h3 {...cProps('qa-tit', textMain, { color: getColor('qa-tit', textMain), marginBottom: '12px', fontSize: '13px' })}>Quick Actions</h3>
                            <div className="quick-actions-grid">
                                {quickActions.map(qa => (
                                    <button key={qa.id} {...cProps(qa.id, bgApp, { backgroundColor: getColor(qa.id, bgApp), color: getColor(`${qa.id}-t`, textMain) })}>
                                        <qa.icon size={16} /> <span {...cProps(`${qa.id}-txt`, textMain, { color: getColor(`${qa.id}-txt`, textMain) })}>{qa.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewDashboard;