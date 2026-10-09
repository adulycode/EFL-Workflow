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
      notifyMention,
      notifyComment
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
        ...(notifyMention !== undefined && { notifyMention }),
        ...(notifyComment !== undefined && { notifyComment })
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('user:updated', updatedUser);
    }

    // Two-Way Sync: Sync updated name or avatarUrl back to Central SSO in background
    if (name !== undefined || avatarUrl !== undefined) {
      import('../services/ssoService').then(({ syncProfileToSSO }) => {
        syncProfileToSSO({
          ssoUserId: updatedUser.ssoUserId,
          email: updatedUser.email,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl || undefined
        }).catch((err) => console.error('[Two-Way Sync Error]:', err.message));
      });
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

// Toggle User Assignable Status (Hide / Show in Task Pickers)
router.patch('/:id/assignable', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAssignable } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAssignable: Boolean(isAssignable) }
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

// Central SSO Universal Webhook (Real-Time Push from SSO on user create/edit/delete/disable)
router.post('/sso-sync', async (req, res) => {
  try {
    const { secretKey, event, user, users, userId, id, email } = req.body;
    const { SSO_CONFIG, upsertUserFromSsoData, pullAllUsersFromSSO, reconcileDeletedSsoUsers } = await import('../services/ssoService');

    // Verify Shared Secret Key
    const authHeader = req.headers['x-sso-secret'] || req.headers['authorization'];
    const passedSecret = secretKey || authHeader?.toString().replace('Bearer ', '');
    
    if (passedSecret && passedSecret !== SSO_CONFIG.sharedSecret) {
      return res.status(401).json({ error: 'Unauthorized secret key' });
    }

    const io = req.app.get('io');

    // 1. Explicit user deletion event
    const isDeleteEvent = event === 'USER_DELETED' || event === 'user.deleted' || event === 'DELETE_USER' || user?.deleted === true;
    if (isDeleteEvent) {
      const targetEmail = (email || user?.email)?.toLowerCase()?.trim();
      const targetId = userId || id || user?.id || user?.userId || user?.ssoUserId;

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            ...(targetId ? [{ ssoUserId: targetId }, { id: targetId }] : []),
            ...(targetEmail ? [{ email: targetEmail }] : [])
          ]
        }
      });

      if (existing) {
        await prisma.cardAssignee.deleteMany({ where: { userId: existing.id } });
        await prisma.user.update({
          where: { id: existing.id },
          data: { isActive: false, isAssignable: false, role: 'VIEWER' }
        });
        console.log(`[SSO Webhook] 🔒 Deactivated user upon SSO delete event: ${existing.name} (${existing.email})`);
        
        const allUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
        if (io) {
          io.emit('users:synced', allUsers);
          io.emit('card:updated', {});
        }
        return res.json({ success: true, deleted: true, user: existing });
      }
    }

    // 2. Batch user sync (with full reconciliation)
    if (Array.isArray(users) && users.length > 0) {
      const syncedList = [];
      for (const u of users) {
        const synced = await upsertUserFromSsoData(u);
        if (synced) syncedList.push(synced);
      }
      const deletedIds = await reconcileDeletedSsoUsers(users);
      const allUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

      if (io) {
        io.emit('users:synced', allUsers);
        if (deletedIds.length > 0) {
          io.emit('card:updated', {});
        }
      }
      return res.json({ success: true, count: syncedList.length, deletedCount: deletedIds.length, users: allUsers });
    }

    // 3. Single user event
    if (user && user.email) {
      const synced = await upsertUserFromSsoData(user);
      if (io && synced) {
        io.emit('user:updated', synced);
      }
      return res.json({ success: true, user: synced });
    }

    // 4. Fallback pull all
    const result = await pullAllUsersFromSSO();
    const allUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    if (io) {
      io.emit('users:synced', allUsers);
      if ((result as any).deletedCount > 0) {
        io.emit('card:updated', {});
      }
    }
    return res.json(result);
  } catch (err: any) {
    console.error('[SSO Webhook Error]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Admin On-Demand Manual Sync from Central SSO
router.post('/sync-from-sso', async (req, res) => {
  try {
    const { pullAllUsersFromSSO } = await import('../services/ssoService');
    const result = await pullAllUsersFromSSO();

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('users:synced', allUsers);
      if ((result as any).deletedCount > 0) {
        io.emit('card:updated', {});
      }
    }

    res.json({ success: true, count: result.count, deletedCount: (result as any).deletedCount || 0, users: allUsers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
