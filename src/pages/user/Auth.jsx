import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const isStandalonePage = isOpen === undefined;

  // Auto-redirect if already logged in (for standalone page)
  useEffect(() => {
    if (isStandalonePage) {
      const unsubscribeAuto = auth.onAuthStateChanged((user) => {
        if (user) {
          if (user.email?.toLowerCase().startsWith('admin')) {
            window.location.replace('/admin/dashboard');
          } else {
            navigate('/', { replace: true });
          }
        }
      });
      return () => unsubscribeAuto();
    }
  }, [isStandalonePage, navigate]);

  if (!isOpen && !isStandalonePage) return null;

  const handleSuccess = () => {
    if (onClose) onClose();
    if (isStandalonePage) {
      // Use replace: true to prevent going back to login page
      navigate('/', { replace: true });
    }
  };

  const manageSession = async (userEmail) => {
    try {
      if (!userEmail) return true;
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      const userRef = doc(db, 'users', userEmail);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const isPremium = userData.subscription === 'premium';
        const maxSessions = isPremium ? 2 : 1;

        let currentSessions = userData.activeSessions || [];

        // FLUID SESSION MANAGEMENT: "Bump" the oldest session if we're at the limit
        if (currentSessions.length >= maxSessions) {
          currentSessions.shift(); // Remove oldest
        }

        // Add new session
        currentSessions.push(sessionId);

        await updateDoc(userRef, {
          activeSessions: currentSessions,
          lastLogin: serverTimestamp()
        });

        localStorage.setItem('activeSessionId', sessionId);
        localStorage.setItem('lastSessionUpdate', Date.now().toString());
        return true;
      } else {
        // If doc doesn't exist for some reason, still set local session to prevent infinite login loops
        localStorage.setItem('activeSessionId', sessionId);
        localStorage.setItem('lastSessionUpdate', Date.now().toString());
        return true;
      }
    } catch (error) {
      console.error("Session Error:", error);
      return true; // Proceed anyway on doc error to prevent lockout
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // BLOCK ADMIN EMAILS FROM USER AUTH
      if (formData.email.toLowerCase().startsWith('admin')) {
        toast.error('Access Denied: This email is reserved for administration.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const sessionAllowed = await manageSession(userCredential.user.email);
        if (sessionAllowed) {
          toast.success('Successfully logged in!', {
            style: { borderRadius: '1rem', background: '#5F6F52', color: '#fff' }
          });
          handleSuccess();
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.email), {
          uid: user.uid,
          name: formData.name,
          email: user.email,
          createdAt: serverTimestamp(),
          role: 'user',
          viewsCount: 0,
          subscription: 'free',
          activeSessions: []
        });

        const sessionAllowed = await manageSession(user.email);
        if (sessionAllowed) {
          toast.success('Account created successfully!', {
            style: { borderRadius: '1rem', background: '#5F6F52', color: '#fff' }
          });
          handleSuccess();
        }
      }
    } catch (error) {
      console.error("Auth Error:", error);
      let message = "An error occurred. Please try again.";

      if (error.code === 'auth/email-already-in-use') message = "This email is already registered.";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password. Please try again.";
      if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      if (error.code === 'auth/user-not-found') message = "No account found with this email.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/too-many-requests') message = "Too many failed attempts. Please try later.";
      if (error.code === 'auth/user-disabled') message = "This account has been disabled.";
      if (error.message.includes('permission-denied')) message = "Database error: Access Denied.";
      if (error.code === 'auth/network-request-failed') message = "Network error. Please check your connection.";

      toast.error(message, {
        duration: 4000,
        style: { borderRadius: '1rem', background: '#333', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);

    // Use clear provider config
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("No email associated with this Google account.");
      }

      // BLOCK ADMIN EMAILS FROM USER AUTH (CONSISTENCY)
      if (user.email && user.email.toLowerCase().startsWith('admin')) {
        await signOut(auth); // Sign out immediately if it's an admin account
        toast.error('Access Denied: Admin accounts must use the Admin Portal.');
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.email);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          createdAt: serverTimestamp(),
          role: 'user',
          viewsCount: 0,
          subscription: 'free',
          activeSessions: [],
          photoURL: user.photoURL
        });
        toast.success('Account created with Google!');
      } else {
        toast.success('Signed in with Google!');
      }

      const sessionAllowed = await manageSession(user.email);
      if (sessionAllowed) {
        handleSuccess();
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      let message = "Failed to sign in with Google.";

      // Detailed error reporting for debugging
      if (error.code === 'auth/popup-blocked') message = "The sign-in popup was blocked. Please allow popups for this site.";
      if (error.code === 'auth/cancelled-popup-request') return;
      if (error.code === 'auth/popup-closed-by-user') return;
      if (error.code === 'auth/operation-not-allowed') message = "Google Sign-In is not enabled in the Firebase Console.";
      if (error.code === 'auth/internal-error') message = "Internal Firebase error. Please check your internet connection.";
      if (error.message.includes('permission-denied')) message = "Database access denied. Please contact support.";

      toast.error(message, {
        duration: 5000,
        style: { borderRadius: '1rem', background: '#333', color: '#fff' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address first.', { style: { borderRadius: '1rem' } });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success('Reset link sent to your email!', {
        style: { borderRadius: '1rem', background: '#5F6F52', color: '#fff' }
      });
    } catch (error) {
      console.error("Reset Error:", error);
      let message = "Failed to send reset email.";
      if (error.code === 'auth/user-not-found') message = "No account found with this email.";
      if (error.code === 'auth/too-many-requests') message = "Too many requests. Try again later.";
      toast.error(message, { style: { borderRadius: '1rem' } });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => setIsLogin(!isLogin);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center ${isStandalonePage ? 'overflow-y-auto bg-cream-light' : 'overflow-y-auto justify-center bg-pista-deep/40 backdrop-blur-md'} p-4`}>
      {/* Backdrop - Only show if modal */}
      {!isStandalonePage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
          className="fixed inset-0 -z-10"
        />
      )}

      {/* Container - Added min-height for mobile to prevent card collapse */}
      <div className={`relative w-full max-w-5xl lg:h-[620px] h-[580px] sm:h-fit sm:max-h-[85vh] [perspective:2000px] my-auto`}>
        <motion.div
          initial={false}
          animate={{ rotateY: isLogin ? 0 : 180 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="w-full h-full relative [transform-style:preserve-3d]"
        >
          {/* FRONT SIDE (LOGIN) */}
          <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-y-auto sm:overflow-hidden border border-pista-light/20 shadow-pista/5`}>
            {!isStandalonePage && (
              <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-pista-deep shadow-md transition-all active:scale-95">
                <X size={20} />
              </button>
            )}

            <div className="hidden lg:block lg:w-5/12 relative">
              <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=2070&auto=format&fit=crop" alt="Study Session" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-pista-dark/30 backdrop-blur-[1px]"></div>
              <div className="absolute bottom-10 left-10 right-10 z-10 text-white">
                <h2 className="text-3xl font-black leading-tight">Empowering Students <br /> Through Better Notes.</h2>
              </div>
            </div>

            <div className="w-full lg:w-7/12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
              <div className="max-w-md mx-auto w-full p-6 sm:p-8 lg:p-12 my-auto">
                <header className="mb-8 text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl font-black text-pista-deep mb-2">Login</h1>
                  <p className="text-pista-deep/40 font-bold">Welcome back to your educational archive</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-pista-deep/60 px-1 uppercase tracking-wider">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark transition-colors" size={20} />
                      <input
                        type="email"
                        className="w-full pl-14 pr-6 py-4 bg-cream-light border border-pista-light/40 rounded-3xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-sm font-black text-pista-deep/60 uppercase tracking-wider">Password</label>
                      <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-xs font-black text-pista-dark hover:underline disabled:opacity-50">Forgot?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-14 pr-14 py-4 bg-cream-light border border-pista-light/40 rounded-3xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-pista-deep/30 hover:text-pista-dark transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-3 py-4 sm:py-5 bg-pista-dark text-white rounded-[2rem] font-black text-lg hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-[0.98] disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><span>Authenticate</span><ArrowRight size={22} /></>}
                  </button>
                </form>

                <div className="mt-2 mb-2 border-t border-pista-light/20 w-full" />

                <button onClick={handleGoogleLogin} disabled={loading} className="w-full flex items-center justify-center space-x-4 py-3 sm:py-4 bg-white border-2 border-pista-light/20 text-pista-deep rounded-[2rem] font-black hover:border-pista-dark/40 transition-all active:scale-[0.98] disabled:opacity-70">
                  <svg className="w-6 h-6" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.248 1.224-3.192 2.544-6.416 2.544-5.112 0-9.12-4.144-9.12-9.264 0-5.12 4.008-9.264 9.12-9.264 2.768 0 4.8 1.096 6.288 2.512l2.312-2.312C18.16 1.056 15.44 0 12.48 0 5.688 0 0 5.688 0 12.512c0 6.824 5.688 12.512 12.48 12.512 3.688 0 6.472-1.208 8.64-3.48 2.224-2.224 2.928-5.384 2.928-7.96 0-.768-.064-1.488-.184-2.16H12.48z" /></svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              <footer className="mt-2 text-center border-t border-pista-light/20 pt-4">
                <p className="text-pista-deep/30 font-bold mb-2 uppercase tracking-tighter text-sm">New to the community?</p>
                <button onClick={handleToggle} disabled={loading} className="text-pista-dark font-black hover:text-pista-deep transition-colors text-xl underline decoration-pista-light underline-offset-8 decoration-4 disabled:opacity-50">Create new account</button>
              </footer>
            </div>
          </div>

          {/* BACK SIDE (SIGNUP) */}
          <div className={`absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row-reverse overflow-y-auto sm:overflow-hidden border border-pista-light/20 shadow-pista/5`}>
            {!isStandalonePage && (
              <button onClick={onClose} className="absolute top-6 left-6 z-20 p-2 bg-white/80 hover:bg-white rounded-full text-pista-deep shadow-md transition-all active:scale-95">
                <X size={20} />
              </button>
            )}

            <div className="hidden lg:block lg:w-5/12 relative">
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop" alt="Study Group" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-pista-dark/30 backdrop-blur-[1px]"></div>
              <div className="absolute bottom-10 left-10 right-10 z-10 text-white">
                <h2 className="text-3xl font-black leading-tight text-right">Join the Network <br /> of Bright Minds.</h2>
              </div>
            </div>

            <div className="w-full lg:w-7/12 flex flex-col bg-white overflow-y-auto custom-scrollbar">
              <div className="max-w-md mx-auto w-full p-6 sm:p-8 lg:p-12 my-auto">
                <header className="mb-6 text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl font-black text-pista-deep mb-2">Register</h1>
                  <p className="text-pista-deep/40 font-bold">Initialize your student profile today</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-pista-deep/60 px-1 uppercase tracking-wider">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark transition-colors" size={20} />
                      <input
                        type="text"
                        className="w-full pl-14 pr-6 py-4 bg-cream-light border border-pista-light/40 rounded-3xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                        required={!isLogin}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-pista-deep/60 px-1 uppercase tracking-wider">Education Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark transition-colors" size={20} />
                      <input
                        type="email"
                        className="w-full pl-14 pr-6 py-4 bg-cream-light border border-pista-light/40 rounded-3xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-pista-deep/60 px-1 uppercase tracking-wider">Secure Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-pista-deep/30 group-focus-within:text-pista-dark transition-colors" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-14 pr-14 py-4 bg-cream-light border border-pista-light/40 rounded-3xl focus:outline-none focus:border-pista transition-all font-bold text-pista-deep"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={loading}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-pista-deep/30 hover:text-pista-dark transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center space-x-3 py-4 sm:py-5 bg-pista-dark text-white rounded-[2rem] font-black text-lg hover:bg-pista-deep transition-all shadow-xl shadow-pista/20 active:scale-[0.98] mt-4 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><span>Initialize Account</span><ArrowRight size={22} /></>}
                  </button>
                </form>

                <footer className="mt-6 text-center border-t border-pista-light/20 pt-4">
                  <p className="text-pista-deep/30 font-bold mb-2 uppercase tracking-tighter text-sm">Already a member?</p>
                  <button onClick={handleToggle} disabled={loading} className="text-pista-dark font-black hover:text-pista-deep transition-colors text-xl underline decoration-pista-light underline-offset-8 decoration-4 disabled:opacity-50">Back to login</button>
                </footer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthModal;
