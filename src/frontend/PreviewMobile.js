// ไฟล์: src/frontend/PreviewMobile.js
import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import {
    Bell, Wallet, TrendingUp, ArrowRightLeft, Receipt,
    ScanLine, SmartphoneNfc, WalletCards, ChevronRight,
    Plus, Home, CreditCard, BarChart2, User, Plane, Shuffle
} from 'lucide-react';
import './PreviewMobile.css';
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

const PreviewMobile = ({ mode = 'Generate' }) => {
    const [shuffleSeed, setShuffleSeed] = useState(0);
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    // 📍 Interaction Engine States
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

    const bgApp = neutral[0];
    const bgCard = neutral[0];
    const textMain = neutral[10];
    const textMuted = neutral[6];
    const borderColor = neutral[2];

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
        let lastColor = null;       
        let secondLastColor = null; 

        for (let i = 0; i < 50; i++) {
            let nextColor;
            let attempts = 0;
            do {
                nextColor = colorPool[Math.floor(Math.random() * colorPool.length) + dummySeed];
                attempts++;
            } while ((nextColor === lastColor || nextColor === secondLastColor) && attempts < 5);
            randomColors.push(nextColor);
            secondLastColor = lastColor;
            lastColor = nextColor;
        }
        return randomColors;
    }, [pColor, sColorsString, shuffleSeed]);

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
            >
                {isCurrent && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor }}></div>}
            </div>
        );
    };

    const quickActions = [
        { name: 'Transfer', icon: ArrowRightLeft, acc: 2 },
        { name: 'Pay Bills', icon: Receipt, acc: 3 },
        { name: 'Scan QR', icon: ScanLine, acc: 4 },
        { name: 'Cards', icon: WalletCards, acc: 5 },
        { name: 'Top-up', icon: SmartphoneNfc, acc: 6 }
    ];

    const spendingData = [
        { day: 'MON', val: 30 }, { day: 'TUE', val: 50 },
        { day: 'WED', val: 100, active: true }, { day: 'THU', val: 40 },
        { day: 'FRI', val: 35 }, { day: 'SAT', val: 60 }, { day: 'SUN', val: 25 }
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

            <button
                onClick={() => { setShuffleSeed(prev => prev + 1); setOverrides({}); }}
                style={{
                    position: 'absolute', top: '8px', left: '24px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: bgCard, color: textMain,
                    border: `1px solid ${borderColor}`, borderRadius: '24px',
                    padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', zIndex: 100, transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                <Shuffle size={16} /> Shuffle
            </button>

            {/* =========================================================
                ✨ MOBILE AREA
            ========================================================= */}
            <div className="preview-mobile-wrapper" style={{ position: 'relative' }}>
                <div className="mobile-phone-frame" {...cProps('pm-bgApp', bgApp, { backgroundColor: getColor('pm-bgApp', bgApp), borderColor: '#333' })}>
                    <div className="pm-scroll-container">

                        <header className="pm-header">
                            <div className="pm-user-info">
                                <div className="pm-avatar" {...cProps('pm-ava-bg', neutral[2], { backgroundColor: getColor('pm-ava-bg', neutral[2]) })}>
                                    <User size={12} color={getColor('pm-ava-ico', textMain)} {...cProps('pm-ava-ico', textMain)} />
                                </div>
                                <div className="pm-welcome">
                                    <span {...cProps('pm-wel-1', textMuted, { color: getColor('pm-wel-1', textMuted), fontSize: '8px' })}>Good morning,</span>
                                    <span {...cProps('pm-wel-2', textMain, { fontWeight: 'bold', fontSize: '11px', color: getColor('pm-wel-2', textMain) })}>Alex Johnson</span>
                                </div>
                            </div>
                            <div className="pm-bell-icon" {...cProps('pm-bell', textMain, { color: getColor('pm-bell', textMain) })}>
                                <Bell size={14} />
                                <span className="pm-bell-dot" style={{ backgroundColor: '#EF4444' }}></span>
                            </div>
                        </header>

                        <div className="pm-balance-card" {...cProps('pm-bal-bg', accents[0], { background: `linear-gradient(135deg, ${getColor('pm-bal-bg', accents[0])}, ${getColor('pm-bal-bg2', accents[1])}dd)` })}>
                            <div className="pm-card-top">
                                <div className="pm-balance-texts">
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px' }}>Total Balance</span>
                                    <h2 style={{ color: '#fff', margin: '2px 0 6px', fontSize: '22px', fontWeight: 'bold' }}>$12,450.80</h2>
                                    <div className="pm-trend-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                        <TrendingUp size={8} color="#fff" strokeWidth={3} />
                                        <span style={{ color: '#fff', fontSize: '7px' }}>+2.4% this month</span>
                                    </div>
                                </div>
                                <div className="pm-wallet-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                                    <Wallet size={14} color="#fff" />
                                </div>
                            </div>
                            <div className="pm-card-bottom">
                                <div className="pm-savings-info">
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '7px', fontWeight: 'bold' }}>PRIMARY SAVINGS</span>
                                    <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>**** **** 4290</span>
                                </div>
                                <button className="pm-view-btn" {...cProps('pm-view-btn', accents[0], { color: getColor('pm-view-btn', accents[0]) })}>View Details</button>
                            </div>
                        </div>

                        <div className="pm-quick-actions">
                            {quickActions.map(action => (
                                <div key={action.name} className="pm-quick-action-item">
                                    <div className="pm-quick-icon-box" {...cProps(`pm-qi-bg-${action.name}`, neutral[1], { backgroundColor: getColor(`pm-qi-bg-${action.name}`, neutral[1]) })}>
                                        <action.icon size={14} {...cProps(`pm-qi-ico-${action.name}`, accents[action.acc], { color: getColor(`pm-qi-ico-${action.name}`, accents[action.acc]) })} />
                                    </div>
                                    <span {...cProps(`pm-qi-txt-${action.name}`, textMain, { color: getColor(`pm-qi-txt-${action.name}`, textMain), fontSize: '7px', fontWeight: '600', marginTop: '4px' })}>{action.name}</span>
                                </div>
                            ))}
                        </div>

                        <section className="pm-section pm-favorites-section">
                            <div className="pm-section-head">
                                <h4 {...cProps('pm-fav-tit', textMain, { color: getColor('pm-fav-tit', textMain), fontSize: '10px', fontWeight: 'bold' })}>Favorite</h4>
                                <div {...cProps('pm-fav-all', textMuted, { display: 'flex', alignItems: 'center', gap: '2px', color: getColor('pm-fav-all', textMuted) })}>
                                    <span style={{ fontSize: '7px' }}>All</span>
                                    <ChevronRight size={10} />
                                </div>
                            </div>
                            <div className="pm-favorites-list">
                                {['Daung', 'Qin', 'Jaemy', 'Pae'].map((fav, i) => (
                                    <div key={fav} className="pm-favorite-item">
                                        <div className="pm-fav-avatar" {...cProps(`pm-fav-ava-${i}`, accents[8], { backgroundColor: getColor(`pm-fav-ava-${i}`, accents[8]) })}>
                                            <User size={12} color="#fff" />
                                        </div>
                                        <span {...cProps(`pm-fav-txt-${i}`, textMain, { color: getColor(`pm-fav-txt-${i}`, textMain), fontSize: '7px' })}>{fav}</span>
                                    </div>
                                ))}
                                <div className="pm-favorite-item">
                                    <div className="pm-fav-avatar pm-fav-add" {...cProps('pm-fav-plus', accents[7], { backgroundColor: getColor('pm-fav-plus', accents[7]) })}>
                                        <Plus size={12} color="#fff" strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pm-section">
                            <div className="pm-spending-card" {...cProps('pm-sp-bg', bgCard, { borderColor: getColor('pm-sp-brd', borderColor), backgroundColor: getColor('pm-sp-bg', bgCard) })}>
                                <div className="pm-section-head">
                                    <h4 {...cProps('pm-sp-tit', textMain, { color: getColor('pm-sp-tit', textMain), fontSize: '10px', fontWeight: 'bold' })}>Weekly Spending</h4>
                                    <span {...cProps('pm-sp-det', accents[9], { color: getColor('pm-sp-det', accents[9]), fontSize: '8px', fontWeight: 'bold' })}>Details</span>
                                </div>
                                <div className="pm-chart-area">
                                    <div className="pm-bars-container">
                                        {spendingData.map((d, idx) => (
                                            <div key={d.day} className="pm-bar-wrapper">
                                                {d.active && <span className="pm-bar-tooltip" {...cProps('pm-sp-tool', accents[10], { color: getColor('pm-sp-tool', accents[10]) })}>Today</span>}
                                                <div className="pm-bar" {...cProps(`pm-bar-${idx}`, d.active ? accents[10] : neutral[2], {
                                                    height: `${d.val}%`,
                                                    backgroundColor: getColor(`pm-bar-${idx}`, d.active ? accents[10] : neutral[2])
                                                })}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pm-x-axis" {...cProps('pm-x-axis', textMuted, { color: getColor('pm-x-axis', textMuted) })}>
                                        {spendingData.map(d => <span key={d.day}>{d.day}</span>)}
                                    </div>
                                </div>
                                <div className="pm-chart-chips">
                                    <span className="pm-chip active" {...cProps('pm-chip-act', accents[11], { backgroundColor: getColor('pm-chip-act', accents[11]), color: '#fff' })}>All</span>
                                    <span className="pm-chip" {...cProps('pm-chip-1', neutral[1], { backgroundColor: getColor('pm-chip-1', neutral[1]), color: textMuted })}>Food</span>
                                    <span className="pm-chip" {...cProps('pm-chip-2', neutral[1], { backgroundColor: getColor('pm-chip-2', neutral[1]), color: textMuted })}>Travel</span>
                                </div>
                            </div>
                        </section>

                        <section className="pm-section" style={{ marginBottom: '70px' }}>
                            <div className="pm-promo-card" {...cProps('pm-pro-bg', accents[12], { background: `linear-gradient(135deg, ${getColor('pm-pro-bg', accents[12])}, ${getColor('pm-pro-bg2', accents[13])})` })}>
                                <span className="pm-promo-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>SPECIAL OFFER</span>
                                <h3 style={{ color: '#fff', fontSize: '14px', margin: '6px 0 4px' }}>Get 5% Cashback on<br />Travel</h3>
                                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '8px', margin: 0 }}>Book your next trip with GlobalPay.</p>
                                <Plane className="pm-promo-icon" size={40} color="rgba(255,255,255,0.2)" />
                            </div>
                        </section>

                    </div>

                    <nav className="pm-bottom-nav" {...cProps('pm-nav-bg', bgCard, { backgroundColor: getColor('pm-nav-bg', bgCard), borderTop: `1px solid ${getColor('pm-nav-brd', borderColor)}` })}>
                        <div className="pm-nav-item active" {...cProps('pm-nav-i1', accents[14], { color: getColor('pm-nav-i1', accents[14]) })}>
                            <Home size={16} strokeWidth={2.5} />
                            <span>Home</span>
                        </div>
                        <div className="pm-nav-item" {...cProps('pm-nav-i2', textMuted, { color: getColor('pm-nav-i2', textMuted) })}>
                            <CreditCard size={16} strokeWidth={1.5} />
                            <span>Cards</span>
                        </div>

                        <div className="pm-fab-button" {...cProps('pm-fab-bg', accents[15], { backgroundColor: getColor('pm-fab-bg', accents[15]), boxShadow: `0 4px 12px ${getColor('pm-fab-bg', accents[15])}80` })}>
                            <Plus size={20} color="#fff" strokeWidth={3} />
                        </div>

                        <div className="pm-nav-item" {...cProps('pm-nav-i3', textMuted, { color: getColor('pm-nav-i3', textMuted) })}>
                            <BarChart2 size={16} strokeWidth={1.5} />
                            <span>Stats</span>
                        </div>
                        <div className="pm-nav-item" {...cProps('pm-nav-i4', textMuted, { color: getColor('pm-nav-i4', textMuted) })}>
                            <User size={16} strokeWidth={1.5} />
                            <span>Profile</span>
                        </div>
                    </nav>

                </div>
            </div>
        </div>
    );
};

export default PreviewMobile;