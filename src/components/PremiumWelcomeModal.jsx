import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, BookOpen, Crown, CheckCircle2, Star, Sparkles, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const PremiumWelcomeModal = ({ isOpen, onClose, userEmail }) => {
    const handleClose = async () => {
        try {
            const userRef = doc(db, 'users', userEmail);
            await updateDoc(userRef, {
                hasSeenPremiumWelcome: true
            });
            onClose();
        } catch (error) {
            console.error("Error updating welcome status:", error);
            onClose(); // Close anyway if update fails
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 sm:p-12 text-center relative overflow-hidden">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-1/2 -left-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
                        />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 border border-white/30 shadow-2xl">
                                <Crown className="text-white w-10 h-10" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tight mb-2">
                                Welcome, <span className="text-purple-200 not-italic">Scholar!</span>
                            </h2>
                            <p className="text-indigo-100 font-black text-[10px] uppercase tracking-[0.4em]">Premium Status Activated</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 sm:p-12 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                            {[
                                { icon: Zap, title: 'Unlimited Access', desc: 'Download archive manuscripts without any restrictions.' },
                                { icon: Star, title: 'Research Mode', desc: 'Focus-optimized high-contrast study environment.' },
                                { icon: Shield, title: 'Elite Identity', desc: 'Exclusive badges and priority recognition platform-wide.' },
                                { icon: CheckCircle2, title: 'Verified Assets', desc: 'High-integrity, peer-reviewed academic materials.' }
                            ].map((perk, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                        <perk.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-1">{perk.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest leading-4">{perk.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Sparkles size={16} />
                            <span>Enter Elite Portal</span>
                        </button>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all sm:hidden"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PremiumWelcomeModal;
