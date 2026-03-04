import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, QrCode, Upload, Loader2, Clock, Ticket, CheckCircle2, CreditCard } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import qrCodeImg from '../assets/qr_code.jpeg';

const SubscriptionModal = ({ isOpen, onClose, user }) => {
    const [step, setStep] = useState(1); // 1: Pricing, 2: Payment, 3: Success
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [receipt, setReceipt] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);
    const [isCouponSuccess, setIsCouponSuccess] = useState(false);

    const plans = [
        { id: 'monthly', name: 'Monthly Pro', price: '₹99', duration: '30 Days', features: ['Unlimited PDF Views', 'Priority Requests', 'Ad-free Experience', 'Offline Access'] },
        { id: 'yearly', name: 'Yearly Legend', price: '₹799', duration: '365 Days', features: ['Unlimited PDF Views', 'All Classes Access', 'Exclusive Study Guides', 'Direct Mentor Support'], popular: true },
    ];

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setReceipt(null);
            setTimeLeft(300);
            setIsCouponSuccess(false);

            // Auto-check if user already has a pending request
            const checkExistingRequest = async () => {
                try {
                    const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
                    const q = query(
                        collection(db, 'subscription_requests'),
                        where('userId', '==', user?.email),
                        where('status', '==', 'pending'),
                        limit(1)
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        setStep(3); // Already submitted
                    }
                } catch (error) {
                    console.error("Error checking request:", error);
                }
            };

            if (user) checkExistingRequest();
        }
    }, [isOpen, user]);

    useEffect(() => {
        let timer;
        if (step === 2 && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && step === 2) {
            toast.error('Payment session expired. Please try again.');
            setStep(1);
            setTimeLeft(300);
        }
        return () => clearInterval(timer);
    }, [step, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setStep(2);
        setTimeLeft(300);
    };

    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) return toast.error('File size must be less than 5MB');
            setReceipt(file);
        }
    };

    const handleSubmitPayment = async () => {
        if (!receipt) return toast.error('Please upload your payment receipt');

        setUploading(true);
        const toastId = toast.loading('Submitting your request...');

        try {
            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

            // 1. Upload receipt to Cloudinary
            const data = new FormData();
            data.append('file', receipt);
            data.append('upload_preset', uploadPreset);
            data.append('cloud_name', cloudName);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
                method: 'POST',
                body: data
            });

            const cloudData = await response.json();
            const receiptUrl = cloudData.secure_url;

            // 2. Save request to Firestore
            await addDoc(collection(db, 'subscription_requests'), {
                userId: user.email,
                userName: user.displayName || 'Student',
                userEmail: user.email,
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                receiptUrl: receiptUrl,
                status: 'pending',
                amount: selectedPlan.price,
                createdAt: serverTimestamp()
            });

            setStep(3);
            toast.success('Request submitted!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit request', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setApplyingCoupon(true);
        const toastId = toast.loading('Verifying coupon...');

        try {
            if (couponCode.toUpperCase() === 'FREEPASS') {
                // GRANT FULL ACCESS DIRECTLY
                const userRef = doc(db, 'users', user.email);
                await updateDoc(userRef, {
                    subscription: 'premium',
                    viewsCount: 0,
                    activatedVia: 'coupon'
                });

                toast.success('Access Granted! You are now a Premium Member.', { id: toastId });
                setIsCouponSuccess(true);
                setStep(3);
            } else {
                toast.error('Invalid coupon code', { id: toastId });
            }
        } catch (error) {
            console.error("Coupon Error:", error);
            toast.error('Failed to apply coupon', { id: toastId });
        } finally {
            setApplyingCoupon(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-pista-deep/60 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-[92%] sm:w-[90%] lg:w-[900px] h-auto lg:h-[600px] max-h-[90vh] bg-cream-light rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col sm:block"
                >
                    {/* Header */}
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
                        <button onClick={onClose} className="p-2 sm:p-3 bg-white/50 hover:bg-white rounded-full transition-all active:scale-95 shadow-lg backdrop-blur-md">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Sidebar / Feature List */}
                        <div className="lg:w-1/3 bg-pista-dark p-6 sm:p-8 text-white flex flex-col justify-center">
                            <div className="mb-3 sm:mb-4">
                                <span className="px-3 py-0.5 bg-white/20 rounded-full text-[9px] font-black tracking-widest uppercase mb-2 inline-block italic">Elite Membership</span>
                                <h2 className="text-xl sm:text-2xl font-black mb-1 whitespace-nowrap">Unlock the Archive.</h2>
                                <p className="text-pista-light/60 text-[10px] sm:text-xs font-medium leading-tight">Join 5000+ students already using StudywithSN to ace their exams.</p>
                            </div>

                            <div className="space-y-3">
                                {plans[1].features.map((f, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <div className="p-1 bg-white/20 rounded-lg">
                                            <Check size={10} />
                                        </div>
                                        <span className="text-[10px] sm:text-[11px] font-bold text-pista-light/80">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:w-2/3 p-5 sm:p-10 overflow-y-auto lg:overflow-hidden flex flex-col justify-center max-h-[70vh] lg:max-h-none">
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col justify-center lg:min-h-[400px]"
                                >
                                    <header className="mb-6 sm:mb-8 text-center lg:text-left">
                                        <h3 className="text-xl sm:text-2xl font-black text-pista-deep mb-1">Select Your Plan</h3>
                                        <p className="text-pista-deep/40 font-bold uppercase tracking-widest text-[9px]">Free limit reached. Get unlimited access today.</p>
                                    </header>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {plans.map((plan) => (
                                            <div
                                                key={plan.id}
                                                className={`relative p-5 sm:p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer hover:scale-[1.02] ${plan.popular ? 'border-pista-dark bg-white shadow-xl' : 'border-pista-light/40 bg-white/50'}`}
                                                onClick={() => handlePlanSelect(plan)}
                                            >
                                                {plan.popular && (
                                                    <span className="absolute -top-3 left-6 bg-pista-dark text-white px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase italic">Popular Choice</span>
                                                )}
                                                <h4 className="text-lg font-black text-pista-deep mb-1">{plan.name}</h4>
                                                <div className="flex items-baseline space-x-1 mb-3">
                                                    <span className="text-2xl font-black text-pista-dark">{plan.price}</span>
                                                    <span className="text-[10px] font-bold text-pista-deep/40">/ {plan.duration}</span>
                                                </div>
                                                <button className={`w-full py-2.5 rounded-xl font-black text-xs transition-all ${plan.popular ? 'bg-pista-dark text-white shadow-lg' : 'bg-pista-light/30 text-pista-dark'}`}>
                                                    Choose Plan
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 border-t border-pista-light/30">
                                        <p className="text-[9px] font-black text-pista-deep/30 uppercase tracking-widest text-center mb-3">Have a coupon code?</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative group">
                                                <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-pista-deep/20 group-focus-within:text-pista-dark transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Enter Code"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-pista-light/40 rounded-xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep text-sm"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={applyingCoupon || !couponCode}
                                                className="px-6 bg-pista-dark text-white rounded-xl font-black text-sm hover:bg-pista-deep transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {applyingCoupon ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center text-center min-h-[400px]"
                                >
                                    <header className="mb-2">
                                        <div className="flex items-center justify-center space-x-2 text-red-500 font-extrabold mb-1 italic">
                                            <Clock size={14} className="animate-pulse" />
                                            <span className="text-[9px] uppercase tracking-widest">Expires: {formatTime(timeLeft)}</span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black text-pista-deep italic uppercase leading-none">Scan & Pay</h3>
                                    </header>

                                    <div className="relative mb-1">
                                        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center relative">
                                            <img
                                                src={qrCodeImg}
                                                alt="Payment QR Code"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '<div class="text-pista-deep/40 font-bold p-10 text-xs">QR Code currently unavailable.</div>';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="max-w-xs mx-auto space-y-3 w-full">
                                        <div className="p-4 bg-white/50 border border-pista-light/30 border-dashed rounded-2xl relative group cursor-pointer overflow-hidden transition-all hover:bg-white">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={handleReceiptUpload}
                                                accept="image/*,.pdf"
                                            />
                                            <div className="flex flex-col items-center">
                                                <div className="p-2 bg-pista-light/30 rounded-xl text-pista-dark mb-1">
                                                    <Upload size={18} />
                                                </div>
                                                <p className="font-bold text-pista-deep text-[11px]">
                                                    {receipt ? receipt.name : 'Upload Receipt'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSubmitPayment}
                                            disabled={uploading || !receipt}
                                            className="w-full flex items-center justify-center space-x-2 py-4 bg-pista-dark text-white rounded-xl font-black text-sm hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {uploading ? <Loader2 className="animate-spin" size={18} /> : <span>Verify Payment</span>}
                                        </button>
                                        <button onClick={() => setStep(1)} className="text-[10px] font-bold text-pista-deep/30 hover:text-pista-dark uppercase tracking-widest block mx-auto">Go Back</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center h-full flex flex-col justify-center py-20">
                                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl transition-all ${isCouponSuccess ? 'bg-amber-400 text-white shadow-amber-400/50' : 'bg-pista-dark text-white shadow-pista/50'} translate-y-[-20px]`}>
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <h3 className="text-4xl font-black text-pista-deep mb-4 italic">
                                        {isCouponSuccess ? 'Congratulations!' : 'Applied!'}
                                    </h3>
                                    <div className="max-w-md mx-auto bg-white/50 p-8 rounded-[2.5rem] border border-pista-light/30 shadow-inner">
                                        <p className="text-pista-deep text-lg font-bold leading-relaxed mb-4">
                                            {isCouponSuccess
                                                ? 'You have unlocked lifetime access to all study materials. Your premium membership is now active!'
                                                : 'Your request has been submitted successfully to our curators.'
                                            }
                                        </p>
                                        <div className={`flex items-center justify-center space-x-2 font-black uppercase text-xs tracking-widest mb-6 px-4 py-2 rounded-full inline-block ${isCouponSuccess ? 'bg-amber-100 text-amber-600' : 'bg-pista-light/30 text-pista-dark'}`}>
                                            {isCouponSuccess ? (
                                                <>
                                                    <CreditCard size={16} />
                                                    <span>Unlimited Access Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={16} />
                                                    <span>Activation within 2 Hours</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className={`mt-12 px-12 py-4 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 ${isCouponSuccess ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-pista-dark hover:bg-pista-deep shadow-pista/20'}`}
                                    >
                                        Explore Library
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SubscriptionModal;
