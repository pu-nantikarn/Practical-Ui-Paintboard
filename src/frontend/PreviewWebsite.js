// ไฟล์: src/frontend/PreviewWebsite.js
import React, { useContext, useMemo, useState, useEffect, useRef } from 'react';
import {
    Search, User, Heart, ShoppingCart, Grid, List,
    ChevronLeft, ChevronRight, ArrowRight, Truck,
    Package, Wrench, PieChart, PenTool, ClipboardList,
    LayoutGrid, LampDesk, Sofa, Shuffle
} from 'lucide-react';
import './PreviewWebsite.css';
import { ColorContext } from '../contexts/ColorContext';
import heroImage from '../img/dining-table.png';
import product1 from '../img/chair.png';
import product2 from '../img/art.png';
import product3 from '../img/lamp.png';
import cartproduct1 from '../img/sofa.png';
import cartproduct2 from '../img/table.png';
import cartproduct3 from '../img/stool.png';

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

const PreviewWebsite = ({ mode = 'Generate' }) => {
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
    while (sColors.length < 4) {
        sColors.push(pColor);
    }
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
    const bgSection = neutral[1];
    const textMain = neutral[9];
    const textMuted = neutral[5];
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
            const maxAttempts = 5; 

            do {
                nextColor = colorPool[Math.floor(Math.random() * colorPool.length) + dummySeed];
                attempts++;
            } while (
                (nextColor === lastColor || nextColor === secondLastColor) 
                && attempts < maxAttempts
            );

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
                title={color.toUpperCase()}
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
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = neutral[2]}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = bgCard}
            >
                <Shuffle size={16} /> Shuffle
            </button>

            {/* =========================================================
                ✨ WEBSITE AREA (ALL ELEMENTS INDIVIDUALLY BINDED)
            ========================================================= */}
            <div className="preview-website" {...cProps('pw-bgApp', bgApp, { backgroundColor: getColor('pw-bgApp', bgApp), color: getColor('pw-textMain', textMain), position: 'relative' })}>
                
                {/* 📍 Header */}
                <header className="pw-header" {...cProps('pw-header-brd', borderColor, { borderBottom: `1px solid ${getColor('pw-header-brd', borderColor)}` })}>
                    <div className="pw-logo">
                        <div className="pw-logo-icon" {...cProps('pw-logo-icon', accents[0], { backgroundColor: getColor('pw-logo-icon', accents[0]) })}></div>
                        <span {...cProps('pw-logo-txt', textMain, { color: getColor('pw-logo-txt', textMain), fontWeight: 'bold' })}>UIPREVIEW</span>
                    </div>

                    <div className="pw-search" {...cProps('pw-search-bg', bgSection, { backgroundColor: getColor('pw-search-bg', bgSection), borderColor: getColor('pw-search-brd', borderColor) })}>
                        <Search size={16} color={getColor('pw-search-ico', textMuted)} {...cProps('pw-search-ico', textMuted)} />
                        <span {...cProps('pw-search-txt', textMain, { color: getColor('pw-search-txt', textMain) })}>Search for products...</span>
                    </div>

                    <div className="pw-nav-links" {...cProps('pw-nav-grp', textMain, { color: getColor('pw-nav-grp', textMain) })}>
                        <span {...cProps('pw-nav-1', textMain, { fontWeight: '600', color: getColor('pw-nav-1', textMain) })}>Deals</span>
                        <span {...cProps('pw-nav-2', textMain, { color: getColor('pw-nav-2', textMain) })}>New Arrivals</span>
                        <span {...cProps('pw-nav-3', textMain, { color: getColor('pw-nav-3', textMain) })}>Best Sellers</span>
                    </div>

                    <div className="pw-actions">
                        <div {...cProps('pw-act-usr', textMain, { color: getColor('pw-act-usr', textMain) })}><User size={20} /></div>
                        <div {...cProps('pw-act-hrt', textMain, { color: getColor('pw-act-hrt', textMain) })}><Heart size={20} /></div>
                        <div className="pw-cart-icon">
                            <div {...cProps('pw-act-cart', textMain, { color: getColor('pw-act-cart', textMain) })}><ShoppingCart size={20} /></div>
                            <span className="pw-badge" {...cProps('pw-cart-bdg', accents[1], { backgroundColor: getColor('pw-cart-bdg', accents[1]), color: getColor('pw-cart-bdg-txt', '#fff') })}>3</span>
                        </div>
                        <div className="pw-avatar" {...cProps('pw-avatar', neutral[3], { backgroundColor: getColor('pw-avatar', neutral[3]) })}></div>
                    </div>
                </header>

                <div className="pw-layout">
                    {/* 📍 Sidebar (Categories & Filters) */}
                    <aside className="pw-sidebar">
                        <h4 {...cProps('pw-cat-tit', textMuted, { color: getColor('pw-cat-tit', textMuted) })}>CATEGORIES</h4>
                        <ul className="pw-category-list">
                            <li {...cProps('pw-cat-l1-bg', accents[2], { backgroundColor: `${getColor('pw-cat-l1-bg', accents[2])}15`, color: getColor('pw-cat-l1-txt', accents[2]), fontWeight: '600' })}>
                                <LayoutGrid size={16} /> All Products
                            </li>
                            <li {...cProps('pw-cat-l2', textMain, { color: getColor('pw-cat-l2', textMain) })}><Sofa size={16} /> Furniture</li>
                            <li {...cProps('pw-cat-l3', textMain, { color: getColor('pw-cat-l3', textMain) })}><PenTool size={16} /> Art & Decor</li>
                            <li {...cProps('pw-cat-l4', textMain, { color: getColor('pw-cat-l4', textMain) })}><LampDesk size={16} /> Lighting</li>
                        </ul>

                        <div className="pw-filters" {...cProps('pw-filt-brd', borderColor, { borderTop: `1px solid ${getColor('pw-filt-brd', borderColor)}` })}>
                            <div className="pw-filter-head">
                                <h4 {...cProps('pw-filt-h4', textMain, { color: getColor('pw-filt-h4', textMain) })}>Filters</h4>
                                <span {...cProps('pw-filt-clr', textMuted, { color: getColor('pw-filt-clr', textMuted) })}>CLEAR ALL</span>
                            </div>

                            <div className="pw-filter-group">
                                <h5 {...cProps('pw-filt-t1', textMain, { color: getColor('pw-filt-t1', textMain) })}>Price Range</h5>
                                <div className="pw-slider-track" {...cProps('pw-slide-trk', borderColor, { backgroundColor: getColor('pw-slide-trk', borderColor) })}>
                                    <div className="pw-slider-fill" {...cProps('pw-slide-fill', accents[3], { backgroundColor: getColor('pw-slide-fill', accents[3]), width: '60%', left: '20%' })}></div>
                                    <div className="pw-slider-thumb" {...cProps('pw-slide-th1', accents[3], { borderColor: getColor('pw-slide-th1', accents[3]), left: '20%', backgroundColor: getColor('pwApp', bgApp) })}></div>
                                    <div className="pw-slider-thumb" {...cProps('pw-slide-th2', accents[3], { borderColor: getColor('pw-slide-th2', accents[3]), left: '80%', backgroundColor: getColor('pwApp', bgApp) })}></div>
                                </div>
                                <div className="pw-slider-labels" {...cProps('pw-slide-lbl', textMuted, { color: getColor('pw-slide-lbl', textMuted) })}>
                                    <span>$10</span><span>$500</span>
                                </div>
                            </div>

                            <div className="pw-filter-group">
                                <h5 {...cProps('pw-filt-t2', textMain, { color: getColor('pw-filt-t2', textMain) })}>Age Range</h5>
                                <label {...cProps('pw-age-1', textMain, { color: getColor('pw-age-1', textMain) })}><input type="radio" name="age" readOnly /> 0-2 Years</label>
                                <label {...cProps('pw-age-2', accents[4], { color: getColor('pw-age-2', accents[4]) })}><input type="radio" name="age" readOnly checked /> 3-5 Years</label>
                                <label {...cProps('pw-age-3', textMain, { color: getColor('pw-age-3', textMain) })}><input type="radio" name="age" readOnly /> 6+ Years</label>
                            </div>

                            <div className="pw-filter-group">
                                <h5 {...cProps('pw-filt-t3', textMain, { color: getColor('pw-filt-t3', textMain) })}>Special Features</h5>
                                <label {...cProps('pw-feat-1', textMain, { color: getColor('pw-feat-1', textMain) })}><input type="checkbox" readOnly /> Eco-friendly</label>
                                <label {...cProps('pw-feat-2', textMain, { color: getColor('pw-feat-2', textMain) })}><input type="checkbox" readOnly /> Handmade</label>
                                <label {...cProps('pw-feat-3', textMain, { color: getColor('pw-feat-3', textMain) })}><input type="checkbox" readOnly /> Battery-free</label>
                            </div>
                        </div>

                        <div className="pw-promo-box" {...cProps('pw-promo-bg', accents[5], { backgroundColor: `${getColor('pw-promo-bg', accents[5])}15` })}>
                            <h4 {...cProps('pw-promo-t1', textMain, { color: getColor('pw-promo-t1', textMain) })}>Pro Experimenter</h4>
                            <p {...cProps('pw-promo-t2', textMuted, { color: getColor('pw-promo-t2', textMuted) })}>Unlock advanced color mapping and AR visualization tools.</p>
                            <button {...cProps('pw-promo-btn', neutral[9], { backgroundColor: getColor('pw-promo-btn', neutral[9]), color: getColor('pw-promo-btn-txt', bgApp) })}>Upgrade Now</button>
                        </div>
                    </aside>

                    <main className="pw-main">
                        {/* 📍 Hero Section */}
                        <div className="pw-hero" {...cProps('pw-hero-bg', neutral[9], { backgroundColor: getColor('pw-hero-bg', neutral[9]) })}>
                            <div className="pw-hero-content" >
                                <span className="pw-hero-badge" {...cProps('pw-hero-bdg', accents[6], { backgroundColor: getColor('pw-hero-bdg', accents[6]), color: getColor('pw-hero-bdg-txt', '#fff') })}>FEATURED COLLECTION</span>
                                <h1 {...cProps('pw-hero-h1', accents[7], { color: getColor('pw-hero-h1', accents[7]) })}>The Vibrant Living Series</h1>
                                <p {...cProps('pw-hero-p', neutral[4], { color: getColor('pw-hero-p', neutral[4]) })}>Explore how modern colors transform living spaces.</p>
                                <div className="pw-hero-btns">
                                    <button {...cProps('pw-hero-b1', accents[8], { backgroundColor: getColor('pw-hero-b1', accents[8]), color: getColor('pw-hero-b1-txt', '#fff') })}>Shop The Look</button>
                                    <button {...cProps('pw-hero-b2', neutral[5], { borderColor: getColor('pw-hero-b2', neutral[5]), color: getColor('pw-hero-b2-txt', '#fff'), backgroundColor: 'transparent' })}>Learn More</button>
                                </div>
                            </div>
                            <div className="pw-hero-image" {...cProps('pw-hero-img-bg', accents[9], { backgroundColor: getColor('pw-hero-img-bg', accents[9]) })}>
                                <img src={heroImage} alt="Featured Sofa" className="pw-hero-product-img" />
                            </div>
                        </div>

                        {/* 📍 Tabs */}
                        <div className="pw-tabs-header">
                            <div className="pw-tabs">
                                <button className="active" {...cProps('pw-tab1', neutral[9], { backgroundColor: getColor('pw-tab1', neutral[9]), color: getColor('pw-tab1-txt', bgApp) })}>Newest</button>
                                <button {...cProps('pw-tab2', textMuted, { color: getColor('pw-tab2', textMuted), backgroundColor: 'transparent' })}>Trending</button>
                                <button {...cProps('pw-tab3', textMuted, { color: getColor('pw-tab3', textMuted), backgroundColor: 'transparent' })}>Best Rated</button>
                                <button {...cProps('pw-tab4', textMuted, { color: getColor('pw-tab4', textMuted), backgroundColor: 'transparent' })}>Price</button>
                            </div>
                            <div className="pw-view-toggles">
                                <span {...cProps('pw-view-t', textMuted, { color: getColor('pw-view-t', textMuted) })}>View:</span>
                                <div {...cProps('pw-view-i1', accents[10], { color: getColor('pw-view-i1', accents[10]) })}><Grid size={16} /></div>
                                <div {...cProps('pw-view-i2', textMuted, { color: getColor('pw-view-i2', textMuted) })}><List size={16} /></div>
                            </div>
                        </div>

                        {/* 📍 Product Grid */}
                        <div className="pw-product-grid">
                            {/* Product 1 */}
                            <div className="pw-product-card" {...cProps('pw-p1-card', borderColor, { borderColor: getColor('pw-p1-card', borderColor) })}>
                                <div className="pw-product-img" {...cProps('pw-p1-img', bgSection, { backgroundColor: getColor('pw-p1-img', bgSection) })}>
                                    <span className="pw-card-badge" {...cProps('pw-p1-bdg', accents[11], { backgroundColor: getColor('pw-p1-bdg', accents[11]), color: '#fff' })}>NEW ARRIVAL</span>
                                    <div className="pw-heart-btn" {...cProps('pw-p1-hrt-bg', accents[12], { backgroundColor: `${getColor('pw-p1-hrt-bg', accents[12])}20`, color: getColor('pw-p1-hrt-txt', accents[12]) })}><Heart size={14} /></div>
                                    <img src={product1} alt="Nordic Lounge" className="pw-product-real-img" />
                                </div>
                                <div className="pw-product-info">
                                    <p className="pw-p-category" {...cProps('pw-p1-cat', textMuted, { color: getColor('pw-p1-cat', textMuted) })}>COLOR 1 FOCUS <span {...cProps('pw-p1-star', '#F59E0B', { color: getColor('pw-p1-star', '#F59E0B') })}>★ 4.9</span></p>
                                    <h4 {...cProps('pw-p1-tit', textMain, { color: getColor('pw-p1-tit', textMain) })}>Nordic Lounge - Rust Edition</h4>
                                    <div className="pw-p-price-row">
                                        <h3 {...cProps('pw-p1-pri', accents[13], { color: getColor('pw-p1-pri', accents[13]) })}>$299.00</h3>
                                        <button className="pw-add-cart" {...cProps('pw-p1-btn', neutral[9], { backgroundColor: getColor('pw-p1-btn', neutral[9]), color: getColor('pw-p1-btn-txt', bgApp) })}><ShoppingCart size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Product 2 */}
                            <div className="pw-product-card" {...cProps('pw-p2-card', borderColor, { borderColor: getColor('pw-p2-card', borderColor) })}>
                                <div className="pw-product-img" {...cProps('pw-p2-img', bgSection, { backgroundColor: getColor('pw-p2-img', bgSection) })}>
                                    <span className="pw-card-badge" {...cProps('pw-p2-bdg', accents[14], { backgroundColor: getColor('pw-p2-bdg', accents[14]), color: '#fff' })}>20% OFF</span>
                                    <div className="pw-heart-btn" {...cProps('pw-p2-hrt-bg', accents[15], { backgroundColor: `${getColor('pw-p2-hrt-bg', accents[15])}20`, color: getColor('pw-p2-hrt-txt', accents[15]) })}><Heart size={14} /></div>
                                    <img src={product2} alt="Abstract Geometry" className="pw-product-real-img" />
                                </div>
                                <div className="pw-product-info">
                                    <p className="pw-p-category" {...cProps('pw-p2-cat', textMuted, { color: getColor('pw-p2-cat', textMuted) })}>ART SERIES <span {...cProps('pw-p2-star', '#F59E0B', { color: getColor('pw-p2-star', '#F59E0B') })}>★ 4.7</span></p>
                                    <h4 {...cProps('pw-p2-tit', textMain, { color: getColor('pw-p2-tit', textMain) })}>Abstract Geometry 04</h4>
                                    <div className="pw-p-price-row">
                                        <div>
                                            <h3 style={{ display: 'inline-block', marginRight: '5px' }} {...cProps('pw-p2-pri', accents[16], { color: getColor('pw-p2-pri', accents[16]) })}>$89.00</h3>
                                            <span {...cProps('pw-p2-old', textMuted, { color: getColor('pw-p2-old', textMuted), textDecoration: 'line-through', fontSize: '10px' })}>$110.00</span>
                                        </div>
                                        <button className="pw-add-cart" {...cProps('pw-p2-btn', neutral[9], { backgroundColor: getColor('pw-p2-btn', neutral[9]), color: getColor('pw-p2-btn-txt', bgApp) })}><ShoppingCart size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Product 3 */}
                            <div className="pw-product-card" {...cProps('pw-p3-card', borderColor, { borderColor: getColor('pw-p3-card', borderColor) })}>
                                <div className="pw-product-img" {...cProps('pw-p3-img', bgSection, { backgroundColor: getColor('pw-p3-img', bgSection) })}>
                                    <div className="pw-heart-btn" {...cProps('pw-p3-hrt-bg', accents[17], { backgroundColor: `${getColor('pw-p3-hrt-bg', accents[17])}20`, color: getColor('pw-p3-hrt-txt', accents[17]) })}><Heart size={14} /></div>
                                    <img src={product3} alt="Table Lamp" className="pw-product-real-img" />
                                </div>
                                <div className="pw-product-info">
                                    <p className="pw-p-category" {...cProps('pw-p3-cat', textMuted, { color: getColor('pw-p3-cat', textMuted) })}>LIGHTING <span {...cProps('pw-p3-star', '#F59E0B', { color: getColor('pw-p3-star', '#F59E0B') })}>★ 4.5</span></p>
                                    <h4 {...cProps('pw-p3-tit', textMain, { color: getColor('pw-p3-tit', textMain) })}>Golden Eclipse Table Lamp</h4>
                                    <div className="pw-p-price-row">
                                        <h3 {...cProps('pw-p3-pri', accents[18], { color: getColor('pw-p3-pri', accents[18]) })}>$145.00</h3>
                                        <button className="pw-add-cart" {...cProps('pw-p3-btn', neutral[9], { backgroundColor: getColor('pw-p3-btn', neutral[9]), color: getColor('pw-p3-btn-txt', bgApp) })}><ShoppingCart size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Promo Card */}
                            <div className="pw-promo-card" {...cProps('pw-pro-c-bg', accents[19], { backgroundColor: getColor('pw-pro-c-bg', accents[19]) })}>
                                <span className="pw-card-badge-small" {...cProps('pw-pro-bdg', 'rgba(255,255,255,0.2)', { backgroundColor: getColor('pw-pro-bdg', 'rgba(255,255,255,0.2)'), color: '#fff' })}>SPECIAL EDITION</span>
                                <h3 {...cProps('pw-pro-tit', '#fff', { color: getColor('pw-pro-tit', '#fff') })}>Mood Palette</h3>
                                <p {...cProps('pw-pro-sub', 'rgba(255,255,255,0.8)', { color: getColor('pw-pro-sub', 'rgba(255,255,255,0.8)') })}>Discover curated pieces that blend deep tones with vibrant accents.</p>
                                <div className="pw-promo-colors">
                                    <span {...cProps('pw-pro-col1', accents[20], { border: '2px solid #fff', backgroundColor: getColor('pw-pro-col1', accents[20]) })}></span>
                                    <span {...cProps('pw-pro-col2', accents[21], { border: '2px solid #fff', backgroundColor: getColor('pw-pro-col2', accents[21]) })}></span>
                                </div>
                                <button {...cProps('pw-pro-btn', '#fff', { backgroundColor: getColor('pw-pro-btn', '#fff'), color: getColor('pw-pro-btn-txt', accents[19]) })}>Explore Collection <ArrowRight size={14} /></button>
                            </div>

                            {/* Product 4 */}
                            <div className="pw-product-card" {...cProps('pw-p4-card', borderColor, { borderColor: getColor('pw-p4-card', borderColor) })}>
                                <div className="pw-product-img" {...cProps('pw-p4-img', bgSection, { backgroundColor: getColor('pw-p4-img', bgSection) })}>
                                    <span className="pw-card-badge" {...cProps('pw-p4-bdg', accents[22], { backgroundColor: getColor('pw-p4-bdg', accents[22]), color: '#fff' })}>BEST SELLER</span>
                                    <div className="pw-heart-btn" {...cProps('pw-p4-hrt-bg', accents[23], { backgroundColor: `${getColor('pw-p4-hrt-bg', accents[23])}20`, color: getColor('pw-p4-hrt-txt', accents[23]) })}><Heart size={14} /></div>
                                    <img src={cartproduct1} alt="Navy Sofa" className="pw-product-real-img" />
                                </div>
                                <div className="pw-product-info">
                                    <p className="pw-p-category" {...cProps('pw-p4-cat', textMuted, { color: getColor('pw-p4-cat', textMuted) })}>FURNITURE <span {...cProps('pw-p4-star', '#F59E0B', { color: getColor('pw-p4-star', '#F59E0B') })}>★ 4.8</span></p>
                                    <h4 {...cProps('pw-p4-tit', textMain, { color: getColor('pw-p4-tit', textMain) })}>Navy Velvet Sofa</h4>
                                    <div className="pw-p-price-row">
                                        <h3 {...cProps('pw-p4-pri', accents[24], { color: getColor('pw-p4-pri', accents[24]) })}>$299.00</h3>
                                        <button className="pw-add-cart" {...cProps('pw-p4-btn', neutral[9], { backgroundColor: getColor('pw-p4-btn', neutral[9]), color: getColor('pw-p4-btn-txt', bgApp) })}><ShoppingCart size={14} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Product 5 */}
                            <div className="pw-product-card" {...cProps('pw-p5-card', borderColor, { borderColor: getColor('pw-p5-card', borderColor) })}>
                                <div className="pw-product-img" {...cProps('pw-p5-img', bgSection, { backgroundColor: getColor('pw-p5-img', bgSection) })}>
                                    <div className="pw-heart-btn" {...cProps('pw-p5-hrt-bg', accents[25], { backgroundColor: `${getColor('pw-p5-hrt-bg', accents[25])}20`, color: getColor('pw-p5-hrt-txt', accents[25]) })}><Heart size={14} /></div>
                                    <img src={cartproduct2} alt="Wood Table" className="pw-product-real-img" />
                                </div>
                                <div className="pw-product-info">
                                    <p className="pw-p-category" {...cProps('pw-p5-cat', textMuted, { color: getColor('pw-p5-cat', textMuted) })}>DINING <span {...cProps('pw-p5-star', '#F59E0B', { color: getColor('pw-p5-star', '#F59E0B') })}>★ 4.6</span></p>
                                    <h4 {...cProps('pw-p5-tit', textMain, { color: getColor('pw-p5-tit', textMain) })}>Oak Veneer Table</h4>
                                    <div className="pw-p-price-row">
                                        <h3 {...cProps('pw-p5-pri', accents[26], { color: getColor('pw-p5-pri', accents[26]) })}>$349.00</h3>
                                        <button className="pw-add-cart" {...cProps('pw-p5-btn', neutral[9], { backgroundColor: getColor('pw-p5-btn', neutral[9]), color: getColor('pw-p5-btn-txt', bgApp) })}><ShoppingCart size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="pw-pagination">
                            <button {...cProps('pw-pag-prev', textMuted, { color: getColor('pw-pag-prev', textMuted), backgroundColor: 'transparent' })}><ChevronLeft size={16} /></button>
                            <button className="active" {...cProps('pw-pag-1', accents[27], { backgroundColor: getColor('pw-pag-1', accents[27]), color: getColor('pw-pag-1-txt', '#fff') })}>1</button>
                            <button {...cProps('pw-pag-2', textMain, { color: getColor('pw-pag-2', textMain), backgroundColor: 'transparent' })}>2</button>
                            <button {...cProps('pw-pag-3', textMain, { color: getColor('pw-pag-3', textMain), backgroundColor: 'transparent' })}>3</button>
                            <span {...cProps('pw-pag-dot', textMuted, { color: getColor('pw-pag-dot', textMuted) })}>...</span>
                            <button {...cProps('pw-pag-12', textMain, { color: getColor('pw-pag-12', textMain), backgroundColor: 'transparent' })}>12</button>
                            <button {...cProps('pw-pag-nxt', textMain, { color: getColor('pw-pag-nxt', textMain), backgroundColor: 'transparent' })}><ChevronRight size={16} /></button>
                        </div>
                    </main>

                    {/* 📍 Cart Sidebar */}
                    <aside className="pw-cart-sidebar" {...cProps('pw-c-sid-brd', borderColor, { borderLeft: `1px solid ${getColor('pw-c-sid-brd', borderColor)}` })}>
                        <div className="pw-cart-head">
                            <h3 {...cProps('pw-c-h3', textMain, { color: getColor('pw-c-h3', textMain) })}>My Cart</h3>
                            <span className="pw-badge-light" {...cProps('pw-c-bdg-bg', accents[28], { backgroundColor: `${getColor('pw-c-bdg-bg', accents[28])}20`, color: getColor('pw-c-bdg-txt', accents[28]) })}>3 Items</span>
                        </div>

                        <div className="pw-cart-items">
                            {[
                                { id: 1, name: 'Navy Sofa', img: cartproduct1, price: '$299.00' },
                                { id: 2, name: 'Oak Veneer Table', img: cartproduct2, price: '$349.00' },
                                { id: 3, name: 'Wooden Stool', img: cartproduct3, price: '$79.00' }
                            ].map((item, idx) => (
                                <div key={item.id} className="pw-cart-item" {...cProps(`pw-ci-brd-${idx}`, borderColor, { borderBottom: `1px solid ${getColor(`pw-ci-brd-${idx}`, borderColor)}` })}>
                                    <div className="pw-c-img" {...cProps(`pw-ci-imgbg-${idx}`, bgSection, { backgroundColor: getColor(`pw-ci-imgbg-${idx}`, bgSection) })}>
                                        <img src={item.img} alt={item.name} className="pw-cart-real-img" />
                                    </div>

                                    <div className="pw-c-details">
                                        <h5 {...cProps(`pw-ci-tit-${idx}`, textMain, { color: getColor(`pw-ci-tit-${idx}`, textMain) })}>{item.name}</h5>
                                        <div className="pw-c-price-row">
                                            <span {...cProps(`pw-ci-pri-${idx}`, accents[29], { color: getColor(`pw-ci-pri-${idx}`, accents[29]), fontWeight: 'bold' })}>{item.price}</span>
                                            <div className="qty-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <div className="pw-qty" {...cProps(`pw-ci-qty-${idx}`, bgSection, { backgroundColor: getColor(`pw-ci-qty-${idx}`, bgSection), color: getColor(`pw-ci-qtyt-${idx}`, textMain) })}>- 1 +</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pw-cart-summary">
                            <div className="pw-summary-row" {...cProps('pw-cs-sub', textMuted, { color: getColor('pw-cs-sub', textMuted) })}>
                                <span>Subtotal</span>
                                <span {...cProps('pw-cs-sub-v', textMain, { color: getColor('pw-cs-sub-v', textMain) })}>$727.00</span>
                            </div>
                            <div className="pw-summary-row" {...cProps('pw-cs-shp', textMuted, { color: getColor('pw-cs-shp', textMuted) })}>
                                <span>Shipping</span>
                                <span {...cProps('pw-cs-shp-v', '#10B981', { color: getColor('pw-cs-shp-v', '#10B981'), fontWeight: 'bold' })}>FREE</span>
                            </div>
                            <div className="pw-summary-row pw-total" {...cProps('pw-cs-tot-brd', borderColor, { color: getColor('pw-cs-tot-lbl', textMain), borderTop: `1px solid ${getColor('pw-cs-tot-brd', borderColor)}` })}>
                                <h3>Total</h3>
                                <h3 {...cProps('pw-cs-tot-v', accents[30], { color: getColor('pw-cs-tot-v', accents[30]) })}>$727.00</h3>
                            </div>
                            <button className="pw-checkout-btn" {...cProps('pw-cs-btn', accents[31], { backgroundColor: getColor('pw-cs-btn', accents[31]), color: getColor('pw-cs-btn-t', '#fff') })}>
                                Checkout Now <ArrowRight size={16} />
                            </button>
                            <p className="pw-secure-text" {...cProps('pw-cs-sec', textMuted, { color: getColor('pw-cs-sec', textMuted) })}>Secure payment powered by System</p>
                        </div>
                    </aside>
                </div>

                {/* 📍 Services Section */}
                <div className="pw-services-section" {...cProps('pw-svcs-brd', borderColor, { borderTop: `1px solid ${getColor('pw-svcs-brd', borderColor)}` })}>
                    <div className="pw-services-head">
                        <h2 {...cProps('pw-svcs-tit', textMain, { color: getColor('pw-svcs-tit', textMain) })}>Service</h2>
                        <span {...cProps('pw-svcs-lnk', accents[32], { color: getColor('pw-svcs-lnk', accents[32]), fontWeight: 'bold' })}>View All Service <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                    </div>
                    <div className="pw-services-grid">
                        {[
                            { title: 'Delivery', icon: <Truck /> },
                            { title: 'Track Your Order', icon: <Package /> },
                            { title: 'Assembly Service', icon: <Wrench /> },
                            { title: 'Finance Option', icon: <PieChart /> },
                            { title: 'Interior Design', icon: <PenTool /> },
                            { title: 'Planning Support', icon: <ClipboardList /> },
                        ].map((svc, idx) => (
                            <div key={idx} className="pw-svc-card" {...cProps(`pw-svc-bg-${idx}`, accents[33 + idx], { backgroundColor: `${getColor(`pw-svc-bg-${idx}`, accents[33 + idx])}15` })}>
                                <div {...cProps(`pw-svc-ico-${idx}`, accents[33 + idx], { color: getColor(`pw-svc-ico-${idx}`, accents[33 + idx]), marginBottom: '16px' })}>
                                    {React.cloneElement(svc.icon, { size: 40 })}
                                </div>
                                <span className="pw-svc-badge" {...cProps(`pw-svc-bdg-${idx}`, accents[33 + idx], { backgroundColor: getColor(`pw-svc-bdg-${idx}`, accents[33 + idx]), color: getColor(`pw-svc-bdgt-${idx}`, '#fff') })}>
                                    {svc.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewWebsite;