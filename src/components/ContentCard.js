'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function ContentCard({ content }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetchLikeCount();
    fetchComments();
  }, []);

  const fetchLikeCount = async () => {
    try {
      const res = await api.get(`/content/${content.id}/likes`);
      setLikeCount(res.data.count);
    } catch (err) {}
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/content/${content.id}/comments`);
      setComments(res.data);
    } catch (err) {}
  };

  const handleLike = async () => {
    try {
      const res = await api.post(`/content/${content.id}/like`);
      setLiked(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (err) {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/content/${content.id}/comments`, { text: commentText });
      setComments([res.data, ...comments]);
      setCommentText('');
    } catch (err) {}
  };

  const handlePlay = () => {
    window.dispatchEvent(new CustomEvent('trackchange', {
      detail: { track: content, playlist: [content], index: 0 }
    }));
    api.post(`/content/${content.id}/play`).catch(() => {});
  };

  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="flex gap-4">
        <img src={content.thumbnailUrl || 'https://picsum.photos/80/80'} className="w-20 h-20 rounded-lg object-cover" />
        <div className="flex-1">
          <div className="font-bold text-lg">{content.title}</div>
          <div className="text-cyan-300 text-sm">{content.artist?.name || 'Artist'}</div>
          <div className="text-white/50 text-xs">{content.type}</div>
          <div className="flex gap-4 mt-2">
            <button onClick={handlePlay} className="bg-cyan-500 px-4 py-1 rounded-full text-sm">Play</button>
            <button onClick={handleLike} className={`text-sm ${liked ? 'text-red-500' : 'text-white/70'}`}>
              ❤️ {likeCount}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-sm text-white/70">
              💬 {comments.length}
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="mt-4 border-t border-white/20 pt-4">
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 p-2 rounded bg-black/50 border border-white/20 text-sm"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="bg-cyan-500 px-3 py-1 rounded text-sm">Post</button>
          </form>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {comments.map(c => (
              <div key={c.id} className="text-sm">
                <span className="font-bold">{c.user?.name || 'User'}: </span>
                <span>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
