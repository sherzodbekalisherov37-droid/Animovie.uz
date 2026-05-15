import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  isAdmin: boolean;
  loading: boolean;
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [completeDob, setCompleteDob] = useState('');
  const [completeName, setCompleteName] = useState('');
  const [pendingUserRef, setPendingUserRef] = useState<any>(null);

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

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        // Unsubscribe from previous user doc if any
        if (unsubscribeUserDoc) unsubscribeUserDoc();

        const userDocRef = doc(db, 'users', currUser.uid);
        
        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            
            const admins = ['sherzodbekalisherov37@gmail.com'];
            const isAdminUser = admins.includes(currUser.email || '') || (data && data.role === 'admin');
            setIsAdmin(!!isAdminUser);

            // Close login modal and age modal if user profile is complete
            if (data?.dob) {
              setShowAgeModal(false);
              setAuthModalOpen(false);
            } else if (!isRegistering) {
              setPendingUserRef(userDocRef);
              setCompleteName(currUser.displayName || '');
              setShowAgeModal(true);
            }
          } else if (!isRegistering) {
            // Document doesn't exist yet
            setUserData(null);
            setIsAdmin(['sherzodbekalisherov37@gmail.com'].includes(currUser.email || ''));
            setPendingUserRef(userDocRef);
            setCompleteName(currUser.displayName || '');
            setShowAgeModal(true);
          }
          setLoading(false);
        }, (error) => {
          console.error("User doc listener error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeUserDoc) unsubscribeUserDoc();
        unsubscribeUserDoc = null;
        setIsAdmin(false);
        setUserData(null);
        setShowAgeModal(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const handleSaveAge = async () => {
    if (!completeDob || !completeName) return;
    if (pendingUserRef && user) {
      const updatedData = {
        uid: user.uid,
        email: user.email,
        name: completeName,
        age: calculateAge(completeDob),
        dob: completeDob,
        role: 'user'
      };
      await setDoc(pendingUserRef, updatedData, { merge: true });
      setUserData(updatedData);
      setShowAgeModal(false);
      setAuthModalOpen(false); // Close login modal if open
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAuthModalOpen(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData,
      isAdmin, 
      loading, 
      isRegistering,
      setIsRegistering,
      signInWithGoogle, 
      logout,
      isAuthModalOpen,
      setAuthModalOpen
    }}>
      {children}
      {showAgeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 max-w-sm w-full space-y-6">
            <h3 className="text-xl font-bold text-white text-center">Ma'lumotlarni kiriting</h3>
            <p className="text-sm text-gray-400 text-center">Davom etish uchun ismingizni va tug'ilgan sanangizni kiriting</p>
            <div className="space-y-4">
              <input 
                type="text"
                className="w-full bg-[#1c1c1f] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
                placeholder="Ismingiz"
                value={completeName}
                onChange={(e) => setCompleteName(e.target.value)}
              />
              <input 
                type="date"
                className="w-full bg-[#1c1c1f] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                value={completeDob}
                onChange={(e) => setCompleteDob(e.target.value)}
              />
            </div>
            <button 
              onClick={handleSaveAge}
              className="w-full bg-[#c22d2d] py-3 rounded-xl font-bold text-white hover:bg-red-600 transition-colors"
            >
              Saqlash va Davom etish
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
