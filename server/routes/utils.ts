import { Router } from 'express';

const router = Router();

interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  mediaType?: 'canva' | 'youtube' | 'gdrive' | 'figma' | 'website';
}

// In-Memory Cache for fast response and zero redundant network overhead
const previewCache = new Map<string, { data: LinkPreviewData; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const MAX_CACHE_SIZE = 1000;

function isPrivateIp(hostname: string): boolean {
  if (!hostname) return true;
  const h = hostname.toLowerCase().trim();
  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h === '169.254.169.254' || // Cloud metadata IP
    h.endsWith('.internal') ||
    h.endsWith('.local')
  ) {
    return true;
  }
  // Check private IP ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

function extractMetaContent(html: string, propertyPattern: RegExp): string | null {
  const match = html.match(propertyPattern);
  if (!match) return null;
  // match[1] or match[2] depending on regex
  const val = (match[1] || match[2] || '').trim();
  return val.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

router.get('/link-preview', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Security check: Only http/https and no private/internal IPs
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Invalid protocol' });
    }

    if (isPrivateIp(parsedUrl.hostname)) {
      return res.status(403).json({ error: 'Internal/private IPs not allowed' });
    }

    const cleanUrl = parsedUrl.toString();

    // Check Cache
    const cached = previewCache.get(cleanUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    let mediaType: LinkPreviewData['mediaType'] = 'website';
    let defaultSiteName = hostname.replace(/^www\./, '');

    if (hostname.includes('canva.com')) {
      mediaType = 'canva';
      defaultSiteName = 'Canva';
    } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      mediaType = 'youtube';
      defaultSiteName = 'YouTube';
    } else if (hostname.includes('drive.google.com') || hostname.includes('docs.google.com')) {
      mediaType = 'gdrive';
      defaultSiteName = 'Google Drive';
    } else if (hostname.includes('figma.com')) {
      mediaType = 'figma';
      defaultSiteName = 'Figma';
    }

    // Default Favicon
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;

    // Special quick handling for YouTube without scraping full HTML
    if (mediaType === 'youtube') {
      let videoId = '';
      if (hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1).split('?')[0];
      } else {
        videoId = parsedUrl.searchParams.get('v') || '';
      }

      if (videoId) {
        const ytData: LinkPreviewData = {
          url: cleanUrl,
          title: `YouTube Video`,
          description: `Watch on YouTube`,
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          siteName: 'YouTube',
          favicon,
          mediaType: 'youtube'
        };

        // Try to fetch YouTube oEmbed for exact video title quickly
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`, {
            signal: controller.signal
          });
          clearTimeout(timer);
          if (oembedRes.ok) {
            const oembedJson: any = await oembedRes.json();
            if (oembedJson.title) ytData.title = oembedJson.title;
            if (oembedJson.author_name) ytData.description = `By ${oembedJson.author_name}`;
          }
        } catch {
          // Fallback to basic data
        }

        previewCache.set(cleanUrl, { data: ytData, timestamp: Date.now() });
        return res.json(ytData);
      }
    }

    // Fetch HTML with strict 3.5s timeout and 64KB max buffer
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    let html = '';
    try {
      const response = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; EFLWorkflow/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,th;q=0.8'
        }
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Read only the first 64KB to conserve CPU and Memory
      if (response.body) {
        const reader = response.body.getReader();
        let bytesRead = 0;
        const chunks: Uint8Array[] = [];

        while (bytesRead < 65536) {
          const { done, value } = await reader.read();
          if (done || !value) break;
          chunks.push(value);
          bytesRead += value.length;
        }

        const totalBuf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
        html = totalBuf.toString('utf-8');
      } else {
        html = await response.text();
      }
    } catch {
      clearTimeout(timer);
      // If fetching fails or times out, provide clean fallback without crashing
      const fallbackData: LinkPreviewData = {
        url: cleanUrl,
        title: defaultSiteName,
        description: cleanUrl,
        siteName: defaultSiteName,
        favicon,
        mediaType
      };
      previewCache.set(cleanUrl, { data: fallbackData, timestamp: Date.now() });
      return res.json(fallbackData);
    }

    // Extract Open Graph & Meta tags
    const ogTitle =
      extractMetaContent(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i) ||
      extractMetaContent(html, /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<title[^>]*>([^<]+)<\/title>/i);

    const ogDescription =
      extractMetaContent(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i) ||
      extractMetaContent(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);

    let ogImage =
      extractMetaContent(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
      extractMetaContent(html, /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+name=["']twitter:image:src["']\s+content=["']([^"']+)["']/i);

    const ogSiteName =
      extractMetaContent(html, /<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta\s+content=["']([^"']+)["']\s+property=["']og:site_name["']/i) ||
      defaultSiteName;

    // Resolve relative image URLs if any
    if (ogImage && !ogImage.startsWith('http')) {
      try {
        ogImage = new URL(ogImage, cleanUrl).toString();
      } catch {
        ogImage = undefined;
      }
    }

    const title = (ogTitle || defaultSiteName).trim();
    const description = ogDescription ? ogDescription.trim() : undefined;

    const previewData: LinkPreviewData = {
      url: cleanUrl,
      title,
      description,
      image: ogImage || undefined,
      siteName: ogSiteName,
      favicon,
      mediaType
    };

    // Store in LRU cache
    if (previewCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = previewCache.keys().next().value;
      if (oldestKey) previewCache.delete(oldestKey);
    }
    previewCache.set(cleanUrl, { data: previewData, timestamp: Date.now() });

    res.json(previewData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
