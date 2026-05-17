/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Header } from '@/src/components/Header';
import { Hero } from '@/src/components/Hero';
import { MovieCard } from '@/src/components/MovieCard';
import { AdminPanel } from '@/src/components/AdminPanel';
import { VideoPlayer } from '@/src/components/VideoPlayer';
import { Comments } from '@/src/components/Comments';
import { LoginModal } from '@/src/components/LoginModal';
import { ContactModal } from '@/src/components/ContactModal';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuth } from './lib/AuthContext';
import { Loader2, ArrowLeft, Send, Instagram } from 'lucide-react';
import { Movie, Settings } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [pending18PlusMovie, setPending18PlusMovie] = useState<Movie | null>(null);
  const [rejected18Plus, setRejected18Plus] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<Settings | null>(null);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  
  const { user, userData, isAdmin, logout, setAuthModalOpen } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
    
    const unsubscribeMovies = onSnapshot(q, (snapshot) => {
      const moviesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Movie[];
      setMovies(moviesData);
      setLoading(false);
    }, (error) => {
      console.error("Movies fetch error:", error);
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSiteSettings({ id: 'global', ...snapshot.data() } as Settings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    return () => {
      unsubscribeMovies();
      unsubscribeSettings();
    };
  }, []);

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedGenre === '' || m.genre === selectedGenre)
  );

  const bannerMovies = movies.filter(m => m.isBanner);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setShowAdmin(false);
    setSelectedMovie(null);
  };

  const handleMovieSelect = (movie: Movie) => {
    if (movie.is18Plus) {
      if (user && userData) {
        if (userData.age && userData.age < 18) {
          setRejected18Plus(true);
          return;
        }
      } else if (!user) {
        setPending18PlusMovie(movie);
        return;
      }
    }
    setSelectedMovie(movie);
    setCurrentEpisodeIndex(0);
    const seasons = movie.episodes ? [...new Set(movie.episodes.map(e => e.season || 1))] : [1];
    setActiveSeason(Math.min(...seasons));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getGroupedEpisodes = () => {
    if (!selectedMovie?.episodes) return {};
    return selectedMovie.episodes.reduce((acc: any, ep) => {
      const s = ep.season || 1;
      if (!acc[s]) acc[s] = [];
      acc[s].push(ep);
      return acc;
    }, {});
  };

  const groupedEpisodes = getGroupedEpisodes();
  const availableSeasons = Object.keys(groupedEpisodes).map(Number).sort((a, b) => a - b);
  const currentSeasonEpisodes = groupedEpisodes[activeSeason] || [];

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-gray-100 font-sans flex flex-col">
      <Header 
        onSearch={setSearchTerm} 
        onGenreSelect={handleGenreSelect} 
        activeGenre={selectedGenre}
        onAdminClick={() => { setShowAdmin(true); setSelectedMovie(null); }}
        settings={siteSettings}
      />
      
      {!showAdmin && !selectedMovie && !selectedGenre && !searchTerm && (
        <Hero movies={bannerMovies} onWatchClick={handleMovieSelect} />
      )}
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
        <AnimatePresence mode="wait">
          {showAdmin && isAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel movies={movies} />
            </motion.div>
          ) : selectedMovie ? (
            <motion.div 
              key="movie-detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <button 
                onClick={() => setSelectedMovie(null)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition group text-sm uppercase font-bold tracking-widest"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Orqaga qaytish
              </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {selectedMovie.episodes && selectedMovie.episodes.length > 0 ? (
                  <>
                    <VideoPlayer 
                      url={selectedMovie.episodes[currentEpisodeIndex].url} 
                      title={selectedMovie.episodes[currentEpisodeIndex].title} 
                    />
                    
                    <div className="space-y-6 pt-4">
                      {availableSeasons.length > 1 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-white/5 no-scrollbar">
                          {availableSeasons.map(s => (
                            <button
                              key={s}
                              onClick={() => {
                                setActiveSeason(s);
                                // Set index to first episode of this season
                                const firstEpIndex = selectedMovie.episodes?.findIndex(ep => (ep.season || 1) === s);
                                if (firstEpIndex !== undefined && firstEpIndex !== -1) setCurrentEpisodeIndex(firstEpIndex);
                              }}
                              className={`px-4 py-2 rounded-full text-xs font-black uppercase transition-all flex-shrink-0 ${
                                activeSeason === s 
                                  ? 'bg-[#fbbf24] text-black shadow-lg shadow-yellow-500/20' 
                                  : 'bg-white/5 text-gray-500 hover:text-white'
                              }`}
                            >
                              {s}-Fasl
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {selectedMovie.episodes.map((ep, idx) => (
                          (ep.season || 1) === activeSeason && (
                            <button
                              key={idx}
                              onClick={() => setCurrentEpisodeIndex(idx)}
                              className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all ${
                                currentEpisodeIndex === idx 
                                  ? 'bg-[#fbbf24] text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            >
                              {ep.title}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-black/40 rounded-xl border border-white/5 flex flex-col items-center justify-center text-gray-500 p-8 text-center italic">
                    Ushbu film uchun video havola qo'shilmagan.
                  </div>
                )}
                
                {/* Comments Section */}
                <Comments movieId={selectedMovie.id} />
              </div>

              <div className="space-y-6">
                <div className="relative aspect-[2/3] w-48 mx-auto lg:mx-0 rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 hidden lg:block">
                  <img src={selectedMovie.image} alt={selectedMovie.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#fbbf24] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">{selectedMovie.genre}</span>
                    <span className="text-gray-500 text-xs">{selectedMovie.year}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">{selectedMovie.title}</h1>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light italic">
                    {selectedMovie.description || "Ushbu film haqida tavsif mavjud emas."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-white/5">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#fbbf24] rounded-full"></span>
                Sizga yoqishi mumkin
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
                {movies.filter(m => m.id !== selectedMovie.id).slice(0, 6).map((movie) => (
                  <MovieCard key={movie.id} title={movie.title} image={movie.image} onClick={() => handleMovieSelect(movie)} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="movie-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="w-1.5 h-8 bg-[#fbbf24] rounded-full"></span>
                {selectedGenre || "Yangi qo'shilganlar"}
              </h2>
              {searchTerm && (
                <div className="text-sm text-gray-500">
                  Qidiruv: <span className="text-[#fbbf24]">"{searchTerm}"</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="text-sm font-bold uppercase tracking-widest text-[#fbbf24]">Yuklanmoqda...</p>
              </div>
            ) : filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
                {filteredMovies.map((movie) => (
                  <MovieCard key={movie.id} title={movie.title} image={movie.image} onClick={() => handleMovieSelect(movie)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
                <p className="text-gray-500 italic">Hech qanday film topilmadi.</p>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-white/5 p-8 bg-[#121214] flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest gap-4">
        <div className="flex flex-col gap-2 items-center md:items-start">
          <div>© 2024 AniMovie.uz - Barcha huquqlar himoyalangan.</div>
          {siteSettings && (
            <div className="flex gap-4">
              {siteSettings.telegram && (
                <a href={siteSettings.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#fbbf24] transition-colors">
                  <Send size={12} className="text-blue-400" /> Telegram
                </a>
              )}
              {siteSettings.instagram && (
                <a href={siteSettings.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#fbbf24] transition-colors">
                  <Instagram size={12} className="text-pink-400" /> Instagram
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-6">
          <span className="hover:text-white cursor-pointer transition" onClick={() => setShowTerms(true)}>Foydalanish shartlari</span>
          <span className="hover:text-white cursor-pointer transition">Reklama</span>
          <span className="hover:text-white cursor-pointer transition" onClick={() => setShowContact(true)}>Aloqa</span>
        </div>
      </footer>
      <LoginModal />
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />

      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121214] border border-white/10 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Foydalanish shartlari</h2>
              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                <p>
                  1. Umumiy qoidalar<br/>
                  Ushbu qoidalar "AniMovie.uz" saytidan foydalanish shartlarini belgilaydi. Saytdan foydalanish orqali siz ushbu shartlarga rozilik bildirasiz.
                </p>
                <p>
                  2. Ma'lumotlardan foydalanish<br/>
                  Saytdagi barcha materiallar (videolar, rasmlar, matnlar) faqat shaxsiy maqsadlarda foydalanish uchun taqdim etiladi. Ularni tijorat maqsadida nusxalash yoki tarqatish taqiqlanadi.
                </p>
                <p>
                  3. Yosh cheklovlari<br/>
                  Ayrim kontentlar (masalan, 18+ filmlar) yosh chekloviga ega. Bunday kontentlarni ko'rish uchun foydalanuvchi belgilangan yoshdan oshganligini tasdiqlashi shart.
                </p>
                <p>
                  4. Foydalanuvchi majburiyatlari<br/>
                  Saytdan foydalanishda O'zbekiston Respublikasi qonunchiligiga rioya qilish, boshqa foydalanuvchilarni haqorat qilmaslik va noqonuniy materiallarni tarqatmaslik talab etiladi.
                </p>
                <p>
                  5. Javobgarlikni rad etish<br/>
                  Ma'muriyat sayt uzluksiz ishlashini kafolatlamaydi va foydalanuvchi tomonidan saytdan foydalanish oqibatida yuzaga kelgan har qanday zararlar uchun javobgar emas.
                </p>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {pending18PlusMovie && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#121214] p-8 rounded-3xl max-w-sm w-full border border-red-500/20 text-center space-y-6 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <span className="text-red-500 font-black text-2xl tracking-tighter">18+</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-2">Yoshingiz qanchada?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Ushbu film 18 yoshdan oshganlar uchun mo'ljallangan. Iltimos, yoshingizni tasdiqlang yoki profilingizga kiring.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button 
                onClick={() => {
                  setSelectedMovie(pending18PlusMovie);
                  setCurrentEpisodeIndex(0);
                  setPending18PlusMovie(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full bg-[#c22d2d] py-4 rounded-xl font-black text-white hover:bg-red-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
              >
                Men 18 yoshdaman
              </button>
              <button 
                onClick={() => {
                  setPending18PlusMovie(null);
                  setAuthModalOpen(true);
                }}
                className="w-full bg-[#2c2c30] py-4 rounded-xl font-black text-white hover:bg-[#3c3c40] transition-colors uppercase text-xs tracking-widest"
              >
                Tizimga kirish
              </button>
              <button 
                onClick={() => setPending18PlusMovie(null)}
                className="w-full text-gray-500 py-3 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mt-2"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {rejected18Plus && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#121214] p-8 rounded-3xl max-w-sm w-full border border-red-500/20 text-center space-y-6 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
              <span className="text-red-500 font-black text-2xl tracking-tighter">18+</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-2">Kirish taqiqlandi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Kechirasiz, sizning yoshingiz ushbu filmni ko'rishga yetmaydi. Bu film 18 yoshdan kattalar uchun mo'ljallangan.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <button 
                onClick={() => setRejected18Plus(false)}
                className="w-full bg-[#c22d2d] py-4 rounded-xl font-black text-white hover:bg-red-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
