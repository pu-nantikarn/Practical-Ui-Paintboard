// ไฟล์: src/frontend/PreviewWebsite.js
import React, { useContext, useMemo } from 'react';
import {
    Search, User, Heart, ShoppingCart, Grid, List,
    ChevronLeft, ChevronRight, ArrowRight, Truck,
    Package, Wrench, PieChart, PenTool, ClipboardList,
    LayoutGrid, LampDesk, Sofa
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
// 🛠️ Color Math Helpers (Same as Dashboard)
// ==========================================
const hexToRgb = (hex) => {
    if (!hex) return { r: 0, g: 0, b: 0 };
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

const PreviewWebsite = ({ mode = 'Generate' }) => {
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    const primaryState = mode === 'Generate' ? genPrimary : imgPrimary;
    const secondaryState = mode === 'Generate' ? genSecondary : imgSecondary;

    const pColor = `#${primaryState.value}`;
    const sColors = secondaryState.map(c => `#${c.value}`);
    while (sColors.length < 4) {
        sColors.push(pColor);
    }

    const neutral = useMemo(() => {
        if (!primaryState || !primaryState.value) {
            return ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#000000'];
        }
        const shades = generateNeutralShades(primaryState.value);
        return shades.map(s => s.startsWith('#') ? s : `#${s}`);
    }, [primaryState]);

    const bgApp = neutral[0];
    const bgSection = neutral[1];
    const textMain = neutral[9];
    const textMuted = neutral[5];
    const borderColor = neutral[2];

    return (
        <div className="preview-website" style={{ backgroundColor: bgApp, color: textMain }}>

            <header className="pw-header" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <div className="pw-logo">
                    <div className="pw-logo-icon" style={{ backgroundColor: pColor }}></div>
                    <span style={{ color: textMain, fontWeight: 'bold' }}>UIPREVIEW</span>
                </div>

                <div className="pw-search" style={{ backgroundColor: bgSection, borderColor: borderColor }}>
                    <Search size={16} color={textMuted} />
                    <input type="text" placeholder="Search for products, brands..." style={{ color: textMain }} />
                </div>

                <div className="pw-nav-links" style={{ color: textMain }}>
                    <span style={{ fontWeight: '600' }}>Deals</span>
                    <span>New Arrivals</span>
                    <span>Best Sellers</span>
                </div>

                <div className="pw-actions">
                    <User size={20} color={textMain} />
                    <Heart size={20} color={textMain} />
                    <div className="pw-cart-icon">
                        <ShoppingCart size={20} color={textMain} />
                        <span className="pw-badge" style={{ backgroundColor: pColor, color: '#fff' }}>3</span>
                    </div>
                    <div className="pw-avatar" style={{ backgroundColor: neutral[3] }}></div>
                </div>
            </header>

            <div className="pw-layout">
                <aside className="pw-sidebar">
                    <h4 style={{ color: textMuted }}>CATEGORIES</h4>
                    <ul className="pw-category-list">
                        <li style={{ backgroundColor: `${pColor}15`, color: pColor, fontWeight: '600' }}>
                            <LayoutGrid size={16} /> All Products
                        </li>
                        <li style={{ color: textMain }}><Sofa size={16} /> Furniture</li>
                        <li style={{ color: textMain }}><PenTool size={16} /> Art & Decor</li>
                        <li style={{ color: textMain }}><LampDesk size={16} /> Lighting</li>
                    </ul>

                    <div className="pw-filters" style={{ borderTop: `1px solid ${borderColor}` }}>
                        <div className="pw-filter-head">
                            <h4 style={{ color: textMain }}>Filters</h4>
                            <span style={{ color: textMuted }}>CLEAR ALL</span>
                        </div>

                        <div className="pw-filter-group">
                            <h5 style={{ color: textMain }}>Price Range</h5>
                            <div className="pw-slider-track" style={{ backgroundColor: borderColor }}>
                                <div className="pw-slider-fill" style={{ backgroundColor: pColor, width: '60%', left: '20%' }}></div>
                                <div className="pw-slider-thumb" style={{ borderColor: pColor, left: '20%', backgroundColor: bgApp }}></div>
                                <div className="pw-slider-thumb" style={{ borderColor: pColor, left: '80%', backgroundColor: bgApp }}></div>
                            </div>
                            <div className="pw-slider-labels" style={{ color: textMuted }}>
                                <span>$10</span><span>$500</span>
                            </div>
                        </div>

                        <div className="pw-filter-group">
                            <h5 style={{ color: textMain }}>Age Range</h5>
                            <label><input type="radio" name="age" /> 0-2 Years</label>
                            <label style={{ color: pColor }}><input type="radio" name="age" defaultChecked /> 3-5 Years</label>
                            <label><input type="radio" name="age" /> 6+ Years</label>
                        </div>

                        <div className="pw-filter-group">
                            <h5 style={{ color: textMain }}>Special Features</h5>
                            <label><input type="checkbox" /> Eco-friendly</label>
                            <label><input type="checkbox" /> Handmade</label>
                            <label><input type="checkbox" /> Battery-free</label>
                        </div>
                    </div>

                    <div className="pw-promo-box" style={{ backgroundColor: `${sColors[0]}15` }}>
                        <h4 style={{ color: textMain }}>Pro Experimenter</h4>
                        <p style={{ color: textMuted }}>Unlock advanced color mapping and AR visualization tools.</p>
                        <button style={{ backgroundColor: neutral[9], color: bgApp }}>Upgrade Now</button>
                    </div>
                </aside>

                <main className="pw-main">
                    <div className="pw-hero" style={{ backgroundColor: neutral[9] }}>
                        <div className="pw-hero-content" >
                            <span className="pw-hero-badge" style={{ backgroundColor: pColor, color: '#fff' }}>FEATURED COLLECTION</span>
                            <h1 style={{ color: sColors[1] || '#fff' }}>The Vibrant Living Series</h1>
                            <p style={{ color: neutral[4] }}>Explore how modern colors transform living spaces.</p>
                            <div className="pw-hero-btns">
                                <button style={{ backgroundColor: pColor, color: '#fff' }}>Shop The Look</button>
                                <button style={{ borderColor: neutral[5], color: '#fff', backgroundColor: 'transparent' }}>Learn More</button>
                            </div>
                        </div>
                        {/* 📍 ปรับเปลี่ยน pw-hero-image: ใช้รูปภาพจริงที่ไม่มีพื้นหลังแทนไอค่อน */}
                        <div className="pw-hero-image" style={{ backgroundColor: pColor }}>
                            <img src={heroImage} alt="Featured Sofa" className="pw-hero-product-img" />
                        </div>
                    </div>

                    <div className="pw-tabs-header">
                        <div className="pw-tabs">
                            <button className="active" style={{ backgroundColor: neutral[9], color: bgApp }}>Newest</button>
                            <button style={{ color: textMuted }}>Trending</button>
                            <button style={{ color: textMuted }}>Best Rated</button>
                            <button style={{ color: textMuted }}>Price</button>
                        </div>
                        <div className="pw-view-toggles">
                            <span style={{ color: textMuted }}>View:</span>
                            <Grid size={16} color={pColor} />
                            <List size={16} color={textMuted} />
                        </div>
                    </div>

                    <div className="pw-product-grid">
                        <div className="pw-product-card" style={{ borderColor: borderColor }}>
                            <div className="pw-product-img" style={{ backgroundColor: bgSection }}>
                                <span className="pw-card-badge" style={{ backgroundColor: sColors[0], color: '#fff' }}>NEW ARRIVAL</span>
                                <div className="pw-heart-btn" style={{ backgroundColor: `${sColors[1]}20`, color: sColors[1] }}><Heart size={14} /></div>
                                <img src={product1} alt="Nordic Lounge" className="pw-product-real-img" />
                            </div>
                            <div className="pw-product-info">
                                <p className="pw-p-category" style={{ color: textMuted }}>COLOR 1 FOCUS <span style={{ color: '#F59E0B' }}>★ 4.9</span></p>
                                <h4 style={{ color: textMain }}>Nordic Lounge - Rust Edition</h4>
                                <div className="pw-p-price-row">
                                    <h3 style={{ color: pColor }}>$299.00</h3>
                                    <button className="pw-add-cart" style={{ backgroundColor: neutral[9], color: bgApp }}><ShoppingCart size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="pw-product-card" style={{ borderColor: borderColor }}>
                            <div className="pw-product-img" style={{ backgroundColor: bgSection }}>
                                <span className="pw-card-badge" style={{ backgroundColor: pColor, color: '#fff' }}>20% OFF</span>
                                <div className="pw-heart-btn" style={{ backgroundColor: `${sColors[1]}20`, color: sColors[1] }}><Heart size={14} /></div>
                                <img src={product2} alt="Abstract Geometry" className="pw-product-real-img" />
                            </div>
                            <div className="pw-product-info">
                                <p className="pw-p-category" style={{ color: textMuted }}>ART SERIES <span style={{ color: '#F59E0B' }}>★ 4.7</span></p>
                                <h4 style={{ color: textMain }}>Abstract Geometry 04</h4>
                                <div className="pw-p-price-row">
                                    <div>
                                        <h3 style={{ color: pColor, display: 'inline-block', marginRight: '5px' }}>$89.00</h3>
                                        <span style={{ color: textMuted, textDecoration: 'line-through', fontSize: '10px' }}>$110.00</span>
                                    </div>
                                    <button className="pw-add-cart" style={{ backgroundColor: neutral[9], color: bgApp }}><ShoppingCart size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="pw-product-card" style={{ borderColor: borderColor }}>
                            <div className="pw-product-img" style={{ backgroundColor: bgSection }}>
                                <div className="pw-heart-btn" style={{ backgroundColor: `${sColors[1]}20`, color: sColors[1] }}><Heart size={14} /></div>
                                <img src={product3} alt="Table Lamp" className="pw-product-real-img" />
                            </div>
                            <div className="pw-product-info">
                                <p className="pw-p-category" style={{ color: textMuted }}>LIGHTING <span style={{ color: '#F59E0B' }}>★ 4.5</span></p>
                                <h4 style={{ color: textMain }}>Golden Eclipse Table Lamp</h4>
                                <div className="pw-p-price-row">
                                    <h3 style={{ color: pColor }}>$145.00</h3>
                                    <button className="pw-add-cart" style={{ backgroundColor: neutral[9], color: bgApp }}><ShoppingCart size={14} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="pw-promo-card" style={{ backgroundColor: sColors[1] || '#8B5CF6' }}>
                            <span className="pw-card-badge-small" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>SPECIAL EDITION</span>
                            <h3 style={{ color: '#fff' }}>Mood Palette</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Discover curated pieces that blend deep tones with vibrant accents.</p>
                            <div className="pw-promo-colors">
                                <span style={{ border: '2px solid #fff', backgroundColor: sColors[1] }}></span>
                                <span style={{ border: '2px solid #fff', backgroundColor: sColors[2] }}></span>
                            </div>
                            <button style={{ backgroundColor: '#fff', color: sColors[1] }}>Explore Collection <ArrowRight size={14} /></button>
                        </div>
                    <div className="pw-product-card" style={{ borderColor: borderColor }}>
                            <div className="pw-product-img" style={{ backgroundColor: bgSection }}>
                                <span className="pw-card-badge" style={{ backgroundColor: sColors[2] || pColor, color: '#fff' }}>BEST SELLER</span>
                                <div className="pw-heart-btn" style={{ backgroundColor: `${sColors[1]}20`, color: sColors[1] }}><Heart size={14} /></div>
                                <img src={cartproduct1} alt="Navy Sofa" className="pw-product-real-img" />
                            </div>
                            <div className="pw-product-info">
                                <p className="pw-p-category" style={{ color: textMuted }}>FURNITURE <span style={{ color: '#F59E0B' }}>★ 4.8</span></p>
                                <h4 style={{ color: textMain }}>Navy Velvet Sofa</h4>
                                <div className="pw-p-price-row">
                                    <h3 style={{ color: pColor }}>$299.00</h3>
                                    <button className="pw-add-cart" style={{ backgroundColor: neutral[9], color: bgApp }}><ShoppingCart size={14} /></button>
                                </div>
                            </div>
                        </div>

                        {/* 📍 เพิ่มสินค้าชิ้นที่ 5 (ด้านข้าง Promo Card ชิ้นขวาสุด) */}
                        <div className="pw-product-card" style={{ borderColor: borderColor }}>
                            <div className="pw-product-img" style={{ backgroundColor: bgSection }}>
                                <div className="pw-heart-btn" style={{ backgroundColor: `${sColors[1]}20`, color: sColors[1] }}><Heart size={14} /></div>
                                <img src={cartproduct2} alt="Wood Table" className="pw-product-real-img" />
                            </div>
                            <div className="pw-product-info">
                                <p className="pw-p-category" style={{ color: textMuted }}>DINING <span style={{ color: '#F59E0B' }}>★ 4.6</span></p>
                                <h4 style={{ color: textMain }}>Oak Veneer Table</h4>
                                <div className="pw-p-price-row">
                                    <h3 style={{ color: pColor }}>$349.00</h3>
                                    <button className="pw-add-cart" style={{ backgroundColor: neutral[9], color: bgApp }}><ShoppingCart size={14} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pw-pagination">
                        <button style={{ color: textMuted }}><ChevronLeft size={16} /></button>
                        <button className="active" style={{ backgroundColor: pColor, color: '#fff' }}>1</button>
                        <button style={{ color: textMain }}>2</button>
                        <button style={{ color: textMain }}>3</button>
                        <span style={{ color: textMuted }}>...</span>
                        <button style={{ color: textMain }}>12</button>
                        <button style={{ color: textMain }}><ChevronRight size={16} /></button>
                    </div>
                </main>

                <aside className="pw-cart-sidebar" style={{ borderLeft: `1px solid ${borderColor}` }}>
                    <div className="pw-cart-head">
                        <h3 style={{ color: textMain }}>My Cart</h3>
                        <span className="pw-badge-light" style={{ backgroundColor: `${pColor}20`, color: pColor }}>3 Items</span>
                    </div>

                    <div className="pw-cart-items">
                        {/* สร้าง Array ข้อมูลสินค้าในตะกร้าที่มีรูปภาพประกอบ */}
                        {[
                            { id: 1, name: 'Navy Sofa', img: cartproduct1, price: '$299.00' },
                            { id: 2, name: 'Oak Veneer Table', img: cartproduct2, price: '$349.00' },
                            { id: 3, name: 'Wooden Stool', img: cartproduct3, price: '$79.00' }
                        ].map((item) => (
                            <div key={item.id} className="pw-cart-item" style={{ borderBottom: `1px solid ${borderColor}` }}>
                                {/* เปลี่ยนจากไอคอน <Sofa /> เป็นแท็ก <img /> */}
                                <div className="pw-c-img" style={{ backgroundColor: bgSection }}>
                                    <img src={item.img} alt={item.name} className="pw-cart-real-img" />
                                </div>

                                <div className="pw-c-details">
                                    <h5 style={{ color: textMain }}>{item.name}</h5>
                                    <div className="pw-c-price-row">
                                        <span style={{ color: pColor, fontWeight: 'bold' }}>{item.price}</span>
                                        <div className="qty-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div className="pw-qty" style={{ backgroundColor: bgSection, color: textMain }}>- 1 +</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pw-cart-summary">
                        <div className="pw-summary-row" style={{ color: textMuted }}>
                            <span>Subtotal</span>
                            <span style={{ color: textMain }}>$727.00</span>
                        </div>
                        <div className="pw-summary-row" style={{ color: textMuted }}>
                            <span>Shipping</span>
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>FREE</span>
                        </div>
                        <div className="pw-summary-row pw-total" style={{ color: textMain, borderTop: `1px solid ${borderColor}` }}>
                            <h3>Total</h3>
                            <h3 style={{ color: pColor }}>$727.00</h3>
                        </div>
                        <button className="pw-checkout-btn" style={{ backgroundColor: pColor, color: '#fff' }}>
                            Checkout Now <ArrowRight size={16} />
                        </button>
                        <p className="pw-secure-text" style={{ color: textMuted }}>Secure payment powered by System</p>
                    </div>
                </aside>
            </div>

            <div className="pw-services-section" style={{ borderTop: `1px solid ${borderColor}` }}>
                <div className="pw-services-head">
                    <h2 style={{ color: textMain }}>Service</h2>
                    <span style={{ color: pColor, fontWeight: 'bold', cursor: 'pointer' }}>View All Service <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                </div>
                <div className="pw-services-grid">
                    {[
                        { title: 'Delivery', icon: <Truck />, color: pColor },
                        { title: 'Track Your Order', icon: <Package />, color: sColors[0] },
                        { title: 'Assembly Service', icon: <Wrench />, color: sColors[1] },
                        { title: 'Finance Option', icon: <PieChart />, color: sColors[2] },
                        { title: 'Interior Design', icon: <PenTool />, color: sColors[3] },
                        { title: 'Planning Support', icon: <ClipboardList />, color: pColor },
                    ].map((svc, idx) => (
                        <div key={idx} className="pw-svc-card" style={{ backgroundColor: `${svc.color}15` }}>
                            <div style={{ color: svc.color, marginBottom: '16px' }}>
                                {React.cloneElement(svc.icon, { size: 40 })}
                            </div>
                            <span className="pw-svc-badge" style={{ backgroundColor: svc.color, color: '#fff' }}>
                                {svc.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PreviewWebsite;