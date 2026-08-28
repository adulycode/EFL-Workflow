import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER || 'efl.notify@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || 'oxvrgteancrhipia';
const APP_URL = process.env.APP_BASE_URL || 'https://trello.eflworkspace.com';

// Create Nodemailer Transporter
export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

// Verify connection on startup
emailTransporter.verify((error) => {
  if (error) {
    console.warn(`[Email Service] ⚠️ Gmail SMTP connection failed: ${error.message}`);
  } else {
    console.log(`[Email Service] 🚀 Gmail SMTP is ready to send from: ${GMAIL_USER}`);
  }
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  cardId?: string;
}

/**
 * Send raw email with logging
 */
export async function sendEmail({ to, subject, html, text, userId, cardId }: SendEmailOptions) {
  try {
    const info = await emailTransporter.sendMail({
      from: `"EFL Workflow Alert" <${GMAIL_USER}>`,
      to,
      subject,
      text: text || subject,
      html
    });

    console.log(`[Email Service] ✅ Email sent to ${to} (MessageId: ${info.messageId})`);

    // Log in database
    if (userId) {
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'EMAIL',
          title: subject,
          message: text || subject,
          status: 'SENT',
          details: { messageId: info.messageId, to, response: info.response }
        }
      }).catch(() => {});
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Service] ❌ Failed to send email to ${to}:`, error.message);

    if (userId) {
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'EMAIL',
          title: subject,
          message: text || subject,
          status: 'FAILED',
          details: { error: error.message, to }
        }
      }).catch(() => {});
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send beautifully styled Card Notification Email
 */
export async function sendCardNotificationEmail({
  to,
  title,
  message,
  cardTitle,
  boardTitle,
  workspaceTitle,
  priority,
  dueDate,
  actorName,
  cardId,
  userId
}: {
  to: string;
  title: string;
  message: string;
  cardTitle?: string;
  boardTitle?: string;
  workspaceTitle?: string;
  priority?: string;
  dueDate?: string | Date;
  actorName?: string;
  cardId?: string;
  userId?: string;
}) {
  const cardUrl = cardId ? `${APP_URL}/cards/${cardId}` : APP_URL;
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  const priorityColor = priority === 'URGENT' ? '#ef4444' :
                        priority === 'HIGH' ? '#f97316' :
                        priority === 'MEDIUM' ? '#eab308' : '#10b981';

  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
    
    <!-- Top Gradient Bar -->
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px 32px; text-align: left;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #a7f3d0; text-transform: uppercase;">EFL WORKFLOW NOTIFICATION</span>
      </div>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 8px 0 0 0; line-height: 1.3;">${title}</h1>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px;">
      
      <!-- Action Intro -->
      <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155;">
          ${actorName ? `<strong>${actorName}</strong> ได้อัปเดตการ์ดงาน:` : 'มีกิจกรรมใหม่เกี่ยวกับการ์ดงานของคุณ:'}
        </p>
        <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">${message}</p>
      </div>

      <!-- Card Details Box -->
      ${cardTitle ? `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
          ${workspaceTitle || 'EFL Organization'} &bull; ${boardTitle || 'Kanban Board'}
        </div>
        <div style="font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
          📌 ${cardTitle}
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #475569; border-top: 1px dashed #e2e8f0; padding-top: 12px;">
          ${priority ? `
          <div style="display: inline-block; margin-right: 16px;">
            <span style="color: #64748b;">ระดับความสำคัญ:</span>
            <span style="display: inline-block; background-color: ${priorityColor}15; color: ${priorityColor}; font-weight: 700; padding: 2px 8px; border-radius: 6px; margin-left: 4px;">
              ${priority}
            </span>
          </div>
          ` : ''}

          ${formattedDueDate ? `
          <div style="display: inline-block;">
            <span style="color: #64748b;">กำหนดส่ง (Due Date):</span>
            <strong style="color: #0f172a; margin-left: 4px;">⏰ ${formattedDueDate}</strong>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${cardUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
          🔗 เปิดดูการ์ดงานบนบอร์ด (Open in EFL-Workflow)
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0 0 6px 0;">อีเมลฉบับนี้ส่งโดยอัตโนมัติจากระบบ EFL Workflow Automation</p>
      <p style="margin: 0;">หากต้องการตั้งค่าการรับการแจ้งเตือน สามารถปรับแต่งได้ในหน้า Profile & Notifications Settings</p>
    </div>

  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `[EFL Workflow] ${title}`,
    html,
    text: `${title}\n\n${message}\n\nเปิดดูการ์ดงาน: ${cardUrl}`,
    userId,
    cardId
  });
}
