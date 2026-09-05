import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || 'efl.notify@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || 'oxvrgteancrhipia';

let ioInstance: any = null;

export function setInboundSocketIO(io: any) {
  ioInstance = io;
}

/**
 * Clean quoted email text, signatures, and mobile client artifacts
 */
export function cleanEmailReply(rawText: string): string {
  if (!rawText) return '';

  // 1. Strip quoted reply headers
  const quotePatterns = [
    /\r?\n\s*On\s+[\s\S]+?wrote:\s*/i,
    /\r?\n\s*เมื่อ\s+[\s\S]+?เขียนว่า:\s*/i,
    /\r?\n\s*ในวันที่\s+[\s\S]+?เขียนว่า:\s*/i,
    /\r?\n\s*From:\s+/i,
    /\r?\n\s*-----Original Message-----/i,
    /\r?\n\s*--\s*\r?\n/
  ];

  let cleaned = rawText;
  for (const pattern of quotePatterns) {
    const idx = cleaned.search(pattern);
    if (idx !== -1) {
      cleaned = cleaned.slice(0, idx);
    }
  }

  // 2. Strip quoted lines starting with >
  cleaned = cleaned
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join('\n');

  // 3. Strip mobile signatures (iOS, Android, etc.)
  cleaned = cleaned.replace(/(?:Sent from my|ส่งจาก)[\s\S]*$/i, '');

  return cleaned.trim() || rawText.trim();
}

/**
 * Extract Card ID from subject, text body, or HTML
 */
export function extractCardIdFromEmail(subject: string, bodyText: string, htmlText: string): string | null {
  // 1. Search in subject: [card: clu123...] or [card:clu123...]
  const subMatch = subject.match(/\[card:\s*([a-zA-Z0-9_-]+)\]/i);
  if (subMatch && subMatch[1]) return subMatch[1].trim();

  // 2. Search in HTML hidden tag: <!-- EFL-CARD-ID:clu123... -->
  const htmlMatch = htmlText.match(/<!--\s*EFL-CARD-ID:([a-zA-Z0-9_-]+)\s*-->/i);
  if (htmlMatch && htmlMatch[1]) return htmlMatch[1].trim();

  // 3. Search in text body: [card:clu123...]
  const bodyMatch = bodyText.match(/\[card:\s*([a-zA-Z0-9_-]+)\]/i);
  if (bodyMatch && bodyMatch[1]) return bodyMatch[1].trim();

  // 4. Search for URL link in body: /cards/clu123...
  const urlMatch = (bodyText + ' ' + htmlText).match(/(?:https?:\/\/[^\/]+)?\/cards\/([a-zA-Z0-9_-]+)/i);
  if (urlMatch && urlMatch[1]) return urlMatch[1].trim();

  return null;
}

/**
 * Process a single incoming email stream or parsed object
 */
async function processIncomingEmail(stream: any): Promise<boolean> {
  try {
    const parsed: any = await simpleParser(stream as any);

    const fromAddress = (parsed.from?.value?.[0]?.address || parsed.from?.text || '').toLowerCase().trim();
    const subject = parsed.subject || '';
    const textBody = parsed.text || '';
    const htmlBody = parsed.html || '';
    const messageId = parsed.messageId || '';

    // Ignore self emails from notification sender
    if (fromAddress === GMAIL_USER.toLowerCase()) {
      return false;
    }

    const cardId = extractCardIdFromEmail(subject, textBody, htmlBody);
    if (!cardId) {
      // Not a card reply email (could be notification failure, newsletter, etc.)
      return false;
    }

    // Verify card exists in database
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: true } }
      }
    });

    if (!card) {
      console.warn(`[Inbound Email Reader] ⚠️ Card with ID "${cardId}" not found in database.`);
      return false;
    }

    // Match sender to staff member in database
    const user = await prisma.user.findFirst({
      where: { email: { equals: fromAddress, mode: 'insensitive' } }
    });

    if (!user) {
      console.warn(`[Inbound Email Reader] ⚠️ Sender ${fromAddress} is not registered in EFL-Workflow. Ignoring.`);
      return false;
    }

    const cleanedContent = cleanEmailReply(textBody);
    if (!cleanedContent) {
      console.log(`[Inbound Email Reader] ℹ️ Empty reply body after cleaning for card "${card.title}". Skipping.`);
      return false;
    }

    // --- Deduplication Check ---
    // Check if this message was already processed into a comment
    if (messageId) {
      const alreadyLogged = await prisma.activityLog.findFirst({
        where: {
          cardId: card.id,
          actionType: 'COMMENT_ADDED',
          details: {
            path: ['emailMessageId'],
            equals: messageId
          }
        }
      });
      if (alreadyLogged) {
        return false; // Already processed
      }
    }

    // Check by content & user to prevent double posting
    const alreadyCommented = await prisma.comment.findFirst({
      where: {
        cardId: card.id,
        userId: user.id,
        content: cleanedContent,
        isEmailReply: true
      }
    });
    if (alreadyCommented) {
      return false; // Already posted
    }

    // Check for inline image attachment if present
    let imageUrl: string | null = null;
    if (parsed.attachments && parsed.attachments.length > 0) {
      const imgAtt = parsed.attachments.find((a: any) => a.contentType?.startsWith('image/'));
      if (imgAtt && imgAtt.content) {
        imageUrl = `data:${imgAtt.contentType};base64,${imgAtt.content.toString('base64')}`;
      }
    }

    const commentDate = parsed.date ? new Date(parsed.date) : new Date();

    // Insert Comment into Database
    const newComment = await prisma.comment.create({
      data: {
        cardId: card.id,
        userId: user.id,
        content: cleanedContent,
        imageUrl,
        isEmailReply: true,
        createdAt: commentDate
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true }
        }
      }
    });

    // Log Activity with emailMessageId for reliable idempotency
    await prisma.activityLog.create({
      data: {
        cardId: card.id,
        userId: user.id,
        actionType: 'COMMENT_ADDED',
        details: {
          commentId: newComment.id,
          source: 'EMAIL_REPLY',
          emailMessageId: messageId,
          senderEmail: fromAddress,
          preview: cleanedContent.slice(0, 100)
        },
        createdAt: commentDate
      }
    });

    console.log(`[Inbound Email Reader] 🎉 Successfully posted comment from ${user.name} (${fromAddress}) on card: "${card.title}"`);

    // Broadcast Real-time WebSocket to all connected clients
    if (ioInstance) {
      ioInstance.emit('comment:created', {
        cardId: card.id,
        boardId: card.column.boardId,
        comment: newComment
      });
      ioInstance.emit('card:updated', {
        id: card.id,
        boardId: card.column.boardId
      });
    }

    return true;
  } catch (err: any) {
    console.error(`[Inbound Email Reader] Error parsing email:`, err.message);
    return false;
  }
}

/**
 * Start Gmail IMAP Background Listener
 */
export function startInboundEmailListener(io?: any) {
  if (io) ioInstance = io;

  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn('[Inbound Email Reader] ⚠️ Missing GMAIL_USER or GMAIL_APP_PASSWORD. Listener not started.');
    return;
  }

  const imap = new Imap({
    user: GMAIL_USER,
    password: GMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    keepalive: {
      interval: 10000,
      idleInterval: 300000,
      forceNoop: true
    }
  });

  let isSyncing = false;

  function syncRecentEmails() {
    if (isSyncing || imap.state !== 'authenticated') return;
    isSyncing = true;

    // Search both UNSEEN and recent messages from ALL
    imap.search(['ALL'], (err, allResults) => {
      if (err) {
        console.error('[Inbound Email Reader] Search error:', err.message);
        isSyncing = false;
        return;
      }

      if (!allResults || allResults.length === 0) {
        isSyncing = false;
        return;
      }

      // Check UNSEEN as well to combine sequence numbers
      imap.search(['UNSEEN'], (unseenErr, unseenResults) => {
        const targetSet = new Set<number>();

        // Always check the latest 35 messages in INBOX
        const recentSlice = allResults.slice(-35);
        recentSlice.forEach((seq) => targetSet.add(seq));

        // Also add any UNSEEN messages
        if (unseenResults && unseenResults.length > 0) {
          unseenResults.forEach((seq) => targetSet.add(seq));
        }

        const targets = Array.from(targetSet);
        if (targets.length === 0) {
          isSyncing = false;
          return;
        }

        const fetcher = imap.fetch(targets, { bodies: '', markSeen: true });

        fetcher.on('message', (msg) => {
          msg.on('body', (stream) => {
            processIncomingEmail(stream);
          });
        });

        fetcher.once('error', (fErr) => {
          console.error('[Inbound Email Reader] Fetch error:', fErr.message);
          isSyncing = false;
        });

        fetcher.once('end', () => {
          setTimeout(() => {
            isSyncing = false;
          }, 2000);
        });
      });
    });
  }

  imap.once('ready', () => {
    console.log(`[Inbound Email Reader] 🚀 Connected to Gmail IMAP (${GMAIL_USER}) - Listening for replies!`);

    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('[Inbound Email Reader] Failed to open INBOX:', err.message);
        return;
      }

      console.log(`[Inbound Email Reader] 📬 INBOX opened (${box.messages.total} total messages). Starting email sync...`);

      // Initial sync on connection
      syncRecentEmails();

      // Listen on new email events from IMAP server
      imap.on('mail', () => {
        syncRecentEmails();
      });

      // Regular polling fallback every 15s to catch any emails marked seen by other clients
      setInterval(() => {
        if (imap.state === 'authenticated') {
          syncRecentEmails();
        }
      }, 15000);
    });
  });

  imap.once('error', (err: any) => {
    console.warn(`[Inbound Email Reader] ⚠️ IMAP connection error: ${err.message}. Retrying in 30s...`);
    setTimeout(() => {
      try {
        imap.connect();
      } catch {}
    }, 30000);
  });

  imap.once('end', () => {
    console.log('[Inbound Email Reader] IMAP connection ended. Reconnecting in 15s...');
    setTimeout(() => {
      try {
        imap.connect();
      } catch {}
    }, 15000);
  });

  try {
    imap.connect();
  } catch (err: any) {
    console.error('[Inbound Email Reader] Failed to connect to IMAP:', err.message);
  }
}
