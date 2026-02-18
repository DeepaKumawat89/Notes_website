import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Download, Search, CheckCircle2, ArrowRight, Loader2, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AuthModal from '../../pages/user/Auth';
import SubscriptionModal from '../../components/SubscriptionModal';
import NoteSkeleton from '../../components/NoteSkeleton';
import toast from 'react-hot-toast';

const Home = () => {
    const [recentNotes, setRecentNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

    useEffect(() => {
        let unsubscribeUser = null;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Redirect admin to dashboard if they land here
                if (currentUser.email.toLowerCase().startsWith('admin')) {
                    window.location.replace('/admin/dashboard');
                }

                // Listen to user data
                unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.email), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                });
            } else {
                setUserData(null);
            }
        });

        const q = query(
            collection(db, 'notes'),
            orderBy('createdAt', 'desc'),
            limit(6)
        );

        const unsubscribeNotes = onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentNotes(notes);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNotes();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, []);

    const handleProtectedNavigation = async (fileUrl) => {
        if (!user) {
            setIsAuthOpen(true);
            toast('Please login to view study materials', {
                icon: '🔒',
                style: {
                    borderRadius: '15px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }

        try {
            const userRef = doc(db, 'users', user.email);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const isPremium = data.subscription === 'premium';
                const views = data.viewsCount || 0;

                if (isPremium || views < 3) {
                    if (fileUrl) {
                        if (!isPremium) {
                            await updateDoc(userRef, {
                                viewsCount: increment(1)
                            });
                        } else {
                            toast.success('Premium Access Granted', {
                                icon: '🌟',
                                style: {
                                    borderRadius: '15px',
                                    background: '#7C3AED',
                                    color: '#fff',
                                },
                            });
                        }
                        window.open(fileUrl, '_blank');
                    } else {
                        toast.error('File link not available');
                    }
                } else {
                    setIsSubscriptionOpen(true);
                }
            } else {
                toast.error('User data not found');
            }
        } catch (error) {
            console.error("Access Error:", error);
            toast.error('Failed to verify access');
        }
    };

    // Format relative time helper
    const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const now = new Date();
        const date = timestamp.toDate();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="min-h-screen bg-cream-light pt-20 overflow-x-hidden">
            <Navbar />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            <SubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
                user={user}
            />

            {/* Hero Section */}
            {/* ... (keep existing hero code) ... */}
            <section className="relative px-6 pt-12 pb-24 mx-auto max-w-7xl lg:pt-32">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {userData?.subscription === 'premium' ? (
                            <>
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-indigo-100 shadow-sm animate-pulse">
                                    <Crown size={12} className="mr-2" />
                                    Elite Scholastic Access Active
                                </div>
                                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 italic">
                                    Master Your <span className="text-indigo-600 not-italic">Legacy,</span> {userData?.name?.split(' ')[0] || 'Scholar'}.
                                </h1>
                                <p className="text-lg font-bold text-slate-400 mb-10 max-w-lg uppercase tracking-widest leading-relaxed">
                                    Your unlimited repository of verified digital assets is synchronized and ready for research.
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-pista-light/50 text-pista-deep text-sm font-semibold mb-6">
                                    <span className="flex h-2 w-2 rounded-full bg-pista-dark mr-2"></span>
                                    The Ultimate Notes Platform
                                </div>
                                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-pista-deep leading-tight mb-6">
                                    Elevate Your <span className="text-pista-dark">Learning</span> Journey.
                                </h1>
                                <p className="text-lg text-pista-deep/70 mb-10 max-w-lg font-medium">
                                    Access high-quality, curated study materials for classes 10, 11, and 12.
                                    Organized, readable, and free to download.
                                </p>
                            </>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/classes" className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-pista-dark text-white rounded-2xl font-bold hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-95">
                                <span>Start Learning</span>
                                <ArrowRight size={20} />
                            </Link>
                            <button className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-pista-deep border-2 border-pista-light rounded-2xl font-bold hover:bg-pista-light transition-all active:scale-95">
                                <span>How it Works</span>
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute -top-12 -left-12 w-64 h-64 bg-pista-light/40 rounded-full blur-3xl invisible lg:visible"></div>
                        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-cream/50 rounded-full blur-3xl invisible lg:visible"></div>
                        <div className={`relative ${userData?.subscription === 'premium' ? 'bg-indigo-600/5' : 'glass-card'} rounded-[3rem] p-4 sm:p-8 transform rotate-1 sm:rotate-2 hover:rotate-0 transition-all duration-700 border ${userData?.subscription === 'premium' ? 'border-indigo-200 shadow-[0_0_50px_rgba(79,70,229,0.1)]' : 'border-white/20'}`}>
                            {userData?.subscription === 'premium' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[3rem] -z-10" />
                            )}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-cream-light rounded-2xl p-4 sm:p-6 h-32 sm:h-40 flex flex-col justify-end">
                                        <div className="h-1.5 sm:h-2 w-10 sm:w-12 bg-pista/30 rounded-full mb-2 sm:mb-3"></div>
                                        <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-pista/20 rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-2xl p-4 sm:p-6 w-5/6 sm:w-3/4 border border-pista-light">
                                <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                                    <div className="p-2 sm:p-3 bg-pista-light rounded-xl text-pista-dark">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-pista-deep">Chapter 04: Genetics</h4>
                                        <p className="text-xs text-pista-deep/60">Molecular Biology</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold px-2 py-1 bg-pista-light rounded text-pista-dark">PDF</span>
                                    <button className="p-2 bg-pista-dark text-white rounded-lg"><Download size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: 'Downloads', value: '10K+', icon: Download },
                            { label: 'Active Users', value: '5K+', icon: GraduationCap },
                            { label: 'Subject Guides', value: '500+', icon: BookOpen },
                            { label: 'Verification rate', value: '100%', icon: CheckCircle2 },
                        ].map((stat, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <div className={`inline-flex p-3 ${userData?.subscription === 'premium' ? 'bg-indigo-50 text-indigo-600' : 'bg-cream-light text-pista-dark'} rounded-2xl mb-4 transition-colors duration-700`}>
                                    <stat.icon size={28} />
                                </div>
                                <h3 className={`text-3xl font-black ${userData?.subscription === 'premium' ? 'text-slate-900' : 'text-pista-deep'} mb-1 transition-colors duration-700`}>{stat.value}</h3>
                                <p className={`font-bold ${userData?.subscription === 'premium' ? 'text-slate-400 uppercase tracking-widest text-[10px]' : 'text-pista-deep/60'} transition-colors duration-700`}>{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Daily Quiz Banner */}
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className={`${userData?.subscription === 'premium' ? 'bg-indigo-950' : 'bg-slate-900'} rounded-[3rem] p-8 lg:p-12 relative overflow-hidden group shadow-2xl shadow-slate-200 transition-colors duration-500`}
                    >
                        <div className={`absolute top-0 right-0 p-12 ${userData?.subscription === 'premium' ? 'text-purple-500/10' : 'text-pista-dark/10'} -rotate-12 translate-x-1/2 -translate-y-1/2 group-hover:rotate-0 transition-transform duration-1000`}>
                            <Zap size={280} />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6">
                                <div className={`inline-flex items-center gap-3 px-4 py-2 ${userData?.subscription === 'premium' ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-pista-dark/20 text-pista-dark border-pista-dark/30'} rounded-full border`}>
                                    <div className={`w-2 h-2 ${userData?.subscription === 'premium' ? 'bg-purple-500' : 'bg-pista-dark'} rounded-full animate-pulse`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {userData?.subscription === 'premium' ? 'UNLIMITED ACCESS UNLOCKED' : 'Institutional Challenge'}
                                    </span>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black text-white italic leading-tight">
                                    Today's Knowledge <span className={`${userData?.subscription === 'premium' ? 'text-purple-500' : 'text-pista-dark'} not-italic`}>Vault</span> is Active.
                                </h2>
                                <p className="text-slate-400 font-bold max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                                    {userData?.subscription === 'premium'
                                        ? 'As a premium scholar, you have full access to advanced assessments and priority rankings.'
                                        : 'Test your understanding of recent concepts. Earn points and climb the elite student ranks.'}
                                </p>
                            </div>
                            <div className="flex justify-center lg:justify-end">
                                <Link
                                    to="/daily-quiz"
                                    className={`w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 ${userData?.subscription === 'premium' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-pista-dark hover:bg-pista-deep'} text-white rounded-[2rem] font-black uppercase text-[10px] sm:text-xs tracking-[0.3em] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-4`}
                                >
                                    <span>{userData?.subscription === 'premium' ? 'Enter Elite Assessment' : 'Enter Assessment Arena'}</span>
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Chapters (Recent Uploads) */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
                    <div>
                        <h2 className={`text-4xl font-black ${userData?.subscription === 'premium' ? 'text-slate-900 leading-tight italic' : 'text-pista-deep'} mb-4`}>
                            {userData?.subscription === 'premium' ? 'Elite Repository' : 'Recent Uploads'}
                        </h2>
                        <p className={`font-bold ${userData?.subscription === 'premium' ? 'text-indigo-400 uppercase tracking-[0.2em] text-xs' : 'text-pista-deep/60'}`}>
                            {userData?.subscription === 'premium' ? 'Curated Verified Digital Assets' : 'Get the latest notes added to our library.'}
                        </p>
                    </div>
                    <Link to="/classes" className="flex items-center space-x-2 text-pista-dark font-bold hover:underline">
                        <span>Browse all</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => <NoteSkeleton key={i} />)
                    ) : (
                        <AnimatePresence>
                            {recentNotes.map((note, idx) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className={`relative ${note.isPremium && userData?.subscription === 'premium' ? 'bg-indigo-50/30' : 'bg-white'} rounded-[2.5rem] p-6 group transition-all duration-700 shadow-xl ${note.isPremium && userData?.subscription === 'premium' ? 'shadow-indigo-500/10 border-indigo-200' : 'shadow-pista/5 border-pista-light/10'} border`}
                                >
                                    {note.isPremium && userData?.subscription === 'premium' && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 rounded-[2.5rem] -z-10" />
                                    )}
                                    <div className="w-full h-48 bg-pista-light/30 rounded-2xl mb-6 overflow-hidden flex items-center justify-center relative shadow-inner">
                                        {note.thumbnailUrl ? (
                                            <img
                                                src={note.thumbnailUrl}
                                                alt={note.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <BookOpen size={64} className="text-pista/40 group-hover:scale-110 transition-transform duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <div className="px-3 py-1 bg-white/80 backdrop-blur-md border border-pista-light rounded-full text-[10px] font-black tracking-widest text-pista-dark uppercase">
                                                {note.classId}
                                            </div>
                                            {note.isPremium && (
                                                <div className="px-3 py-1 bg-purple-600 border border-purple-400 rounded-full text-[10px] font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                                                    <Zap size={10} fill="currentColor" />
                                                    PREMIUM
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-pista-deep mb-1 line-clamp-1">{note.title}</h3>
                                            <p className="text-sm text-pista-deep/60 font-bold uppercase tracking-tight">
                                                {note.subjectId} • {note.size || '0 MB'}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-pista-dark text-white rounded-full text-[10px] font-black tracking-widest">PDF</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-pista-light/50">
                                        <p className="text-xs text-pista-deep/40 font-bold italic">Uploaded {getRelativeTime(note.createdAt)}</p>
                                        <button
                                            onClick={() => handleProtectedNavigation(note.fileUrl)}
                                            className="flex items-center space-x-2 text-pista-dark font-black group-hover:translate-x-1 transition-transform"
                                        >
                                            <span>View</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-pista-deep text-white py-16 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-pista rounded-xl text-white">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">EduNotes</span>
                        </div>
                        <p className="text-pista-light/60 max-w-sm mb-8 leading-relaxed">
                            Empowering students with accessible, high-quality educational resources.
                            Our mission is to make learning organized and simple for everyone.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-pista-light">Quick Links</h4>
                        <ul className="space-y-4 text-pista-light/50">
                            <li><Link to="/classes" className="hover:text-white transition-colors">Select Class</Link></li>
                            <li><Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link></li>
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-sm text-pista-light/30">
                    © 2026 EduNotes Archive. All rights reserved. Designed with ❤️ for students.
                </div>
            </footer>
        </div>
    );
};

export default Home;
