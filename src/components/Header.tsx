import React from 'react';
import { Search, LogOut, User, Send, Instagram } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Settings } from '../types';

interface HeaderProps {
  onSearch: (term: string) => void;
  onGenreSelect: (genre: string) => void;
  activeGenre: string;
  onAdminClick: () => void;
  settings?: Settings | null;
}

export const Header = ({ onSearch, onGenreSelect, activeGenre, onAdminClick, settings }: HeaderProps) => {
  const { user, userData, isAdmin, setAuthModalOpen, logout } = useAuth();

  const genres = [
    { label: 'Bosh sahifa', value: '' },
    { label: 'Filmlar', value: 'Filmlar' },
    { label: 'Seriallar', value: 'Seriallar' },
    { label: 'Multfilmlar', value: 'Multfilmlar' },
    { label: 'Anime', value: 'Anime' },
  ];

  return (
    <>
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-[#121214] border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          className="text-xl md:text-2xl font-black tracking-tighter cursor-pointer flex items-center group"
          onClick={() => onGenreSelect('')}
        >
          <span className="text-[#fbbf24] transition-all group-hover:text-yellow-300">ANI</span>
          <span className="text-white">MOVIE</span>
          <motion.span 
            animate={{ 
              opacity: [1, 0.5, 1],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#fbbf24] ml-0.5"
          >
            .UZ
          </motion.span>
        </motion.div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400 uppercase tracking-widest relative">
          {genres.map((genre, index) => (
            <motion.button
              key={genre.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => onGenreSelect(genre.value)}
              className={`relative pb-1 transition-colors ${
                activeGenre === genre.value ? 'text-white' : 'hover:text-white'
              }`}
            >
              {genre.label}
              {activeGenre === genre.value && (
                <motion.div
                  layoutId="underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fbbf24]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className="text-red-500 hover:text-red-400 font-bold"
            >
              ADMIN
            </button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {/* Social Icons Desktop */}
        <div className="hidden sm:flex items-center gap-3 mr-2 border-r border-white/5 pr-4">
          {settings?.telegram && (
            <a href={settings.telegram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#fbbf24] transition-colors" title="Telegram">
              <Send size={18} />
            </a>
          )}
          {settings?.instagram && (
            <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#fbbf24] transition-colors" title="Instagram">
              <Instagram size={18} />
            </a>
          )}
        </div>

        {/* Always visible responsive search input wrapper */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Qidirish..." 
            className="bg-[#1c1c1f] border border-white/10 rounded-full px-3 md:px-4 py-1.5 text-xs w-28 sm:w-48 text-white focus:outline-none focus:border-[#fbbf24]/50"
            onChange={(e) => onSearch(e.target.value)}
          />
          <div className="absolute right-3 top-1.5 text-gray-500">
            <Search size={14} className="mt-[1px]" />
          </div>
        </div>
        
        {user ? (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400 hidden lg:block">{userData?.name || user.email}</div>
            <button 
              onClick={logout}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition"
              title="Chiqish"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#fbbf24] text-black px-3 md:px-5 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase hover:bg-yellow-400 transition flex items-center gap-1.5 md:gap-2"
          >
            <User size={14} />
            <span className="hidden sm:inline">Kirish</span>
          </button>
        )}
      </div>
    </header>

    {/* Mobile Navigation Scrollbar */}
    <div className="md:hidden w-full overflow-x-auto bg-[#121214] border-b border-white/5 sticky top-16 z-40" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`.md\\:hidden::-webkit-scrollbar { display: none; }`}</style>
      <nav className="flex items-center gap-4 px-4 py-3 min-w-max text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        {genres.map((genre) => (
          <button
            key={genre.label}
            onClick={() => onGenreSelect(genre.value)}
            className={`transition-colors whitespace-nowrap px-3 py-1.5 rounded-full ${
              activeGenre === genre.value ? 'bg-white/10 text-white' : 'hover:text-white'
            }`}
          >
            {genre.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={onAdminClick}
            className="text-red-500 hover:text-red-400 whitespace-nowrap px-3 py-1.5 rounded-full"
          >
            ADMIN
          </button>
        )}
      </nav>
    </div>
    </>
  );
};
