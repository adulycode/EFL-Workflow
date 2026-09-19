import React from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

export interface ServiceMeta {
  name: string;
  category: 'google' | 'canva' | 'adobe' | 'design' | 'productivity' | 'social' | 'web';
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconBg: string;
  renderIcon: (className?: string) => React.ReactNode;
}

export function extractUrls(text: string): string[] {
  if (!text) return [];
  // Regex matching http/https URLs while trimming trailing punctuation like . , ) ]
  const urlRegex = /(https?:\/\/[^\s<>"{}|\^`\\[\]]+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(
    new Set(
      matches.map((url) => {
        // Strip trailing punctuation that often attaches when copying/typing
        return url.replace(/[.,;:!?)]+$/, '');
      })
    )
  );
}

export function getDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getServiceMeta(urlStr: string): ServiceMeta {
  const lower = urlStr.toLowerCase();
  const domain = getDomain(urlStr);

  // Google Docs
  if (lower.includes('docs.google.com/document')) {
    return {
      name: 'Google Docs',
      category: 'google',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      badgeText: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#4285F4"/>
        </svg>
      )
    };
  }

  // Google Sheets
  if (lower.includes('docs.google.com/spreadsheet')) {
    return {
      name: 'Google Sheets',
      category: 'google',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6v-3h3v3zm0-5H6V9h3v3zm5 5h-3v-3h3v3zm0-5h-3V9h3v3zm5 5h-3v-3h3v3zm0-5h-3V9h3v3z" fill="#0F9D58"/>
        </svg>
      )
    };
  }

  // Google Slides
  if (lower.includes('docs.google.com/presentation')) {
    return {
      name: 'Google Slides',
      category: 'google',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeBorder: 'border-amber-200 dark:border-amber-800',
      badgeText: 'text-amber-700 dark:text-amber-300',
      iconBg: 'bg-amber-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM8 8h8v2H8zm0 3h8v2H8zm0 3h5v2H8z" fill="#F4B400"/>
        </svg>
      )
    };
  }

  // Google Forms
  if (lower.includes('docs.google.com/forms') || lower.includes('forms.gle')) {
    return {
      name: 'Google Forms',
      category: 'google',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
      badgeBorder: 'border-purple-200 dark:border-purple-800',
      badgeText: 'text-purple-700 dark:text-purple-300',
      iconBg: 'bg-purple-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2zm-3 8h-4v-2h4v2zm0-4h-4V5h4v2z" fill="#7248B9"/>
        </svg>
      )
    };
  }

  // Google Drive
  if (lower.includes('drive.google.com')) {
    return {
      name: 'Google Drive',
      category: 'google',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 87.3 78" fill="currentColor">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
      )
    };
  }

  // Google Meet
  if (lower.includes('meet.google.com')) {
    return {
      name: 'Google Meet',
      category: 'google',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/60',
      badgeBorder: 'border-teal-200 dark:border-teal-800',
      badgeText: 'text-teal-700 dark:text-teal-300',
      iconBg: 'bg-teal-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 7l-4 4v-2c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-2l4 4V7z" fill="#00897B"/>
        </svg>
      )
    };
  }

  // YouTube
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return {
      name: 'YouTube',
      category: 'social',
      badgeBg: 'bg-red-50 dark:bg-red-950/60',
      badgeBorder: 'border-red-200 dark:border-red-800',
      badgeText: 'text-red-700 dark:text-red-300',
      iconBg: 'bg-red-600',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
        </svg>
      )
    };
  }

  // Canva (Requested explicitly)
  if (lower.includes('canva.com')) {
    return {
      name: 'Canva',
      category: 'canva',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
      badgeBorder: 'border-cyan-200 dark:border-cyan-800',
      badgeText: 'text-cyan-700 dark:text-cyan-300',
      iconBg: 'bg-cyan-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="url(#canvaGrad)"/>
          <path d="M12.5 6.5C8.9 6.5 7 9.5 7 12.8c0 3.1 1.8 5.7 5.2 5.7 2.2 0 3.8-1 4.7-2.3l-1.6-1.1c-.7.9-1.8 1.5-3.1 1.5-2.1 0-3.1-1.6-3.1-3.6 0-2.3 1.2-4.5 3.4-4.5 1.2 0 2 .5 2.5 1.3l1.5-1.2c-.9-1.3-2.3-2.1-4-2.1z" fill="#ffffff"/>
          <defs>
            <linearGradient id="canvaGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00C4CC"/>
              <stop offset="1" stopColor="#7D2AE8"/>
            </linearGradient>
          </defs>
        </svg>
      )
    };
  }

  // Figma
  if (lower.includes('figma.com')) {
    return {
      name: 'Figma',
      category: 'design',
      badgeBg: 'bg-violet-50 dark:bg-violet-950/60',
      badgeBorder: 'border-violet-200 dark:border-violet-800',
      badgeText: 'text-violet-700 dark:text-violet-300',
      iconBg: 'bg-violet-600',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="none">
          <path d="M8 12a4 4 0 0 1 4-4h4V4h-4a4 4 0 1 0 0 8h-4zm0 0a4 4 0 0 0 4 4h4v-4h-8z" fill="#F24E1E"/>
          <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" fill="#A259FF"/>
          <path d="M8 20a4 4 0 0 0 4-4v-4H8a4 4 0 1 0 0 8z" fill="#0ACF83"/>
          <path d="M16 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#FF7262"/>
          <path d="M16 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#1ABCFE"/>
        </svg>
      )
    };
  }

  // Adobe / Express / Behance
  if (lower.includes('adobe.com') || lower.includes('behance.net')) {
    return {
      name: lower.includes('express.adobe') ? 'Adobe Express' : 'Adobe',
      category: 'adobe',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
      badgeBorder: 'border-rose-200 dark:border-rose-800',
      badgeText: 'text-rose-700 dark:text-rose-300',
      iconBg: 'bg-rose-600',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.96 3H22v18h-4.04L13.96 3zM2 3h8.04l4 18H10l-2.1-5.1H4.4L2 21H2V3zm4.7 9.8h1.6L6.7 8.3 5.1 12.8h1.6z" fill="#FA0F00"/>
        </svg>
      )
    };
  }

  // Notion
  if (lower.includes('notion.so') || lower.includes('notion.site')) {
    return {
      name: 'Notion',
      category: 'productivity',
      badgeBg: 'bg-neutral-100 dark:bg-neutral-800',
      badgeBorder: 'border-neutral-300 dark:border-neutral-700',
      badgeText: 'text-neutral-800 dark:text-neutral-200',
      iconBg: 'bg-black',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.69c-.467-.373-.98-.653-2.007-.606L3.34 2.11c-.42.047-.514.28-.374.466l1.493 1.632zm.793 4.2v12.78c0 .7.373.933 1.167.886l14.288-.84c.793-.046.98-.466.98-1.026V7.473c0-.606-.233-.886-.887-.84l-14.52.84c-.7.047-1.028.327-1.028.935zm12.934 1.353c.094.42 0 .84-.42.887l-.98.14v8.583c0 .56-.327.793-.794.793-.326 0-.606-.187-.84-.514l-4.76-7.464v6.997l1.353.28c.373.094.467.42.373.84-.093.42-.42.42-.84.42l-3.36.186c-.373 0-.466-.373-.373-.793l.98-.187V10.88l-1.26-.094c-.373 0-.466-.373-.373-.793.093-.42.373-.42.793-.42l3.593-.233 4.9 7.604V10.6l-1.073-.187c-.373 0-.467-.373-.373-.793.093-.42.42-.42.793-.42l3.173-.187c.373 0 .467.374.373.794z"/>
        </svg>
      )
    };
  }

  // Trello
  if (lower.includes('trello.com')) {
    return {
      name: 'Trello',
      category: 'productivity',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      badgeText: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-600',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9.5 14c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v7zm8-4c0 .55-.45 1-1 1h-2c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h2c.55 0 1 .45 1 1v3z" fill="#0079BF"/>
        </svg>
      )
    };
  }

  // GitHub
  if (lower.includes('github.com')) {
    return {
      name: 'GitHub',
      category: 'productivity',
      badgeBg: 'bg-neutral-100 dark:bg-neutral-800',
      badgeBorder: 'border-neutral-300 dark:border-neutral-700',
      badgeText: 'text-neutral-900 dark:text-neutral-100',
      iconBg: 'bg-neutral-800',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      )
    };
  }

  // LINE
  if (lower.includes('line.me') || lower.includes('lin.ee')) {
    return {
      name: 'LINE',
      category: 'social',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      iconBg: 'bg-emerald-500',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.477.254l2.493 3.388V8.108c0-.345.282-.63.63-.63.345 0 .627.285.627.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="#00C300"/>
        </svg>
      )
    };
  }

  // Facebook
  if (lower.includes('facebook.com') || lower.includes('fb.com') || lower.includes('fb.watch')) {
    return {
      name: 'Facebook',
      category: 'social',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      badgeText: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-600',
      renderIcon: (cls = 'w-3.5 h-3.5') => (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
        </svg>
      )
    };
  }

  // Universal fallback with Google Favicon service
  const cleanDomain = domain.split('/')[0];
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=64`;

  return {
    name: cleanDomain,
    category: 'web',
    badgeBg: 'bg-neutral-100 dark:bg-neutral-800',
    badgeBorder: 'border-neutral-200 dark:border-neutral-700',
    badgeText: 'text-neutral-700 dark:text-neutral-300',
    iconBg: 'bg-neutral-200 dark:bg-neutral-700',
    renderIcon: (cls = 'w-3.5 h-3.5') => (
      <img
        src={faviconUrl}
        alt={cleanDomain}
        className={`${cls} object-contain rounded-xs`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    )
  };
}

export function formatUrlDisplay(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    let path = u.pathname + u.search;
    if (path.length > 28) {
      path = path.slice(0, 25) + '...';
    }
    return path === '/' ? u.hostname.replace(/^www\./, '') : `${u.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return urlStr.length > 30 ? urlStr.slice(0, 27) + '...' : urlStr;
  }
}

/**
 * Interactive Link Badge Component
 */
export const RichLinkBadge: React.FC<{ url: string; compact?: boolean }> = ({ url, compact = false }) => {
  const meta = getServiceMeta(url);
  const display = formatUrlDisplay(url);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${meta.name}: ${url}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-medium transition-all group ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} hover:shadow-xs hover:scale-[1.02] cursor-pointer align-baseline my-0.5`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="shrink-0 flex items-center justify-center">
        {meta.renderIcon('w-3.5 h-3.5')}
      </span>
      <span className="font-bold">{meta.name}</span>
      {!compact && (
        <span className="opacity-70 font-normal truncate max-w-[160px] text-[11px]">
          {display}
        </span>
      )}
      <ExternalLink size={10} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
};

/**
 * Extracted Links Bar Component (rendered under description)
 */
export const ExtractedLinksBar: React.FC<{ text: string }> = ({ text }) => {
  const urls = extractUrls(text);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  if (urls.length === 0) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-1.5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span>🔗</span>
          <span>ลิงก์ที่พบในรายละเอียด ({urls.length})</span>
        </span>
        <span className="text-[10px] font-normal text-neutral-400">คลิกเพื่อเปิดเว็บทันที</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {urls.map((url) => {
          const meta = getServiceMeta(url);
          const display = formatUrlDisplay(url);
          const isCopied = copiedUrl === url;

          return (
            <div
              key={url}
              className={`flex items-center justify-between p-1.5 px-2 rounded-xl border transition-all ${meta.badgeBg} ${meta.badgeBorder} group`}
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 flex-1"
                title={url}
              >
                <div className="p-1 rounded-lg bg-white dark:bg-neutral-800 shadow-xs shrink-0 flex items-center justify-center">
                  {meta.renderIcon('w-4 h-4')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-bold truncate ${meta.badgeText}`}>
                      {meta.name}
                    </span>
                    <ExternalLink size={10} className="text-neutral-400 group-hover:text-blue-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {display}
                  </p>
                </div>
              </a>

              <button
                type="button"
                onClick={() => handleCopy(url)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 ml-1"
                title="คัดลอกลิงก์"
              >
                {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Text renderer that splits text by URLs and renders RichLinkBadge inline
 */
export const RenderedTextWithLinks: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Split text by URL pattern
  const urlRegex = /(https?:\/\/[^\s<>"{}|\^`\\[\]]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.match(/^https?:\/\//i)) {
          // Clean any trailing punctuation
          const cleanUrl = part.replace(/[.,;:!?)]+$/, '');
          const trailing = part.slice(cleanUrl.length);
          return (
            <React.Fragment key={i}>
              <RichLinkBadge url={cleanUrl} />
              {trailing}
            </React.Fragment>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};
