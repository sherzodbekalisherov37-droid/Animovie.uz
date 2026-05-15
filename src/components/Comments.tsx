import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Comment } from '../types';
import { MessageSquare, Send, Trash2, User, Loader2 } from 'lucide-react';

interface CommentsProps {
  movieId: string;
}

export const Comments: React.FC<CommentsProps> = ({ movieId }) => {
  const { user, isAdmin, setAuthModalOpen } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('movieId', '==', movieId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [movieId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        movieId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Foydalanuvchi',
        userPhoto: user.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Haqiqatan ham ushbu fikrni o\'chirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  return (
    <div className="mt-12 bg-[#0c0c0e] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <MessageSquare className="text-[#fbbf24]" size={20} />
        <h2 className="text-lg font-black uppercase tracking-widest text-white">Fikrlar ({comments.length})</h2>
      </div>

      <div className="p-6">
        {user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fbbf24] to-yellow-600 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-black" size={20} />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Fikringizni qoldiring..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[#fbbf24]/50 transition-colors resize-none h-24"
                  maxLength={1000}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-[#fbbf24] text-black px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    Yuborish
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-4">Fikr qoldirish uchun tizimga kiring</p>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="text-[#fbbf24] text-xs font-black uppercase tracking-[0.2em] border-b border-[#fbbf24]/30 pb-1 hover:border-[#fbbf24] transition-all"
            >
              Tizimga kirish
            </button>
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#fbbf24]" size={32} />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                  {comment.userPhoto ? (
                    <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-500" size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white uppercase tracking-wider">{comment.userName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500 font-bold">
                        {comment.createdAt && (comment.createdAt as any).toDate ? new Date((comment.createdAt as any).toDate()).toLocaleDateString() : 'Hozirgina'}
                      </span>
                      {(isAdmin || (user && user.uid === comment.userId)) && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          title="Fikrni o'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-700 mb-4 flex justify-center">
                <MessageSquare size={48} strokeWidth={1} />
              </div>
              <p className="text-gray-500 text-sm italic">Hozircha hech qanday fikr bildirilmagan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
