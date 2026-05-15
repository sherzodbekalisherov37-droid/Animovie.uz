import React from 'react';
import { motion } from 'motion/react';

interface MovieCardProps {
  title: string;
  image: string;
  onClick: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ title, image, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-[#1c1c1f] shadow-lg group-hover:ring-2 ring-[#fbbf24] transition-all">
        <div className="absolute top-2 left-2 z-10 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">HD</div>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
      <h3 className="text-sm font-semibold truncate group-hover:text-[#fbbf24] transition-colors">{title}</h3>
      <p className="text-[10px] text-gray-500 uppercase tracking-tighter">UZB • HD</p>
    </motion.div>
  );
};
