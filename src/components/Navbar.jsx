import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Menu, User, Shield, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../pages/user/Auth';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Navbar = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Error logging out');
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-pista-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="p-2 bg-pista-light rounded-xl group-hover:bg-pista-dark group-hover:text-white transition-all duration-300">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-pista-deep">EduNotes</span>
                        </Link>

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

                        <button className="md:hidden p-2 text-pista-deep">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </>
    );
};

export default Navbar;
