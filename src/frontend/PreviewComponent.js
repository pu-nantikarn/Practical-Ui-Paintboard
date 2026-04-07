// ไฟล์: src/frontend/PreviewComponent.js
import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Search, User, Check, ChevronDown, Home, ChevronRight, ChevronLeft, Shuffle } from 'lucide-react';
import './PreviewComponent.css';
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

const PreviewComponent = ({ mode = 'Generate' }) => {
    const [shuffleSeed, setShuffleSeed] = useState(0);
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    // 📍 States สำหรับ Interaction Engine
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
    const borderColor = neutral[2];
    const textMain = neutral[10];
    const textMuted = neutral[5];

    // 📍 สร้างบ่อสุ่มสี + ระบบกระจายสี
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

            <div className="preview-component-wrapper" {...cProps('pc-bgApp', bgApp, { backgroundColor: getColor('pc-bgApp', bgApp), position: 'relative' })}>
                <div className="pc-grid">

                    {/* 1. Button */}
                    <div className="pc-card" {...cProps('pc-c1-brd', borderColor, { borderColor: getColor('pc-c1-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <button className="pc-btn" {...cProps('pc-btn-bg', accents[0], { borderColor: getColor('pc-btn-bg', accents[0]), color: getColor('pc-btn-txt', accents[0]), backgroundColor: `${getColor('pc-btn-bg', accents[0])}15` })}>
                                <Plus size={16} /> Button
                            </button>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c1-f', borderColor, { borderColor: getColor('pc-c1-f', borderColor), color: getColor('pc-c1-ft', textMain) })}>Button</div>
                    </div>

                    {/* 2. Group Profile */}
                    <div className="pc-card" {...cProps('pc-c2-brd', borderColor, { borderColor: getColor('pc-c2-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-group-profile">
                                <div className="pc-avatar" {...cProps('pc-av-1', accents[1], { borderColor: getColor('pc-av-1', accents[1]), color: getColor('pc-av-1', accents[1]) })}>JD</div>
                                <div className="pc-avatar" {...cProps('pc-av-2', accents[2], { borderColor: getColor('pc-av-2', accents[2]), color: getColor('pc-av-2', accents[2]) })}>JD</div>
                                <div className="pc-avatar" {...cProps('pc-av-3', accents[3], { borderColor: getColor('pc-av-3', accents[3]), color: getColor('pc-av-3', accents[3]) })}>JD</div>
                                <div className="pc-avatar pc-avatar-more" {...cProps('pc-av-m', neutral[2], { backgroundColor: getColor('pc-av-m', neutral[2]), color: getColor('pc-av-mt', textMuted), borderColor: '#fff' })}>+4</div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c2-f', borderColor, { borderColor: getColor('pc-c2-f', borderColor), color: getColor('pc-c2-ft', textMain) })}>Group Profile</div>
                    </div>

                    {/* 3. Profile */}
                    <div className="pc-card" {...cProps('pc-c3-brd', borderColor, { borderColor: getColor('pc-c3-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-avatar-single" {...cProps('pc-av-s', accents[4], { borderColor: getColor('pc-av-s', accents[4]), color: getColor('pc-av-s', accents[4]) })}>JD</div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c3-f', borderColor, { borderColor: getColor('pc-c3-f', borderColor), color: getColor('pc-c3-ft', textMain) })}>Profile</div>
                    </div>

                    {/* 4. Icon */}
                    <div className="pc-card" {...cProps('pc-c4-brd', borderColor, { borderColor: getColor('pc-c4-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-icon-group">
                                <div className="pc-icon-btn" {...cProps('pc-ico-1', accents[5], { borderColor: getColor('pc-ico-1', accents[5]), color: getColor('pc-ico-1', accents[5]) })}><Search size={20} /></div>
                                <div className="pc-icon-btn" {...cProps('pc-ico-2', accents[6], { borderColor: getColor('pc-ico-2', accents[6]), color: getColor('pc-ico-2', accents[6]), backgroundColor: `${getColor('pc-ico-2', accents[6])}15` })}><User size={20} /></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c4-f', borderColor, { borderColor: getColor('pc-c4-f', borderColor), color: getColor('pc-c4-ft', textMain) })}>Icon</div>
                    </div>

                    {/* 5. Badge */}
                    <div className="pc-card" {...cProps('pc-c5-brd', borderColor, { borderColor: getColor('pc-c5-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-badge" {...cProps('pc-bdg-bg', accents[7], { borderColor: getColor('pc-bdg-bg', accents[7]), color: getColor('pc-bdg-t', accents[7]), backgroundColor: `${getColor('pc-bdg-bg', accents[7])}15` })}>
                                Badge
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c5-f', borderColor, { borderColor: getColor('pc-c5-f', borderColor), color: getColor('pc-c5-ft', textMain) })}>Badge</div>
                    </div>

                    {/* 6. Radio */}
                    <div className="pc-card" {...cProps('pc-c6-brd', borderColor, { borderColor: getColor('pc-c6-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-radio-group">
                                <div className="pc-radio active" {...cProps('pc-rad-bg', accents[8], { borderColor: getColor('pc-rad-bg', accents[8]) })}>
                                    <div className="pc-radio-inner" {...cProps('pc-rad-in', accents[8], { backgroundColor: getColor('pc-rad-in', accents[8]) })}></div>
                                </div>
                                <div className="pc-radio inactive" {...cProps('pc-rad-ina', borderColor, { borderColor: getColor('pc-rad-ina', borderColor) })}></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c6-f', borderColor, { borderColor: getColor('pc-c6-f', borderColor), color: getColor('pc-c6-ft', textMain) })}>Radio</div>
                    </div>

                    {/* 7. Checkbox */}
                    <div className="pc-card" {...cProps('pc-c7-brd', borderColor, { borderColor: getColor('pc-c7-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-checkbox-group">
                                <div className="pc-check active" {...cProps('pc-chk-bg', accents[9], { backgroundColor: getColor('pc-chk-bg', accents[9]), borderColor: getColor('pc-chk-bg', accents[9]) })}>
                                    <Check size={18} color="#fff" strokeWidth={3} />
                                </div>
                                <div className="pc-check inactive" {...cProps('pc-chk-ina', borderColor, { borderColor: getColor('pc-chk-ina', borderColor) })}></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c7-f', borderColor, { borderColor: getColor('pc-c7-f', borderColor), color: getColor('pc-c7-ft', textMain) })}>Checkbox</div>
                    </div>

                    {/* 8. Toggle */}
                    <div className="pc-card" {...cProps('pc-c8-brd', borderColor, { borderColor: getColor('pc-c8-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ flexDirection: 'column', gap: '16px' }}>
                            <div className="pc-toggle inactive" {...cProps('pc-tog-ina-bg', borderColor, { borderColor: getColor('pc-tog-ina-bg', borderColor) })}>
                                <div className="pc-toggle-knob" {...cProps('pc-tog-ina-k', accents[10], { backgroundColor: getColor('pc-tog-ina-k', accents[10]) })}></div>
                            </div>
                            <div className="pc-toggle active" {...cProps('pc-tog-act-bg', accents[11], { backgroundColor: getColor('pc-tog-act-bg', accents[11]), borderColor: getColor('pc-tog-act-bg', accents[11]) })}>
                                <div className="pc-toggle-knob white" style={{ backgroundColor: '#fff' }}></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c8-f', borderColor, { borderColor: getColor('pc-c8-f', borderColor), color: getColor('pc-c8-ft', textMain) })}>Toggle</div>
                    </div>

                    {/* 9. Slide */}
                    <div className="pc-card" {...cProps('pc-c9-brd', borderColor, { borderColor: getColor('pc-c9-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '0 32px' }}>
                            <div className="pc-slide-track" {...cProps('pc-sli-trk', neutral[2], { backgroundColor: getColor('pc-sli-trk', neutral[2]) })}>
                                <div className="pc-slide-fill" {...cProps('pc-sli-fil', accents[12], { backgroundColor: getColor('pc-sli-fil', accents[12]), width: '70%' })}></div>
                                <div className="pc-slide-thumb" {...cProps('pc-sli-th', accents[13], { borderColor: getColor('pc-sli-th', accents[13]), left: '70%' })}></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c9-f', borderColor, { borderColor: getColor('pc-c9-f', borderColor), color: getColor('pc-c9-ft', textMain) })}>Slide</div>
                    </div>

                    {/* 10. Input Field */}
                    <div className="pc-card" {...cProps('pc-c10-brd', borderColor, { borderColor: getColor('pc-c10-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '0 24px' }}>
                            <div className="pc-input-field" {...cProps('pc-inp-bg', accents[14], { borderColor: getColor('pc-inp-bg', accents[14]), backgroundColor: `${getColor('pc-inp-bg', accents[14])}15` })}>
                                <Search size={14} color={getColor('pc-inp-txt', accents[14])} {...cProps('pc-inp-txt', accents[14])} />
                                <span {...cProps('pc-inp-ph', accents[14], { color: getColor('pc-inp-ph', accents[14]) })}>Type to search...</span>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c10-f', borderColor, { borderColor: getColor('pc-c10-f', borderColor), color: getColor('pc-c10-ft', textMain) })}>Input Field</div>
                    </div>

                    {/* 11. Drop Down */}
                    <div className="pc-card" {...cProps('pc-c11-brd', borderColor, { borderColor: getColor('pc-c11-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '0 24px' }}>
                            <div className="pc-dropdown" {...cProps('pc-drp-bg', accents[15], { borderColor: getColor('pc-drp-bg', accents[15]), backgroundColor: `${getColor('pc-drp-bg', accents[15])}15` })}>
                                <span {...cProps('pc-drp-txt', accents[15], { color: getColor('pc-drp-txt', accents[15]) })}>Drop down</span>
                                <ChevronDown size={16} color={getColor('pc-drp-ico', accents[15])} {...cProps('pc-drp-ico', accents[15])} />
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c11-f', borderColor, { borderColor: getColor('pc-c11-f', borderColor), color: getColor('pc-c11-ft', textMain) })}>Drop Down</div>
                    </div>

                    {/* 12. Text Field */}
                    <div className="pc-card" {...cProps('pc-c12-brd', borderColor, { borderColor: getColor('pc-c12-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '24px', alignItems: 'stretch' }}>
                            <div className="pc-textarea" {...cProps('pc-txa-bg', neutral[1], { borderColor: getColor('pc-txa-brd', borderColor), backgroundColor: getColor('pc-txa-bg', neutral[1]) })}>
                                <span {...cProps('pc-txa-t', textMuted, { color: getColor('pc-txa-t', textMuted) })}>Lorem Ipsum ...</span>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c12-f', borderColor, { borderColor: getColor('pc-c12-f', borderColor), color: getColor('pc-c12-ft', textMain) })}>Text Field</div>
                    </div>

                    {/* 13. Breadcrumb */}
                    <div className="pc-card" {...cProps('pc-c13-brd', borderColor, { borderColor: getColor('pc-c13-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-breadcrumb" {...cProps('pc-brd-bg', accents[16], { backgroundColor: `${getColor('pc-brd-bg', accents[16])}15` })}>
                                <span {...cProps('pc-brd-a1', accents[16], { color: getColor('pc-brd-a1', accents[16]), display: 'flex', alignItems: 'center', gap: '4px' })}>
                                    <Home size={12} /> Home
                                </span>
                                <ChevronRight size={12} color={getColor('pc-brd-i1', textMuted)} {...cProps('pc-brd-i1', textMuted)} />
                                <span {...cProps('pc-brd-a2', textMuted, { color: getColor('pc-brd-a2', textMuted) })}>Project</span>
                                <ChevronRight size={12} color={getColor('pc-brd-i2', textMuted)} {...cProps('pc-brd-i2', textMuted)} />
                                <span {...cProps('pc-brd-a3', textMuted, { color: getColor('pc-brd-a3', textMuted) })}>Settings</span>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c13-f', borderColor, { borderColor: getColor('pc-c13-f', borderColor), color: getColor('pc-c13-ft', textMain) })}>Breadcrumb</div>
                    </div>

                    {/* 14. Segment */}
                    <div className="pc-card" {...cProps('pc-c14-brd', borderColor, { borderColor: getColor('pc-c14-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-segment" {...cProps('pc-seg-bg', neutral[1], { backgroundColor: getColor('pc-seg-bg', neutral[1]) })}>
                                <div className="pc-seg-item active" {...cProps('pc-seg-a', accents[17], { backgroundColor: '#fff', color: getColor('pc-seg-a', accents[17]), boxShadow: '0 2px 4px rgba(0,0,0,0.05)' })}>Overview</div>
                                <div className="pc-seg-item" {...cProps('pc-seg-i1', textMuted, { color: getColor('pc-seg-i1', textMuted) })}>Analytics</div>
                                <div className="pc-seg-item" {...cProps('pc-seg-i2', textMuted, { color: getColor('pc-seg-i2', textMuted) })}>Reports</div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c14-f', borderColor, { borderColor: getColor('pc-c14-f', borderColor), color: getColor('pc-c14-ft', textMain) })}>Segment</div>
                    </div>

                    {/* 15. Tab */}
                    <div className="pc-card" {...cProps('pc-c15-brd', borderColor, { borderColor: getColor('pc-c15-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ alignItems: 'flex-end', paddingBottom: '30px' }}>
                            <div className="pc-tabs" {...cProps('pc-tab-brd', borderColor, { borderBottom: `1px solid ${getColor('pc-tab-brd', borderColor)}`, width: '80%' })}>
                                <div className="pc-tab-item active" {...cProps('pc-tab-a', accents[18], { color: getColor('pc-tab-a', accents[18]), borderBottom: `2px solid ${getColor('pc-tab-a', accents[18])}` })}>Overview</div>
                                <div className="pc-tab-item" {...cProps('pc-tab-i1', textMuted, { color: getColor('pc-tab-i1', textMuted) })}>Analytics</div>
                                <div className="pc-tab-item" {...cProps('pc-tab-i2', textMuted, { color: getColor('pc-tab-i2', textMuted) })}>Reports</div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c15-f', borderColor, { borderColor: getColor('pc-c15-f', borderColor), color: getColor('pc-c15-ft', textMain) })}>Tab</div>
                    </div>

                    {/* 16. Pagination */}
                    <div className="pc-card" {...cProps('pc-c16-brd', borderColor, { borderColor: getColor('pc-c16-brd', borderColor) })}>
                        <div className="pc-card-content">
                            <div className="pc-pagination">
                                <div className="pc-page-item" {...cProps('pc-pag-i1', neutral[1], { backgroundColor: getColor('pc-pag-i1', neutral[1]), color: getColor('pc-pag-t1', textMuted) })}><ChevronLeft size={14} /></div>
                                <div className="pc-page-item active" {...cProps('pc-pag-a', accents[19], { backgroundColor: getColor('pc-pag-a', accents[19]), color: '#fff' })}>1</div>
                                <div className="pc-page-item" {...cProps('pc-pag-i2', neutral[1], { backgroundColor: getColor('pc-pag-i2', neutral[1]), color: getColor('pc-pag-t2', textMain) })}>2</div>
                                <div className="pc-page-item" {...cProps('pc-pag-i3', neutral[1], { backgroundColor: getColor('pc-pag-i3', neutral[1]), color: getColor('pc-pag-t3', textMuted) })}><ChevronRight size={14} /></div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c16-f', borderColor, { borderColor: getColor('pc-c16-f', borderColor), color: getColor('pc-c16-ft', textMain) })}>Pagination</div>
                    </div>

                    {/* 17. Progress */}
                    <div className="pc-card" {...cProps('pc-c17-brd', borderColor, { borderColor: getColor('pc-c17-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '0 32px' }}>
                            <div className="pc-progress-container">
                                <div className="pc-prog-head">
                                    <span {...cProps('pc-pr-lbl', textMuted, { color: getColor('pc-pr-lbl', textMuted), fontSize: '10px', fontWeight: 'bold' })}>UPLOADING</span>
                                    <span {...cProps('pc-pr-v', accents[20], { color: getColor('pc-pr-v', accents[20]), fontSize: '10px', fontWeight: 'bold' })}>65%</span>
                                </div>
                                <div className="pc-prog-track" {...cProps('pc-pr-trk', neutral[2], { backgroundColor: getColor('pc-pr-trk', neutral[2]) })}>
                                    <div className="pc-prog-fill" {...cProps('pc-pr-fil', accents[21], { backgroundColor: getColor('pc-pr-fil', accents[21]), width: '65%' })}></div>
                                </div>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c17-f', borderColor, { borderColor: getColor('pc-c17-f', borderColor), color: getColor('pc-c17-ft', textMain) })}>Progress</div>
                    </div>

                    {/* 18. Typography */}
                    <div className="pc-card" {...cProps('pc-c18-brd', borderColor, { borderColor: getColor('pc-c18-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ alignItems: 'flex-start', padding: '24px' }}>
                            <div className="pc-typography">
                                <h3 {...cProps('pc-ty-h3', accents[22], { color: getColor('pc-ty-h3', accents[22]) })}>Heading</h3>
                                <p {...cProps('pc-ty-p', textMuted, { color: getColor('pc-ty-p', textMuted) })}>This is a secondary piece of information used for labels, helper text, and fine print metadata.</p>
                            </div>
                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c18-f', borderColor, { borderColor: getColor('pc-c18-f', borderColor), color: getColor('pc-c18-ft', textMain) })}>Typography</div>
                    </div>

                    {/* 19. Calendar */}
                    <div className="pc-card pc-calendar-card" {...cProps('pc-c19-brd', borderColor, { borderColor: getColor('pc-c19-brd', borderColor) })}>
                        <div className="pc-card-content" style={{ padding: '24px', flexDirection: 'column' }}>

                            <div className="pc-cal-header">
                                <span {...cProps('pc-cal-h', textMain, { color: getColor('pc-cal-h', textMain) })}>October 2024</span>
                                <div className="pc-cal-arrows" {...cProps('pc-cal-arr', textMain, { color: getColor('pc-cal-arr', textMain) })}>
                                    <ChevronLeft size={16} />
                                    <ChevronRight size={16} />
                                </div>
                            </div>

                            <div className="pc-cal-grid">
                                {['S', 'M', 'T', 'W', 'TH', 'F', 'SA'].map((day, idx) => (
                                    <div key={day} className="pc-cal-day" {...cProps(`pc-cal-d-${idx}`, accents[23], { color: getColor(`pc-cal-d-${idx}`, accents[23]) })}>{day}</div>
                                ))}
                                <div className="pc-cal-date muted" {...cProps('pc-cal-m1', neutral[3], { color: getColor('pc-cal-m1', neutral[3]) })}>29</div>
                                <div className="pc-cal-date muted" {...cProps('pc-cal-m2', neutral[3], { color: getColor('pc-cal-m2', neutral[3]) })}>30</div>
                                <div className="pc-cal-date" {...cProps('pc-cal-1', textMain, { color: getColor('pc-cal-1', textMain) })}>1</div>
                                <div className="pc-cal-date" {...cProps('pc-cal-2', textMain, { color: getColor('pc-cal-2', textMain) })}>2</div>
                                <div className="pc-cal-date active" {...cProps('pc-cal-a', accents[24], { backgroundColor: getColor('pc-cal-a', accents[24]), color: '#fff' })}>3</div>
                                <div className="pc-cal-date" {...cProps('pc-cal-4', textMain, { color: getColor('pc-cal-4', textMain) })}>4</div>
                                <div className="pc-cal-date" {...cProps('pc-cal-5', textMain, { color: getColor('pc-cal-5', textMain) })}>5</div>
                            </div>

                        </div>
                        <div className="pc-card-footer" {...cProps('pc-c19-f', borderColor, { borderColor: getColor('pc-c19-f', borderColor), color: getColor('pc-c19-ft', textMain) })}>Calendar</div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PreviewComponent;