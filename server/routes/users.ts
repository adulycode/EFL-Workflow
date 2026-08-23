import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.patch('/profile', async (req, res) => {
  try {
    const { 
      userId, 
      name, 
      jobTitle, 
      avatarUrl, 
      theme, 
      language, 
      lineUserId, 
      lineNotifyToken,
      notifyEmail, 
      notifyLine, 
      notifyAssigned, 
      notifyDueDate, 
      notifyMention 
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(lineUserId !== undefined && { lineUserId }),
        ...(lineNotifyToken !== undefined && { lineNotifyToken }),
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifyLine !== undefined && { notifyLine }),
        ...(notifyAssigned !== undefined && { notifyAssigned }),
        ...(notifyDueDate !== undefined && { notifyDueDate }),
        ...(notifyMention !== undefined && { notifyMention })
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', updatedUser);
    }

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update User Role
router.patch('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'STAFF', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role value' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role as Role }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', updatedUser);
    }

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite / Add Member
router.post('/invite', async (req, res) => {
  try {
    const { email, name, role = 'STAFF', jobTitle } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          jobTitle: jobTitle || 'Staff Member',
          role: (role as Role) || 'STAFF'
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('user:created', user);
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle User Active Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', updatedUser);
    }

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Central SSO Webhook to Sync Active/Disabled Status
router.post('/sso-status-sync', async (req, res) => {
  try {
    const { email, isActive, secretKey } = req.body;
    const { SSO_CONFIG, syncUserStatusFromSso } = await import('../services/ssoService');

    if (secretKey && secretKey !== SSO_CONFIG.sharedSecret) {
      return res.status(401).json({ error: 'Unauthorized secret key' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const updated = await syncUserStatusFromSso(email, isActive !== false);
    const io = req.app.get('io');
    if (io && updated) {
      io.emit('user:updated', updated);
    }

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
