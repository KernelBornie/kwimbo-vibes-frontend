'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ContentCard from '@/components/ContentCard';
import { Content } from '@/types/content';

export default function Home() {
  const [feed, setFeed] = useState<Content[]>([]);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/feed');
      setFeed(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Kwimbo Vibes</h1>
        <div className="space-y-4">
          {feed.map(item => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
