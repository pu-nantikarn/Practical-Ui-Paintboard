// ไฟล์: src/frontend/PreviewDashboard.js
import React, { useContext, useMemo } from 'react';
import { TrendingUp, Zap, Heart, Clock, Upload, User, CheckCircle, Send, Megaphone, Target, HardDrive } from 'lucide-react';
import './PreviewDashboard.css';
import { ColorContext } from '../contexts/ColorContext'; // 📍 เช็ค Path ตรงนี้ให้ตรงกับในโปรเจกต์ของคุณนะครับ

// ==========================================
// 🛠️ Color Math Helpers
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

const PreviewDashboard = ({ mode = 'Generate' }) => {
    
    // 1. ดึง State สีทั้งหมดมาจาก Context
    const { genPrimary, genSecondary, imgPrimary, imgSecondary } = useContext(ColorContext);

    // 2. เลือกใช้งานชุดสีให้ตรงกับโหมดปัจจุบัน
    const primaryState = mode === 'Generate' ? genPrimary : imgPrimary;
    const secondaryState = mode === 'Generate' ? genSecondary : imgSecondary;

    // 3. เตรียมตัวแปรสีสำหรับใช้งาน
    const pColor = `#${primaryState.value}`;
    
    const sColors = secondaryState.map(c => `#${c.value}`);
    while (sColors.length < 4) {
        sColors.push(pColor); 
    }
    const chartColors = [pColor, ...sColors]; 

    // 4. คำนวณสี Neutral 11 เฉด
    const neutral = useMemo(() => {
        if (!primaryState || !primaryState.value) {
            return ['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#000000'];
        }
        const shades = generateNeutralShades(primaryState.value);
        return shades.map(s => s.startsWith('#') ? s : `#${s}`);
    }, [primaryState]);

    const bgApp = neutral[1]; 
    const bgCard = neutral[0]; 
    const textMain = neutral[9]; 
    const textMuted = neutral[5]; 
    const borderColor = neutral[3];

    return (
        <div className="preview-dashboard" style={{ backgroundColor: bgApp, color: textMain }}>
            
            {/* --- Row 1: KPI Cards --- */}
            <div className="dash-row kpi-row">
                <div className="dash-card kpi-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ backgroundColor: `${pColor}15`, color: pColor }}><TrendingUp size={16} /></div>
                        <span className="trend positive" style={{ backgroundColor: '#10B98115', color: '#10B981' }}><TrendingUp size={12}/> 12.5%</span>
                    </div>
                    <p className="kpi-title" style={{ color: textMuted }}>TOTAL REVENUE</p>
                    <h2 className="kpi-value" style={{ color: textMain }}>$128,430</h2>
                </div>
                
                <div className="dash-card kpi-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ backgroundColor: `${sColors[0]}15`, color: sColors[0] }}><Zap size={16} /></div>
                        <span className="trend positive" style={{ backgroundColor: '#10B98115', color: '#10B981' }}><TrendingUp size={12}/> 8.2%</span>
                    </div>
                    <p className="kpi-title" style={{ color: textMuted }}>ACTIVE USERS</p>
                    <h2 className="kpi-value" style={{ color: textMain }}>14,202</h2>
                </div>

                <div className="dash-card kpi-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ backgroundColor: `${sColors[1]}15`, color: sColors[1] }}><Heart size={16} /></div>
                        <span className="trend negative" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}><TrendingUp size={12} style={{transform:'scaleY(-1)'}}/> 0.8%</span>
                    </div>
                    <p className="kpi-title" style={{ color: textMuted }}>CONVERSION RATE</p>
                    <h2 className="kpi-value" style={{ color: textMain }}>3.42%</h2>
                </div>

                <div className="dash-card kpi-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                    <div className="kpi-header">
                        <div className="kpi-icon" style={{ backgroundColor: `${sColors[2]}15`, color: sColors[2] }}><Clock size={16} /></div>
                        <span className="trend positive" style={{ backgroundColor: '#10B98115', color: '#10B981' }}><TrendingUp size={12}/> 14%</span>
                    </div>
                    <p className="kpi-title" style={{ color: textMuted }}>AVG. SESSION</p>
                    <h2 className="kpi-value" style={{ color: textMain }}>4m 32s</h2>
                </div>
            </div>

            {/* --- Main Grid Layout --- */}
            <div className="dash-grid">
                
                {/* 📌 Left Column */}
                <div className="dash-col-left">
                    {/* Line Chart */}
                    <div className="dash-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <div className="card-header">
                            <div>
                                <h3 style={{ color: textMain }}>Revenue Trends</h3>
                                <p style={{ color: textMuted, fontSize: '11px' }}>Detailed performance comparison</p>
                            </div>
                            {/* 📍 แก้ palette.neutral[2] เป็น neutral[2] */}
                            <div className="toggle-group" style={{ backgroundColor: neutral[2] }}>
                                <button style={{ color: textMuted }}>Week</button>
                                <button style={{ backgroundColor: pColor, color: '#fff' }}>Month</button>
                                <button style={{ color: textMuted }}>Year</button>
                            </div>
                        </div>
                        <svg className="mock-line-chart" viewBox="0 0 100 40" preserveAspectRatio="none">
                            <polyline points="0,35 20,28 40,32 60,15 80,25 100,10" fill="none" stroke={chartColors[0]} strokeWidth="1.5" strokeLinejoin="round"/>
                            <polyline points="0,20 20,25 40,15 60,20 80,10 100,5" fill="none" stroke={chartColors[1]} strokeWidth="1.5" strokeLinejoin="round"/>
                            <polyline points="0,30 20,35 40,20 60,10 80,15 100,20" fill="none" stroke={chartColors[2]} strokeWidth="1.5" strokeLinejoin="round"/>
                            <polyline points="0,10 20,15 40,25 60,30 80,15 100,25" fill="none" stroke={chartColors[3]} strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <div className="chart-x-axis" style={{ color: textMuted }}><span>01 Nov</span><span>07 Nov</span><span>14 Nov</span><span>21 Nov</span><span>28 Nov</span></div>
                    </div>

                    {/* Treemap & Stacked Bar */}
                    <div className="dash-row inner-row">
                        <div className="dash-card treemap-card" style={{ backgroundColor: bgCard, borderColor: borderColor, flex: 1 }}>
                            <h3 style={{ color: textMain, marginBottom:'12px', fontSize:'13px' }}>Inventory Distribution</h3>
                            <div className="mock-treemap">
                                <div className="tm-box tm-large" style={{ backgroundColor: chartColors[0] }}>Cat A<br/>45%</div>
                                <div className="tm-box tm-wide" style={{ backgroundColor: chartColors[1] }}>Cat B<br/>22%</div>
                                <div className="tm-box tm-small" style={{ backgroundColor: chartColors[2] }}>C<br/>12%</div>
                                <div className="tm-box tm-small" style={{ backgroundColor: chartColors[3] }}>D<br/>8%</div>
                                <div className="tm-box tm-wide" style={{ backgroundColor: chartColors[4] || pColor }}>E<br/>13%</div>
                            </div>
                        </div>

                        <div className="dash-card resource-card" style={{ backgroundColor: bgCard, borderColor: borderColor, flex: 1 }}>
                            <h3 style={{ color: textMain, marginBottom:'12px', fontSize:'13px' }}>Resource Allocation</h3>
                            <div className="stacked-bar-group">
                                {['Alpha', 'Beta', 'Gamma', 'Delta'].map((proj, i) => (
                                    <div key={proj} className="sb-item">
                                        <div className="sb-label" style={{ color: textMuted }}><span>Project {proj}</span><span>{80 - (i*8)}%</span></div>
                                        {/* 📍 แก้ palette.neutral[2] เป็น neutral[2] */}
                                        <div className="sb-track" style={{ backgroundColor: neutral[2] }}>
                                            <div className="sb-fill" style={{ width: '40%', backgroundColor: chartColors[0] }}></div>
                                            <div className="sb-fill" style={{ width: '25%', backgroundColor: chartColors[1] }}></div>
                                            <div className="sb-fill" style={{ width: `${15 - i*2}%`, backgroundColor: chartColors[2] }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Gantt Chart */}
                    <div className="dash-card gantt-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <h3 style={{ color: textMain, marginBottom:'12px', fontSize:'13px' }}>Project Timeline</h3>
                        <div className="mock-gantt">
                            {/* 📍 แก้ palette.neutral[2] เป็น neutral[2] ทั้งแผง */}
                            <div className="g-row"><span style={{ color: textMuted }}>PHASE 1</span><div className="g-track" style={{ backgroundColor: neutral[2] }}><div className="g-bar" style={{ left:'10%', width:'30%', backgroundColor: chartColors[0] }}>Research</div></div></div>
                            <div className="g-row"><span style={{ color: textMuted }}>PHASE 2</span><div className="g-track" style={{ backgroundColor: neutral[2] }}><div className="g-bar" style={{ left:'35%', width:'40%', backgroundColor: chartColors[1] }}>Design System</div></div></div>
                            <div className="g-row"><span style={{ color: textMuted }}>PHASE 3</span><div className="g-track" style={{ backgroundColor: neutral[2] }}><div className="g-bar" style={{ left:'60%', width:'25%', backgroundColor: chartColors[2] }}>Development</div></div></div>
                            <div className="g-row"><span style={{ color: textMuted }}>PHASE 4</span><div className="g-track" style={{ backgroundColor: neutral[2] }}><div className="g-bar" style={{ left:'75%', width:'15%', backgroundColor: chartColors[3] }}>QA / Testing</div></div></div>
                            <div className="g-row"><span style={{ color: textMuted }}>LAUNCH</span><div className="g-track" style={{ backgroundColor: neutral[2] }}><div className="g-bar" style={{ left:'85%', width:'10%', backgroundColor: chartColors[4] || pColor }}>Deployment</div></div></div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="dash-card radar-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <div className="card-header-sm">
                            <h3 style={{ color: textMain, fontSize:'13px' }}>Product Performance Metrics</h3>
                            <div className="kpi-icon-sm" style={{ backgroundColor: `${pColor}15`, color: pColor }}><Target size={14} /></div>
                        </div>
                        <div className="radar-container">
                            <svg viewBox="0 0 100 100" className="mock-radar-chart">
                                <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke={borderColor} strokeWidth="0.5"/>
                                <polygon points="50,27.5 72.5,38.75 72.5,61.25 50,72.5 27.5,61.25 27.5,38.75" fill="none" stroke={borderColor} strokeWidth="0.5" strokeDasharray="1 1"/>
                                <line x1="50" y1="50" x2="50" y2="5" stroke={borderColor} strokeWidth="0.5"/>
                                <line x1="50" y1="50" x2="95" y2="27.5" stroke={borderColor} strokeWidth="0.5"/>
                                <line x1="50" y1="50" x2="95" y2="72.5" stroke={borderColor} strokeWidth="0.5"/>
                                <line x1="50" y1="50" x2="50" y2="95" stroke={borderColor} strokeWidth="0.5"/>
                                <line x1="50" y1="50" x2="5" y2="72.5" stroke={borderColor} strokeWidth="0.5"/>
                                <line x1="50" y1="50" x2="5" y2="27.5" stroke={borderColor} strokeWidth="0.5"/>
                                <polygon points="50,15 85,35 80,65 50,75 20,60 25,30" fill={`${pColor}40`} stroke={pColor} strokeWidth="1.5"/>
                                <polygon points="50,25 75,40 70,60 50,85 30,70 35,45" fill="none" stroke={chartColors[2]} strokeWidth="1" strokeDasharray="2 2"/>
                            </svg>
                            <div className="radar-labels" style={{ color: textMuted }}>
                                <span className="label-top">Velocity</span>
                                <span className="label-top-right">Quality</span>
                                <span className="label-bottom-right">Uptime</span>
                                <span className="label-bottom">Coverage</span>
                                <span className="label-bottom-left">Satisfaction</span>
                                <span className="label-top-left">Efficiency</span>
                            </div>
                        </div>
                        <div className="radar-legend">
                            <div><span style={{backgroundColor: pColor}}></span> <p style={{color:textMuted}}>Current</p></div>
                            <div><span style={{borderColor: chartColors[2]}} className="legend-target"></span> <p style={{color:textMuted}}>Target</p></div>
                        </div>
                    </div>
                </div>

                {/* 📌 Right Column */}
                <div className="dash-col-right">
                    
                    {/* Donut Chart */}
                    <div className="dash-card donut-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <h3 style={{ color: textMain, marginBottom:'16px', fontSize:'13px' }}>Task Distribution</h3>
                        <div className="donut-container">
                            <div className="mock-donut" style={{
                                background: `conic-gradient(${chartColors[0]} 0% 40%, ${chartColors[1]} 40% 65%, ${chartColors[2]} 65% 80%, ${chartColors[3]} 80% 92%, ${chartColors[4] || pColor} 92% 100%)`
                            }}>
                                <div className="donut-inner" style={{ backgroundColor: bgCard }}>
                                    <h2 style={{ color: textMain }}>320</h2>
                                    <p style={{ color: textMuted }}>TOTAL TASKS</p>
                                </div>
                            </div>
                            <div className="donut-legend">
                                <div><span style={{backgroundColor: chartColors[0]}}></span> <p style={{color:textMuted}}>Dev (40%)</p></div>
                                <div><span style={{backgroundColor: chartColors[1]}}></span> <p style={{color:textMuted}}>Design (25%)</p></div>
                                <div><span style={{backgroundColor: chartColors[2]}}></span> <p style={{color:textMuted}}>QA (15%)</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Growth Bar Chart */}
                    <div className="dash-card growth-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <h3 style={{ color: textMain, marginBottom:'16px', fontSize:'13px' }}>Weekly Growth</h3>
                        <div className="mock-bar-chart">
                            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map((day, i) => (
                                <div key={day} className="bar-col">
                                    <div className="bar-wrapper">
                                        {/* 📍 แก้ palette.neutral[2] เป็น neutral[2] */}
                                        <div className="bar-fill" style={{ height: `${Math.random() * 60 + 20}%`, backgroundColor: i === 3 ? pColor : neutral[2] }}></div>
                                    </div>
                                    <span style={{ color: textMuted }}>{day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="dash-card activity-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <h3 style={{ color: textMain, marginBottom:'16px', fontSize:'13px' }}>Activity Feed</h3>
                        <div className="activity-list">
                            <div className="act-item">
                                <div className="act-icon" style={{ backgroundColor: `${chartColors[0]}20`, color: chartColors[0] }}><Upload size={14}/></div>
                                <div className="act-text"><p style={{ color: textMain }}><strong>Project Beta</strong> updated</p><span style={{ color: textMuted }}>12 mins ago</span></div>
                            </div>
                            <div className="act-item">
                                <div className="act-icon" style={{ backgroundColor: `${chartColors[1]}20`, color: chartColors[1] }}><User size={14}/></div>
                                <div className="act-text"><p style={{ color: textMain }}><strong>New user</strong> joined team</p><span style={{ color: textMuted }}>2 hours ago</span></div>
                            </div>
                            <div className="act-item">
                                <div className="act-icon" style={{ backgroundColor: '#10B98120', color: '#10B981' }}><CheckCircle size={14}/></div>
                                <div className="act-text"><p style={{ color: textMain }}><strong>Task completed</strong></p><span style={{ color: textMuted }}>Yesterday</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Storage Usage (Half-Donut / Gauge Chart) */}
                    <div className="dash-card storage-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <div className="card-header-sm">
                            <h3 style={{ color: textMain, fontSize:'13px' }}>Storage Usage</h3>
                            <div className="kpi-icon-sm" style={{ backgroundColor: `${sColors[1] || pColor}15`, color: sColors[1] || pColor }}><HardDrive size={14} /></div>
                        </div>
                        
                        <div className="gauge-container">
                            <svg viewBox="0 0 100 50" className="mock-gauge-chart">
                                {/* 📍 แก้ palette.neutral[2] เป็น neutral[2] */}
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={neutral[2]} strokeWidth="12" strokeLinecap="round" />
                                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={chartColors[1] || pColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="125" strokeDashoffset="30" />
                            </svg>
                            
                            <div className="gauge-center-text">
                                <h2 style={{ color: textMain }}>75%</h2>
                                <p style={{ color: textMuted }}>Used of 1TB</p>
                            </div>
                        </div>

                        <div className="storage-details">
                            <div className="storage-item">
                                <span className="dot" style={{backgroundColor: chartColors[1] || pColor}}></span>
                                <span style={{color: textMuted}}>Documents</span>
                                <strong style={{color: textMain}}>450 GB</strong>
                            </div>
                            <div className="storage-item">
                                {/* 📍 แก้ palette.neutral[3] เป็น neutral[3] */}
                                <span className="dot" style={{backgroundColor: neutral[3]}}></span>
                                <span style={{color: textMuted}}>Free Space</span>
                                <strong style={{color: textMain}}>250 GB</strong>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="dash-card quick-card" style={{ backgroundColor: bgCard, borderColor: borderColor }}>
                        <h3 style={{ color: textMain, marginBottom:'12px', fontSize:'13px' }}>Quick Actions</h3>
                        <div className="quick-actions-grid">
                            {/* 📍 แก้ palette.neutral[1] เป็น neutral[1] หรือ bgApp ทั้ง 4 ปุ่ม */}
                            <button style={{ backgroundColor: bgApp, color: textMain }}><User size={16}/> Add User</button>
                            <button style={{ backgroundColor: bgApp, color: textMain }}><Upload size={16}/> Export</button>
                            <button style={{ backgroundColor: bgApp, color: textMain }}><Send size={16}/> Invoice</button>
                            <button style={{ backgroundColor: bgApp, color: textMain }}><Megaphone size={16}/> Announce</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PreviewDashboard;