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
        const toastId = toast.loading('Activating subscription...');
        try {
            // 1. Update User to Premium
            const userRef = doc(db, 'users', request.userId);
            await updateDoc(userRef, {
                subscription: 'premium',
                viewsCount: 0 // Reset views or keep? Resetting is better for premium.
            });

            // 2. Update Request Status
            const requestRef = doc(db, 'subscription_requests', request.id);
            await updateDoc(requestRef, {
                status: 'approved',
                approvedAt: new Date()
            });

            toast.success(`Access granted to ${request.userName}`, { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to approve request', { id: toastId });
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;
        try {
            const requestRef = doc(db, 'subscription_requests', requestId);
            await updateDoc(requestRef, {
                status: 'rejected'
            });
            toast.success('Request rejected');
        } catch (error) {
            toast.error('Error rejecting request');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-cream-light flex">
            <AdminSidebar />

            <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-pista-deep italic">Subscription Requests</h1>
                        <p className="text-pista-deep/50 font-medium">Verify receipts and activate premium access</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 shadow-sm"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none pl-12 pr-10 py-3 bg-white border border-pista-light/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pista/20 shadow-sm font-bold text-pista-deep"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/30" size={18} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {loading ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-pista-dark mb-4" size={48} />
                            <p className="text-pista-deep/40 font-bold uppercase tracking-widest text-xs">Accessing Payment Logs...</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredRequests.map((req, idx) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[2.5rem] p-8 border border-pista-light/20 shadow-xl shadow-pista/5 group"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-14 h-14 bg-pista-light/50 rounded-2xl flex items-center justify-center text-pista-dark font-black text-xl italic">
                                                {req.userName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-pista-deep">{req.userName}</h3>
                                                <p className="text-xs font-bold text-pista-deep/40 flex items-center gap-1">
                                                    <Mail size={12} /> {req.userEmail}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border ${req.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                    'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 p-6 bg-cream-light rounded-3xl mb-8">
                                        <div>
                                            <p className="text-[10px] font-black text-pista-deep/30 uppercase tracking-widest mb-1">Plan Selected</p>
                                            <p className="text-lg font-black text-pista-dark">{req.planName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-pista-deep/30 uppercase tracking-widest mb-1">Amount Paid</p>
                                            <p className="text-lg font-black text-pista-deep">{req.amount}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] font-black text-pista-deep/30 uppercase tracking-widest mb-1">Uploaded On</p>
                                            <p className="text-sm font-bold text-pista-deep/60 flex items-center gap-2">
                                                <Clock size={14} />
                                                {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <a
                                            href={req.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center space-x-2 py-4 bg-white border-2 border-pista-light/40 rounded-2xl font-black text-pista-deep hover:bg-pista-light/20 transition-all active:scale-95"
                                        >
                                            <span>View Receipt</span>
                                            <ExternalLink size={18} />
                                        </a>

                                        {req.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                                                    title="Reject Request"
                                                >
                                                    <X size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(req)}
                                                    className="p-4 bg-pista-dark text-white rounded-2xl hover:bg-pista-deep shadow-lg shadow-pista/20 transition-all active:scale-95"
                                                    title="Approve & Activate"
                                                >
                                                    <Check size={20} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {!loading && filteredRequests.length === 0 && (
                    <div className="py-32 text-center bg-white rounded-[3rem] border border-pista-light/20 shadow-xl shadow-pista/5">
                        <div className="inline-flex p-8 bg-cream-light text-pista-deep/10 rounded-full mb-8">
                            <CreditCard size={64} />
                        </div>
                        <h3 className="text-3xl font-black text-pista-deep">No payments found</h3>
                        <p className="text-pista-deep/40 font-bold mt-2">New subscription requests will appear here for verification.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Payments;
