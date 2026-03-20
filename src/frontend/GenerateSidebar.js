// ไฟล์: src/components/Sidebar.js (หรือ src/frontend/GenerateSidebar.js)
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Minus, Plus, Palette, Pipette } from 'lucide-react';
import './GenerateSidebar.css';
import { supabase } from '../backend/supabaseClient';
// 📍 นำเข้า Component SavePaletteModal (เช็ค path ให้ตรงกับที่ไฟล์คุณอยู่ด้วยนะครับ)
import SavePalette from '../frontend/SavePalette';

// ==========================================
// 🛠️ Color Math Helpers (สมการคำนวณสีระดับโปร)
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
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
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
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
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
    setLocalHsv(prev => ({
      h: newHsv.s === 0 ? prev.h : newHsv.h,
      s: newHsv.s,
      v: newHsv.v
    }));
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

    let s = x / rect.width;
    let v = 1 - (y / rect.height);

    setLocalHsv(prev => ({ ...prev, s, v }));
    onChange(hsvToHex(localHsv.h, s, v));
  };

  const handleMouseDown = (e) => {
    handleColorPick(e);
    const handleMouseMove = (ev) => { ev.preventDefault(); handleColorPick(ev); };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
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
        
        <div 
          className="picker-color-box" 
          ref={boxRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{ background: `hsl(${localHsv.h}, 100%, 50%)` }}
        >
          <div className="picker-color-overlay"></div>
          <div 
            className="picker-thumb-2d" 
            style={{ 
              left: `${localHsv.s * 100}%`, 
              top: `${(1 - localHsv.v) * 100}%`,
              backgroundColor: `#${hsvToHex(localHsv.h, localHsv.s, localHsv.v)}` 
            }}
          ></div>
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

const FloatingGradient = ({ baseHex }) => (
  <div className="floating-popover gradient-popover" onClick={e => e.stopPropagation()}>
    <div className="shades-grid">
      {generateShades(baseHex).map((shade, index) => (
        <div key={index} className="shade-cell" style={{ backgroundColor: `#${shade}` }}>
          <span className="shade-text" style={{ color: getContrastColor(shade) }}>#{shade}</span>
          {shade === baseHex && <div className="active-dot" style={{ backgroundColor: getContrastColor(shade) }}></div>}
        </div>
      ))}
      <div className="shade-cell empty-cell"></div>
    </div>
  </div>
);

// ==========================================
// 🎨 Component หลัก (Generate Sidebar)
// ==========================================
const Sidebar = () => {
  const moods = ['Random', 'Playful', 'Earth', 'Natural', 'Minimal', 'Luxury', 'Midnight', 'Warm', 'Cool', 'Pastel', 'Retro', 'Neon', 'Forest', 'Dreamy', 'Sunset', 'Futuristic'];

  // --- 1. State ของสี และการจดจำค่า (localStorage) ---
  const [activeMood, setActiveMood] = useState(() => {
    const saved = localStorage.getItem('genMood');
    return saved ? saved : 'Random';
  });

  const [primary, setPrimary] = useState(() => {
    const saved = localStorage.getItem('genPrimary');
    return saved ? JSON.parse(saved) : { value: '8B5CF6', isLocked: false };
  });

  const [secondary, setSecondary] = useState(() => {
    const saved = localStorage.getItem('genSecondary');
    return saved ? JSON.parse(saved) : [{ id: 1, value: '1F2937', isLocked: false }];
  });

  const [openPopover, setOpenPopover] = useState({ type: null, id: null });
  const neutralShades = generateShades('6B7280');

  // 📍 2. State ควบคุมหน้าต่าง Save Palette
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // 📍 3. ดึงค่าสีทั้งหมดมารวมกันเป็น Array เพื่อส่งไปแสดงในพรีวิวของ Modal
  const currentColors = [
    primary.value, 
    ...secondary.map(s => s.value)
  ].filter(Boolean); // กรองค่าว่างออก

  const [userId, setUserId] = useState(null);

  // --- 4. useEffect สำหรับ Auto-Save ลงเบราว์เซอร์ ---
  useEffect(() => {
    localStorage.setItem('genMood', activeMood);
  }, [activeMood]);

  useEffect(() => {
    localStorage.setItem('genPrimary', JSON.stringify(primary));
  }, [primary]);

  useEffect(() => {
    localStorage.setItem('genSecondary', JSON.stringify(secondary));
  }, [secondary]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.floating-popover') && !event.target.closest('.color-circle-btn') && !event.target.closest('.action-icon')) {
        setOpenPopover({ type: null, id: null });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --- 5. ฟังก์ชันจัดการสี ---
  const handleHexInput = (val, callback) => {
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

  return (
    <aside className="sidebar-container">
      <div className="sidebar-section mood-section">
        <h3 className="section-title">Mood & Tone</h3>
        <div className="mood-grid">
          {moods.map(mood => <button key={mood} className={`mood-btn ${activeMood === mood ? 'active' : ''}`} onClick={() => setActiveMood(mood)}>{mood}</button>)}
        </div>
        <button className="generate-btn"><div className="gen-btn-text">Generate Color</div></button>
      </div>

      <div className="sidebar-section palette-section">
        {/* Primary Color */}
        <div className="color-group">
          <label className="section-title">Primary Colors</label>
          <div className="input-wrapper">
            <button className="color-circle-btn" style={{ backgroundColor: `#${primary.value || 'FFF'}` }} onClick={() => togglePopover('picker', 'primary')} />
            <span className="hex-prefix">#</span>
            <input type="text" value={primary.value} onChange={(e) => handleHexInput(e.target.value, (val) => setPrimary({ ...primary, value: val }))} readOnly={primary.isLocked} className={primary.isLocked ? 'locked-input' : ''} />
            <div className="action-group">
              <button className="action-icon" onClick={() => togglePopover('gradient', 'primary')}><Palette size={16} /></button>
              <button className="action-icon" onClick={() => setPrimary({ ...primary, isLocked: !primary.isLocked })}>{primary.isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
            </div>
            {openPopover.type === 'picker' && openPopover.id === 'primary' && <FloatingPicker hex={primary.value} onChange={(hex) => updateColorValue('primary', hex)} />}
            {openPopover.type === 'gradient' && openPopover.id === 'primary' && <FloatingGradient baseHex={primary.value} />}
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
                <input type="text" value={slot.value} onChange={(e) => handleHexInput(e.target.value, (val) => updateColorValue(slot.id, val))} readOnly={slot.isLocked} className={slot.isLocked ? 'locked-input' : ''} />
                <div className="action-group">
                  <button className="action-icon" onClick={() => handleRemoveSecondary(slot.id)}><Minus size={16} /></button>
                  <button className="action-icon" onClick={() => togglePopover('gradient', slot.id)}><Palette size={16} /></button>
                  <button className="action-icon" onClick={() => setSecondary(prev => prev.map(s => s.id === slot.id ? { ...s, isLocked: !s.isLocked } : s))}>{slot.isLocked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                </div>
                {openPopover.type === 'picker' && openPopover.id === slot.id && <FloatingPicker hex={slot.value} onChange={(hex) => updateColorValue(slot.id, hex)} />}
                {openPopover.type === 'gradient' && openPopover.id === slot.id && <FloatingGradient baseHex={slot.value} />}
              </div>
            ))}
            {[...Array(5 - secondary.length)].map((_, index) => <div key={`empty-${index}`} className="dashed-add-slot" onClick={handleAddSecondary}><Plus size={20} className="plus-icon" /></div>)}
          </div>
        </div>

        {/* Neutral */}
        <div className="color-group neutral-group">
          <label className="section-title">Neutral Colors</label>
          <div className="shades-grid neutral-grid">
            {neutralShades.map((shade, index) => (
              <div key={index} className="shade-cell" style={{ backgroundColor: `#${shade}` }}><span className="shade-text always-visible" style={{ color: getContrastColor(shade) }}>#{shade}</span></div>
            ))}
            <div className="shade-cell empty-cell"></div>
          </div>
        </div>

        {/* 📍 ปุ่ม Save Palette กดแล้วเปิดหน้าต่าง Modal */}
        <button 
          className="save-palette-btn" 
          onClick={() => setIsSaveModalOpen(true)}
        >
          Save Palette
        </button>
      </div>

      {/* 📍 เรียกใช้งาน Component หน้าต่าง SavePaletteModal */}
      <SavePalette
          isOpen={isSaveModalOpen} 
          onClose={() => setIsSaveModalOpen(false)} 
          colors={currentColors}
          userId={userId}
      />
    </aside>
  );
};

export default Sidebar;