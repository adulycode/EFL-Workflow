import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationPayload {
  userId: string;
  email?: string;
  lineUserId?: string;
  title: string;
  message: string;
  cardId?: string;
  actionType: string;
  cardDetails?: {
    boardTitle?: string;
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

  // 1. Email Notification via Resend
  if (email) {
    if (RESEND_API_KEY && RESEND_API_KEY !== 'placeholder_resend_api_key') {
      const emailPromise = fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'EFL-Workflow <notifications@efl.org>',
          to: [email],
          subject: title,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="background: #047857; padding: 20px; text-align: left;">
                <h1 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 1px;">EFL WORKFLOW ALERT</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 0;">${title}</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">${message}</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
                  <a href="http://localhost:3010" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">เปิดดูการ์ดงาน</a>
                </div>
              </div>
            </div>
          `
        })
      })
      .then(async (res) => {
        const data = await res.json();
        await prisma.notificationLog.create({
          data: {
            userId,
            channel: 'EMAIL',
            title,
            message,
            status: res.ok ? 'SENT' : 'FAILED',
            details: data
          }
        });
      })
      .catch(async (err) => {
        console.error('[Resend Error]', err);
      });

      promises.push(emailPromise);
    }
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
      .catch(async (err) => {
        console.error('[LINE API Error]', err);
      });

      promises.push(linePromise);
    } else {
      // Mock / Simulation Log
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'LINE_FLEX_CARD',
          title,
          message,
          status: 'SENT (Simulated Flex Card)',
          details: flexMessage
        }
      });
    }
  }

  await Promise.allSettled(promises);
}
