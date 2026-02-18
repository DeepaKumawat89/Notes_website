import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && user.email.toLowerCase().startsWith('admin')) {
                let localSessionId = localStorage.getItem('adminSessionId');

                if (!localSessionId) {
                    localSessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
                    localStorage.setItem('adminSessionId', localSessionId);
                    localStorage.setItem('adminLastUpdate', Date.now().toString());

                    const adminRef = doc(db, 'admins', user.email);
                    try {
                        const adminSnap = await getDoc(adminRef);

                        let activeSessions = [];
                        if (adminSnap.exists()) {
                            activeSessions = adminSnap.data().activeSessions || [];
                        } else {
                            await setDoc(adminRef, {
                                email: user.email,
                                createdAt: serverTimestamp(),
                                activeSessions: []
                            });
                        }

                        // Bump logic (2 session limit for admin)
                        if (activeSessions.length >= 2) activeSessions.shift();
                        activeSessions.push(localSessionId);

                        await updateDoc(adminRef, {
                            activeSessions: activeSessions,
                            lastActive: serverTimestamp()
                        });
                        navigate('/admin/dashboard', { replace: true });
                    } catch (err) {
                        console.error("Session init error:", err);
                        setCheckingSession(false);
                    }
                } else {
                    // Update grace period pulse even on resumption
                    localStorage.setItem('adminLastUpdate', Date.now().toString());
                    navigate('/admin/dashboard', { replace: true });
                }
            } else {
                setCheckingSession(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-cream-light flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-10 h-10 border-4 border-pista-dark border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Password/Email validation
        if (!formData.email.toLowerCase().startsWith('admin')) {
            toast.error('Access Denied: Only admin accounts can log in here.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
            localStorage.setItem('adminSessionId', sessionId);
            localStorage.setItem('adminLastUpdate', Date.now().toString());

            const adminRef = doc(db, 'admins', user.email);
            const adminSnap = await getDoc(adminRef);

            let activeSessions = [];
            if (adminSnap.exists()) {
                activeSessions = adminSnap.data().activeSessions || [];
            } else {
                await setDoc(adminRef, {
                    email: user.email,
                    createdAt: serverTimestamp(),
                    activeSessions: []
                });
            }

            // Bump logic (2 session limit)
            if (activeSessions.length >= 2) activeSessions.shift();
            activeSessions.push(sessionId);

            await updateDoc(adminRef, {
                activeSessions: activeSessions,
                lastLogin: serverTimestamp(),
                lastActive: serverTimestamp()
            });

            toast.success('Login successful! Welcome Admin.', {
                duration: 3000,
                style: {
                    borderRadius: '1rem',
                    background: '#5F6F52',
                    color: '#fff',
                    fontWeight: 'bold'
                }
            });

            setTimeout(() => {
                navigate('/admin/dashboard');
            }, 1000);

        } catch (error) {
            console.error("Admin Auth Error:", error);
            toast.error(error.message.includes('invalid-credential')
                ? 'Invalid admin email or password.'
                : 'Authentication failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-cream-light flex items-center justify-center p-4 lg:p-10 font-outfit">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden min-h-[600px] border border-pista-light/20"
            >
                {/* Left Side: Security Image */}
                <div className="hidden lg:block lg:w-5/12 relative">
                    <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                        alt="Security and Control"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-pista-deep/60 backdrop-blur-[2px]"></div>
                    <div className="absolute inset-0 flex flex-col justify-between p-12">
                        <Link to="/" className="inline-flex items-center space-x-2 text-white bg-white/10 px-4 py-2 rounded-full backdrop-blur-md w-fit hover:bg-white/20 transition-all">
                            <ArrowLeft size={18} />
                            <span className="font-bold text-sm">Return Home</span>
                        </Link>

                        <div className="text-white">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                                <ShieldCheck size={28} />
                            </div>
                            <h2 className="text-3xl font-black leading-tight">
                                Administrator Console <br />
                                <span className="text-pista-light/60">Secure Access Point</span>
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Right Side: Simple Form */}
                <div className="w-full lg:w-7/12 p-8 lg:p-16 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        <header className="mb-12">
                            <div className="inline-flex p-3 bg-pista-light/20 rounded-2xl text-pista-dark mb-6">
                                <ShieldCheck size={24} />
                            </div>
                            <h1 className="text-4xl font-black text-pista-deep mb-2">Admin Portal</h1>
                            <p className="text-pista-deep/40 font-bold tracking-tight">Enter your dashboard credentials</p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-pista-deep/60 px-1 uppercase tracking-widest">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/20 group-focus-within:text-pista-dark transition-colors" size={20} />
                                    <input
                                        type="email"
                                        placeholder=""
                                        className="w-full pl-14 pr-6 py-5 bg-cream-light border border-pista-light/40 rounded-[2rem] focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-black text-pista-deep/60 uppercase tracking-widest">Password</label>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/20 group-focus-within:text-pista-dark transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder=""
                                        className="w-full pl-14 pr-14 py-5 bg-cream-light border border-pista-light/40 rounded-[2rem] focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-pista-deep/20 hover:text-pista-dark transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center space-x-3 py-5 bg-pista-dark text-white rounded-[2rem] font-black text-lg hover:bg-pista-deep transition-all shadow-2xl shadow-pista/30 active:scale-[0.98] mt-4"
                            >
                                <span>Verify & Access</span>
                                <ArrowRight size={22} />
                            </button>
                        </form>

                        <footer className="mt-12 text-center">
                            <div className="h-px bg-pista-light/20 w-12 mx-auto mb-6"></div>
                            <p className="text-pista-deep/30 text-xs font-bold uppercase tracking-widest">
                                Secure Environment 128-bit
                            </p>
                        </footer>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
