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

  let cleaned = rawText
    // Remove reply header lines (English & Thai)
    .split(/\r?\nOn .+ wrote:|\r?\nเมื่อ .+ เขียนว่า:|\r?\nFrom: .+|\r?\n-----Original Message-----|\r?\n--\s*\r?\n/i)[0]
    // Remove "Reply above this line" markers
    .split(/--\s*Reply above this line\s*--/i)[0]
    // Remove sent from iPhone/Android/Outlook lines
    .replace(/(?:Sent from my (?:iPhone|iPad|Android|Galaxy|mobile device)|ส่งจาก iPhone ของฉัน|ส่งจากสมาร์ทโฟนของฉัน)[\s\S]*$/i, '')
    .trim();

  return cleaned || rawText.trim();
}

/**
 * Extract Card ID from subject or body
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

  return null;
}

/**
 * Process a single incoming email
 */
async function processIncomingEmail(stream: NodeJS.ReadableStream) {
  try {
    const parsed = await simpleParser(stream);

    const fromAddress = parsed.from?.value[0]?.address?.toLowerCase().trim() || '';
    const subject = parsed.subject || '';
    const textBody = parsed.text || '';
    const htmlBody = parsed.html || '';

    console.log(`[Inbound Email Reader] 📥 New email received from: ${fromAddress} - Subject: "${subject}"`);

    // Ignore self emails
    if (fromAddress === GMAIL_USER.toLowerCase()) {
      return;
    }

    const cardId = extractCardIdFromEmail(subject, textBody, htmlBody);
    if (!cardId) {
      console.log(`[Inbound Email Reader] ℹ️ No Card ID found in email subject "${subject}". Skipping.`);
      return;
    }

    // Verify card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: true } }
      }
    });

    if (!card) {
      console.warn(`[Inbound Email Reader] ⚠️ Card with ID "${cardId}" not found in database.`);
      return;
    }

    // Match sender to staff member
    let user = await prisma.user.findFirst({
      where: { email: { equals: fromAddress, mode: 'insensitive' } }
    });

    if (!user) {
      console.warn(`[Inbound Email Reader] ⚠️ Sender ${fromAddress} is not registered in EFL-Workflow. Ignoring.`);
      return;
    }

    const cleanedContent = cleanEmailReply(textBody);
    if (!cleanedContent) {
      console.log(`[Inbound Email Reader] ℹ️ Empty reply body after cleaning. Skipping.`);
      return;
    }

    // Insert Comment into Database
    const newComment = await prisma.comment.create({
      data: {
        cardId: card.id,
        userId: user.id,
        content: cleanedContent,
        isEmailReply: true
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true }
        }
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        cardId: card.id,
        userId: user.id,
        actionType: 'COMMENT_ADDED',
        details: {
          commentId: newComment.id,
          source: 'EMAIL_REPLY',
          preview: cleanedContent.slice(0, 100)
        }
      }
    });

    console.log(`[Inbound Email Reader] 🎉 Successfully posted comment from ${user.name} on card: "${card.title}"`);

    // Broadcast Real-time WebSocket to all clients
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

  } catch (err: any) {
    console.error(`[Inbound Email Reader] Error parsing email:`, err.message);
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

  function openInbox(cb: (err: Error | null, box?: Imap.Box) => void) {
    imap.openBox('INBOX', false, cb);
  }

  function checkUnseenEmails() {
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error('[Inbound Email Reader] Search error:', err.message);
        return;
      }

      if (!results || results.length === 0) {
        return;
      }

      console.log(`[Inbound Email Reader] 📬 Found ${results.length} new unread email(s) in INBOX. Processing...`);

      const f = imap.fetch(results, { bodies: '', markSeen: true });

      f.on('message', (msg) => {
        msg.on('body', (stream) => {
          processIncomingEmail(stream);
        });
      });

      f.once('error', (fetchErr) => {
        console.error('[Inbound Email Reader] Fetch error:', fetchErr.message);
      });
    });
  }

  imap.once('ready', () => {
    console.log(`[Inbound Email Reader] 🚀 Connected to Gmail IMAP (${GMAIL_USER}) - Listening for replies!`);

    openInbox((err) => {
      if (err) {
        console.error('[Inbound Email Reader] Failed to open INBOX:', err.message);
        return;
      }

      // Check immediately
      checkUnseenEmails();

      // Listen on new email events
      imap.on('mail', () => {
        checkUnseenEmails();
      });

      // Regular polling fallback every 15s
      setInterval(() => {
        if (imap.state === 'authenticated') {
          checkUnseenEmails();
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
