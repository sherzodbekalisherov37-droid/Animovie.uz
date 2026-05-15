import React, { useState, useEffect } from 'react';
import { Movie } from '../types';
import { Play, Info, Star, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  movie?: Movie;
  movies?: Movie[];
  onWatchClick?: (movie: Movie) => void;
}

export const Hero = ({ movie: singleMovie, movies = [], onWatchClick }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayMovies = movies.length > 0 ? movies : (singleMovie ? [singleMovie] : []);
  const currentMovie = displayMovies[currentIndex];

  useEffect(() => {
    if (displayMovies.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMovies.length);
    }, 6000); // cycle every 6 seconds

    return () => clearInterval(interval);
  }, [displayMovies.length]);

  const getTitleSizeClass = (title: string) => {
    const len = title.length;
    if (len > 60) return 'text-xl md:text-3xl lg:text-4xl';
    if (len > 40) return 'text-2xl md:text-4xl lg:text-5xl';
    if (len > 25) return 'text-3xl md:text-5xl lg:text-6xl';
    return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl';
  };

  if (!currentMovie && displayMovies.length === 0) {
    return (
      <div className="relative h-[80vh] min-h-[500px] md:min-h-[750px] md:h-[750px] w-full overflow-hidden bg-[#050505] flex items-center justify-center text-white/50">
        Banner filmlar topilmadi
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] min-h-[500px] md:min-h-[750px] md:h-[750px] w-full overflow-hidden bg-[#050505]">
      <AnimatePresence mode="wait">
        <motion.section 
          key={currentMovie?.id || 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="relative h-full w-full text-white group"
        >
          {/* Cinematic Background with Slow Pan */}
          <motion.div 
            initial={{ scale: 1.15, x: 10, y: 10 }}
            animate={{ scale: 1, x: 0, y: 0 }}
            transition={{ duration: 6, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700"
              style={{ 
                backgroundImage: `url(${currentMovie?.image || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1920&auto=format&fit=crop'})` 
              }}
            />
            {/* Cinematic Noise/Grain */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          </motion.div>

          {/* Luxury Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 via-30% to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 via-60% to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-transparent z-10"></div>
          
          {/* Left Edge Border Accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#fbbf24]/40 to-transparent z-20"></div>

          {/* Content */}
          <div className="relative z-30 h-full flex items-center justify-between px-6 md:px-16 lg:px-24 max-w-7xl mx-auto w-full gap-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl lg:max-w-2xl w-full flex-shrink-1"
            >
              {/* Badges & Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span 
                  className="px-3 py-1 bg-[#fbbf24] text-black text-[10px] font-black rounded-sm uppercase tracking-[0.2em] shadow-2xl shadow-yellow-500/40"
                >
                  {currentMovie?.isBanner ? 'PREMYERA' : 'YANGI'}
                </span>
                
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <span className="flex items-center gap-1 text-[#fbbf24] text-[10px] font-black uppercase tracking-widest">
                    <Star size={12} className="fill-current" /> 4.9
                  </span>
                  <span className="w-[1px] h-3 bg-white/20"></span>
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                    {currentMovie?.genre || 'Filmlar'}
                  </span>
                </div>
              </div>

              {/* Scalable Premium Typography */}
              <h1 className={`${getTitleSizeClass(currentMovie?.title || '')} font-black mb-8 uppercase leading-[0.85] tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
                {currentMovie?.title ? (
                  currentMovie.title.split(' ').map((word, i) => (
                    <span 
                      key={i} 
                      className={i === 0 ? "text-white" : "text-[#fbbf24]"}
                    >
                      {word}{' '}
                    </span>
                  ))
                ) : (
                  <>BETMEN <br/><span className="text-[#fbbf24]">RITSAR</span></>
                )}
              </h1>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center gap-6 mb-8 text-white/60 text-[11px] font-black tracking-widest uppercase">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#fbbf24]" />
                  <span>{currentMovie?.year || '2024'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#fbbf24]" />
                  <span>2s 15d</span>
                </div>
                <div className="px-2 py-0.5 border-2 border-white/30 rounded text-[10px] font-black">16+</div>
                <div className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-black text-white">ULTRA HD</div>
              </div>

              {/* Description with enhanced typography */}
              <p className="text-gray-300 text-xs sm:text-sm md:text-lg mb-8 md:mb-10 line-clamp-3 md:line-clamp-4 font-medium leading-relaxed max-w-2xl border-l-[3px] md:border-l-[4px] border-[#fbbf24] pl-4 md:pl-8 py-1 bg-gradient-to-r from-[#fbbf24]/5 to-transparent">
                {currentMovie?.description || "Jinoyatchilik avj olgan Gotham shahrida yangi qahramon paydo bo'ladi. U shaharni tartibsizlik va qo'rquvdan qutqarishga va'da beradi."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 md:gap-6">
                <button 
                  onClick={() => currentMovie && onWatchClick?.(currentMovie)}
                  className="group/main-btn hover:scale-105 active:scale-95 relative overflow-hidden bg-[#fbbf24] text-black px-8 py-4 md:px-14 md:py-6 rounded-sm font-black flex items-center gap-2 md:gap-3 uppercase text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] transition-all shadow-[0_20px_40px_-10px_rgba(251,191,36,0.5)] md:shadow-[0_30px_60px_-15px_rgba(251,191,36,0.5)] w-full sm:w-auto justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover/main-btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  <Play size={20} className="fill-current transition-transform group-hover/main-btn:scale-125 md:w-6 md:h-6" /> 
                  TOMOSHA QILISH
                </button>
                
                <button 
                  onClick={() => currentMovie && onWatchClick?.(currentMovie)}
                  className="hover:scale-105 active:scale-95 bg-white/5 backdrop-blur-3xl border border-white/20 text-white px-8 py-4 md:px-14 md:py-6 rounded-sm font-black uppercase text-[10px] md:text-xs flex items-center gap-2 md:gap-3 tracking-[0.2em] md:tracking-[0.3em] transition-all hover:bg-white/10 hover:border-white/40 shadow-xl w-full sm:w-auto justify-center"
                >
                  <Info size={20} className="md:w-6 md:h-6" /> MA'LUMOT
                </button>
              </div>
            </motion.div>

            {/* Movie Poster on the Right with Floating Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50, rotateY: -15, y: -10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0, 
                y: [0, -15, 0], // Floating animation
                rotateY: -15
              }}
              transition={{ 
                opacity: { duration: 0.8 },
                x: { duration: 0.8 },
                scale: { duration: 0.8 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" } // Infinite float
              }}
              className="hidden lg:block relative w-[280px] xl:w-[350px] aspect-[2/3] shrink-0"
              style={{ perspective: "1000px", filter: "drop-shadow(-20px 20px 30px rgba(0,0,0,0.8))" }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#fbbf24]/20 to-transparent rounded-xl blur-3xl"></div>
              <img 
                src={currentMovie?.image || 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1920&auto=format&fit=crop'} 
                alt={currentMovie?.title || 'Film'} 
                className="relative z-10 w-full h-full object-cover rounded-xl border border-white/10"
              />
            </motion.div>
          </div>
          
          {/* Pagination Indicators - Only show when multiple movies */}
          {displayMovies.length > 1 && (
            <div className="absolute bottom-10 left-10 z-30 flex items-center gap-3">
              {displayMovies.map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentIndex(idx)}
                  className={`cursor-pointer transition-all duration-300 rounded-full h-1.5 ${
                    currentIndex === idx ? 'bg-[#fbbf24] w-8' : 'bg-white/30 w-3 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-30">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-1.5">
              <motion.div 
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 bg-white rounded-full"
              />
            </div>
          </div>
        </motion.section>
      </AnimatePresence>
    </div>
  );
};


