import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, Download, FileText, Calendar, CheckCircle2, Loader2, Zap } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AuthModal from '../../pages/user/Auth';
import SubscriptionModal from '../../components/SubscriptionModal';
import NoteSkeleton from '../../components/NoteSkeleton';
import toast from 'react-hot-toast';

const NoteList = () => {
    const { classId, subjectId } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

    useEffect(() => {
        // Track auth state
        let unsubscribeUser = null;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.email), (docSnap) => {
                    if (docSnap.exists()) setUserData(docSnap.data());
                });
            }
        });

        // Fetch notes from Firestore
        const qGeneral = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));

        const unsubscribeNotes = onSnapshot(qGeneral, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Filter locally to be safe since classId/subjectId formats might vary
            const filtered = notesData.filter(n => {
                const classMatch = n.classId?.toString().includes(classId);
                const subjectMatch = n.subjectId?.toLowerCase() === subjectId.toLowerCase();
                return classMatch && subjectMatch;
            });

            setNotes(filtered);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNotes();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, [classId, subjectId]);

    const handleProtectedDownload = async (fileUrl) => {
        if (!user) {
            setIsAuthOpen(true);
            toast('Please login to view study material', {
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
                toast.error('User profile not found');
            }
        } catch (error) {
            console.error("Access Error:", error);
            toast.error('Failed to verify access');
        }
    };

    const filteredDisplayNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-light pt-28 lg:pt-36 pb-20 px-4 sm:px-8">
            <Navbar />
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
            <SubscriptionModal
                isOpen={isSubscriptionOpen}
                onClose={() => setIsSubscriptionOpen(false)}
                user={user}
            />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 mb-10 sm:mb-12">
                    <div>
                        <button
                            onClick={() => navigate(`/class/${classId}`)}
                            className="flex items-center space-x-2 text-pista-deep mb-3 sm:mb-4 hover:text-pista-dark transition-colors font-bold"
                        >
                            <ChevronLeft size={20} />
                            <span>Back to Subjects</span>
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pista-deep capitalize leading-tight flex items-center gap-4">
                            {subjectId} Notes
                            <span className="hidden sm:inline text-pista-dark font-medium text-lg sm:text-l lg:text-2xl">· Class {classId}</span>
                            {userData?.subscription === 'premium' && (
                                <span className="px-3 py-1 bg-purple-600 text-[10px] font-black text-white rounded-lg uppercase tracking-widest animate-pulse">
                                    Premium Scholar
                                </span>
                            )}
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${userData?.subscription === 'premium' ? 'text-purple-400 group-focus-within:text-purple-600' : 'text-pista-deep/40 group-focus-within:text-pista-dark'} transition-colors`} size={20} />
                            <input
                                type="text"
                                placeholder="Search chapters..."
                                className={`w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white border ${userData?.subscription === 'premium' ? 'border-purple-100 focus:ring-purple-200 focus:border-purple-400 shadow-purple-50' : 'border-pista-light/30 focus:ring-pista/20 focus:border-pista shadow-sm'} rounded-[1.25rem] sm:rounded-2xl focus:outline-none focus:ring-2 transition-all font-medium`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {userData?.subscription === 'premium' && (
                                <div className="absolute inset-0 rounded-[1.25rem] sm:rounded-2xl bg-gradient-to-r from-purple-400/20 to-indigo-400/20 blur pointer-events-none -z-10 group-focus-within:opacity-100 opacity-0 transition-opacity" />
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <NoteSkeleton key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        <AnimatePresence>
                            {filteredDisplayNotes.map((note, idx) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-pista-light/30 hover:border-pista hover:shadow-2xl hover:shadow-pista/5 transition-all duration-300"
                                >
                                    <div className="relative w-full h-40 bg-pista-light/30 rounded-2xl mb-6 overflow-hidden flex items-center justify-center">
                                        {note.thumbnailUrl ? (
                                            <img
                                                src={note.thumbnailUrl}
                                                alt={note.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <FileText size={48} className="text-pista/40 group-hover:scale-110 transition-transform duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                        <div className="absolute top-3 left-4 flex flex-col gap-2">
                                            <div className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-full text-[8px] font-black tracking-widest text-pista-dark uppercase w-fit">
                                                {note.fileName?.split('.').pop() || 'PDF'}
                                            </div>
                                            {note.isPremium && (
                                                <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1 w-fit shadow-lg">
                                                    <Zap size={8} fill="currentColor" /> PREMIUM
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-pista-deep mb-2 group-hover:text-pista-dark transition-colors line-clamp-1">{note.title}</h3>
                                    <p className="text-sm font-bold text-pista-deep/40 mb-8 uppercase tracking-tighter">{note.subjectId} · {note.size || '0 MB'}</p>

                                    <div className="flex items-center space-x-4 pt-6 border-t border-pista-light/50">
                                        <div className="flex items-center space-x-2 text-[10px] font-black text-pista-deep/30 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            <span>{note.createdAt ? new Date(note.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                                        </div>
                                        <div className="flex-1"></div>
                                        <button
                                            onClick={() => handleProtectedDownload(note.fileUrl)}
                                            className={`group/btn relative overflow-hidden px-7 py-3 ${userData?.subscription === 'premium' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-pista-dark shadow-pista/20'} text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg`}
                                        >
                                            <div className="flex items-center space-x-2 relative z-10 transition-transform group-hover/btn:translate-x-1">
                                                <span>{userData?.subscription === 'premium' ? 'Elite View' : 'View'}</span>
                                                {userData?.subscription === 'premium' ? <FileText size={16} /> : <Download size={16} />}
                                            </div>
                                        </button>
                                    </div>

                                    {/* Verified badge */}
                                    <div className={`absolute -top-2 -right-2 ${userData?.subscription === 'premium' ? 'bg-indigo-600' : 'bg-pista-dark'} text-white p-1 rounded-full border-4 border-cream-light shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500`}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && filteredDisplayNotes.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-pista-light/20">
                        <div className="inline-flex p-8 bg-cream-light text-pista-deep/10 rounded-full mb-8">
                            <FileText size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-pista-deep">Library is empty</h2>
                        <p className="text-pista-deep/40 font-bold mt-2">No notes have been uploaded for this subject yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteList;
