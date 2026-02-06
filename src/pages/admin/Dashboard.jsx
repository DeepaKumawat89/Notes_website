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
    Loader2
} from 'lucide-react';
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
        { label: 'Total Notes', value: '0', increase: '...', icon: FileText, color: 'bg-blue-500' },
        { label: 'Total Downloads', value: '0', increase: '...', icon: Download, color: 'bg-green-500' },
        { label: 'Active Students', value: '0', increase: '...', icon: Users, color: 'bg-purple-500' },
        { label: 'Storage Used', value: '0 MB', icon: BarChart3, color: 'bg-orange-500' },
    ]);
    const [recentNotes, setRecentNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activityLog, setActivityLog] = useState([]);

    useEffect(() => {
        // Real-time listener for Notes
        const qNotes = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        const unsubscribeNotes = onSnapshot(qNotes, (snapshot) => {
            const notesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setRecentNotes(notesData.slice(0, 5));
            const totalDLs = notesData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

            // Calculate Total Storage in MB
            const totalStorage = notesData.reduce((acc, curr) => {
                const sizeStr = curr.size || "0 MB";
                const sizeValue = parseFloat(sizeStr.replace(' MB', '')) || 0;
                return acc + sizeValue;
            }, 0);

            setStats(prev => prev.map(s => {
                if (s.label === 'Total Notes') return { ...s, value: snapshot.size.toString() };
                if (s.label === 'Total Downloads') return { ...s, value: totalDLs.toLocaleString() };
                if (s.label === 'Storage Used') return { ...s, value: `${totalStorage.toFixed(2)} MB` };
                return s;
            }));
        });

        // Real-time listener for Users
        const qUsers = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            setStats(prev => prev.map(s =>
                s.label === 'Active Students' ? { ...s, value: snapshot.size.toString() } : s
            ));
        });

        // Activity Log based on recent snapshots
        const qRecent = query(collection(db, 'notes'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribeActivity = onSnapshot(qRecent, (snapshot) => {
            const activities = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    text: `New upload: ${data.title || 'Untitled'}`,
                    time: data.createdAt?.toDate().toLocaleTimeString() || 'Just now'
                };
            });
            setActivityLog(activities);
            setLoading(false);
        });

        return () => {
            unsubscribeNotes();
            unsubscribeUsers();
            unsubscribeActivity();
        };
    }, []);

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-pista-deep">Dashboard</h1>
                        <p className="text-pista-deep/50 font-medium tracking-tight">Overview of your repository performace</p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark" size={20} />
                            <input
                                type="text"
                                placeholder="Search dashboard..."
                                className="pl-12 pr-4 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 w-64 shadow-sm"
                            />
                        </div>
                        <button className="p-3 bg-white rounded-2xl border border-pista-light/30 text-pista-deep hover:bg-pista-light transition-colors relative">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="flex items-center space-x-3 pl-6 border-l border-pista-light/50">
                            <div className="text-right hidden md:block">
                                <p className="font-bold text-pista-deep leading-none">Admin Control</p>
                                <p className="text-xs text-pista-deep/50 mt-1">Super Admin</p>
                            </div>
                            <div className="w-12 h-12 bg-pista-dark rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-white font-bold">
                                AC
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="animate-spin text-pista-dark" size={48} />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-8 rounded-3xl border border-pista-light/20 shadow-xl shadow-pista/5 group hover:border-pista transition-all"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <div className="flex items-center space-x-1 text-green-500 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold">
                                            <TrendingUp size={14} />
                                            <span>{stat.increase}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-pista-deep/50 font-bold text-sm uppercase tracking-wider mb-1">{stat.label}</h3>
                                    <p className="text-3xl font-black text-pista-deep">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Recent Uploads */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-pista-light/20 shadow-xl shadow-pista/5">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-2xl font-bold text-pista-deep">Recent Uploads</h2>
                                    <button className="text-pista-dark font-bold text-sm hover:underline">View All</button>
                                </div>

                                <div className="space-y-6">
                                    {recentNotes.length > 0 ? recentNotes.map((note) => (
                                        <div key={note.id} className="flex items-center justify-between p-4 hover:bg-cream-light rounded-2xl transition-colors border border-transparent hover:border-pista-light">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-14 h-14 bg-pista-light/30 rounded-xl flex items-center justify-center text-pista-dark">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-pista-deep">{note.title || 'Untitled Note'}</h4>
                                                    <p className="text-xs text-pista-deep/50">
                                                        {note.classId || 'N/A'} · {note.subjectId || 'N/A'} · {note.size || '0 MB'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-6">
                                                <div className="text-right text-xs">
                                                    <p className="text-pista-deep font-bold italic">
                                                        {note.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                                                    </p>
                                                    <p className="text-pista-deep/40 mt-1">Uploaded by Admin</p>
                                                </div>
                                                <button className="p-3 text-pista-deep/40 hover:text-pista-dark transition-colors">
                                                    <ArrowUpRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-pista-deep/40 font-bold">
                                            No notes found.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions / Activity */}
                            <div className="space-y-8">
                                <div className="bg-pista-dark rounded-[2.5rem] p-8 text-white shadow-xl shadow-pista/20">
                                    <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
                                    <div className="space-y-4">
                                        <button className="w-full bg-white text-pista-dark font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-cream-light transition-all active:scale-95 shadow-lg">
                                            <span>Upload New Note</span>
                                        </button>
                                        <button className="w-full bg-pista whitespace-nowrap text-white font-bold py-4 rounded-2xl border-2 border-white/20 flex items-center justify-center space-x-2 hover:bg-pista-deep transition-all active:scale-95">
                                            <span>Generate Report</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] p-8 border border-pista-light/20 shadow-xl shadow-pista/5">
                                    <h3 className="text-xl font-bold text-pista-deep mb-8 flex items-center space-x-3">
                                        <Clock size={20} className="text-pista-dark" />
                                        <span>Activity Log</span>
                                    </h3>
                                    <div className="space-y-8 relative">
                                        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-pista-light/50"></div>
                                        {activityLog.length > 0 ? activityLog.map((log) => (
                                            <div key={log.id} className="relative pl-10">
                                                <div className="absolute left-0 top-1.5 w-5 h-5 bg-white border-4 border-pista-dark rounded-full"></div>
                                                <p className="text-sm font-bold text-pista-deep leading-tight">{log.text}</p>
                                                <p className="text-xs text-pista-deep/40 mt-1">{log.time}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center text-pista-deep/30 text-xs italic">
                                                No recent activity
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

