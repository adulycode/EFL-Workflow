import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationPayload {
  userId: string;
  email?: string;
  lineUserId?: string;
  title: string;
  message: string;
  cardId?: string;
  actionType?: string;
  cardDetails?: {
    title?: string;
    boardTitle?: string;
    workspaceTitle?: string;
    actorName?: string;
    priority?: string;
    dueDate?: string;
    assigneeName?: string;
    checklistProgress?: string;
    coverColor?: string;
  };
}

export function buildLineFlexCard({
  title,
  message,
  cardId,
  cardDetails
}: {
  title: string;
  message: string;
  cardId?: string;
  cardDetails?: NotificationPayload['cardDetails'];
}) {
  const priority = cardDetails?.priority || 'MEDIUM';
  const priorityColor =
    priority === 'URGENT' ? '#ef4444' : priority === 'HIGH' ? '#f97316' : '#10b981';
  const priorityText =
    priority === 'URGENT' ? '🔴 URGENT' : priority === 'HIGH' ? '🟠 HIGH' : '🟢 NORMAL';

  const headerBg = cardDetails?.coverColor || '#047857';

  return {
    type: 'flex',
    altText: `🔔 EFL Workflow: ${title}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: headerBg,
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            alignItems: 'center',
            contents: [
              {
                type: 'text',
                text: 'EFL WORKFLOW',
                weight: 'bold',
                color: '#ffffff',
                size: 'xxs',
                letterSpacing: '1.5px'
              },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: priorityColor,
                cornerRadius: '12px',
                paddingStart: '8px',
                paddingEnd: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                contents: [
                  {
                    type: 'text',
                    text: priorityText,
                    color: '#ffffff',
                    size: 'xxs',
                    weight: 'bold'
                  }
                ]
              }
            ]
          },
          {
            type: 'text',
            text: cardDetails?.boardTitle ? `📁 ${cardDetails.boardTitle}` : '📋 Kanban Board',
            color: '#a7f3d0',
            size: 'xs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '18px',
        backgroundColor: '#ffffff',
        contents: [
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'md',
            color: '#0f172a',
            wrap: true
          },
          {
            type: 'text',
            text: message,
            size: 'xs',
            color: '#475569',
            margin: 'md',
            wrap: true
          },
          {
            type: 'separator',
            margin: 'lg',
            color: '#f1f5f9'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              ...(cardDetails?.dueDate
                ? [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '📅 กำหนดส่ง:',
                          size: 'xs',
                          color: '#64748b',
                          flex: 3
                        },
                        {
                          type: 'text',
                          text: cardDetails.dueDate,
                          size: 'xs',
                          color: '#e11d48',
                          weight: 'bold',
                          flex: 7
                        }
                      ]
                    }
                  ]
                : []),
              ...(cardDetails?.assigneeName
                ? [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '👤 ผู้รับผิดชอบ:',
                          size: 'xs',
                          color: '#64748b',
                          flex: 3
                        },
                        {
                          type: 'text',
                          text: cardDetails.assigneeName,
                          size: 'xs',
                          color: '#0f172a',
                          weight: 'bold',
                          flex: 7
                        }
                      ]
                    }
                  ]
                : []),
              ...(cardDetails?.checklistProgress
                ? [
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '✅ Checklist:',
                          size: 'xs',
                          color: '#64748b',
                          flex: 3
                        },
                        {
                          type: 'text',
                          text: cardDetails.checklistProgress,
                          size: 'xs',
                          color: '#059669',
                          weight: 'bold',
                          flex: 7
                        }
                      ]
                    }
                  ]
                : [])
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '14px',
        backgroundColor: '#f8fafc',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#059669',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🔗 เปิดดูการ์ดงานบนบอร์ด',
              uri: cardId
                ? `http://localhost:3010?cardId=${cardId}`
                : 'http://localhost:3010'
            }
          }
        ]
      }
    }
  };
}

const APP_BASE_URL = process.env.APP_URL || 'https://trello.eflworkspace.com';

/**
 * Generate cryptographic magic token for 1-click email actions
 */
export function generateMagicActionToken(cardId: string, userId: string, action: string = 'view'): string {
  const secret = process.env.SSO_SHARED_SECRET || 'super-secret-jwt-key-for-efl-sso-change-in-production-123456789';
  const payload = `${cardId}:${userId}:${action}:${Math.floor(Date.now() / 1000) + 86400 * 30}`;
  const crypto = require('crypto');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/**
 * Pattern 1: Comment / Reply Notification HTML
 */
export function buildCommentReplyEmailHtml({
  cardTitle,
  boardTitle,
  columnTitle,
  priority,
  commenterName,
  commenterAvatar,
  commentContent,
  imageUrl,
  cardId,
  recipientName,
  recipientRoleText,
  stakeholderSummary
}: {
  cardTitle: string;
  boardTitle: string;
  columnTitle: string;
  priority: string;
  commenterName: string;
  commenterAvatar?: string;
  commentContent: string;
  imageUrl?: string | null;
  cardId: string;
  recipientName: string;
  recipientRoleText: string;
  stakeholderSummary?: { assignees: string[]; reportTo: string[]; fyi: string[] };
}) {
  const cardUrl = `${APP_BASE_URL}?cardId=${cardId}`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: #0f172a; padding: 20px 24px; border-bottom: 3px solid #10b981; display: flex; justify-content: space-between; align-items: center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="color: #10b981; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">EFL WORKFLOW</span>
                <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 16px; font-weight: 700;">💬 มีการตอบกลับใน Ticket</h1>
              </td>
              <td align="right">
                <span style="background: #1e293b; color: #94a3b8; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid #334155;">${recipientRoleText}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Ticket Summary Banner -->
        <div style="background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600;">📁 ${boardTitle} • 📋 ${columnTitle}</span>
          <h2 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #0f172a;">${cardTitle}</h2>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">เรียน <strong>${recipientName}</strong>,</p>

          <!-- Comment Box -->
          <div style="background: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px 12px 12px 8px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 13px; font-weight: 700; color: #0f172a;">👤 ${commenterName}</span>
              <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">ตอบกลับว่า:</span>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${commentContent}</div>

            ${
              imageUrl
                ? `
              <div style="margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 8px;">🖼️ รูปภาพที่แนบมา:</span>
                <img src="${imageUrl}" alt="Attachment" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />
                <a href="${imageUrl}" target="_blank" style="display: inline-block; font-size: 11px; color: #2563eb; margin-top: 6px; text-decoration: none; font-weight: 600;">🔍 คลิกดูรูปขนาดเต็ม (Full Resolution)</a>
              </div>
            `
                : ''
            }
          </div>

          <!-- Stakeholders Footer List -->
          ${
            stakeholderSummary
              ? `
            <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #475569; line-height: 1.6;">
              ${stakeholderSummary.assignees.length ? `<div>🛠️ <strong>ผู้รับผิดชอบ (Assignees):</strong> ${stakeholderSummary.assignees.join(', ')}</div>` : ''}
              ${stakeholderSummary.reportTo.length ? `<div>👑 <strong>รายงาน (Report To):</strong> ${stakeholderSummary.reportTo.join(', ')}</div>` : ''}
              ${stakeholderSummary.fyi.length ? `<div>📢 <strong>แจ้งเพื่อทราบ (FYI):</strong> ${stakeholderSummary.fyi.join(', ')}</div>` : ''}
            </div>
          `
              : ''
          }

          <!-- Action Button -->
          <div style="text-align: center; margin-top: 24px;">
            <a href="${cardUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none; box-shadow: 0 4px 12px rgba(16,185,129,0.25);">💬 เปิดดูและตอบกลับบนเว็บ</a>
          </div>
          
          <div style="text-align: center; margin-top: 14px;">
            <span style="font-size: 11px; color: #94a3b8;">💡 หรือกดปุ่ม <strong>Reply (ตอบกลับ)</strong> ในแอปอีเมลนี้เพื่อโพสต์ข้อความกลับเข้า Ticket ได้ทันที</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          🔒 ระบบส่งอัตโนมัติจาก EFL Workflow System • <a href="${APP_BASE_URL}" style="color: #64748b; text-decoration: none;">trello.eflworkspace.com</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Pattern 2: Executive Report To Notification HTML (for Boss / Manager)
 */
export function buildReportToEmailHtml({
  cardTitle,
  boardTitle,
  columnTitle,
  priority,
  actionSummary,
  actorName,
  dueDate,
  imageUrl,
  cardId,
  managerName,
  magicApproveUrl
}: {
  cardTitle: string;
  boardTitle: string;
  columnTitle: string;
  priority: string;
  actionSummary: string;
  actorName: string;
  dueDate?: string;
  imageUrl?: string | null;
  cardId: string;
  managerName: string;
  magicApproveUrl?: string;
}) {
  const cardUrl = `${APP_BASE_URL}?cardId=${cardId}`;
  const priorityColor = priority === 'URGENT' ? '#e11d48' : priority === 'HIGH' ? '#f59e0b' : '#10b981';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: #1e1b4b; padding: 22px 24px; border-bottom: 3px solid #fbbf24;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <span style="color: #fbbf24; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">👑 EXECUTIVE REPORT</span>
                <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 17px; font-weight: 700;">รายงานความคืบหน้าถึงคุณ</h1>
              </td>
              <td align="right">
                <span style="background: ${priorityColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">${priority}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #1e293b;">เรียน <strong>คุณ${managerName}</strong>,</p>
          <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">มีการรายงานผลงานและส่งความคืบหน้าของงานใน Ticket ที่รายงานถึงคุณโดยตรง:</p>

          <!-- Card Summary Card -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-bottom: 4px;">📁 ${boardTitle} • 📋 ${columnTitle}</div>
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f172a;">${cardTitle}</h3>

            <div style="font-size: 13px; color: #334155; line-height: 1.6; background: #ffffff; padding: 12px 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
              <strong>📝 สรุปความคืบหน้า (${actorName}):</strong><br>
              ${actionSummary}
            </div>

            ${
              dueDate
                ? `
              <div style="margin-top: 10px; font-size: 12px; color: #e11d48; font-weight: 600;">
                📅 กำหนดส่ง (Due Date): ${dueDate}
              </div>
            `
                : ''
            }

            ${
              imageUrl
                ? `
              <div style="margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <span style="font-size: 11px; font-weight: 600; color: #64748b; display: block; margin-bottom: 8px;">🖼️ รูปภาพสรุปผลงาน:</span>
                <img src="${imageUrl}" alt="Report Attachment" style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />
                <a href="${imageUrl}" target="_blank" style="display: inline-block; font-size: 11px; color: #2563eb; margin-top: 6px; text-decoration: none; font-weight: 600;">🔍 ดูภาพความละเอียดสูง (Full Resolution)</a>
              </div>
            `
                : ''
            }
          </div>

          <!-- 1-Click Action Buttons -->
          <div style="text-align: center; margin-top: 24px; display: flex; justify-content: center; gap: 12px;">
            <a href="${cardUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none;">🔍 เปิดตรวจสอบ Ticket</a>
            ${
              magicApproveUrl
                ? `
              <a href="${magicApproveUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none; box-shadow: 0 4px 12px rgba(16,185,129,0.25);">✅ 1-Click อนุมัติงาน</a>
            `
                : ''
            }
          </div>

          <div style="text-align: center; margin-top: 14px;">
            <span style="font-size: 11px; color: #94a3b8;">💡 ท่านสามารถกด <strong>Reply ในแอปเมลนี้</strong> เพื่อส่งคำสั่งการกลับเข้ามาได้ทันที</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          🔒 รายงานส่งตรงถึงผู้บริหารผ่านระบบ EFL Workflow System
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Pattern 3: FYI Notification HTML (In-the-loop Notification)
 */
export function buildFyiEmailHtml({
  cardTitle,
  boardTitle,
  columnTitle,
  inviterName,
  cardId,
  recipientName
}: {
  cardTitle: string;
  boardTitle: string;
  columnTitle: string;
  inviterName: string;
  cardId: string;
  recipientName: string;
}) {
  const cardUrl = `${APP_BASE_URL}?cardId=${cardId}`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: #0284c7; padding: 20px 24px; border-bottom: 3px solid #38bdf8;">
          <span style="color: #e0f2fe; font-weight: 800; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">📢 FYI • แจ้งเพื่อทราบ</span>
          <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 16px; font-weight: 700;">คุณถูกเพิ่มเป็นผู้รับทราบใน Ticket</h1>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">เรียน <strong>${recipientName}</strong>,</p>
          <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
            <strong>${inviterName}</strong> ได้เพิ่มคุณเข้าสู่สถานะ <strong>FYI (ผู้ร่วมรับทราบ)</strong> สำหรับงานนี้ เพื่อให้คุณติดตามความคืบหน้าของงานในโปรเจกต์:
          </p>

          <div style="background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">📁 ${boardTitle} • 📋 ${columnTitle}</div>
            <h3 style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${cardTitle}</h3>
          </div>

          <div style="background: #f0f9ff; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #0369a1; line-height: 1.5; margin-bottom: 24px;">
            ℹ️ <em>คุณไม่จำเป็นต้องลงมือทำงานนี้ แต่จะได้รับอีเมลแจ้งเตือนเมื่อมีความคืบหน้าหรือการตอบกลับใน Ticket ครับ</em>
          </div>

          <div style="text-align: center;">
            <a href="${cardUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 11px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; text-decoration: none;">📋 เปิดดูรายละเอียด Ticket</a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
          🔒 ระบบส่งอัตโนมัติจาก EFL Workflow System
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Universal Stakeholder Notification Dispatcher
 */
export async function sendStakeholderNotifications({
  cardId,
  actorUserId,
  type,
  comment,
  actionSummary,
  imageUrl
}: {
  cardId: string;
  actorUserId?: string;
  type: 'COMMENT' | 'REPORT_TO_ASSIGNED' | 'FYI_ASSIGNED' | 'COLUMN_MOVED';
  comment?: { content: string; imageUrl?: string | null };
  actionSummary?: string;
  imageUrl?: string | null;
}) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        column: { include: { board: true } },
        assignees: { include: { user: true } },
        createdBy: true
      }
    });

    if (!card) return;

    const actor = actorUserId ? await prisma.user.findUnique({ where: { id: actorUserId } }) : null;
    const actorName = actor?.name || 'ทีมงาน EFL';

    const assignees = card.assignees.filter((a) => a.type === 'ASSIGNEE' || !a.type);
    const reportTos = card.assignees.filter((a) => a.type === 'REPORT_TO');
    const fyis = card.assignees.filter((a) => a.type === 'FYI');

    const stakeholderSummary = {
      assignees: assignees.map((a) => a.user.name),
      reportTo: reportTos.map((a) => a.user.name),
      fyi: fyis.map((a) => a.user.name)
    };

    const { sendCardNotificationEmail } = await import('./emailService');

    for (const item of card.assignees) {
      const user = item.user;
      if (user.id === actorUserId) continue; // Don't notify the actor themself
      if (!user.email || user.isActive === false) continue;

      // Check Master Email Switch & Specific Preference
      if (user.notifyEmail === false) continue;
      if (type === 'COMMENT' && (user as any).notifyComment === false) continue;
      if (type === 'REPORT_TO_ASSIGNED' && user.notifyAssigned === false) continue;
      if (type === 'FYI_ASSIGNED' && user.notifyAssigned === false) continue;

      const roleText = item.type === 'REPORT_TO' ? '👑 Report To' : item.type === 'FYI' ? '📢 FYI' : '🛠️ Assignee';
      const notificationTitle = type === 'COMMENT' 
        ? `💬 ${actorName} ตอบกลับในการ์ดงาน: "${card.title}"`
        : `📌 คุณได้รับมอบหมายการ์ดงาน (${roleText}): "${card.title}"`;

      const notificationMessage = type === 'COMMENT'
        ? (comment?.content || 'มีความคิดเห็นใหม่ในการ์ดงานนี้')
        : (actionSummary || `คุณได้รับการระบุเป็น ${roleText} ในการ์ดงานนี้`);

      sendCardNotificationEmail({
        to: user.email,
        title: notificationTitle,
        message: notificationMessage,
        cardTitle: card.title,
        boardTitle: card.column.board.title,
        workspaceTitle: (card.column.board as any).workspace?.name || 'EFL Organization',
        priority: card.priority,
        dueDate: card.dueDate || undefined,
        actorName,
        cardId: card.id,
        userId: user.id
      }).catch((err) => {
        console.error(`[Stakeholder Email Error to ${user.email}]:`, err.message);
      });
    }
  } catch (err: any) {
    console.error('[sendStakeholderNotifications Error]:', err.message);
  }
}

export async function sendNotification({
  userId,
  email,
  lineUserId,
  title,
  message,
  cardId,
  actionType,
  cardDetails
}: NotificationPayload) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  console.log(`[Notification Engine] Triggering alert for user: ${userId} (${email || 'No email'}) - ${title}`);

  const promises: Promise<any>[] = [];

  // 1. Email Notification via Gmail SMTP (or Resend fallback)
  if (email) {
    const { sendCardNotificationEmail } = await import('./emailService');
    const emailPromise = sendCardNotificationEmail({
      to: email,
      title,
      message,
      cardTitle: cardDetails?.title,
      priority: cardDetails?.priority,
      dueDate: cardDetails?.dueDate,
      actorName: cardDetails?.actorName,
      cardId,
      userId
    }).catch((err) => {
      console.error('[Email Dispatch Error]:', err.message);
    });

    promises.push(emailPromise);
  }

  // 2. LINE Messaging API (Flex Message)
  if (lineUserId) {
    const flexMessage = buildLineFlexCard({
      title,
      message,
      cardId,
      cardDetails: cardDetails || {
        boardTitle: 'EFL Core Organization',
        priority: 'HIGH',
        dueDate: '18 ส.ค. 2026, 17:00 น.',
        assigneeName: 'สมชาย ประเสริฐ',
        checklistProgress: '3/4 รายการ (75%)',
        coverColor: '#059669'
      }
    });

    if (LINE_ACCESS_TOKEN && LINE_ACCESS_TOKEN !== 'placeholder_line_token') {
      const linePromise = fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [flexMessage]
        })
      })
      .then(async (res) => {
        const data = await res.json();
        await prisma.notificationLog.create({
          data: {
            userId,
            channel: 'LINE',
            title,
            message,
            status: res.ok ? 'SENT' : 'FAILED',
            details: data
          }
        });
      })
      .catch((err) => {
        console.error('[LINE API Error]', err);
      });

      promises.push(linePromise);
    }
  }

  await Promise.allSettled(promises);
}
