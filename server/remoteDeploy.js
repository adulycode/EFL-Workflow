const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Adding Two-Way Sync (syncFromApp) to Central SSO...');

const userControllerCode = `import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuditService } from '../services/auditService';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Broadcast user changes to all active child applications in real-time
 */
async function broadcastUserToApps(event: string, userPayload: any) {
  try {
    const apps = await prisma.application.findMany({ where: { isActive: true } });
    for (const app of apps) {
      if (app.url) {
        const webhookUrl = \`\${app.url.replace(/\\/$/, '')}/api/users/sso-sync\`;
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event,
            user: userPayload
          })
        }).then(r => console.log(\`[SSO Webhook] Pushed \${event} to \${app.name} (\${webhookUrl}) - status \${r.status}\`))
          .catch(err => console.warn(\`[SSO Webhook Failed] \${app.name} (\${webhookUrl}): \${err.message}\`));
      }
    }
  } catch (err: any) {
    console.error('[SSO Webhook Broadcast Error]:', err.message);
  }
}

export class UserController {
  /**
   * Sync user update from Child Application (Two-Way Sync)
   */
  static async syncFromApp(req: Request, res: Response) {
    try {
      const { secretKey, ssoUserId, email, name, nickname, avatarUrl } = req.body;
      const { config } = require('../config');

      const authHeader = req.headers['x-sso-secret'] || req.headers['authorization'];
      const passedSecret = secretKey || authHeader?.toString().replace('Bearer ', '');

      if (passedSecret && passedSecret !== config.jwtSecret) {
        return res.status(403).json({ success: false, message: 'Invalid secretKey' });
      }

      if (!ssoUserId && !email) {
        return res.status(400).json({ success: false, message: 'ssoUserId or email is required' });
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            ...(ssoUserId ? [{ id: ssoUserId }] : []),
            ...(email ? [{ email: email.toLowerCase().trim() }] : [])
          ]
        }
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'User not found in Central SSO' });
      }

      let parsedNickname = nickname;
      let parsedName = name;
      if (!parsedNickname && name && name.includes('(') && name.includes(')')) {
        const match = name.match(/^(.+?)\\s*\\((.+?)\\)$/);
        if (match) {
          parsedNickname = match[1].trim();
          parsedName = match[2].trim();
        }
      }

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...(parsedName !== undefined && { name: parsedName }),
          ...(parsedNickname !== undefined && { nickname: parsedNickname }),
          ...(avatarUrl !== undefined && { avatarUrl })
        }
      });

      await AuditService.log({
        action: 'USER_SYNCED_FROM_APP',
        details: { ssoUserId: updated.id, email: updated.email, name: updated.name, nickname: updated.nickname, avatarUrl: updated.avatarUrl },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: 'User updated in Central SSO successfully (Two-Way Sync)',
        user: updated
      });
    } catch (err: any) {
      console.error('syncFromApp error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * List all users
   */
  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          nickname: true,
          employeeCode: true,
          avatarUrl: true,
          isSuperAdmin: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { appAccesses: { where: { hasAccess: true } } },
          },
        },
      });

      return res.status(200).json({
        success: true,
        users: users.map((u) => ({
          ...u,
          accessibleAppsCount: u.isSuperAdmin ? 'All' : u._count.appAccesses,
        })),
      });
    } catch (error) {
      console.error('GetAll Users error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  }

  /**
   * Create a new user
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name, nickname, username, employeeCode, avatarUrl, isSuperAdmin, isActive } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required',
        });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: username ? username.trim() : null,
          passwordHash,
          name,
          nickname: nickname ? nickname.trim() : null,
          employeeCode: employeeCode ? employeeCode.trim() : null,
          avatarUrl: avatarUrl || \`https://api.dicebear.com/7.x/initials/svg?seed=\${encodeURIComponent(name)}\`,
          isSuperAdmin: !!isSuperAdmin,
          isActive: isActive !== undefined ? !!isActive : true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          nickname: true,
          employeeCode: true,
          avatarUrl: true,
          isSuperAdmin: true,
          isActive: true,
          createdAt: true,
        },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'USER_CREATED',
        details: { newUserId: user.id, email: user.email, name: user.name, nickname: user.nickname, isSuperAdmin: user.isSuperAdmin },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      broadcastUserToApps('USER_CREATED', {
        ssoUserId: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        user,
      });
    } catch (error) {
      console.error('Create User error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
  }

  /**
   * Update user details
   */
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { email, name, nickname, username, employeeCode, avatarUrl, isSuperAdmin, isActive } = req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (req.user?.userId === id && isSuperAdmin === false && req.user.isSuperAdmin) {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove your own Super Admin privileges',
        });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(email !== undefined && { email: email.toLowerCase().trim() }),
          ...(username !== undefined && { username: username ? username.trim() : null }),
          ...(name !== undefined && { name }),
          ...(nickname !== undefined && { nickname: nickname ? nickname.trim() : null }),
          ...(employeeCode !== undefined && { employeeCode: employeeCode ? employeeCode.trim() : null }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(isSuperAdmin !== undefined && { isSuperAdmin: !!isSuperAdmin }),
          ...(isActive !== undefined && { isActive: !!isActive }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          nickname: true,
          employeeCode: true,
          avatarUrl: true,
          isSuperAdmin: true,
          isActive: true,
          updatedAt: true,
        },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'USER_UPDATED',
        details: { targetUserId: id, updates: req.body },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      broadcastUserToApps('USER_UPDATED', {
        ssoUserId: updated.id,
        email: updated.email,
        name: updated.name,
        nickname: updated.nickname,
        avatarUrl: updated.avatarUrl,
        isActive: updated.isActive
      });

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: updated,
      });
    } catch (error) {
      console.error('Update User error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  /**
   * Reset user password
   */
  static async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'PASSWORD_RESET',
        details: { targetUserId: id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Reset Password error:', error);
      return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  }

  /**
   * Delete user
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.userId === id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
      }

      const deleted = await prisma.user.delete({ where: { id } });

      await AuditService.log({
        userId: req.user?.userId,
        action: 'USER_DELETED',
        details: { deletedUserId: id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      broadcastUserToApps('USER_DELETED', {
        ssoUserId: deleted.id,
        email: deleted.email,
        isActive: false
      });

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete User error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
}
`;

const userRoutesCode = `import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// Two-Way Sync Endpoint from Child Applications (e.g. Trello, FixFlow)
router.post('/sync-from-app', UserController.syncFromApp);

router.get('/', authMiddleware, adminOnly, UserController.getAll);
router.post('/', authMiddleware, adminOnly, UserController.create);
router.put('/:id', authMiddleware, adminOnly, UserController.update);
router.post('/:id/reset-password', authMiddleware, adminOnly, UserController.resetPassword);
router.delete('/:id', authMiddleware, adminOnly, UserController.delete);

export default router;
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Write userController.ts
    const ws1 = sftp.createWriteStream('/home/serva/apps/eflsso/server/src/controllers/userController.ts');
    ws1.write(userControllerCode);
    ws1.end(() => {
      console.log('✅ Updated userController.ts');
      
      // Write userRoutes.ts
      const ws2 = sftp.createWriteStream('/home/serva/apps/eflsso/server/src/routes/userRoutes.ts');
      ws2.write(userRoutesCode);
      ws2.end(() => {
        console.log('✅ Updated userRoutes.ts');

        const commands = [
          'cd /home/serva/apps/eflsso',
          'docker compose up -d --build',
          'sleep 3',
          'docker ps --filter "name=efl"'
        ].join(' && ');

        conn.exec(commands, (err2, stream2) => {
          if (err2) throw err2;
          stream2.on('data', (d) => process.stdout.write(d.toString()));
          stream2.stderr.on('data', (d) => process.stderr.write(d.toString()));
          stream2.on('close', (code) => {
            console.log(`\n🎉 Central SSO rebuild finished with exit code: ${code}`);
            conn.end();
          });
        });
      });
    });
  });
}).connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
