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

export default router;
