import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Sparkles, Image as ImageIcon } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  mediaType?: 'canva' | 'youtube' | 'gdrive' | 'figma' | 'website';
}

const clientPreviewCache = new Map<string, LinkPreviewData>();

export const LinkPreviewCard: React.FC<{ url: string }> = ({ url }) => {
  const [data, setData] = useState<LinkPreviewData | null>(() => clientPreviewCache.get(url) || null);
  const [isLoading, setIsLoading] = useState<boolean>(!clientPreviewCache.has(url));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (clientPreviewCache.has(url)) {
      setData(clientPreviewCache.get(url)!);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchPreview() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/utils/link-preview?url=${encodeURIComponent(url)}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('Failed to fetch preview');
        const json = await res.json();
        if (isMounted) {
          clientPreviewCache.set(url, json);
          setData(json);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    fetchPreview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url]);

  if (hasError || (!isLoading && !data)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="my-2 p-2.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-750 animate-pulse flex items-center gap-2.5 max-w-lg">
        <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 shrink-0" />
        <div className="flex-1 space-y-1 min-w-0">
          <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-2.5 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isCanva = data.mediaType === 'canva' || data.siteName?.toLowerCase().includes('canva');
  const isYouTube = data.mediaType === 'youtube';
  const isFigma = data.mediaType === 'figma';
  const isGdrive = data.mediaType === 'gdrive';

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group my-2 block rounded-2xl border transition-all overflow-hidden max-w-xl shadow-xs hover:shadow-md ${
        isCanva
          ? 'bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-blue-500/5 hover:from-purple-500/10 hover:via-cyan-500/10 hover:to-blue-500/10 border-cyan-500/30 hover:border-cyan-500/60'
          : isYouTube
          ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400'
          : isFigma
          ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-200/80 dark:border-violet-900/50 hover:border-violet-400'
          : isGdrive
          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50 hover:border-blue-400'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Thumbnail Preview Image (if available) */}
        {data.image && (
          <div className="sm:w-44 h-32 sm:h-auto bg-neutral-100 dark:bg-neutral-950 shrink-0 relative overflow-hidden flex items-center justify-center border-b sm:border-b-0 sm:border-r border-neutral-200/60 dark:border-neutral-800">
            <img
              src={data.image}
              alt={data.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // If image fails to load, hide image container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {isCanva && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                CANVA
              </span>
            )}
            {isYouTube && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                YOUTUBE
              </span>
            )}
          </div>
        )}

        {/* Text & Site details */}
        <div className="p-3 sm:p-3.5 flex-1 min-w-0 flex flex-col justify-between space-y-1.5">
          <div className="space-y-1">
            {/* Header: Favicon + Site Name */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {data.favicon ? (
                <img
                  src={data.favicon}
                  alt=""
                  className="w-3.5 h-3.5 rounded shrink-0 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe size={13} className="shrink-0 text-neutral-400" />
              )}
              <span className="truncate">{data.siteName || 'Web Page'}</span>
              <ExternalLink size={10} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-neutral-400" />
            </div>

            {/* Title */}
            <h5 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
              {data.title}
            </h5>

            {/* Description snippet */}
            {data.description && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {data.description}
              </p>
            )}
          </div>

          {/* Footer URL link */}
          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate pt-0.5">
            {data.url}
          </div>
        </div>
      </div>
    </a>
  );
};
