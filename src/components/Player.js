'use client';
import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaVolumeUp, FaRandom, FaRedoAlt, FaStepBackward, FaStepForward } from 'react-icons/fa';

export default function Player() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const mediaRef = useRef(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const pendingPlay = useRef(false);
  
  const baseUrl = "https://kwimbo-backend-final.onrender.com";

  useEffect(() => {
    const saved = localStorage.getItem('lastTrack');
    if (saved) {
      try {
        const track = JSON.parse(saved);
        setCurrentTrack(track);
        setPlaylist([track]);
        setCurrentIndex(0);
        if (mediaRef.current) {
          mediaRef.current.src = `${baseUrl}${track.fileUrl}`;
          mediaRef.current.load();
          const savedTime = localStorage.getItem('lastTrackTime');
          if (savedTime) mediaRef.current.currentTime = parseFloat(savedTime);
          mediaRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleTrackChange = (e) => {
      const { track, playlist: newPlaylist, index } = e.detail;
      if (pendingPlay.current) return;
      pendingPlay.current = true;
      setCurrentTrack(track);
      setPlaylist(newPlaylist || [track]);
      setCurrentIndex(index !== undefined ? index : 0);
      if (mediaRef.current) {
        mediaRef.current.src = `${baseUrl}${track.fileUrl}`;
        mediaRef.current.load();
        const onCanPlay = () => {
          const playPromise = mediaRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                localStorage.setItem('lastTrack', JSON.stringify(track));
                localStorage.removeItem('lastTrackTime');
                pendingPlay.current = false;
              })
              .catch(e => console.error('Play error', e));
          }
          mediaRef.current.removeEventListener('canplaythrough', onCanPlay);
        };
        mediaRef.current.addEventListener('canplaythrough', onCanPlay, { once: true });
      }
    };
    window.addEventListener('trackchange', handleTrackChange);
    return () => window.removeEventListener('trackchange', handleTrackChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mediaRef.current && currentTrack && isPlaying) {
        localStorage.setItem('lastTrackTime', mediaRef.current.currentTime.toString());
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const onLoaded = () => setDuration(media.duration);
    const onTime = () => setProgress((media.currentTime / media.duration) * 100);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeat) {
        media.currentTime = 0;
        media.play();
      } else {
        nextTrack();
      }
    };
    media.addEventListener('loadedmetadata', onLoaded);
    media.addEventListener('timeupdate', onTime);
    media.addEventListener('play', onPlay);
    media.addEventListener('pause', onPause);
    media.addEventListener('ended', onEnded);
    return () => {
      media.removeEventListener('loadedmetadata', onLoaded);
      media.removeEventListener('timeupdate', onTime);
      media.removeEventListener('play', onPlay);
      media.removeEventListener('pause', onPause);
      media.removeEventListener('ended', onEnded);
    };
  }, [currentTrack, repeat]);

  const playTrack = (track, idx) => {
    if (pendingPlay.current) return;
    pendingPlay.current = true;
    mediaRef.current.src = `${baseUrl}${track.fileUrl}`;
    mediaRef.current.load();
    const onCanPlay = () => {
      const playPromise = mediaRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setCurrentTrack(track);
            setCurrentIndex(idx);
            localStorage.setItem('lastTrack', JSON.stringify(track));
            localStorage.removeItem('lastTrackTime');
            pendingPlay.current = false;
          })
          .catch(e => console.error(e));
      }
      mediaRef.current.removeEventListener('canplaythrough', onCanPlay);
    };
    mediaRef.current.addEventListener('canplaythrough', onCanPlay, { once: true });
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    let nextIdx;
    if (shuffle) {
      do { nextIdx = Math.floor(Math.random() * playlist.length); } while (nextIdx === currentIndex && playlist.length > 1);
    } else {
      nextIdx = (currentIndex + 1) % playlist.length;
    }
    playTrack(playlist[nextIdx], nextIdx);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    let prevIdx;
    if (shuffle) {
      do { prevIdx = Math.floor(Math.random() * playlist.length); } while (prevIdx === currentIndex && playlist.length > 1);
    } else {
      prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    }
    playTrack(playlist[prevIdx], prevIdx);
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) mediaRef.current.pause();
    else {
      const playPromise = mediaRef.current.play();
      if (playPromise !== undefined) playPromise.catch(e => console.error(e));
    }
  };

  const stop = () => {
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      localStorage.removeItem('lastTrackTime');
    }
  };

  const seek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (mediaRef.current && duration) {
      mediaRef.current.currentTime = percent * duration;
      setProgress(percent * 100);
    }
  };

  const changeVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mediaRef.current) mediaRef.current.volume = val;
  };

  if (!currentTrack) return null;
  const isVideo = currentTrack.type === 'VIDEO';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/20 shadow-2xl">
      <div className="container mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {isVideo ? (
          <video id="global-media" ref={mediaRef} preload="auto" className="hidden" />
        ) : (
          <audio id="global-media" ref={mediaRef} preload="auto" />
        )}
        <div className="flex items-center gap-4 min-w-[180px]">
          <img src={currentTrack.thumbnailUrl || 'https://picsum.photos/50/50'} className="w-12 h-12 rounded-lg shadow-md" />
          <div>
            <div className="font-bold text-white text-sm">{currentTrack.title}</div>
            <div className="text-xs text-cyan-300">{currentTrack.artist?.name || 'Artist'}</div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
          <div className="flex gap-4 text-white">
            <button onClick={() => setShuffle(!shuffle)} className={shuffle ? 'text-cyan-400' : ''}><FaRandom /></button>
            <button onClick={prevTrack}><FaStepBackward /></button>
            <button onClick={togglePlay} className="bg-cyan-500 rounded-full p-3 w-10 h-10 flex items-center justify-center">{isPlaying ? <FaPause /> : <FaPlay />}</button>
            <button onClick={nextTrack}><FaStepForward /></button>
            <button onClick={() => setRepeat(!repeat)} className={repeat ? 'text-cyan-400' : ''}><FaRedoAlt /></button>
            <button onClick={stop}><FaStop /></button>
          </div>
          <div className="w-full flex items-center gap-2">
            <span className="text-xs text-white/60">{formatTime((progress / 100) * duration)}</span>
            <div className="flex-1 bg-white/20 rounded-full h-1.5 cursor-pointer" onClick={seek}>
              <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs text-white/60">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="flex gap-3 text-white items-center min-w-[120px] justify-end">
          <FaVolumeUp />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={changeVolume} className="w-20" />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
