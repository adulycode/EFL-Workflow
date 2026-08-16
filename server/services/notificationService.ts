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
}

export async function sendNotification({
  userId,
  email,
  lineUserId,
  title,
  message,
  cardId,
  actionType
}: NotificationPayload) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  console.log(`[Notification Engine] Triggering alert for user: ${userId} (${email || 'No email'}) - ${title}`);

  const promises: Promise<any>[] = [];

  // 1. Email Notification via Resend (or Mock Log if API Key is placeholder)
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
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background: #18181b; padding: 20px; text-align: left;">
                <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.025em;">EFL Workflow Alert</h1>
              </div>
              <div style="padding: 24px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">${title}</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">${message}</p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
                  <span style="font-size: 12px; color: #9ca3af;">Notification triggered automatically by EFL Kanban System.</span>
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
        await prisma.notificationLog.create({
          data: {
            userId,
            channel: 'EMAIL',
            title,
            message,
            status: 'FAILED',
            details: { error: err.message }
          }
        });
      });

      promises.push(emailPromise);
    } else {
      // Mock / Dev mode log
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'EMAIL',
          title,
          message,
          status: 'SENT (Simulated)',
          details: { note: 'Sent in dev mode without live RESEND_API_KEY' }
        }
      });
    }
  }

  // 2. LINE Messaging API (Flex Message / Push Message)
  if (lineUserId) {
    if (LINE_ACCESS_TOKEN && LINE_ACCESS_TOKEN !== 'placeholder_line_token') {
      const linePromise = fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [
            {
              type: 'flex',
              altText: title,
              contents: {
                type: 'bubble',
                size: 'kilo',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  backgroundColor: '#ffffff',
                  contents: [
                    {
                      type: 'text',
                      text: 'EFL WORKFLOW',
                      weight: 'bold',
                      color: '#16a34a',
                      size: 'xxs',
                      letterSpacing: '1px'
                    },
                    {
                      type: 'text',
                      text: title,
                      weight: 'bold',
                      size: 'sm',
                      margin: 'md',
                      wrap: true,
                      color: '#18181b'
                    },
                    {
                      type: 'text',
                      text: message,
                      size: 'xs',
                      color: '#52525b',
                      margin: 'sm',
                      wrap: true
                    }
                  ]
                }
              }
            }
          ]
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
        await prisma.notificationLog.create({
          data: {
            userId,
            channel: 'LINE',
            title,
            message,
            status: 'FAILED',
            details: { error: err.message }
          }
        });
      });

      promises.push(linePromise);
    } else {
      // Mock / Dev mode log
      await prisma.notificationLog.create({
        data: {
          userId,
          channel: 'LINE',
          title,
          message,
          status: 'SENT (Simulated)',
          details: { note: 'Sent in dev mode without live LINE_ACCESS_TOKEN' }
        }
      });
    }
  }

  await Promise.allSettled(promises);
}
