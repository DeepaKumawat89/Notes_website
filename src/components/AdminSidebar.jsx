import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, FileStack, LogOut, BookOpen, Users, MessageSquare, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [authLoading, setAuthLoading] = React.useState(true);

    const menuItems = [
        { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'Upload Notes', path: '/admin/upload', icon: Upload },
        { title: 'Manage Notes', path: '/admin/manage', icon: FileStack },
        { title: 'Manage Quizzes', path: '/admin/quizzes', icon: BookOpen },
        { title: 'Users List', path: '/admin/users', icon: Users },
        { title: 'Payments', path: '/admin/payments', icon: CreditCard },
    ];

    React.useEffect(() => {
        let unsubscribeSession = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setAuthLoading(false);
                if (!localStorage.getItem('adminLoggingOut')) {
                    window.location.replace('/admin/login');
                }
                return;
            }

            if (!user?.email?.toLowerCase()?.startsWith('admin')) {
                setAuthLoading(false);
                window.location.replace('/admin/login');
                return;
            }

            const localSessionId = localStorage.getItem('adminSessionId');
            const adminDocRef = doc(db, 'admins', user?.email || 'unknown');

            try {
                // Refresh grace period pulse on valid detection
                localStorage.setItem('adminLastUpdate', Date.now().toString());

                // 1. Update last active status
                await updateDoc(adminDocRef, {
                    lastActive: serverTimestamp()
                });

                // 2. Setup Real-time listener for session termination
                unsubscribeSession = onSnapshot(adminDocRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.data();
                        const activeSessions = data.activeSessions || [];

                        const lastUpdate = localStorage.getItem('adminLastUpdate');
                        const gracePeriod = 10000; // Increased to 10 seconds for initial sync
                        const isRecentlyUpdated = lastUpdate && (Date.now() - parseInt(lastUpdate) < gracePeriod);

                        if (!isRecentlyUpdated && localSessionId && !activeSessions.includes(localSessionId)) {
                            toast.error('Session terminated: Logged in from another device.', {
                                id: 'admin-term-toast'
                            });
                            signOut(auth).then(() => {
                                localStorage.removeItem('adminSessionId');
                                localStorage.removeItem('adminLastUpdate');
                                window.location.replace('/admin/login');
                            });
                        }
                    }
                    setAuthLoading(false);
                }, (err) => {
                    console.error("Snapshot error:", err);
                    setAuthLoading(false);
                });
            } catch (error) {
                console.error("Session monitor error:", error);
                setAuthLoading(false);
            }
        });

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeSession) unsubscribeSession();
        };
    }, []);

    const handleLogout = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const adminRef = doc(db, 'admins', user.email);
                const localSessionId = localStorage.getItem('adminSessionId');
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists()) {
                    const currentSessions = adminSnap.data().activeSessions || [];
                    const updatedSessions = currentSessions.filter(id => id !== localSessionId);
                    await updateDoc(adminRef, {
                        activeSessions: updatedSessions,
                        lastLogout: serverTimestamp()
                    });
                }
            }

            localStorage.setItem('adminLoggingOut', 'true');
            await signOut(auth);
            localStorage.removeItem('adminSessionId');
            localStorage.removeItem('adminLastUpdate');

            toast.success('Admin logged out successfully');
            window.location.replace('/');

            // Clean up the flag after a short delay in case redirect is slow
            setTimeout(() => localStorage.removeItem('adminLoggingOut'), 1000);
        } catch (error) {
            console.error("Logout Error:", error);
            window.location.href = '/';
        }
    };

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    if (authLoading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pista-dark"></div>
            </div>
        );
    }

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
                ${isMobileMenuOpen ? 'w-[280px] translate-x-0 shadow-2xl' : 'w-[280px] -translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col pt-6 lg:pt-10">
                    <div className="px-8 mb-12 hidden lg:flex items-center space-x-4">
                        <div className="p-3 bg-pista-dark text-white rounded-2xl shadow-lg shadow-pista/20">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-slate-900 italic">Admin</span>
                            <span className="text-[10px] font-black text-pista-dark uppercase tracking-[0.3em]">Panel</span>
                        </div>
                    </div>

                    <div className="lg:hidden px-8 mb-10 flex items-center justify-between pt-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-pista-dark text-white rounded-xl">
                                <BookOpen size={18} />
                            </div>
                            <span className="font-black text-slate-900">Admin</span>
                        </div>
                        <button onClick={toggleMenu} className="p-2 bg-slate-50 rounded-xl">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 lg:px-6 space-y-2 lg:space-y-4">
                        <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 lg:mb-4">Core Management</p>
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
