import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Menu, X, User, Shield, LogOut, Loader2, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../pages/user/Auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Navbar = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        let unsubscribeDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Listen to user document for session changes and real-time data
                unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);

                        // Session validation logic
                        const currentSessionId = localStorage.getItem('activeSessionId');
                        // Only validate if we have a locally stored session ID and the database has an active list
                        if (currentSessionId && data.activeSessions && data.activeSessions.length > 0) {
                            if (!data.activeSessions.includes(currentSessionId)) {
                                handleLogout('Logged out: Active on another device');
                            }
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
            if (user && currentSessionId) {
                await updateDoc(doc(db, 'users', user.uid), {
                    activeSessions: arrayRemove(currentSessionId)
                });
            }
            await signOut(auth);
            localStorage.removeItem('activeSessionId');
            toast.success(customMessage || 'Logged out successfully');
            setIsMobileMenuOpen(false);
        } catch (error) {
            console.error("Logout Error:", error);
            toast.error('Error logging out');
        }
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none p-4 sm:p-6 transition-all duration-500">
                <nav className={`w-full max-w-7xl pointer-events-auto transition-all duration-500 ease-in-out ${isScrolled
                    ? 'bg-white/90 backdrop-blur-md rounded-[2.5rem] px-6 sm:px-8 py-1.5 shadow-xl shadow-pista/10 border border-pista-light/30 scale-[0.98]'
                    : 'bg-white/60 backdrop-blur-sm rounded-[3rem] px-8 sm:px-10 py-3 border border-white/40'
                    }`}>
                    <div className="flex justify-between items-center h-12 sm:h-16">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="p-2 bg-pista-light rounded-2xl group-hover:bg-pista-dark group-hover:text-white transition-all duration-300">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-pista-deep">EduNotes</span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link to="/classes" className="text-pista-deep hover:text-pista-dark font-medium transition-colors">Classes</Link>

                            {loading ? (
                                <div className="flex items-center space-x-2 px-5 py-2.5">
                                    <Loader2 className="animate-spin text-pista-dark" size={18} />
                                </div>
                            ) : user ? (
                                <div className="flex items-center space-x-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center space-x-3 bg-pista-light/30 px-4 py-2 rounded-full border border-pista-light"
                                    >
                                        <div className="w-8 h-8 bg-pista-dark rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm border border-pista-light">
                                            {userData?.photoURL ? (
                                                <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" />
                                            ) : (
                                                userData?.name?.charAt(0).toUpperCase() || <User size={14} />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-pista-deep leading-none">
                                                {userData?.name || 'User'}
                                            </span>
                                            <span className="text-[10px] font-bold text-pista-deep/50 uppercase tracking-wider">
                                                Student Profile
                                            </span>
                                        </div>
                                    </motion.div>

                                    <button
                                        onClick={handleLogout}
                                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
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
                                                        <img src={userData.photoURL} alt={userData.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        userData?.name?.charAt(0).toUpperCase() || <User size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black text-pista-deep leading-none mb-1">{userData?.name || 'User'}</p>
                                                    <p className="text-xs font-bold text-pista-deep/50 uppercase tracking-widest">Active Profile</p>
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
                </nav>
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
        </>
    );
};

export default Navbar;
