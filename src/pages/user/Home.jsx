import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Download, Search, CheckCircle2, ArrowRight, Loader2, Zap } from 'lucide-react';
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
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // Redirect admin to dashboard if they land here
            if (currentUser && currentUser.email.toLowerCase().startsWith('admin')) {
                window.location.replace('/admin/dashboard');
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
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const isPremium = userData.subscription === 'premium';
                const views = userData.viewsCount || 0;

                if (isPremium || views < 3) {
                    if (fileUrl) {
                        if (!isPremium) {
                            await updateDoc(userRef, {
                                viewsCount: increment(1)
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
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-pista-light/50 text-pista-deep text-sm font-semibold mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-pista-dark mr-2"></span>
                            The Ultimate Notes Platform
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-pista-deep leading-tight mb-6">
                            Elevate Your <span className="text-pista-dark">Learning</span> Journey.
                        </h1>
                        <p className="text-lg text-pista-deep/70 mb-10 max-w-lg">
                            Access high-quality, curated study materials for classes 10, 11, and 12.
                            Organized, readable, and free to download.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/classes" className="flex items-center justify-center space-x-2 px-8 py-4 bg-pista-dark text-white rounded-2xl font-bold hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-95">
                                <span>Start Learning</span>
                                <ArrowRight size={20} />
                            </Link>
                            <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-pista-deep border-2 border-pista-light rounded-2xl font-bold hover:bg-pista-light transition-all active:scale-95">
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
                        <div className="relative glass-card rounded-3xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-cream-light rounded-2xl p-6 h-40 flex flex-col justify-end">
                                        <div className="h-2 w-12 bg-pista/30 rounded-full mb-3"></div>
                                        <div className="h-2 w-20 bg-pista/20 rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-2xl p-6 w-3/4 border border-pista-light">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-3 bg-pista-light rounded-xl text-pista-dark">
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
                                <div className="inline-flex p-3 bg-cream-light rounded-2xl text-pista-dark mb-4">
                                    <stat.icon size={28} />
                                </div>
                                <h3 className="text-3xl font-bold text-pista-deep mb-1">{stat.value}</h3>
                                <p className="text-pista-deep/60 font-medium">{stat.label}</p>
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
                        className="bg-slate-900 rounded-[3rem] p-8 lg:p-12 relative overflow-hidden group shadow-2xl shadow-slate-200"
                    >
                        <div className="absolute top-0 right-0 p-12 text-pista-dark/10 -rotate-12 translate-x-1/2 -translate-y-1/2 group-hover:rotate-0 transition-transform duration-1000">
                            <Zap size={280} />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-pista-dark/20 text-pista-dark rounded-full border border-pista-dark/30">
                                    <div className="w-2 h-2 bg-pista-dark rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Challenge</span>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black text-white italic leading-tight">
                                    Today's Knowledge <span className="text-pista-dark not-italic">Vault</span> is Active.
                                </h2>
                                <p className="text-slate-400 font-bold max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                                    Test your understanding of recent concepts. Earn points and climb the elite student ranks.
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <Link
                                    to="/daily-quiz"
                                    className="px-12 py-6 bg-pista-dark text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-pista-deep transition-all shadow-xl shadow-pista-dark/20 hover:scale-105 active:scale-95 flex items-center gap-4"
                                >
                                    <span>Enter Assessment Arena</span>
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
                        <h2 className="text-4xl font-bold text-pista-deep mb-4">Recent Uploads</h2>
                        <p className="text-pista-deep/60">Get the latest notes added to our library.</p>
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
                                    className="glass-card rounded-3xl p-6 group transition-all duration-300 bg-white shadow-xl shadow-pista/5 border border-pista-light/10"
                                >
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
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-md border border-pista-light rounded-full text-[10px] font-black tracking-widest text-pista-dark uppercase">
                                            {note.classId}
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
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
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
                    <div>
                        <h4 className="font-bold text-lg mb-6 text-pista-light">Newsletter</h4>
                        <p className="text-sm text-pista-light/50 mb-4">Stay updated with new notes and study guides.</p>
                        <div className="flex">
                            <input type="text" placeholder="Email" className="bg-white/10 border border-white/20 rounded-l-xl px-4 py-2 w-full focus:outline-none focus:border-pista transition-colors" />
                            <button className="bg-pista px-4 py-2 rounded-r-xl"><ArrowRight size={18} /></button>
                        </div>
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
