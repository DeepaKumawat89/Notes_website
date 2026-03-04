import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Menu, X, User, Shield, LogOut, Loader2, ArrowUp, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import AuthModal from '../pages/user/Auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import toast from 'react-hot-toast';
import PremiumWelcomeModal from './PremiumWelcomeModal';

const Navbar = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPremiumWelcomeOpen, setIsPremiumWelcomeOpen] = useState(false);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (userData?.subscription === 'premium') {
            document.body.classList.add('premium-user');
        } else {
            document.body.classList.remove('premium-user');
        }
    }, [userData]);

    useEffect(() => {
        let unsubscribeDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Listen to user document for session changes and real-time data
                unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.email), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);

                        // Session validation logic
                        const currentSessionId = localStorage.getItem('activeSessionId');
                        const lastSessionUpdate = localStorage.getItem('lastSessionUpdate');
                        const gracePeriod = 5000; // 5 seconds grace period for new logins

                        if (currentSessionId && data.activeSessions) {
                            const isRecentlyUpdated = lastSessionUpdate && (Date.now() - parseInt(lastSessionUpdate) < gracePeriod);

                            if (!isRecentlyUpdated && data.activeSessions.length > 0 && !data.activeSessions.includes(currentSessionId)) {
                                handleLogout('Logged out: Active on another device');
                            }
                        }

                        // Premium Welcome check
                        if (data.subscription === 'premium' && !data.hasSeenPremiumWelcome) {
                            setIsPremiumWelcomeOpen(true);
                        }
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user data:", error);
                    setLoading(false);
                });
            } else {
                setUserData(null);
                if (unsubscribeDoc) {
                    unsubscribeDoc();
                    unsubscribeDoc = null;
                }
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const handleLogout = async (customMessage) => {
        try {
            const currentSessionId = localStorage.getItem('activeSessionId');
            const currentUser = auth.currentUser;

            // 1. Clear local storage immediately to stop session validation
            localStorage.removeItem('activeSessionId');
            localStorage.removeItem('lastSessionUpdate');

            // 2. Close menus
            setIsMobileMenuOpen(false);

            // 3. Try to update Firestore (don't let it block the logout if it fails)
            if (currentUser && currentSessionId) {
                try {
                    await updateDoc(doc(db, 'users', currentUser.email), {
                        activeSessions: arrayRemove(currentSessionId)
                    });
                } catch (dbError) {
                    console.warn("Could not remove session from database:", dbError);
                }
            }

            // 4. Perform actual sign out
            await signOut(auth);

            toast.success(customMessage || 'Logged out successfully');

            // 5. Force a navigation to home to ensure a clean state
            // This prevents "white screens" if the user was on a protected state
            window.location.href = '/';

        } catch (error) {
            console.error("Logout Error:", error);
            toast.error('Error logging out');
            // Even if everything fails, try to clear local storage
            localStorage.clear();
            window.location.href = '/';
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${isScrolled ? 'py-4 sm:py-6' : 'py-6 sm:py-8'}`}>
                {/* Elite Ambient Aura Background */}
                {userData?.subscription === 'premium' && (
                    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                                x: [0, 100, 0],
                                y: [0, 50, 0]
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1/2 -left-1/4 w-[100vw] h-[100vh] blur-[120px]"
                            style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)' }}
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                rotate: [0, -90, 0],
                                x: [0, -100, 0],
                                y: [0, -50, 0]
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-1/2 -right-1/4 w-[100vw] h-[100vh] blur-[120px]"
                            style={{ background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)' }}
                        />
                    </div>
                )}

                {/* Elite Scroll Progress Bar */}
                {userData?.subscription === 'premium' && (
                    <motion.div
                        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 origin-left z-[110] shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                        style={{ scaleX }}
                    />
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-8">
                    <div className={`w-full pointer-events-auto transition-all duration-500 ease-in-out ${isScrolled
                        ? 'bg-white/90 backdrop-blur-md rounded-[2.5rem] px-6 sm:px-8 py-1.5 shadow-xl shadow-pista/10 border border-pista-light/30 scale-[0.98]'
                        : 'bg-white/60 backdrop-blur-sm rounded-[3rem] px-8 sm:px-10 py-3 border border-white/40'
                        }`}>
                        <div className="flex justify-between items-center h-12 sm:h-16">
                            <Link to="/" className="flex items-center space-x-2 group">
                                <div className="p-2 bg-pista-light rounded-2xl group-hover:bg-pista-dark group-hover:text-white transition-all duration-300">
                                    <BookOpen size={24} />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-pista-deep">StudywithSN</span>
                            </Link>

                            {/* Desktop Menu */}
                            <div className="hidden md:flex items-center space-x-6">
                                <Link to="/classes" className="text-pista-deep hover:text-pista-dark font-medium transition-colors">Classes</Link>

                                {loading ? (
                                    <div className="flex items-center space-x-2 px-5 py-2.5">
                                        <Loader2 className="animate-spin text-pista-dark" size={18} />
                                    </div>
                                ) : user ? (
                                    <div className="flex items-center space-x-4 relative">
                                        <div className="flex items-center space-x-3 bg-pista-light/30 pl-4 pr-2 py-1.5 rounded-full border border-pista-light hover:bg-pista-light/50 transition-all active:scale-95 group">
                                            <div className="flex flex-col text-left mr-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-pista-deep leading-none">
                                                        {user?.email?.toLowerCase()?.startsWith('admin') ? 'Admin' : (userData?.name || 'User')}
                                                    </span>
                                                    {userData?.subscription === 'premium' && (
                                                        <span className="px-1.5 py-0.5 bg-purple-600 text-[8px] font-black text-white rounded-md uppercase tracking-wider animate-pulse">PREMIUM</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-pista-deep/50 uppercase tracking-wider">
                                                    {user?.email?.toLowerCase()?.startsWith('admin') ? 'Institutional Lead' : 'Student Profile'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                className="w-8 h-8 bg-pista-dark rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm border border-pista-light group-hover:rotate-12 transition-transform"
                                            >
                                                {userData?.photoURL ? (
                                                    <img src={userData.photoURL} alt={userData?.name || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    userData?.name?.charAt(0)?.toUpperCase() || (user?.email?.toLowerCase()?.startsWith('admin') ? 'A' : <User size={14} />)
                                                )}
                                            </button>
                                        </div>

                                        {user?.email?.toLowerCase()?.startsWith('admin') && (
                                            <Link to="/admin/dashboard" className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-pista-dark text-white rounded-full hover:bg-pista-deep transition-all shadow-lg shadow-pista/20 font-bold text-xs">
                                                <Shield size={14} />
                                                <span>Dashboard</span>
                                            </Link>
                                        )}

                                        <AnimatePresence>
                                            {isProfileOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40 pointer-events-auto" onClick={() => setIsProfileOpen(false)} />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 z-50 overflow-hidden"
                                                    >
                                                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                                            <div className="relative">
                                                                <div className="w-16 h-16 bg-pista-dark rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-pista-light">
                                                                    {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                                </div>
                                                                {userData?.subscription === 'premium' && (
                                                                    <div className="absolute -top-2 -right-2 p-1.5 bg-purple-600 text-white rounded-xl shadow-lg border-2 border-white">
                                                                        <Shield size={12} fill="currentColor" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-slate-900 leading-tight">
                                                                    {userData?.name || 'Academic User'}
                                                                </h4>
                                                                <div className="flex items-center justify-center gap-2 mt-1">
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                                        Verified Scholar
                                                                    </p>
                                                                    {userData?.subscription === 'premium' && (
                                                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">• Premium</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {userData?.subscription !== 'premium' && (
                                                            <Link
                                                                to="/"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setIsProfileOpen(false);
                                                                    // We could trigger the sub modal here if we passing the handler
                                                                }}
                                                                className="w-full mb-6 py-2 px-4 bg-purple-600/10 text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-600/20 transition-all border border-purple-200"
                                                            >
                                                                <Shield size={12} />
                                                                Upgrade to Premium Access
                                                            </Link>
                                                        )}

                                                        <div className="space-y-3 pt-4 border-t border-gray-50">
                                                            <button
                                                                onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                                                                className="w-full flex items-center justify-between px-6 py-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all font-black text-[10px] uppercase tracking-widest group"
                                                            >
                                                                <span>Terminate Session</span>
                                                                <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsAuthOpen(true)}
                                            className="flex items-center space-x-2 px-5 py-2.5 border-2 border-pista-dark text-pista-dark rounded-full hover:bg-pista-light transition-all active:scale-95 font-bold"
                                        >
                                            <User size={18} />
                                            <span>User Login</span>
                                        </button>
                                        <Link to="/admin/login" className="flex items-center space-x-2 px-5 py-2.5 bg-pista-dark text-white rounded-full hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-95 font-bold">
                                            <Shield size={18} />
                                            <span>Admin Login</span>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <div className="md:hidden flex items-center">
                                <button
                                    onClick={toggleMobileMenu}
                                    className="p-2.5 bg-pista-light/30 text-pista-deep rounded-xl hover:bg-pista-light transition-all active:scale-95"
                                >
                                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Drawer */}
                        <AnimatePresence>
                            {isMobileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="md:hidden bg-white border-b border-pista-light overflow-hidden shadow-2xl rounded-b-3xl"
                                >
                                    <div className="px-6 py-8 space-y-6">
                                        <Link
                                            to="/classes"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-xl font-bold text-pista-deep hover:text-pista-dark"
                                        >
                                            Explore Classes
                                        </Link>

                                        {user ? (
                                            <div className="pt-6 border-t border-pista-light/50">
                                                <div className="flex items-center space-x-4 mb-6">
                                                    <div className="w-12 h-12 bg-pista-dark rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg border border-pista-light">
                                                        {userData?.photoURL ? (
                                                            <img src={userData.photoURL} alt={userData?.name || 'User'} className="w-full h-full object-cover" />
                                                        ) : (
                                                            userData?.name?.charAt(0)?.toUpperCase() || <User size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-lg font-black text-pista-deep leading-none">{userData?.name || 'User'}</p>
                                                            {userData?.subscription === 'premium' && (
                                                                <span className="px-2 py-0.5 bg-purple-600 text-[8px] font-black text-white rounded-md uppercase tracking-wider">PREMIUM</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold text-pista-deep/50 uppercase tracking-widest">
                                                            {userData?.subscription === 'premium' ? 'Exclusive Scholar' : 'Free Academic Plan'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center justify-center space-x-3 py-4 bg-red-50 text-red-500 rounded-2xl font-bold transition-all active:scale-95"
                                                >
                                                    <LogOut size={20} />
                                                    <span>Terminate Session</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 pt-6 border-t border-pista-light/50">
                                                <button
                                                    onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                                                    className="w-full flex items-center justify-center space-x-3 py-4 border-2 border-pista-dark text-pista-dark rounded-2xl font-bold hover:bg-pista-light transition-all active:scale-95"
                                                >
                                                    <User size={20} />
                                                    <span>User Login</span>
                                                </button>
                                                <Link
                                                    to="/admin/login"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="w-full flex items-center justify-center space-x-3 py-4 bg-pista-dark text-white rounded-2xl font-bold hover:bg-pista-deep transition-all active:scale-95 shadow-xl shadow-pista/10"
                                                >
                                                    <Shield size={20} />
                                                    <span>Admin Access</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

                {/* Back to Top Button */}
                <AnimatePresence>
                    {isScrolled && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5, y: 20 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="fixed bottom-8 right-8 z-[60] p-4 bg-pista-dark text-white rounded-2xl shadow-2xl shadow-pista/40 hover:bg-pista-deep hover:-translate-y-1 transition-all active:scale-95 group"
                            title="Back to Top"
                        >
                            <ArrowUp size={24} className="group-hover:animate-bounce" />
                        </motion.button>
                    )}
                </AnimatePresence>
                <PremiumWelcomeModal
                    isOpen={isPremiumWelcomeOpen}
                    onClose={() => setIsPremiumWelcomeOpen(false)}
                    userEmail={user?.email}
                />
            </nav>
        </>
    );
};

export default Navbar;
