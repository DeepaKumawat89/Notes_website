import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Search,
    Check,
    X,
    ExternalLink,
    Loader2,
    Clock,
    User,
    Mail,
    Filter
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import { db } from '../../firebase';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const Payments = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const q = query(collection(db, 'subscription_requests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (request) => {
        const toastId = toast.loading('Activating premium access...');
        try {
            const userRef = doc(db, 'users', request.userId);
            await updateDoc(userRef, {
                subscription: 'premium',
                viewsCount: 0
            });

            const requestRef = doc(db, 'subscription_requests', request.id);
            await updateDoc(requestRef, {
                status: 'approved',
                approvedAt: new Date()
            });

            toast.success(`Premium activated for ${request.userName}`, { id: toastId });
        } catch (error) {
            toast.error('Activation failed', { id: toastId });
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Decline this subscription request?')) return;
        try {
            const requestRef = doc(db, 'subscription_requests', requestId);
            await updateDoc(requestRef, {
                status: 'rejected'
            });
            toast.success('Request declined');
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        total: requests.length
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] flex font-sans selection:bg-pista-light">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden">
                {/* Premium Header */}
                <header className="px-10 py-10 bg-white border-b border-gray-100 z-20 overflow-visible">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-2 w-10 bg-pista-dark rounded-full" />
                                <span className="text-[10px] font-black text-pista-deep/40 uppercase tracking-[0.4em]">Finance Portal</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Payment <span className="text-pista-dark italic">Verification</span></h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="px-6 py-4 bg-amber-50 rounded-3xl border border-amber-100 flex items-center space-x-4">
                                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest leading-none mb-1">Pending</p>
                                    <p className="text-xl font-black text-amber-700 leading-none">{stats.pending}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-pista-light/30 rounded-3xl border border-pista/20 flex items-center space-x-4">
                                <div className="p-2 bg-pista-dark text-white rounded-xl shadow-lg shadow-pista/20">
                                    <Check size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-pista-dark/50 uppercase tracking-widest leading-none mb-1">Cleansed</p>
                                    <p className="text-xl font-black text-pista-deep leading-none">{stats.approved}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-200 flex items-center space-x-4">
                                <div className="p-2 bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Logs</p>
                                    <p className="text-xl font-black text-slate-900 leading-none">{stats.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative group flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pista-dark transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search students or receipts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-8 py-5 bg-slate-50 border-none rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-pista/10 font-bold text-slate-700 placeholder:text-slate-300 transition-all shadow-inner"
                            />
                        </div>

                        <div className="relative min-w-[200px]">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 pointer-events-none" size={18} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full appearance-none pl-12 pr-10 py-5 bg-white border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-pista/10 font-black text-pista-deep text-sm shadow-sm cursor-pointer transition-all uppercase tracking-widest"
                            >
                                <option value="all">Display All</option>
                                <option value="pending">Waiting Approval</option>
                                <option value="approved">Cleansed & Active</option>
                                <option value="rejected">Declined</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#F8F9FA]/50">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {loading ? (
                            <div className="h-[50vh] flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                                <p className="text-sm font-black text-pista-deep/20 uppercase tracking-[0.3em]">Synchronizing Ledger</p>
                            </div>
                        ) : filteredRequests.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <AnimatePresence mode='popLayout'>
                                    {filteredRequests.map((req, idx) => (
                                        <motion.div
                                            key={req.id}
                                            layout
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                            className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(107,136,108,0.1)] transition-all group overflow-hidden relative"
                                        >
                                            {/* Status Background Accent */}
                                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-colors ${req.status === 'approved' ? 'bg-green-500' :
                                                    req.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500 group-hover:bg-pista'
                                                }`} />

                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="flex items-center space-x-5">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-pista-light/30 rounded-[1.5rem] flex items-center justify-center text-pista-dark font-black text-2xl italic shadow-inner">
                                                            {req.userName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm ${req.status === 'approved' ? 'bg-green-500 animate-pulse' :
                                                                req.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                                                            }`}>
                                                            {req.status === 'approved' ? <Check size={12} strokeWidth={4} /> :
                                                                req.status === 'rejected' ? <X size={12} strokeWidth={4} /> : <Clock size={12} strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{req.userName}</h3>
                                                        <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                                                            <Mail size={14} className="text-pista-dark" /> {req.userEmail}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 italic">Transaction ID</p>
                                                    <p className="text-xs font-mono font-bold text-slate-400">#{req.id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-px bg-slate-100/50 rounded-[2rem] overflow-hidden mb-8 border border-slate-100">
                                                <div className="bg-slate-50/50 p-6 backdrop-blur-sm">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Entitlement</p>
                                                    <p className="text-xl font-black text-slate-800 italic">{req.planName}</p>
                                                </div>
                                                <div className="bg-slate-50/50 p-6 backdrop-blur-sm">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contribution</p>
                                                    <p className="text-xl font-black text-pista-dark">{req.amount}</p>
                                                </div>
                                                <div className="col-span-2 bg-white p-6">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Date</p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                            <Clock size={14} className="text-pista" />
                                                            {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : 'Pending...'}
                                                        </p>
                                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter ${req.status === 'approved' ? 'bg-green-50 text-green-600' :
                                                                req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 relative z-10">
                                                <a
                                                    href={req.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex items-center justify-center space-x-3 py-5 bg-slate-900 rounded-[1.5rem] font-black text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
                                                >
                                                    <span className="uppercase text-xs tracking-widest">Audit Receipt</span>
                                                    <ExternalLink size={18} />
                                                </a>

                                                {req.status === 'pending' && (
                                                    <div className="flex gap-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleReject(req.id)}
                                                            className="p-5 bg-white border border-red-100 text-red-500 rounded-[1.5rem] hover:bg-red-50 transition-colors shadow-sm"
                                                            title="Decline Request"
                                                        >
                                                            <X size={20} strokeWidth={3} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleApprove(req)}
                                                            className="p-5 bg-pista-dark text-white rounded-[1.5rem] hover:bg-pista-deep shadow-2xl shadow-pista/30 transition-all"
                                                            title="Validate & Activate"
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </motion.button>
                                                    </div>
                                                )}
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
                                    <CreditCard size={80} strokeWidth={1} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800">Ledger is Clean</h3>
                                <p className="text-slate-400 font-bold mt-3 max-w-sm mx-auto">No pending subscription requests found matching your filter criteria.</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Payments;
