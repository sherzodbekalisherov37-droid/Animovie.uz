import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const LoginModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, signInWithGoogle, setIsRegistering, authError, setAuthError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateAge = (dobString: string) => {
    const birthDate = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
    }
    return calculatedAge;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthModalOpen(false);
      } else {
        if (!dob || !name) {
            setError("Iltimos, barcha maydonlarni to'ldiring");
            setLoading(false);
            return;
        }
        
        setIsRegistering(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: name,
          age: calculateAge(dob),
          dob: dob,
          role: 'user'
        });
        setIsRegistering(false);
        setAuthModalOpen(false);
      }
    } catch (err: any) {
      setIsRegistering(false);
      setError(
        err.code === 'auth/user-not-found' ? 'Foydalanuvchi topilmadi' : 
        err.code === 'auth/wrong-password' ? 'Noto\'g\'ri parol' : 
        err.code === 'auth/email-already-in-use' ? 'Ushbu email band' : 
        err.code === 'auth/invalid-email' ? 'Noto\'g\'ri email manzili' :
        err.code === 'auth/operation-not-allowed' ? 'E-mail va parol orqali kirish yoqilmagan. Admin bilan bog\'laning.' :
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Emailingizni kiriting');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Parolni tiklash havolasi emailingizga yuborildi');
      setError('');
    } catch (err: any) {
      setError('Xatolik yuz berdi. Email manzilingizni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div key="auth-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setAuthModalOpen(false);
              setAuthError('');
            }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl md:h-[650px] bg-[#0c0c0e] border border-white/5 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] z-10 grid grid-cols-1 md:grid-cols-[1.1fr_1fr]"
          >
            {/* Left Side: Cinematic Branding */}
            <div className="hidden md:flex flex-col justify-between p-16 relative overflow-hidden bg-black border-r border-white/5">
              <div className="absolute inset-0 z-0 select-none">
                <img 
                  src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1000&auto=format&fit=crop" 
                  alt="Cinema atmosphere" 
                  className="w-full h-full object-cover opacity-30 grayscale saturate-0 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
              </div>

              <div className="relative z-10">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl lg:text-5xl font-black text-white leading-[1.05] tracking-tight"
                >
                  Kino olamiga<br />
                  <span className="text-[#ff3d3d] drop-shadow-[0_0_20px_rgba(255,61,61,0.6)]">xush kelibsiz</span>
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-gray-500 text-base max-w-[260px] leading-relaxed font-medium"
                >
                  Sevimli filmlaringizni tomosha qilish uchun tizimga kiring.
                </motion.p>
              </div>

              {/* Central Visual: The Red Doorway Concept */}
              <div className="relative z-10 flex justify-center items-end h-72">
                <div className="absolute bottom-[-100px] w-full h-[300px] bg-red-600/10 blur-[120px] rounded-full"></div>
                
                {/* The "Doorway" Element */}
                <div className="relative w-44 h-64 bg-[#111] border border-white/5 rounded-t-2xl shadow-2xl flex items-end justify-center overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-[90%] bg-gradient-to-t from-[#ff3d3d]/50 via-[#ff3d3d]/5 to-transparent"></div>
                  {/* Silhouette */}
                  <div className="relative w-14 h-28 bg-black rounded-t-full opacity-90 mb-[-4px]"></div>
                </div>
              </div>
            </div>

            {/* Right Side: Authentication Form */}
            <div className="p-10 md:p-14 overflow-y-auto custom-scrollbar flex flex-col justify-center relative">
              <button 
                onClick={() => {
                  setAuthModalOpen(false);
                  setAuthError('');
                }}
                className="absolute top-10 right-10 text-gray-600 hover:text-white transition-all hover:rotate-90 duration-300 z-20"
              >
                <X size={28} />
              </button>

              <div className="mb-10 relative z-10">
                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Kirish</h3>
                <p className="text-gray-500 text-sm font-medium">
                  Hisobingizga kiring yoki yangi hisob yarating
                </p>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Social Logins */}
                <div className="space-y-4">
                  <button 
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-lg shadow-black/20"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale-0" />
                    Google bilan davom etish
                  </button>
                </div>

                <div className="relative flex items-center justify-center py-2">
                  <div className="w-full border-t border-white/5"></div>
                  <span className="absolute px-6 bg-[#0c0c0e] text-[11px] font-black text-gray-600 uppercase tracking-[0.4em]">yoki</span>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'register' && (
                    <div className="flex gap-4">
                      <div className="relative group flex-1">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ff3d3d] transition-colors" size={20} />
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ismingiz"
                          className="w-full bg-[#161618] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/30 focus:bg-[#1c1c1f] transition-all font-medium"
                        />
                      </div>
                      <div className="relative group w-40 flex-shrink-0">
                        <input 
                          type="date" 
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-[#161618] border border-white/5 rounded-2xl py-4.5 px-4 text-white text-sm focus:outline-none focus:border-red-500/30 focus:bg-[#1c1c1f] transition-all font-medium [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ff3d3d] transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email manzilingiz"
                      className="w-full bg-[#161618] border border-white/5 rounded-2xl py-4.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/30 focus:bg-[#1c1c1f] transition-all font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ff3d3d] transition-colors" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Parolingiz"
                      className="w-full bg-[#161618] border border-white/5 rounded-2xl py-4.5 pl-12 pr-12 text-white text-sm focus:outline-none focus:border-red-500/30 focus:bg-[#1c1c1f] transition-all font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {error && <p className="text-[#ff3d3d] text-xs font-bold text-center">{error}</p>}
                  {authError && <p className="text-[#ff3d3d] text-xs font-bold text-center">{authError}</p>}
                  {success && <p className="text-emerald-500 text-xs font-bold text-center">{success}</p>}

                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-bold text-[#ff3d3d] hover:text-red-400 transition-colors"
                    >
                      Parolni unutdingizmi?
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#c22d2d] text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-600 hover:shadow-[0_0_25px_rgba(194,45,45,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <LogIn size={20} />
                        {mode === 'login' ? 'KIRISH' : 'RO\'YXATDAN O\'TISH'}
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium">
                  <span className="text-gray-500">{mode === 'login' ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"} </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError('');
                      setAuthError('');
                      setSuccess('');
                    }}
                    className="font-bold text-[#ff3d3d] hover:underline ml-1"
                  >
                    {mode === 'login' ? "Ro'yxatdan o'tish" : "Kirish"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
