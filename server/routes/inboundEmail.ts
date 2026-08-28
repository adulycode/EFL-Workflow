import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const APP_BASE_URL = process.env.APP_URL || 'https://trello.eflworkspace.com';

/**
 * Clean quoted email history and signature
 */
function cleanEmailBody(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText
    // Remove "On ... wrote:" or "เมื่อ ... เขียนว่า:"
    .split(/\r?\nOn .+ wrote:|\r?\nเมื่อ .+ เขียนว่า:|\r?\nFrom: .+|\r?\n-----Original Message-----|\r?\n--\s*\r?\n/i)[0]
    // Remove reply line markers
    .split(/--\s*Reply above this line\s*--/i)[0]
    .trim();

  return cleaned || rawText.trim();
}

/**
 * Extract Card ID from email headers or subject
 */
function extractCardId(toEmail: string, subject: string, bodyText: string): string | null {
  // 1. Check Reply-To format: reply+card-{cardId}@... or card-{cardId}@...
  const toMatch = toEmail.match(/(?:reply\+card-|card-)([a-zA-Z0-9-]+)@/i);
  if (toMatch && toMatch[1]) return toMatch[1];

  // 2. Check Subject format: [ticket: {cardId}] or [card: {cardId}]
  const subjectMatch = subject.match(/\[(?:ticket|card|id):\s*([a-zA-Z0-9-]+)\]/i);
  if (subjectMatch && subjectMatch[1]) return subjectMatch[1];

  // 3. Check Body footer format
  const bodyMatch = bodyText.match(/cardId=([a-zA-Z0-9-]+)/i);
  if (bodyMatch && bodyMatch[1]) return bodyMatch[1];

  return null;
}

/**
 * Inbound Email Webhook (Cloudflare Email Routing / Resend Inbound / SendGrid / Postmark)
 */
router.post('/inbound-email', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Inbound Email Webhook] Received incoming email payload:', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject
    });

    const fromHeader = payload.from || payload.sender || '';
    const toHeader = payload.to || payload.recipient || '';
    const subject = payload.subject || '';
    const rawBody = payload.text || payload.html || payload.body || '';

    // Extract sender email
    const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
    const senderEmail = (emailMatch[1] || fromHeader).trim().toLowerCase();

    // Extract cardId
    const cardId = extractCardId(toHeader, subject, rawBody) || payload.cardId;
    if (!cardId) {
      console.warn('[Inbound Email] Unable to match Card ID from incoming email headers.');
      return res.status(400).json({ error: 'Card ID could not be identified from email' });
    }

    // Verify Card exists
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { assignees: { include: { user: true } } }
    });

    if (!card) {
      console.warn(`[Inbound Email] Card not found: ${cardId}`);
      return res.status(404).json({ error: 'Card not found' });
    }

    // Match sender to user
    let user = await prisma.user.findUnique({ where: { email: senderEmail } });
    if (!user) {
      // Find first admin or assignee as author fallback
      user = card.assignees[0]?.user || (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) || null;
    }

    if (!user) {
      return res.status(400).json({ error: 'No valid user found to post comment' });
    }

    // Clean email message text
    const cleanContent = cleanEmailBody(rawBody);

    // Extract attached image if available in payload
    let attachedImageUrl: string | null = null;
    if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
      const imgAttachment = payload.attachments.find((att: any) =>
        att.type?.startsWith('image/') || att.contentType?.startsWith('image/') || att.url || att.content
      );
      if (imgAttachment) {
        attachedImageUrl = imgAttachment.url || imgAttachment.content || null;
      }
    }

    // Create Comment in database
    const comment = await prisma.comment.create({
      data: {
        cardId,
        userId: user.id,
        content: cleanContent ? `📩 [ตอบกลับจากอีเมล] ${cleanContent}` : '📩 [ตอบกลับจากอีเมลพร้อมไฟล์แนบ]',
        imageUrl: attachedImageUrl
      },
      include: { user: true }
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        cardId,
        userId: user.id,
        actionType: 'ADDED_COMMENT',
        details: {
          via: 'EMAIL_REPLY',
          sender: senderEmail,
          preview: cleanContent.slice(0, 60),
          hasImage: Boolean(attachedImageUrl)
        }
      }
    });

    // Broadcast Realtime via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('comment:added', { cardId, comment });
    }

    console.log(`[Inbound Email] ✅ Successfully posted reply comment to card "${card.title}" by ${user.name}`);
    res.json({ success: true, commentId: comment.id, cardTitle: card.title });
  } catch (err: any) {
    console.error('[Inbound Email Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 1-Click Magic Action Handler from Email (Approve / View)
 */
router.get('/magic-action/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const secret = process.env.SSO_SHARED_SECRET || 'super-secret-jwt-key-for-efl-sso-change-in-production-123456789';

    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 5) {
      return res.status(400).send('<h3>❌ Invalid Action Token</h3>');
    }

    const [cardId, userId, action, expiresAtStr, signature] = parts;
    const payload = `${cardId}:${userId}:${action}:${expiresAtStr}`;

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (expectedSignature !== signature) {
      return res.status(401).send('<h3>❌ Token Signature Verification Failed</h3>');
    }

    if (parseInt(expiresAtStr, 10) < Math.floor(Date.now() / 1000)) {
      return res.status(410).send('<h3>⌛ Action Token has Expired</h3>');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } } }
    });

    if (!card || !user) {
      return res.status(404).send('<h3>❌ Card or User not found</h3>');
    }

    if (action === 'approve') {
      // 1. Add Approval Comment
      const comment = await prisma.comment.create({
        data: {
          cardId,
          userId: user.id,
          content: `👑 [1-Click Executive Approval] ได้รับการตรวจสอบและอนุมัติงานเรียบร้อยแล้ว โดย ${user.name}`
        },
        include: { user: true }
      });

      // 2. Move to Done / Review column if available
      const doneColumn = await prisma.column.findFirst({
        where: {
          boardId: card.column.boardId,
          title: { in: ['Done', 'เสร็จสิ้น', 'Approved', 'สำเร็จ'] }
        }
      });

      if (doneColumn && doneColumn.id !== card.columnId) {
        await prisma.card.update({
          where: { id: cardId },
          data: { columnId: doneColumn.id }
        });
      }

      // Record Activity
      await prisma.activityLog.create({
        data: {
          cardId,
          userId: user.id,
          actionType: 'APPROVED_CARD',
          details: { approver: user.name }
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('comment:added', { cardId, comment });
        io.emit('card:updated', { cardId });
      }

      // Redirect to card on web with success message
      return res.redirect(`${APP_BASE_URL}?cardId=${cardId}&approved=true`);
    }

    // Default redirect to Card
    res.redirect(`${APP_BASE_URL}?cardId=${cardId}`);
  } catch (err: any) {
    res.status(500).send(`<h3>Error processing action: ${err.message}</h3>`);
  }
});

export default router;
