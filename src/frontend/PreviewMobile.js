// ไฟล์: src/frontend/PreviewMobile.js
import React, { useContext, useMemo } from 'react';
import { 
    Bell, Wallet, TrendingUp, ArrowRightLeft, Receipt, 
    ScanLine, SmartphoneNfc, WalletCards, ChevronRight, 
    Plus, Home, CreditCard, BarChart2, User, Plane
} from 'lucide-react';
import './PreviewMobile.css';
import { ColorContext } from '../contexts/ColorContext'; 

// ==========================================
// 🛠️ Color Math Helpers
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

const PreviewMobile = ({ mode = 'Generate' }) => {
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    const primaryState = mode === 'Generate' ? genPrimary : imgPrimary;
    const secondaryState = mode === 'Generate' ? genSecondary : imgSecondary;

    const pColor = `#${primaryState.value}`;
    const sColors = secondaryState.map(c => `#${c.value}`);
    while (sColors.length < 4) { sColors.push(pColor); }

    const neutral = useMemo(() => {
        if (!primaryState || !primaryState.value) {
            return ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#000000'];
        }
        const shades = generateNeutralShades(primaryState.value);
        return shades.map(s => s.startsWith('#') ? s : `#${s}`);
    }, [primaryState]);

    const bgApp = neutral[0];      
    const bgCard = neutral[0];     
    const textMain = neutral[10];  
    const textMuted = neutral[6]; 
    const borderColor = neutral[2]; 

    const quickActions = [
        { name: 'Transfer', icon: ArrowRightLeft, color: pColor },
        { name: 'Pay Bills', icon: Receipt, color: '#F97316' }, // สีส้มตามรูป
        { name: 'Scan QR', icon: ScanLine, color: '#10B981' }, // สีเขียวตามรูป
        { name: 'Scan QR', icon: WalletCards, color: '#F59E0B' }, // สีเหลืองตามรูป
        { name: 'Top-up', icon: SmartphoneNfc, color: sColors[1] || '#8B5CF6' }
    ];

    const favorites = ['Daung', 'Qin', 'Jaemy', 'Pae'];
    
    // ข้อมูลกราฟแท่งจำลอง
    const spendingData = [
        { day: 'MON', val: 30 }, { day: 'TUE', val: 50 }, 
        { day: 'WED', val: 100, active: true }, { day: 'THU', val: 40 }, 
        { day: 'FRI', val: 35 }, { day: 'SAT', val: 60 }, { day: 'SUN', val: 25 }
    ];

    return (
        <div className="preview-mobile-wrapper">
            <div className="mobile-phone-frame" style={{ backgroundColor: bgApp, color: textMain, borderColor: '#333' }}>
                
                {/* --- Main Scroll Area --- */}
                <div className="pm-scroll-container">
                    
                    {/* 📍 Header */}
                    <header className="pm-header">
                        <div className="pm-user-info">
                            <div className="pm-avatar" style={{backgroundColor: '#FFEDD5'}}>
                                <User size={12} color="#EA580C" strokeWidth={2}/>
                            </div>
                            <div className="pm-welcome">
                                <span style={{color: textMuted, fontSize: '8px'}}>Good morning,</span>
                                <span style={{fontWeight: 'bold', fontSize: '11px'}}>Alex Johnson</span>
                            </div>
                        </div>
                        <div className="pm-bell-icon">
                            <Bell size={14} color={textMain} strokeWidth={2}/>
                            <span className="pm-bell-dot" style={{backgroundColor: '#EF4444'}}></span>
                        </div>
                    </header>

                    {/* 📍 Balance Card */}
                    <div className="pm-balance-card" style={{ background: `linear-gradient(135deg, ${pColor}, ${sColors[0] || pColor}dd)` }}>
                        <div className="pm-card-top">
                            <div className="pm-balance-texts">
                                <span style={{color: 'rgba(255,255,255,0.8)', fontSize: '9px'}}>Total Balance</span>
                                <h2 style={{color: '#fff', margin: '2px 0 6px', fontSize: '22px', fontWeight: 'bold'}}>$12,450.80</h2>
                                <div className="pm-trend-badge" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                                    <TrendingUp size={8} color="#fff" strokeWidth={3}/>
                                    <span style={{color: '#fff', fontSize: '7px'}}>+2.4% this month</span>
                                </div>
                            </div>
                            <div className="pm-wallet-icon" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
                                <Wallet size={14} color="#fff" strokeWidth={1.5}/>
                            </div>
                        </div>
                        
                        <div className="pm-card-bottom">
                            <div className="pm-savings-info">
                                <span style={{color: 'rgba(255,255,255,0.8)', fontSize: '7px', fontWeight: 'bold', letterSpacing: '0.5px'}}>PRIMARY SAVINGS</span>
                                <span style={{color: '#fff', fontSize: '10px', fontWeight: 'bold'}}>**** **** 4290</span>
                            </div>
                            <button className="pm-view-btn" style={{color: pColor}}>View Details</button>
                        </div>
                    </div>

                    {/* 📍 Quick Actions */}
                    <div className="pm-quick-actions">
                        {quickActions.map(action => (
                            <div key={action.name} className="pm-quick-action-item">
                                <div className="pm-quick-icon-box" style={{backgroundColor: neutral[1]}}>
                                    <action.icon size={14} color={action.color} strokeWidth={2}/>
                                </div>
                                <span style={{color: textMain, fontSize: '7px', fontWeight: '600', marginTop: '4px'}}>{action.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* 📍 Favorite Section */}
                    <section className="pm-section pm-favorites-section">
                        <div className="pm-section-head">
                            <h4 style={{color: textMain, margin: 0, fontSize: '10px', fontWeight: 'bold'}}>Favorite</h4>
                            <div style={{display:'flex', alignItems:'center', gap:'2px', color: textMuted}}>
                                <span style={{fontSize: '7px'}}>All</span>
                                <ChevronRight size={10}/>
                            </div>
                        </div>
                        <div className="pm-favorites-list">
                            {favorites.map((fav, i) => (
                                <div key={fav} className="pm-favorite-item">
                                    <div className="pm-fav-avatar" style={{backgroundColor: sColors[1] || '#A855F7'}}>
                                        <User size={12} color="#fff"/>
                                    </div>
                                    <span style={{color: textMain, fontSize: '7px'}}>{fav}</span>
                                </div>
                            ))}
                            <div className="pm-favorite-item">
                                <div className="pm-fav-avatar pm-fav-add" style={{backgroundColor: pColor}}>
                                    <Plus size={12} color="#fff" strokeWidth={3}/>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 📍 Weekly Spending Bar Chart */}
                    <section className="pm-section">
                        <div className="pm-spending-card" style={{borderColor: borderColor, backgroundColor: bgCard}}>
                            <div className="pm-section-head">
                                <h4 style={{color: textMain, margin: 0, fontSize: '10px', fontWeight: 'bold'}}>Weekly Spending</h4>
                                <span style={{color: pColor, fontSize: '8px', fontWeight: 'bold'}}>Details</span>
                            </div>
                            
                            <div className="pm-chart-area">
                                <div className="pm-bars-container">
                                    {spendingData.map(d => (
                                        <div key={d.day} className="pm-bar-wrapper">
                                            {d.active && <span className="pm-bar-tooltip" style={{color: pColor}}>Today</span>}
                                            <div className="pm-bar" style={{
                                                height: `${d.val}%`, 
                                                backgroundColor: d.active ? pColor : neutral[2]
                                            }}></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pm-x-axis">
                                    {spendingData.map(d => (
                                        <span key={d.day} style={{color: textMuted}}>{d.day}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="pm-chart-chips">
                                <span className="pm-chip active" style={{backgroundColor: pColor, color: '#fff'}}>All</span>
                                <span className="pm-chip" style={{backgroundColor: neutral[1], color: textMuted}}>Food</span>
                                <span className="pm-chip" style={{backgroundColor: neutral[1], color: textMuted}}>Travel</span>
                                <span className="pm-chip" style={{backgroundColor: neutral[1], color: textMuted}}>Shopping</span>
                            </div>
                        </div>
                    </section>

                    {/* 📍 Special Offer Promo */}
                    <section className="pm-section" style={{marginBottom: '70px'}}>
                        <div className="pm-promo-card" style={{background: `linear-gradient(135deg, ${pColor}, ${sColors[1] || '#6366F1'})`}}>
                            <span className="pm-promo-badge" style={{backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff'}}>SPECIAL OFFER</span>
                            <h3 style={{color: '#fff', fontSize: '14px', margin: '6px 0 4px', lineHeight: '1.2'}}>Get 5% Cashback on<br/>Travel</h3>
                            <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '8px', margin: 0, width: '60%'}}>Book your next trip with GlobalPay.</p>
                            <Plane className="pm-promo-icon" size={40} color="rgba(255,255,255,0.2)" strokeWidth={1}/>
                        </div>
                    </section>

                </div> {/* --- จบ Main Scroll Area --- */}

                {/* 📍 Bottom Navigation Bar (ตรึงอยู่กับที่) */}
                <nav className="pm-bottom-nav" style={{backgroundColor: bgCard, borderTop: `1px solid ${borderColor}`}}>
                    <div className="pm-nav-item active" style={{color: pColor}}>
                        <Home size={16} strokeWidth={2.5} />
                        <span>Home</span>
                    </div>
                    <div className="pm-nav-item" style={{color: textMuted}}>
                        <CreditCard size={16} strokeWidth={1.5} />
                        <span>Cards</span>
                    </div>
                    
                    {/* ปุ่ม FAB ลอยตรงกลาง */}
                    <div className="pm-fab-button" style={{backgroundColor: pColor, boxShadow: `0 4px 12px ${pColor}80`}}>
                        <Plus size={20} color="#fff" strokeWidth={3}/>
                    </div>

                    <div className="pm-nav-item" style={{color: textMuted}}>
                        <BarChart2 size={16} strokeWidth={1.5} />
                        <span>Stats</span>
                    </div>
                    <div className="pm-nav-item" style={{color: textMuted}}>
                        <User size={16} strokeWidth={1.5} />
                        <span>Profile</span>
                    </div>
                </nav>

            </div>
        </div>
    );
};

export default PreviewMobile;