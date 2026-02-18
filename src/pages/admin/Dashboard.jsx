import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    FileText,
    Download,
    ArrowUpRight,
    Search,
    Bell,
    Clock,
    TrendingUp,
    BarChart3,
    Loader2,
    MessageSquare,
    ChevronRight,
    X,
    CreditCard
} from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { db, auth } from '../../firebase';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    limit,
    getCountFromServer
} from 'firebase/firestore';

const AdminDashboard = () => {
    const [stats, setStats] = useState([
        { label: 'Total Notes', value: '0', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Active Students', value: '0', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Quizzes Taken', value: '0', icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Storage Used', value: '0 MB', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]);
    const [recentNotes, setRecentNotes] = useState([]);
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasNotifications, setHasNotifications] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notificationRef = useRef(null);

    useEffect(() => {
        // Real-time listener for Subscription Requests
        const qSubRequests = query(collection(db, 'subscription_requests'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribeSubReqs = onSnapshot(qSubRequests, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const pendingOnly = data.filter(r => r.status === 'pending');
            setNotifications(pendingOnly);
            setHasNotifications(pendingOnly.length > 0);
        });

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        // Real-time listener for Notes
        const qNotes = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setRecentNotes(notesData.slice(0, 6));
            const totalStorage = notesData.reduce((acc, curr) => {
                const sizeStr = curr.size || "0 MB";
                const sizeValue = parseFloat(sizeStr.replace(' MB', '')) || 0;
                return acc + sizeValue;
            }, 0);

            setStats(prev => prev.map(s => {
                if (s.label === 'Total Notes') return { ...s, value: snapshot.size.toString() };
                if (s.label === 'Storage Used') return { ...s, value: `${totalStorage.toFixed(1)} MB` };
                return s;
            }));
            setLoading(false);
        });

        // Real-time listener for Users
        const qUsers = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            setStats(prev => prev.map(s =>
                s.label === 'Active Students' ? { ...s, value: snapshot.size.toString() } : s
            ));
        });

        // Real-time listener for Quiz Submissions
        const qSubmissions = query(collection(db, 'quizSubmissions'), orderBy('submittedAt', 'desc'));
        const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
            const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentSubmissions(subs.slice(0, 5));
            setStats(prev => prev.map(s =>
                s.label === 'Quizzes Taken' ? { ...s, value: snapshot.size.toString() } : s
            ));
        });

        return () => {
            unsubscribeSubReqs();
            unsubscribeNotes();
            unsubscribeUsers();
            unsubscribeSubmissions();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex font-sans selection:bg-pista-light">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden pt-20 lg:pt-0">
                {/* Premium Header */}
                <header className="px-4 py-4 lg:px-10 lg:py-10 bg-white border-b border-gray-100 z-30 overflow-visible">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="hidden lg:flex items-center space-x-3 mb-2">
                                <div className="h-2 w-10 bg-pista-dark rounded-full" />
                                <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">System Status</span>
                            </div>
                            <h1 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight italic truncate">
                                <span className="lg:not-italic font-black lg:text-slate-900 text-pista-dark">Dashboard</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-2 lg:space-x-6">
                            {/* Search bar removed for more focus or simplified */}

                            <div className="relative" ref={notificationRef}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`p-3 lg:p-4 rounded-xl lg:rounded-[1.5rem] border transition-all relative ${showNotifications ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:border-slate-200'}`}
                                >
                                    <Bell className="w-5 h-5 lg:w-[22px] lg:h-[22px]" strokeWidth={2.5} />
                                    {hasNotifications && (
                                        <span className={`absolute top-2.5 right-2.5 lg:top-3.5 lg:right-3.5 w-2.5 h-2.5 lg:w-3 h-3 bg-red-500 border-2 rounded-full shadow-sm ${showNotifications ? 'border-slate-900' : 'border-white animate-pulse'}`}></span>
                                    )}
                                </motion.button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                            className="absolute right-0 mt-6 w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-gray-100 z-[100] overflow-hidden"
                                        >
                                            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-8 bg-pista-dark rounded-full"></div>
                                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs italic">High Priority Alerts</h3>
                                                </div>
                                                <span className="px-4 py-1.5 bg-pista-dark text-white text-[10px] font-black rounded-xl">
                                                    {notifications.length} Pending
                                                </span>
                                            </div>

                                            <div className="h-[380px] overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? (
                                                    <div className="divide-y divide-gray-50">
                                                        {notifications.map((notif) => (
                                                            <Link
                                                                key={notif.id}
                                                                to="/admin/payments"
                                                                className="flex items-center space-x-5 p-6 hover:bg-pista-light/10 transition-colors group"
                                                                onClick={() => setShowNotifications(false)}
                                                            >
                                                                <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-pista-dark group-hover:bg-pista-dark group-hover:text-white transition-all shadow-sm">
                                                                    <CreditCard size={20} strokeWidth={2.5} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-black text-slate-900 leading-tight">
                                                                        {notif.userName} <span className="text-pista-dark">requested</span> Premium
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 mt-1 font-bold italic">
                                                                        {notif.planName} · {notif.amount}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-pista-dark transform group-hover:translate-x-1 transition-all" />
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center px-12">
                                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                                                            <Bell size={40} strokeWidth={1} />
                                                        </div>
                                                        <h4 className="font-black text-slate-800 text-lg">Clean Ledger</h4>
                                                        <p className="text-xs text-slate-400 mt-2 font-bold leading-relaxed uppercase tracking-tighter">Everything is running smoothly</p>
                                                    </div>
                                                )}
                                            </div>

                                            <Link
                                                to="/admin/payments"
                                                onClick={() => setShowNotifications(false)}
                                                className="block p-7 text-center bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.4em] hover:bg-black transition-all"
                                            >
                                                Audit All Transactions
                                            </Link>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center space-x-3 lg:space-x-4 pl-3 lg:pl-6 border-l border-gray-100">
                                <div className="text-right hidden sm:block">
                                    <p className="font-black text-slate-900 leading-none">Super Admin</p>
                                    <p className="text-[10px] text-pista-dark font-black uppercase tracking-widest mt-1">Institutional Lead</p>
                                </div>
                                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white p-0.5 lg:p-1 rounded-xl lg:rounded-2xl shadow-xl shadow-slate-200 border border-gray-100 relative group overflow-hidden">
                                    <div className="w-full h-full bg-slate-900 rounded-lg lg:rounded-xl flex items-center justify-center text-white font-black italic cursor-pointer group-hover:bg-pista-dark transition-colors text-xs lg:text-base">
                                        SA
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-7xl mx-auto space-y-12 pb-20">
                        {loading ? (
                            <div className="h-[60vh] flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                                <p className="text-sm font-black text-pista-deep/20 uppercase tracking-[0.3em]">Synching Repository</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Matrix */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
                                    {stats.map((stat, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                                            className="bg-white p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(107,136,108,0.1)] transition-all group"
                                        >
                                            <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
                                                <div className={`p-2.5 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl ${stat.bg} ${stat.color} shadow-inner transition-transform group-hover:scale-110`}>
                                                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
                                                </div>
                                                <div className="hidden sm:block px-3 py-1 bg-slate-50 rounded-lg text-slate-400 text-[10px] font-black italic uppercase tracking-widest">
                                                    Real-time
                                                </div>
                                            </div>
                                            <h3 className="text-slate-400 font-black text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-1 truncate">{stat.label}</h3>
                                            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight italic">{stat.value}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Main Content Section */}
                                <section>
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center space-x-4">
                                            <h2 className="text-2xl font-black text-slate-900">Recent <span className="text-pista-dark italic">Uploads</span></h2>
                                            <div className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Latest 6 logs
                                            </div>
                                        </div>
                                        <Link to="/admin/manage" className="text-slate-900 font-black text-xs uppercase tracking-widest hover:text-pista-dark border-b-2 border-slate-900/10 hover:border-pista-dark transition-all pb-1 flex items-center gap-2">
                                            Expand Vault <ChevronRight size={14} />
                                        </Link>
                                    </div>

                                    <div className="space-y-6">
                                        {recentNotes.length > 0 ? recentNotes.map((note, idx) => (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + (idx * 0.05) }}
                                                className="group bg-white rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-6 border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-pista-light/30 transition-all flex items-center gap-4 sm:gap-8 relative overflow-hidden"
                                            >
                                                {/* Left Accent Bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-pista-dark/10 group-hover:bg-pista-dark transition-colors" />

                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner flex-shrink-0">
                                                    <FileText size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-0.5 sm:mb-1">
                                                        <span className="px-2 py-0.5 bg-pista-light/30 text-pista-dark text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full">
                                                            {note.classId}
                                                        </span>
                                                        <span className="hidden sm:inline text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-widest truncate">
                                                            ID: {note.id.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-sm sm:text-lg text-slate-900 truncate group-hover:text-pista-dark transition-colors leading-tight">
                                                        {note.title || 'Untitled Fragment'}
                                                    </h4>
                                                    <div className="flex items-center space-x-3 mt-1">
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[80px] sm:max-w-none">
                                                            <span className="text-slate-900">{note.subjectId}</span>
                                                        </p>
                                                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                            <Clock size={10} className="text-pista-dark" />
                                                            {note.createdAt?.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <div className="hidden lg:flex flex-col items-end">
                                                        <div className="flex items-center -space-x-2 mb-2">
                                                            {[1, 2, 3].map((i) => (
                                                                <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">
                                                                    {i}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-[9px] font-black text-pista-dark uppercase tracking-widest">Verified</p>
                                                    </div>

                                                    <motion.button
                                                        whileHover={{ x: 5 }}
                                                        className="p-3 bg-slate-50 text-slate-300 hover:bg-pista-dark hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <ArrowUpRight size={18} strokeWidth={3} />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="col-span-full py-20 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
                                                <div className="inline-flex p-10 bg-slate-50 text-slate-200 rounded-full mb-6">
                                                    <FileText size={48} strokeWidth={1} />
                                                </div>
                                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Repository is currently empty</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Quiz Intelligence Section */}
                                <section>
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center space-x-4">
                                            <h2 className="text-2xl font-black text-slate-900">Quiz <span className="text-pista-dark italic">Intelligence</span></h2>
                                            <div className="px-3 py-1 bg-amber-50 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                Real-time Feedback
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {recentSubmissions.length > 0 ? (
                                            recentSubmissions.map((sub, idx) => (
                                                <motion.div
                                                    key={sub.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.5 + (idx * 0.1) }}
                                                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6"
                                                >
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                                                        <span className="text-xl font-black text-slate-900">{sub.score}</span>
                                                        <small className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Score</small>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-900">{sub.userName}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                            {sub.quizDate} · {sub.totalQuestions} Questions
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sub.score / sub.totalQuestions > 0.7 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {Math.round((sub.score / sub.totalQuestions) * 100)}% Acc
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                                <TrendingUp size={32} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for first assessment...</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

