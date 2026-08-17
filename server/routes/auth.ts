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

// ================= EFL CENTRAL SSO ENDPOINTS =================

// SSO Login & Token Exchange Endpoint
router.post('/sso-login', async (req, res) => {
  try {
    const token = req.body?.token || (req.query?.token as string);
    if (!token) {
      return res.status(400).json({ error: 'SSO Token is required' });
    }

    const { consumeSsoToken } = await import('../services/ssoService');
    const user = await consumeSsoToken(token);

    res.json({
      success: true,
      user,
      token: 'efl-session-' + user.id
    });
  } catch (err: any) {
    console.error('[SSO Login Error]', err);
    res.status(401).json({ error: err.message || 'SSO Authentication failed' });
  }
});

// SSO Config Info Endpoint
router.get('/sso-config', async (req, res) => {
  try {
    const { SSO_CONFIG } = await import('../services/ssoService');
    res.json({
      portalUrl: SSO_CONFIG.portalUrl,
      appId: SSO_CONFIG.appId,
      appName: SSO_CONFIG.appName,
      appUrl: SSO_CONFIG.appUrl,
      availableRoles: SSO_CONFIG.availableRoles
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
