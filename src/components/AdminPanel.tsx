import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PlusCircle, Loader2, Trash2, Plus, List, Pencil, X, Play, MessageSquare, Settings as SettingsIcon, Instagram, Send } from 'lucide-react';
import { Episode, Movie, Settings } from '../types';
import { setDoc } from 'firebase/firestore';

interface Message {
  id: string;
  name: string;
  contactInfo: string;
  message: string;
  read: boolean;
  createdAt: any;
}

interface AdminPanelProps {
  movies: Movie[];
}

export const AdminPanel = ({ movies }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'episodes' | 'messages' | 'settings'>('list');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [siteSettings, setSiteSettings] = useState<Settings>({ id: 'global', telegram: '', instagram: '' });
  
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    genre: 'Filmlar',
    year: new Date().getFullYear().toString(),
    description: '',
    isBanner: false,
    is18Plus: false
  });
  const [episodes, setEpisodes] = useState<Episode[]>([{ title: '1-qism', url: '', season: 1 }]);

  const selectedMovieForEpisodes = movies.find(m => m.id === selectedMovieId);

  useEffect(() => {
    let unsubscribe: () => void;
    if (activeTab === 'messages') {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'messages');
      });
    }
    if (activeTab === 'settings') {
      unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
        if (snapshot.exists()) {
          setSiteSettings({ id: 'global', ...snapshot.data() } as Settings);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'episodes' && selectedMovieForEpisodes) {
      setEpisodes(selectedMovieForEpisodes.episodes && selectedMovieForEpisodes.episodes.length > 0 
        ? [...selectedMovieForEpisodes.episodes] 
        : [{ title: '1-qism', url: '', season: 1 }]);
    }
  }, [selectedMovieId, activeTab]);

  const toggleMessageRead = async (id: string, read: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', id), { read: !read });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `messages/${id}`);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Rostdan ham bu xabarni o'chirmoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `messages/${id}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image: '',
      genre: 'Filmlar',
      year: new Date().getFullYear().toString(),
      description: '',
      isBanner: false,
      is18Plus: false
    });
    setEpisodes([{ title: '1-qism', url: '', season: 1 }]);
    setEditingId(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        telegram: siteSettings.telegram,
        instagram: siteSettings.instagram,
        updatedAt: serverTimestamp()
      });
      alert('Sozlamalar saqlandi!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setFormData({
      title: movie.title,
      image: movie.image,
      genre: movie.genre || 'Filmlar',
      year: movie.year || '',
      description: movie.description || '',
      isBanner: movie.isBanner || false,
      is18Plus: movie.is18Plus || false
    });
    setEpisodes(movie.episodes && movie.episodes.length > 0 ? [...movie.episodes] : [{ title: '1-qism', url: '', season: 1 }]);
    setEditingId(movie.id);
    setActiveTab('form');
  };

  const handleSaveEpisodes = async () => {
    if (!selectedMovieId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'movies', selectedMovieId), {
        episodes: episodes.filter(ep => ep.url.trim() !== '')
      });
      alert('Epizodlar saqlandi!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'movies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      console.log('Attempting to delete movie:', id);
      await deleteDoc(doc(db, 'movies', id));
      console.log('Successfully deleted movie:', id);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Delete error details:', error);
      handleFirestoreError(error, OperationType.DELETE, `movies/${id}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const addEpisode = () => {
    const lastSeason = episodes.length > 0 ? episodes[episodes.length - 1].season || 1 : 1;
    setEpisodes([...episodes, { title: `${episodes.length + 1}-qism`, url: '', season: lastSeason }]);
  };

  const removeEpisode = (index: number) => {
    setEpisodes(episodes.filter((_, i) => i !== index));
  };

  const updateEpisode = (index: number, field: 'title' | 'url' | 'season', value: string | number) => {
    const newEpisodes = [...episodes];
    (newEpisodes[index] as any)[field] = value;
    setEpisodes(newEpisodes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEpisodes = episodes.filter(ep => ep.url.trim() !== '');
      const payload = {
        title: formData.title,
        image: formData.image,
        genre: formData.genre,
        year: formData.year,
        description: formData.description,
        isBanner: formData.isBanner,
        is18Plus: formData.is18Plus,
        episodes: newEpisodes,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'movies', editingId), payload);
        alert('Film muvaffaqiyatli tahrirlandi!');
      } else {
        // Check if movie with same title already exists
        const existingMovie = movies.find(m => m.title.trim().toLowerCase() === formData.title.trim().toLowerCase());
        
        if (existingMovie) {
          // If movie exists, append new episodes to it
          const combinedEpisodes = [...(existingMovie.episodes || []), ...newEpisodes];
          await updateDoc(doc(db, 'movies', existingMovie.id), {
            ...payload,
            episodes: combinedEpisodes,
            updatedAt: serverTimestamp()
          });
          alert(`"${existingMovie.title}" mavjud ekan. Yangi qismlar uning ichiga qo'shildi!`);
        } else {
          // Create new movie
          await addDoc(collection(db, 'movies'), {
            ...payload,
            createdAt: serverTimestamp()
          });
          alert('Film muvaffaqiyatli qo\'shildi!');
        }
      }
      resetForm();
      setActiveTab('list');
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'movies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase transition-all ${
            activeTab === 'list' ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <List size={16} /> Filmlar ro'yxati
        </button>
        <button
          onClick={() => { setActiveTab('form'); resetForm(); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase transition-all ${
            activeTab === 'form' && !editingId ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <PlusCircle size={16} /> Yangi qo'shish
        </button>
        <button
          onClick={() => { setActiveTab('episodes'); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase transition-all ${
            activeTab === 'episodes' ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Play size={16} /> Epizodlar
        </button>
        <button
          onClick={() => { setActiveTab('messages'); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase transition-all ${
            activeTab === 'messages' ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} /> Xabarlar
        </button>
        <button
          onClick={() => { setActiveTab('settings'); }}
          className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase transition-all ${
            activeTab === 'settings' ? 'bg-[#fbbf24] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          <SettingsIcon size={16} /> Sozlamalar
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="bg-[#121214] border border-white/5 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Film</th>
                  <th className="px-6 py-4">Banner</th>
                  <th className="px-6 py-4">Janr</th>
                  <th className="px-6 py-4">Yil</th>
                  <th className="px-6 py-4">Epizodlar</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movies.map((movie) => (
                  <tr key={movie.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={movie.image} className="w-8 h-12 object-cover rounded shadow" alt="" />
                        <span className="font-bold text-white group-hover:text-[#fbbf24] transition-colors">{movie.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {movie.isBanner && (
                        <span className="bg-[#fbbf24]/10 text-[#fbbf24] px-2 py-1 rounded text-[10px] font-black uppercase border border-[#fbbf24]/20">
                          BANNER
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs uppercase">{movie.genre}</td>
                    <td className="px-6 py-4 text-gray-400">{movie.year}</td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-gray-500">
                        {movie.episodes?.length || 0} TA
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {confirmDeleteId === movie.id ? (
                          <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                            <button 
                              onClick={() => handleDelete(movie.id)}
                              disabled={deleteLoading === movie.id}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase flex items-center gap-1"
                            >
                              {deleteLoading === movie.id ? <Loader2 size={10} className="animate-spin" /> : 'HA'}
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase"
                            >
                              YO'Q
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEdit(movie)}
                              className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(movie.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {movies.length === 0 && (
            <div className="p-20 text-center text-gray-500 italic">Hali filmlar qo'shilmagan.</div>
          )}
        </div>
      )}

      {activeTab === 'form' && (
        <div className="bg-[#121214] border border-white/5 p-8 rounded-lg animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <PlusCircle className="text-[#fbbf24]" />
              {editingId ? 'Filmni tahrirlash' : 'Yangi film qo\'shish'}
            </h2>
            {editingId && (
              <button onClick={() => { resetForm(); setActiveTab('list'); }} className="text-gray-500 hover:text-white uppercase text-[10px] font-bold flex items-center gap-1">
                <X size={14} /> Bekor qilish
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Film nomi</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Rasm URL</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Janr</label>
                    <select
                      className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    >
                      <option value="Filmlar">Filmlar</option>
                      <option value="Seriallar">Seriallar</option>
                      <option value="Multfilmlar">Multfilmlar</option>
                      <option value="Anime">Anime</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Yil</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Tavsif</label>
                  <textarea
                    className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all h-32 resize-none text-white"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-2 bg-[#1c1c1f] p-4 rounded-lg border border-white/10">
                    <input
                      id="isBanner"
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/10 text-[#fbbf24] focus:ring-[#fbbf24] bg-black"
                      checked={formData.isBanner}
                      onChange={(e) => setFormData({ ...formData, isBanner: e.target.checked })}
                    />
                    <label htmlFor="isBanner" className="text-xs font-bold uppercase text-gray-400 cursor-pointer select-none">
                      BANNER SIFATIDA KO'RSATISH
                    </label>
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-[#1c1c1f] p-4 rounded-lg border border-white/10">
                    <input
                      id="is18Plus"
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/10 text-red-500 focus:ring-red-500 bg-black"
                      checked={formData.is18Plus}
                      onChange={(e) => setFormData({ ...formData, is18Plus: e.target.checked })}
                    />
                    <label htmlFor="is18Plus" className="text-xs font-bold uppercase text-red-500 cursor-pointer select-none">
                      18+ YOSHDAGILAR UCHUN
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">Epizodlar / Video linklar</label>
                  <button 
                    type="button" 
                    onClick={addEpisode}
                    className="text-[#fbbf24] hover:text-yellow-400 text-[10px] font-black uppercase flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Qo'shish
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {episodes.map((ep, index) => (
                    <div key={index} className="flex gap-2 items-start bg-black/30 p-4 rounded-xl border border-white/5 group">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Qism nomi"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                          value={ep.title}
                          onChange={(e) => updateEpisode(index, 'title', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Video URL"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                          value={ep.url}
                          onChange={(e) => updateEpisode(index, 'url', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Fasl:</label>
                          <input
                            type="number"
                            min="1"
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                            value={ep.season || 1}
                            onChange={(e) => updateEpisode(index, 'season', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                      {episodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEpisode(index)}
                          className="text-red-500/50 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#fbbf24] text-black font-black py-4 rounded-xl uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {editingId ? 'O\'zgarishlarni saqlash' : 'Filmni saqlash'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'episodes' && (
        <div className="bg-[#121214] border border-white/5 p-8 rounded-lg animate-in fade-in duration-300">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <Play className="text-[#fbbf24]" />
            Epizodlarni boshqarish
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Filmni tanlang</label>
              <select
                className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
              >
                <option value="">-- Tanlang --</option>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {selectedMovieId && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold text-[#fbbf24] uppercase tracking-wider">{selectedMovieForEpisodes?.title} epizodlari</h3>
                   <button 
                    type="button" 
                    onClick={addEpisode}
                    className="text-[#fbbf24] hover:text-yellow-400 text-[10px] font-black uppercase flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> QISM QO'SHISH
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {episodes.map((ep, index) => (
                    <div key={index} className="flex gap-2 items-start bg-black/30 p-4 rounded-xl border border-white/5">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="Qism nomi"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                          value={ep.title}
                          onChange={(e) => updateEpisode(index, 'title', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Video URL"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                          value={ep.url}
                          onChange={(e) => updateEpisode(index, 'url', e.target.value)}
                        />
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Fasl:</label>
                          <input
                            type="number"
                            min="1"
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#fbbf24] text-white"
                            value={ep.season || 1}
                            onChange={(e) => updateEpisode(index, 'season', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEpisode(index)}
                        className="text-red-500/50 hover:text-red-500 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  disabled={loading}
                  onClick={handleSaveEpisodes}
                  className="w-full bg-[#fbbf24] text-black font-black py-4 rounded-xl uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Epizodlarni Saqlash
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-[#121214] border border-white/5 rounded-lg overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-white/5 flex items-center gap-3 text-white">
            <MessageSquare className="text-[#fbbf24]" />
            <h2 className="text-xl font-bold flex-1">Foydalanuvchilardan xabarlar</h2>
          </div>
          <div className="overflow-x-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-gray-500 italic">Xabarlar yo'q</div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`p-4 rounded-lg border ${msg.read ? 'border-white/5 bg-white/5' : 'border-[#fbbf24]/30 bg-[#fbbf24]/10'} transition-colors`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white text-lg">{msg.name}</h3>
                      <p className="text-sm text-gray-400">{msg.contactInfo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleMessageRead(msg.id, msg.read)}
                        className={`text-xs px-3 py-1 rounded-full font-bold ${msg.read ? 'bg-white/10 text-gray-400 hover:text-white' : 'bg-[#fbbf24] text-black'}`}
                      >
                        {msg.read ? "O'qilmagan qilish" : "O'qildi"}
                      </button>
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-4 whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] text-gray-500 mt-4 tracking-widest uppercase">
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString('uz-UZ') : 'Hozir'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-[#121214] border border-white/5 p-8 rounded-lg animate-in slide-in-from-bottom-4 duration-300">
           <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <SettingsIcon className="text-[#fbbf24]" />
            Sayt sozlamalari
          </h2>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                    <Send size={12} className="text-blue-400" /> Telegram kanal linki
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/yourchannel"
                    className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                    value={siteSettings.telegram || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, telegram: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                    <Instagram size={12} className="text-pink-400" /> Instagram sahifa linki
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/yourpage"
                    className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-white"
                    value={siteSettings.instagram || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, instagram: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="px-8 bg-[#fbbf24] text-black font-black py-4 rounded-xl uppercase text-xs hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-yellow-500/10 transition-all"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              Sozlamalarni saqlash
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
