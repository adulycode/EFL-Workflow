import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all organization team members (up to 20)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile / LINE ID / Notification preferences
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lineUserId, name, role, avatarUrl, notifyEmail, notifyLine } = req.body;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        lineUserId: lineUserId !== undefined ? lineUserId : undefined,
        name: name !== undefined ? name : undefined,
        role: role !== undefined ? role : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
        notifyEmail: notifyEmail !== undefined ? Boolean(notifyEmail) : undefined,
        notifyLine: notifyLine !== undefined ? Boolean(notifyLine) : undefined
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth simulation / Verification callback
router.post('/google-auth', async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}`
        }
      });
    }

    res.json({ user, token: 'mock-jwt-token-' + user.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
