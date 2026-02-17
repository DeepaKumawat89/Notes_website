import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, FileStack, LogOut, BookOpen, Users, MessageSquare, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AdminSidebar = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const menuItems = [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Upload Notes', path: '/admin/upload', icon: Upload },
        { title: 'Manage Notes', path: '/admin/manage', icon: FileStack },
        { title: 'Manage Quizzes', path: '/admin/quizzes', icon: BookOpen },
        { title: 'Users List', path: '/admin/users', icon: Users },
        { title: 'Payments', path: '/admin/payments', icon: CreditCard },
    ];

    React.useEffect(() => {
        const localSessionId = localStorage.getItem('adminSessionId');
        if (!localSessionId) {
            window.location.replace('/admin/login');
            return;
        }

        const sessionDocRef = doc(db, 'admin_settings', 'session');

        // Health Maintenance: Update lastActive on mount if session is valid
        const refreshSession = async () => {
            try {
                const snapshot = await getDoc(sessionDocRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    const now = Date.now();
                    const lastActive = data.lastActive?.toDate()?.getTime() || 0;
                    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

                    if (data.activeSessionId === localSessionId) {
                        if (now - lastActive < thirtyDaysInMs) {
                            // Session is healthy, refresh it to extend the 30-day window
                            await updateDoc(sessionDocRef, {
                                lastActive: serverTimestamp()
                            });
                        } else {
                            // Expired
                            localStorage.removeItem('adminSessionId');
                            window.location.replace('/admin/login');
                        }
                    }
                }
            } catch (error) {
                console.error("Session health refresh error:", error);
            }
        };

        refreshSession();

        const unsubscribe = onSnapshot(sessionDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const activeSessionId = data.activeSessionId;

                // Sync termination check (already existing logic)
                if (activeSessionId !== localSessionId) {
                    toast.error('Session terminated: Logged in from another device.', {
                        duration: 5000,
                        id: 'admin-session-error'
                    });
                    localStorage.removeItem('adminSessionId');
                    window.location.replace('/admin/login');
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            // Clear remote session
            await setDoc(doc(db, 'admin_settings', 'session'), {
                activeSessionId: null,
                lastLogout: new Date()
            });
            localStorage.removeItem('adminSessionId');
            toast.success('Admin logged out successfully');
            window.location.href = '/';
        } catch (error) {
            console.error("Logout Error:", error);
            window.location.href = '/';
        }
    };

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            {/* Mobile Navigation Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-[60] shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pista-dark text-white rounded-xl">
                        <BookOpen size={20} />
                    </div>
                    <span className="font-black text-slate-900 tracking-tight italic">Admin <span className="text-pista-dark not-italic">Panel</span></span>
                </div>
                <button
                    onClick={toggleMenu}
                    className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-transparent active:scale-95"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <LayoutDashboard size={24} />}
                </button>
            </div>

            {/* Backdrop for Mobile */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleMenu}
                        className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar (Desktop & Mobile) */}
            <div className={`
                fixed top-0 left-0 bottom-0 bg-white border-r border-gray-100 z-[80] transition-all duration-500 ease-in-out
                lg:w-72 lg:translate-x-0
                ${isMobileMenuOpen ? 'w-80 translate-x-0 shadow-2xl' : 'w-80 -translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col pt-10">
                    <div className="px-8 mb-12 hidden lg:flex items-center space-x-4">
                        <div className="p-3 bg-pista-dark text-white rounded-2xl shadow-lg shadow-pista/20">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-slate-900 italic">Admin</span>
                            <span className="text-[10px] font-black text-pista-dark uppercase tracking-[0.3em]">Panel</span>
                        </div>
                    </div>

                    <div className="lg:hidden px-8 mb-12 flex items-center space-x-4 pt-10 lg:pt-0">
                        <button onClick={toggleMenu} className="p-2 bg-slate-50 rounded-xl lg:hidden">
                            <X size={20} className="text-slate-400" />
                        </button>
                        <span className="font-black text-slate-900">Close Menu</span>
                    </div>

                    <nav className="flex-1 px-6 space-y-4">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Core Management</p>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center space-x-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 font-black text-xs uppercase tracking-widest ${isActive
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-pista-dark'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-pista-dark' : ''} />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 mt-auto border-t border-gray-50 space-y-3 pb-10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-4 px-6 py-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-xs uppercase tracking-widest bg-red-50/50"
                        >
                            <LogOut size={20} />
                            <span>System Exit</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;
