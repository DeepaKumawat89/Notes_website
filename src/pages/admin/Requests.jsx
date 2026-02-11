import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Search,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(requestsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const deleteRequest = async (id) => {
        try {
            await deleteDoc(doc(db, 'requests', id));
            toast.success('Request removed');
        } catch (error) {
            toast.error('Failed to remove request');
        }
    };

    const filteredRequests = requests.filter(request =>
        request.noteTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-10 pt-24 lg:pt-0">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 lg:pt-10">
                    <div>
                        <h1 className="text-3xl font-bold text-pista-deep">Note Requests</h1>
                        <p className="text-pista-deep/50 font-medium">Study material requested by students</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                        <div className="bg-white px-6 py-3 rounded-2xl border border-pista-light/30 shadow-sm flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                            <span className="text-pista-deep/50 font-bold uppercase text-xs tracking-widest">Pending</span>
                            <span className="text-2xl font-black text-pista-deep">{requests.length}</span>
                        </div>

                        <div className="relative group flex-1 md:flex-none w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark" size={20} />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 w-full md:w-64 lg:w-80 shadow-sm"
                            />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {loading ? (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                                <p className="text-pista-deep/40 font-bold">Scanning for requests...</p>
                            </div>
                        ) : filteredRequests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white p-6 rounded-[2rem] border border-pista-light/20 shadow-lg shadow-pista/5 group relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-pista-light/40 rounded-2xl text-pista-dark">
                                        <BookOpen size={24} />
                                    </div>
                                    <button
                                        onClick={() => deleteRequest(req.id)}
                                        className="p-2 text-pista-deep/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-pista-deep leading-tight mb-1">{req.noteTitle || 'Unnamed Note'}</h3>
                                    <p className="text-sm text-pista-deep/50 font-medium">Class {req.classId || '?'}, {req.subjectId || 'Subject unknown'}</p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-pista-light/10">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-cream-light rounded-full flex items-center justify-center text-pista-dark text-xs font-bold">
                                            {req.userName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-pista-deep">{req.userName || 'Student'}</p>
                                            <div className="flex items-center space-x-1.5 text-pista-deep/30">
                                                <Clock size={10} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {req.description && (
                                        <div className="bg-cream-light/50 p-4 rounded-2xl">
                                            <p className="text-xs text-pista-deep/60 leading-relaxed italic">
                                                "{req.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <button className="w-full py-3 bg-pista-light hover:bg-pista text-pista-dark rounded-xl font-bold flex items-center justify-center space-x-2 transition-all active:scale-95">
                                        <CheckCircle2 size={16} />
                                        <span>Mark as Fulfilled</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {!loading && filteredRequests.length === 0 && (
                    <div className="py-32 text-center bg-white rounded-[3rem] border border-pista-light/10">
                        <div className="inline-flex p-8 bg-cream-light text-pista-deep/20 rounded-full mb-8">
                            <MessageSquare size={64} />
                        </div>
                        <h3 className="text-2xl font-bold text-pista-deep">
                            {requests.length === 0 ? "Inbox is clean" : "No results found"}
                        </h3>
                        <p className="text-pista-deep/50 mt-2">
                            {requests.length === 0 ? "You've addressed all pending note requests." : "Try searching for something else."}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Requests;
