// ไฟล์: src/frontend/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Moon, User, Palette, ChevronDown, Compass, X, ShieldCheck } from 'lucide-react';
import './Navbar.css';
import { supabase } from '../backend/supabaseClient';


const Navbar = ({ activeTab, setActiveTab, openMyPalette, isExploreMode, setIsExploreMode }) => {
    const [user, setUser] = useState(null);
    const [dbUser, setDbUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const syncUserToDB = async (authUser) => {
        if (!authUser) return;

        const timestamp = new Date().toISOString();

        // โครงสร้างข้อมูลที่จะส่งไปเซฟ
        const userData = {
            user_id: authUser.id,
            user_name: authUser.user_metadata.full_name,
            email: authUser.email,
            last_login: timestamp,
            // 💡 เราไม่ส่ง created_at ไปด้วย เพราะถ้า Insert ใหม่ Supabase จะใส่ now() ให้เอง
            // และถ้า Update มันก็จะไม่ไปทับ created_at เดิม
        };

        // ทำการ Upsert ลงตาราง 'users' (ถ้าคุณตั้งชื่อตารางว่า profiles ให้เปลี่ยนตรงนี้นะครับ)
        const { data, error } = await supabase
            .from('user')
            .upsert(userData, { onConflict: 'user_id' }) // ถ้ารหัส id ซ้ำ ให้ทำการอัปเดต
            .select() // สั่งให้ส่งข้อมูลที่บันทึกเสร็จแล้วกลับมาด้วย
            .single(); // เอาแค่ Record เดียว

        if (error) {
            console.error('Error syncing user:', error);
        } else {
            console.log('User synced to DB:', data);
            setDbUser(data); // 📍 เก็บข้อมูลที่ดึงมาจาก Database ลง State
        }
    };

    useEffect(() => {
        // เช็คตอนโหลดเว็บครั้งแรก
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) syncUserToDB(currentUser);
        });

        // ดักจับการเปลี่ยนแปลง (เช่น เพิ่งกดปุ่ม Login ตะกี้)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (event === 'SIGNED_IN' && currentUser) {
                syncUserToDB(currentUser);
            } else if (event === 'SIGNED_OUT') {
                setDbUser(null); // เคลียร์ข้อมูลตอนออกระบบ
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // 📍 เพิ่มบรรทัดนี้: บังคับให้ Google โชว์หน้าเลือกบัญชีทุกครั้งที่กด Login
                queryParams: {
                    prompt: 'select_account',
                },
            },
        });

        if (error) console.error('Login error:', error.message);
    };

    const handleExploreClick = () => {
        // กดครั้งแรกเปิดโหมด, ถ้าเปิดอยู่แล้วกดกากบาทถึงจะปิด (Logic จะอยู่ใน JSX)
        if (!isExploreMode) {
            setIsExploreMode(true);
            console.log("Navigating to Explore Mode...");
            // TODO: ใส่ Logic เพิ่มเติมที่นี่ เช่น การดึงจานสีสาธารณะมาแสดงใน Preview
        }
    };

    const handleCloseExplore = (e) => {
        e.stopPropagation(); // สำคัญ! ป้องกันไม่ให้ Event วิ่งไปโดนปุ่ม Explore จนเปิดกลับมาอีกครั้ง
        setIsExploreMode(false);
        console.log("Exiting Explore Mode");
        // TODO: ใส่ Logic เพิ่มเติมที่นี่ เช่น การล้างจานสีสาธารณะออกจากPreview
    };

    const handleLogout = async () => {
        if (window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            await supabase.auth.signOut();
            setIsDropdownOpen(false);
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">UI PaintBoard</div>

                <div className="navbar-center">
                    <div className="toggle-container">
                        <div className={`slide-bg ${activeTab === 'Image' ? 'slide-right' : ''}`}></div>
                        <button className={`toggle-btn ${activeTab === 'Generate' ? 'active' : ''}`} onClick={() => setActiveTab('Generate')}>Generate</button>
                        <button className={`toggle-btn ${activeTab === 'Image' ? 'active' : ''}`} onClick={() => setActiveTab('Image')}>Image</button>
                    </div>
                </div>

                <div className="navbar-right">
                    {isExploreMode ? (
                        <div className="explore-btn active">
                            <Compass size={18} />
                            <span>Explore</span>
                            <button className="close-explore-btn" onClick={handleCloseExplore} title="Close Explore">
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <button className="explore-btn" onClick={handleExploreClick}>
                            <Compass size={18} />
                            <span>Explore</span>
                        </button>
                    )}
                    <button className="icon-btn">
                        <Moon size={20} fill="currentColor" />
                    </button>

                    {user ? (
                        <div className="profile-container" ref={dropdownRef}>
                            <button
                                className="profile-trigger-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <img
                                    src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`}
                                    alt="Profile"
                                    className="profile-img-nav"
                                    referrerPolicy="no-referrer"
                                />

                                {/* 1. ย้ายชื่อออกไปแล้ว เหลือแค่ Badge กับ Chevron */}
                                {dbUser?.is_admin && (
                                    <div className="admin-badge" title="Administrator">
                                        <ShieldCheck size={12} strokeWidth={2.5} />
                                        <span>Admin</span>
                                    </div>
                                )}
                                <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="profile-dropdown">
                                    {/* 2. เพิ่มส่วนแสดงชื่อผู้ใช้ไว้ที่นี่ (บนสุดของ Dropdown) */}
                                    <div className="dropdown-user-info">
                                        <span className="dropdown-user-name">
                                            {dbUser ? dbUser.user_name : user.user_metadata.full_name}
                                        </span>
                                        <span className="dropdown-user-email">{user.email}</span>
                                    </div>

                                    <div className="dropdown-divider"></div>

                                    <button className="dropdown-item" onClick={openMyPalette}>
                                        <Palette size={20} />
                                        <span>My Palettes</span>
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout-text" onClick={handleLogout}>
                                        Log-out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="icon-btn profile-btn" onClick={handleLogin}>
                            <User size={20} />
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;