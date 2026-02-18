import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, FileText, Calendar, User, Eye, Share2, Info, Loader2, Zap, Shield, Lock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { db, auth } from '../../firebase';
import { doc, getDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import NoteSkeleton from '../../components/NoteSkeleton';
import SubscriptionModal from '../../components/SubscriptionModal';

const NoteDetail = () => {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

    const [isResearchMode, setIsResearchMode] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                onSnapshot(doc(db, 'users', currentUser.email), (docSnap) => {
                    if (docSnap.exists()) setUserData(docSnap.data());
                });
            }
        });

        const fetchNote = async () => {
            try {
                const docRef = doc(db, 'notes', noteId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNote({ id: docSnap.id, ...docSnap.data() });
                } else {
                    toast.error('Note not found');
                    navigate('/');
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error('Failed to load note');
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
        return () => unsubscribeAuth();
    }, [noteId, navigate]);

    const handleDownload = async () => {
        if (!user) {
            toast.error('Please login to download');
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
                    if (!isPremium) {
                        await updateDoc(userRef, { viewsCount: increment(1) });
                    } else {
                        toast.success('Premium Download Available', {
                            icon: '🌟',
                            style: { background: '#7C3AED', color: '#fff', borderRadius: '15px' }
                        });
                    }
                    window.open(note.fileUrl, '_blank');
                    // Increment note download count
                    await updateDoc(doc(db, 'notes', noteId), { downloads: increment(1) });
                } else {
                    setIsSubscriptionOpen(true);
                }
            }
        } catch (error) {
            toast.error('Access verification failed');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-cream-light pt-36 px-8">
            <Navbar />
            <div className="max-w-5xl mx-auto"><NoteSkeleton /></div>
        </div>
    );

    if (!note) return null;

    const isPremiumUser = userData?.subscription === 'premium';

    return (
        <div className={`min-h-screen transition-colors duration-700 ${isResearchMode ? 'bg-[#0F172A]' : 'bg-cream-light'} pt-28 lg:pt-36 pb-20 px-4 sm:px-8`}>
            <Navbar />
            <SubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
                user={user}
            />

            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className={`flex items-center space-x-2 ${isResearchMode ? 'text-slate-400 hover:text-white' : 'text-pista-deep hover:text-pista-dark'} mb-8 transition-colors font-bold`}
                >
                    <ChevronLeft size={20} />
                    <span>Back to Repository</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <motion.div
                            layout
                            className={`${isResearchMode ? 'bg-slate-900 border-slate-800 shadow-indigo-900/10' : 'bg-white border-pista-light/20 shadow-pista/5'} rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-12 shadow-xl border relative overflow-hidden transition-all duration-700`}
                        >
                            {note.isPremium && (
                                <div className="absolute top-0 right-0 px-8 py-2 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-black tracking-[0.3em] uppercase transform rotate-45 translate-x-10 translate-y-4 shadow-lg flex items-center gap-2">
                                    <Zap size={10} fill="currentColor" /> Exclusive
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                                <div className={`inline-flex px-4 py-2 ${isResearchMode ? 'bg-slate-800 text-indigo-400' : 'bg-pista-light/50 text-pista-dark'} rounded-full text-[10px] sm:text-xs font-bold tracking-wide transition-colors`}>
                                    {note.classId?.toUpperCase()} · {note.subjectId?.toUpperCase()}
                                </div>
                                {note.isPremium && (
                                    <div className={`inline-flex px-4 py-2 ${isResearchMode ? 'bg-indigo-950/50 text-indigo-300 border-indigo-900/50' : 'bg-purple-50 text-purple-600 border-purple-100'} rounded-full text-[10px] font-black tracking-widest border uppercase italic transition-colors`}>
                                        Premium Content
                                    </div>
                                )}
                                {isPremiumUser && (
                                    <button
                                        onClick={() => {
                                            setIsResearchMode(!isResearchMode);
                                            toast(isResearchMode ? 'Classical Mode Restored' : 'Elite Research Mode Active', {
                                                icon: isResearchMode ? '☀️' : '🔭',
                                                style: { borderRadius: '15px', background: isResearchMode ? '#333' : '#1E293B', color: '#fff' }
                                            });
                                        }}
                                        className={`inline-flex px-4 py-2 ${isResearchMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-100'} rounded-full text-[10px] font-black tracking-widest uppercase items-center gap-2 hover:scale-105 transition-all shadow-lg ml-auto sm:ml-0`}
                                    >
                                        <Eye size={12} />
                                        {isResearchMode ? 'Exit Research' : 'Research Mode'}
                                    </button>
                                )}
                            </div>

                            <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-bold ${isResearchMode ? 'text-white' : 'text-pista-deep'} mb-6 leading-tight italic transition-colors`}>
                                {note.title}
                            </h1>

                            <div className={`flex flex-wrap items-center gap-4 sm:gap-6 mb-10 pb-10 border-b ${isResearchMode ? 'border-slate-800' : 'border-pista-light/50'} transition-colors`}>
                                <div className={`flex items-center space-x-3 ${isResearchMode ? 'text-slate-400' : 'text-pista-deep/60'}`}>
                                    <div className={`p-2 ${isResearchMode ? 'bg-slate-800' : 'bg-cream-light'} rounded-lg transition-colors`}><Calendar size={20} /></div>
                                    <span className="font-semibold text-sm sm:text-base">
                                        {note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                    </span>
                                </div>
                                <div className={`flex items-center space-x-3 ${isResearchMode ? 'text-slate-400' : 'text-pista-deep/60'}`}>
                                    <div className={`p-2 ${isResearchMode ? 'bg-slate-800' : 'bg-cream-light'} rounded-lg transition-colors`}><Eye size={20} /></div>
                                    <span className="font-semibold text-sm sm:text-base">{note.downloads || 0} Downloads</span>
                                </div>
                            </div>

                            <div className="prose prose-pista mb-12">
                                <h3 className={`text-2xl font-bold ${isResearchMode ? 'text-indigo-400' : 'text-pista-deep'} mb-4 uppercase tracking-tighter transition-colors`}>Abstract</h3>
                                <p className={`text-lg leading-relaxed ${isResearchMode ? 'text-slate-300' : 'text-pista-deep/70'} transition-colors`}>
                                    {note.description || 'No detailed description available for this study material yet. This resource contains high-quality academic concepts and solved patterns.'}
                                </p>
                            </div>

                            <div className={`p-5 sm:p-8 ${isResearchMode ? 'bg-slate-800/50 border-slate-700' : 'bg-pista-light/20 border-pista-light'} rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 border transition-all duration-700`}>
                                <div className="flex items-center space-x-4">
                                    <div className={`p-4 ${isResearchMode ? 'bg-slate-900 border border-slate-700 text-indigo-400' : 'bg-white text-pista-dark'} rounded-2xl shadow-sm transition-colors`}>
                                        <FileText size={32} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-bold ${isResearchMode ? 'text-white' : 'text-pista-deep'} truncate transition-colors`}>{note.fileName || 'Archive_Manuscript.pdf'}</h4>
                                        <p className={`text-sm ${isResearchMode ? 'text-slate-400' : 'text-pista-deep/50'} transition-colors`}>{note.size} · Optimized PDF</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownload}
                                    className={`w-full md:w-auto flex items-center justify-center space-x-3 px-10 py-5 ${isResearchMode ? 'bg-indigo-600 hover:bg-indigo-700' : isPremiumUser ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pista-dark hover:bg-pista-deep'} text-white rounded-2xl font-bold transition-all shadow-xl active:scale-95`}
                                >
                                    {isPremiumUser ? <Shield size={24} /> : <Download size={24} />}
                                    <span className="text-lg">
                                        {isPremiumUser ? 'Premium Download' : 'Secure Access'}
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar/Stats */}
                    <div className="space-y-8">
                        {isPremiumUser && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`bg-gradient-to-br ${isResearchMode ? 'from-slate-800 to-indigo-900' : 'from-indigo-600 to-purple-700'} rounded-3xl p-1 shadow-xl transition-all duration-700`}
                            >
                                <div className={`${isResearchMode ? 'bg-slate-900/50' : 'bg-white/10'} backdrop-blur-sm rounded-[1.4rem] p-6 text-white text-center`}>
                                    <div className={`w-12 h-12 ${isResearchMode ? 'bg-indigo-900/50' : 'bg-white/20'} rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 transition-colors`}>
                                        <Shield size={24} fill="white" />
                                    </div>
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-1">Status: Elite</h3>
                                    <p className="text-[10px] text-white/70 font-bold uppercase">Unlimited Asset Access Active</p>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`${isResearchMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-pista-light/20 text-pista-deep'} rounded-3xl p-6 sm:p-8 border shadow-lg transition-all duration-700`}
                        >
                            <h3 className={`font-bold mb-6 flex items-center space-x-2 ${isResearchMode ? 'text-indigo-400' : ''}`}>
                                <Info size={20} className={isResearchMode ? 'text-indigo-400' : 'text-pista-dark'} />
                                <span>Quick Info</span>
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2">
                                    <span className={`${isResearchMode ? 'text-slate-400' : 'text-pista-deep/50'} font-medium`}>Format</span>
                                    <span className={`font-bold italic ${isResearchMode ? 'text-slate-200' : 'text-pista-deep'}`}>Digital PDF</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-pista-light/30">
                                    <span className={`${isResearchMode ? 'text-slate-400' : 'text-pista-deep/50'} font-medium`}>Access</span>
                                    <span className={`px-2 py-0.5 ${isResearchMode ? 'bg-indigo-900/50 text-indigo-400' : isPremiumUser ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'} text-[10px] font-bold rounded uppercase`}>
                                        {isPremiumUser ? 'Premium' : 'Standard'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-t border-pista-light/30">
                                    <span className={`${isResearchMode ? 'text-slate-400' : 'text-pista-deep/50'} font-medium`}>Integrity</span>
                                    <span className={`font-bold text-xs ${isResearchMode ? 'text-slate-200' : 'text-pista-deep'}`}>Verified Asset</span>
                                </div>
                            </div>
                            <button className={`w-full mt-8 flex items-center justify-center space-x-2 py-4 border-2 ${isResearchMode ? 'border-slate-800' : 'border-pista-light'} rounded-2xl ${isResearchMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-pista-deep hover:bg-pista-light'} font-bold transition-all text-xs uppercase tracking-widest`}>
                                <Share2 size={16} />
                                <span>Share Manuscript</span>
                            </button>
                        </motion.div>

                        {!isPremiumUser && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-pista-dark rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-pista/20 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 text-white/10 -rotate-12 translate-x-4 -translate-y-4 group-hover:rotate-0 transition-transform duration-1000">
                                    <Zap size={140} />
                                </div>
                                <h3 className="font-bold text-xl mb-4 relative z-10">Limit Reached?</h3>
                                <p className="text-pista-light/70 text-sm mb-6 leading-relaxed relative z-10 font-medium">
                                    Upgrade to a Premium Plan for unlimited downloads and exclusive handwritten notes.
                                </p>
                                <button
                                    onClick={() => setIsSubscriptionOpen(true)}
                                    className="w-full py-4 bg-white text-pista-dark rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cream-light transition-all relative z-10"
                                >
                                    Get Premium Access
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteDetail;
