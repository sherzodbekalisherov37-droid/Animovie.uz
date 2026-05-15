import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Loader2, X, ExternalLink } from 'lucide-react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface VideoPlayerProps {
  url: string;
  title: string;
}

const ModernPlayer = ({ url, isM3U8, onReady, onError }: { url: string, isM3U8: boolean, onReady: () => void, onError: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create video element manually to avoid React DOM conflicts
    containerRef.current.innerHTML = `<video autoplay playsinline style="width: 100%; height: 100%;"></video>`;
    const video = containerRef.current.querySelector('video') as HTMLVideoElement;
    
    let hls: Hls | null = null;
    let player: Plyr | null = null;

    const initPlyr = () => {
      try {
        player = new Plyr(video, {
          autoplay: true,
          controls: [
            'play-large', 'play', 'mute', 'volume', 'progress', 'current-time', 'duration', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
          ],
          settings: ['quality', 'speed', 'loop'],
          tooltips: { controls: true, seek: true },
          keyboard: { focused: true, global: true },
          ratio: '16:9',
        });
        onReady();
      } catch (err) {
        console.error("Plyr init error:", err);
        onError();
      }
    };

    if (isM3U8 && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 10, // Fetch first chunks very quickly
        maxMaxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true,
        autoStartLoad: true,
        startLevel: -1,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          onError();
        }
      });
    } else {
      video.src = url;
      initPlyr();
      video.addEventListener('error', () => onError());
    }

    return () => {
      // Ensure HLS and Player are destroyed cleanly
      if (hls) hls.destroy();
      if (player) player.destroy();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [url, isM3U8, onReady, onError]);

  return (
    <div className="absolute inset-0 w-full h-full plyr-container bg-[#050505]" ref={containerRef} style={{ '--plyr-color-main': '#e50914' } as any}>
      <style>{`
        .plyr-container { display: block; overflow: hidden; position: relative; }
        .plyr-container .plyr { position: absolute; inset: 0; width: 100% !important; height: 100% !important; border-radius: 0; }
        .plyr-container .plyr__video-wrapper { height: 100% !important; width: 100% !important; background: transparent; margin: 0; padding: 0 !important; }
        .plyr-container video { object-fit: contain !important; height: 100% !important; width: 100% !important; }
        /* Volume hide/show behavior for all sizes */
        .plyr-container input[data-plyr="volume"] {
           max-width: 0 !important;
           opacity: 0 !important;
           padding: 0 !important;
           margin: 0 !important;
           transition: max-width 0.3s ease, opacity 0.3s ease, margin 0.3s ease !important;
           pointer-events: none;
        }
        .plyr-container .plyr__volume:hover input[data-plyr="volume"],
        .plyr-container .plyr__volume:focus-within input[data-plyr="volume"],
        .plyr-container .plyr__volume.plyr__volume--active input[data-plyr="volume"] {
           max-width: 60px !important;
           opacity: 1 !important;
           margin-left: 5px !important;
           pointer-events: auto;
        }

        @media (max-width: 768px) {
          .plyr-container .plyr__controls { 
            padding: 10px !important; 
            flex-wrap: nowrap !important;
          }
          .plyr-container .plyr__progress { 
            flex: 1 1 0% !important;
            width: auto !important;
            margin: 0 10px !important;
          }
          .plyr-container .plyr__time {
             font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect URL type
  const isEmbedCode = url.trim().startsWith('<iframe');
  const isM3U8 = url.includes('.m3u8') || url.includes('type=m3u8') || url.includes('.m3u') || url.includes('hls');
  const isCommonProvider = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('twitch.tv');
  const isIframeUrl = url.includes('/embed') || url.includes('/iframe') || url.includes('player.html') || url.includes('.html');
  const isDirectVideo = isM3U8 || url.match(/\.(mp4|webm|ogg|mkv|avi|mov)$/i) || (!isEmbedCode && !isCommonProvider && !isIframeUrl);

  // Reset state on URL change
  useEffect(() => {
    setLoading(true);
    setError(false);

    // Timeout safeguard for loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [url]);

  // Rendering logic
  const renderContent = () => {
    // 1. Raw iframe code
    if (isEmbedCode) {
      return (
        <div 
          className="w-full h-full" 
          dangerouslySetInnerHTML={{ __html: url }} 
        />
      );
    }

    // 2. Common providers (YouTube, etc) - react-player is best here
    if (isCommonProvider) {
      const Player = ReactPlayer as any;
      return (
        <Player
          url={url}
          width="100%"
          height="100%"
          controls={true}
          playing={true}
          onReady={() => setLoading(false)}
          onError={() => setError(true)}
          className="react-player"
        />
      );
    }

    // 3. Direct HLS or MP4 - use our new Plymouth player wrapper
    if (isM3U8 || isDirectVideo) {
      return (
        <ModernPlayer 
          key={url}
          url={url} 
          isM3U8={isM3U8} 
          onReady={() => setLoading(false)} 
          onError={() => setError(true)} 
        />
      );
    }

    // 4. Default: Treat as Iframe URL (external players)
    return (
      <iframe 
        src={url} 
        className="w-full h-full border-0" 
        allowFullScreen 
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    );
  };

  return (
    <div className="w-full aspect-video bg-[#050505] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative">
      {renderContent()}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0c0e] z-20 p-6 text-center">
          <div className="text-red-500 mb-4 bg-red-500/10 p-4 rounded-full border border-red-500/20">
            <X size={32} />
          </div>
          <h3 className="text-white font-bold mb-2">Video yuklanmadi</h3>
          <p className="text-xs text-gray-400 mb-6">Ushbu manba hozirda ishlamayapti yoki pleer qo'llab-quvvatlamaydi.</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[#e50914] text-white rounded-lg text-xs font-bold uppercase transition-all hover:scale-105"
          >
            <ExternalLink size={14} /> Tashqi sahifada ko'rish
          </a>
        </div>
      )}
    </div>
  );
};
