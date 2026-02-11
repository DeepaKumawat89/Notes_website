import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users as UsersIcon,
    Search,
    Mail,
    Calendar,
    User,
    Loader2,
    AlertCircle,
    Shield
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: users.length,
        premium: users.filter(u => u.subscription === 'premium').length,
        standard: users.filter(u => u.subscription !== 'premium').length
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex font-sans selection:bg-pista-light">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden">
                {/* Premium Header */}
                <header className="px-10 py-10 bg-white border-b border-gray-100 z-20">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-2 w-10 bg-pista-dark rounded-full" />
                                <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">Administrative Oversight</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student <span className="text-pista-dark italic">Directory</span></h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-200 flex items-center space-x-4">
                                <div className="p-2 bg-slate-800 text-white rounded-xl">
                                    <UsersIcon size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Capacity</p>
                                    <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-purple-50 rounded-3xl border border-purple-100 flex items-center space-x-4">
                                <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-100">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-purple-600/50 uppercase tracking-widest leading-none mb-1">Premium Tier</p>
                                    <p className="text-xl font-black text-purple-700 leading-none">{stats.premium}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-pista-light/30 rounded-3xl border border-pista/20 flex items-center space-x-4">
                                <div className="p-2 bg-pista-dark text-white rounded-xl shadow-lg shadow-pista/20">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-pista-dark/50 uppercase tracking-widest leading-none mb-1">Standard</p>
                                    <p className="text-xl font-black text-pista-deep leading-none">{stats.standard}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative group flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pista-dark transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search students by name or unique ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-pista/10 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-7xl mx-auto">
                        {loading ? (
                            <div className="h-[50vh] flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                                <p className="text-sm font-black text-pista-deep/20 uppercase tracking-[0.3em]">Accessing Directory</p>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                <AnimatePresence mode='popLayout'>
                                    {filteredUsers.map((user, idx) => (
                                        <motion.div
                                            key={user.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.03, duration: 0.4 }}
                                            className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(107,136,108,0.1)] transition-all group overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-pista-light/30 rounded-[1.5rem] flex items-center justify-center text-pista-dark font-black text-2xl italic shadow-inner">
                                                        {user.name?.charAt(0).toUpperCase() || <User size={24} />}
                                                    </div>
                                                    {user.subscription === 'premium' && (
                                                        <div className="absolute -top-2 -right-2 p-1.5 bg-purple-600 text-white rounded-lg shadow-lg border-2 border-white">
                                                            <Shield size={12} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border ${user.subscription === 'premium' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-pista-light text-pista-dark border-pista'
                                                        }`}>
                                                        {user.subscription || 'free tier'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-8">
                                                <h3 className="text-xl font-black text-slate-900 truncate">{user.name || 'Anonymous User'}</h3>
                                                <p className="text-sm font-bold text-slate-400 truncate mt-1">{user.email || 'no-email-recorded'}</p>
                                            </div>

                                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                                <div>
                                                    <div className="flex justify-between items-end mb-2">
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Inventory Views</p>
                                                        <p className="text-xs font-black text-slate-700">{user.viewsCount || 0}/3 <span className="text-slate-300 font-bold ml-1">Limit</span></p>
                                                    </div>
                                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(((user.viewsCount || 0) / 3) * 100, 100)}%` }}
                                                            className={`h-full transition-all duration-700 ${(user.viewsCount || 0) >= 3 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-pista-dark to-pista'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-slate-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-pista-dark" />
                                                        <span className="text-xs font-bold uppercase tracking-tighter">
                                                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Joined Age Ago'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black italic tracking-widest text-slate-300">#{user.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200"
                            >
                                <div className="inline-flex p-10 bg-slate-50 text-slate-200 rounded-full mb-8 shadow-inner">
                                    <UsersIcon size={80} strokeWidth={1} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800">No Students Found</h3>
                                <p className="text-slate-400 font-bold mt-3 max-w-sm mx-auto">Your search didn't return any matches in the current database.</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UsersList;
