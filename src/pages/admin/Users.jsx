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
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
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

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-pista-deep">Students & Admins</h1>
                        <p className="text-pista-deep/50 font-medium">Registered users on the platform</p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="bg-white px-6 py-3 rounded-2xl border border-pista-light/30 shadow-sm flex items-center space-x-3">
                            <span className="text-pista-deep/50 font-bold uppercase text-xs tracking-widest">Total Users</span>
                            <span className="text-2xl font-black text-pista-deep">{users.length}</span>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 w-80 shadow-sm"
                            />
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-[2.5rem] border border-pista-light/20 shadow-xl shadow-pista/5 overflow-hidden">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                            <p className="text-pista-deep/40 font-bold">Fetching user database...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-cream-light/50 border-b border-pista-light/30">
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">User Info</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Email Address</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Plan</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Views</th>
                                        <th className="px-8 py-6 text-sm font-black text-pista-deep/50 uppercase tracking-wider">Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-pista-light/20">
                                    <AnimatePresence>
                                        {filteredUsers.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-cream-light/30 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 bg-pista-light/50 rounded-full flex items-center justify-center text-pista-dark font-black">
                                                            {user.name?.charAt(0).toUpperCase() || <User size={18} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-pista-deep">{user.name || 'Anonymous User'}</p>
                                                            <p className="text-[10px] text-pista-deep/40 font-bold uppercase tracking-tighter">ID: {user.id.slice(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-2 text-pista-deep/70">
                                                        <Mail size={14} className="text-pista-dark" />
                                                        <span className="font-medium">{user.email || 'No email provided'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center w-fit space-x-1.5 ${user.subscription === 'premium'
                                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                        : 'bg-pista-light text-pista-dark border border-pista'
                                                        }`}>
                                                        {user.subscription === 'premium' && <Shield size={10} />}
                                                        <span>{user.subscription || 'free'}</span>
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-full bg-cream-light h-2 rounded-full overflow-hidden max-w-[80px]">
                                                            <div
                                                                className={`h-full transition-all duration-500 ${(user.viewsCount || 0) >= 3 ? 'bg-red-500' : 'bg-pista-dark'}`}
                                                                style={{ width: `${Math.min(((user.viewsCount || 0) / 3) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-pista-deep/60">{user.viewsCount || 0}/3</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center space-x-2 text-pista-deep/40 text-sm font-medium">
                                                        <Calendar size={14} />
                                                        <span>
                                                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredUsers.length === 0 && (
                        <div className="py-32 text-center">
                            <div className="inline-flex p-8 bg-cream-light text-pista-deep/20 rounded-full mb-8">
                                <UsersIcon size={64} />
                            </div>
                            <h3 className="text-2xl font-bold text-pista-deep">
                                {users.length === 0 ? "No users registered yet" : "No matching users found"}
                            </h3>
                            <p className="text-pista-deep/50 mt-2">
                                {users.length === 0 ? "Users will appear here as they sign up." : "Try adjusting your search criteria."}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UsersList;
