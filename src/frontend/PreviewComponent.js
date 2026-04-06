// ไฟล์: src/frontend/PreviewComponent.js
import React, { useContext, useMemo } from 'react';
import { Plus, Search, User, Check, ChevronDown, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import './PreviewComponent.css';
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

const PreviewComponent = ({ mode = 'Generate' }) => {
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
    const borderColor = neutral[2];
    const textMain = neutral[10];
    const textMuted = neutral[5];

    return (
        <div className="preview-component-wrapper" style={{ backgroundColor: bgApp }}>
            <div className="pc-grid">
                
                {/* 1. Button */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <button className="pc-btn" style={{ borderColor: pColor, color: pColor, backgroundColor: `${pColor}15` }}>
                            <Plus size={16} /> Button
                        </button>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Button</div>
                </div>

                {/* 2. Group Profile */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-group-profile">
                            <div className="pc-avatar" style={{ borderColor: pColor, color: pColor }}>JD</div>
                            <div className="pc-avatar" style={{ borderColor: sColors[0], color: sColors[0] }}>JD</div>
                            <div className="pc-avatar" style={{ borderColor: sColors[1] || '#3B82F6', color: sColors[1] || '#3B82F6' }}>JD</div>
                            <div className="pc-avatar pc-avatar-more" style={{ backgroundColor: neutral[2], color: textMuted, borderColor: '#fff' }}>+4</div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Group Profile</div>
                </div>

                {/* 3. Profile */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-avatar-single" style={{ borderColor: pColor, color: pColor }}>JD</div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Profile</div>
                </div>

                {/* 4. Icon */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-icon-group">
                            <div className="pc-icon-btn" style={{ borderColor: pColor, color: pColor }}><Search size={20} /></div>
                            <div className="pc-icon-btn" style={{ borderColor: pColor, color: pColor, backgroundColor: `${pColor}15` }}><User size={20} /></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Icon</div>
                </div>

                {/* 5. Badge */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-badge" style={{ borderColor: sColors[0], color: sColors[0], backgroundColor: `${sColors[0]}15` }}>
                            Badge
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Badge</div>
                </div>

                {/* 6. Radio */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-radio-group">
                            <div className="pc-radio active" style={{ borderColor: pColor }}>
                                <div className="pc-radio-inner" style={{ backgroundColor: pColor }}></div>
                            </div>
                            <div className="pc-radio inactive" style={{ borderColor: borderColor }}></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Radio</div>
                </div>

                {/* 7. Checkbox */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-checkbox-group">
                            <div className="pc-check active" style={{ backgroundColor: pColor, borderColor: pColor }}>
                                <Check size={18} color="#fff" strokeWidth={3} />
                            </div>
                            <div className="pc-check inactive" style={{ borderColor: borderColor }}></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Checkbox</div>
                </div>

                {/* 8. Toggle */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ flexDirection: 'column', gap: '16px' }}>
                        <div className="pc-toggle inactive" style={{ borderColor: borderColor }}>
                            <div className="pc-toggle-knob" style={{ backgroundColor: pColor }}></div>
                        </div>
                        <div className="pc-toggle active" style={{ backgroundColor: pColor }}>
                            <div className="pc-toggle-knob white" style={{ backgroundColor: '#fff' }}></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Toggle</div>
                </div>

                {/* 9. Slide */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '0 32px' }}>
                        <div className="pc-slide-track" style={{ backgroundColor: neutral[2] }}>
                            <div className="pc-slide-fill" style={{ backgroundColor: pColor, width: '70%' }}></div>
                            <div className="pc-slide-thumb" style={{ borderColor: pColor, left: '70%' }}></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Slide</div>
                </div>

                {/* 10. Input Field */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '0 24px' }}>
                        <div className="pc-input-field" style={{ borderColor: pColor, backgroundColor: `${pColor}15` }}>
                            <Search size={14} color={pColor} />
                            <span style={{ color: pColor }}>Type to search...</span>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Input Field</div>
                </div>

                {/* 11. Drop Down */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '0 24px' }}>
                        <div className="pc-dropdown" style={{ borderColor: pColor, backgroundColor: `${pColor}15` }}>
                            <span style={{ color: pColor }}>Drop down</span>
                            <ChevronDown size={16} color={pColor} />
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Drop Down</div>
                </div>

                {/* 12. Text Field (📍 ปรับ alignItems เป็น stretch เพื่อให้กล่องพอดีพื้นที่) */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '24px', alignItems: 'stretch' }}>
                        <div className="pc-textarea" style={{ borderColor: borderColor, backgroundColor: neutral[1] }}>
                            <span style={{ color: textMuted }}>Lorem Ipsum ...</span>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Text Field</div>
                </div>

                {/* --- Components ที่เพิ่มใหม่ --- */}

                {/* 13. Breadcrumb */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-breadcrumb" style={{ backgroundColor: `${pColor}15` }}>
                            <span style={{ color: pColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Home size={12} /> Home
                            </span>
                            <ChevronRight size={12} color={textMuted} />
                            <span style={{ color: textMuted }}>Project</span>
                            <ChevronRight size={12} color={textMuted} />
                            <span style={{ color: textMuted }}>Settings</span>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Breadcrumb</div>
                </div>

                {/* 14. Segment */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-segment" style={{ backgroundColor: neutral[1] }}>
                            <div className="pc-seg-item active" style={{ backgroundColor: '#fff', color: pColor, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>Overview</div>
                            <div className="pc-seg-item" style={{ color: textMuted }}>Analytics</div>
                            <div className="pc-seg-item" style={{ color: textMuted }}>Reports</div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Segment</div>
                </div>

                {/* 15. Tab */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ alignItems: 'flex-end', paddingBottom: '30px' }}>
                        <div className="pc-tabs" style={{ borderBottom: `1px solid ${borderColor}`, width: '80%' }}>
                            <div className="pc-tab-item active" style={{ color: pColor, borderBottom: `2px solid ${pColor}` }}>Overview</div>
                            <div className="pc-tab-item" style={{ color: textMuted }}>Analytics</div>
                            <div className="pc-tab-item" style={{ color: textMuted }}>Reports</div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Tab</div>
                </div>

                {/* 16. Pagination */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content">
                        <div className="pc-pagination">
                            <div className="pc-page-item" style={{ backgroundColor: neutral[1], color: textMuted }}><ChevronLeft size={14}/></div>
                            <div className="pc-page-item active" style={{ backgroundColor: pColor, color: '#fff' }}>1</div>
                            <div className="pc-page-item" style={{ backgroundColor: neutral[1], color: textMain }}>2</div>
                            <div className="pc-page-item" style={{ backgroundColor: neutral[1], color: textMuted }}><ChevronRight size={14}/></div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Pagination</div>
                </div>

                {/* 17. Progress */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '0 32px' }}>
                        <div className="pc-progress-container">
                            <div className="pc-prog-head">
                                <span style={{ color: textMuted, fontSize: '10px', fontWeight: 'bold' }}>UPLOADING</span>
                                <span style={{ color: pColor, fontSize: '10px', fontWeight: 'bold' }}>65%</span>
                            </div>
                            <div className="pc-prog-track" style={{ backgroundColor: neutral[2] }}>
                                <div className="pc-prog-fill" style={{ backgroundColor: pColor, width: '65%' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Progress</div>
                </div>

                {/* 18. Typography */}
                <div className="pc-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ alignItems: 'flex-start', padding: '24px' }}>
                        <div className="pc-typography">
                            <h3 style={{ color: textMain }}>Heading</h3>
                            <p style={{ color: textMuted }}>This is a secondary piece of information used for labels, helper text, and fine print metadata.</p>
                        </div>
                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Typography</div>
                </div>

                {/* 19. Calendar (กว้างสุดครอบคลุม 3 คอลัมน์) */}
                <div className="pc-card pc-calendar-card" style={{ borderColor: borderColor }}>
                    <div className="pc-card-content" style={{ padding: '24px', flexDirection: 'column' }}>
                        
                        <div className="pc-cal-header">
                            <span style={{ color: textMain }}>October 2024</span>
                            <div className="pc-cal-arrows">
                                <ChevronLeft size={16} color={textMain} />
                                <ChevronRight size={16} color={textMain} />
                            </div>
                        </div>

                        <div className="pc-cal-grid">
                            {['S', 'M', 'T', 'W', 'TH', 'F', 'SA'].map(day => (
                                <div key={day} className="pc-cal-day" style={{ color: sColors[0] || pColor }}>{day}</div>
                            ))}
                            <div className="pc-cal-date muted" style={{ color: neutral[3] }}>29</div>
                            <div className="pc-cal-date muted" style={{ color: neutral[3] }}>30</div>
                            <div className="pc-cal-date" style={{ color: textMain }}>1</div>
                            <div className="pc-cal-date" style={{ color: textMain }}>2</div>
                            <div className="pc-cal-date active" style={{ backgroundColor: pColor, color: '#fff' }}>3</div>
                            <div className="pc-cal-date" style={{ color: textMain }}>4</div>
                            <div className="pc-cal-date" style={{ color: textMain }}>5</div>
                        </div>

                    </div>
                    <div className="pc-card-footer" style={{ borderColor: borderColor, color: textMain }}>Calendar</div>
                </div>

            </div>
        </div>
    );
};

export default PreviewComponent;