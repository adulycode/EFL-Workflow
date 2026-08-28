import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get recent notification delivery logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Email notification
router.post('/test-email', async (req, res) => {
  try {
    const { email, userId } = req.body;
    const targetEmail = email || (userId ? (await prisma.user.findUnique({ where: { id: userId } }))?.email : null);

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { sendCardNotificationEmail } = await import('../services/emailService');
    const result = await sendCardNotificationEmail({
      to: targetEmail,
      title: '🎉 ทดสอบการเชื่อมต่อระบบ Email สำเร็จแล้ว!',
      message: 'ยินดีด้วยครับ ระบบอีเมลแจ้งเตือนของ EFL Workflow เชื่อมต่อกับ Gmail SMTP เรียบร้อยแล้ว พร้อมส่งการแจ้งเตือนงานมอบหมายและกำหนดส่งอัตโนมัติ 🚀',
      cardTitle: 'ทดสอบระบบแจ้งเตือนการ์ดงาน (Notification Test)',
      boardTitle: 'EFL Core Operations',
      workspaceTitle: 'EFL Organization',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 86400000),
      actorName: 'EFL Notification System',
      userId
    });

    if (result.success) {
      res.json({ success: true, message: `Email sent successfully to ${targetEmail}`, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test All Notifications (Email + LINE)
router.post('/test', async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    const { sendNotification } = await import('../services/notificationService');
    await sendNotification({
      userId,
      email: user?.email || undefined,
      lineUserId: user?.lineUserId || undefined,
      title: title || '📌 มอบหมายงาน: ตรวจสอบและพัฒนา EFL Workflow System',
      message: message || 'คุณได้รับมอบหมายให้ดูแลการ์ดงานนี้ในบอร์ด EFL Organization',
      cardDetails: {
        title: 'พัฒนาระบบแจ้งเตือน Realtime Notifications',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000)
      }
    });

    res.json({ success: true, message: 'Test notification triggered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

