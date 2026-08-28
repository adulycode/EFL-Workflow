import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SSO_CONFIG = {
  portalUrl: process.env.SSO_PORTAL_URL || 'https://eflworkspace.com',
  sharedSecret: process.env.SSO_SHARED_SECRET || 'super-secret-jwt-key-for-efl-sso-change-in-production-123456789',
  appId: process.env.SSO_APP_ID || 'efl-workflow',
  appName: process.env.SSO_APP_NAME || 'EFL Workflow System',
  appUrl: process.env.APP_URL || 'https://trello.eflworkspace.com',
  availableRoles: ['ADMIN', 'STAFF', 'VIEWER']
};

export interface SsoUserPayload {
  userId?: string;
  id?: string;
  ssoUserId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  appId?: string;
  hasAccess?: boolean;
  isSuperAdmin?: boolean;
  disabled?: boolean;
  isActive?: boolean;
  status?: string;
  linkToken?: string;
  lineNotifyToken?: string;
  lineToken?: string;
  lineUserId?: string;
  exp?: number;
  iat?: number;
}

/**
 * Base64 URL decode helper
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Base64 URL encode helper
 */
function base64UrlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Verify JWT token signed by Central SSO with shared secret
 */
export function verifySsoJwt(token: string): SsoUserPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', SSO_CONFIG.sharedSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest();
    
    const actualSignature = Buffer.from(
      signatureB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64'
    );

    if (expectedSignature.length !== actualSignature.length || !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
      console.warn('[SSO Service] Token signature mismatch');
      return null;
    }

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as SsoUserPayload;

    // Check expiration if exp field exists
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      console.warn('[SSO Service] Token has expired');
      return null;
    }

    return payload;
  } catch (err) {
    console.error('[SSO Service] Failed to decode/verify token:', err);
    return null;
  }
}

/**
 * Exchange / Consume SSO Token and create or update local user in EFL-Workflow
 */
export async function consumeSsoToken(token: string) {
  const payload = verifySsoJwt(token);
  if (!payload || !payload.email) {
    throw new Error('Invalid or expired SSO token');
  }

  const email = payload.email.toLowerCase().trim();
  const name = payload.name || email.split('@')[0];
  const avatarUrl = payload.avatarUrl || payload.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  
  // Normalize Role to valid enum
  let role: any = 'STAFF';
  if (payload.role) {
    const upperRole = payload.role.toUpperCase();
    if (['ADMIN', 'STAFF', 'VIEWER'].includes(upperRole)) {
      role = upperRole;
    }
  }

  const ssoUserId = payload.ssoUserId || payload.userId || payload.id;
  const linkToken = payload.linkToken;
  const lineNotifyToken = payload.lineNotifyToken || payload.lineToken;
  const lineUserId = payload.lineUserId;

  // Check active/disabled status and app-level permission
  const hasAppAccess = payload.hasAccess !== false && (payload.appId ? payload.appId === 'efl-workflow' || payload.isSuperAdmin : true);
  const isExplicitlyDisabled = payload.disabled === true || payload.isActive === false || payload.status === 'INACTIVE' || payload.status === 'DISABLED' || !hasAppAccess;
  const isActive = !isExplicitlyDisabled;

  // Upsert user into database
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    if (isExplicitlyDisabled) {
      throw new Error('บัญชีนี้ไม่ได้รับสิทธิ์เข้าใช้งาน EFL Trello หรือถูกระงับใน Central SSO');
    }
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
        role,
        isActive: true,
        ssoUserId,
        linkToken,
        lineNotifyToken,
        lineUserId,
        language: 'th',
        theme: 'dark'
      }
    });
    console.log(`[SSO Service] Created new local user from SSO: ${email} (${role})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        avatarUrl: avatarUrl || user.avatarUrl,
        role: role || user.role,
        isActive,
        ...(ssoUserId && { ssoUserId }),
        ...(linkToken && { linkToken }),
        ...(lineNotifyToken && { lineNotifyToken }),
        ...(lineUserId && { lineUserId })
      }
    });
    console.log(`[SSO Service] Updated local user from SSO: ${email} (${role}, active: ${isActive})`);

    if (isExplicitlyDisabled) {
      throw new Error('This user account has been disabled in Central SSO.');
    }
  }

  // Ensure user is added to the default EFL Core Organization workspace
  const defaultWorkspaceId = '00000000-0000-0000-0000-000000000001';
  const defaultWs = await prisma.workspace.findUnique({ where: { id: defaultWorkspaceId } });
  if (defaultWs) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: defaultWorkspaceId, userId: user.id }
      },
      update: {
        role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      },
      create: {
        workspaceId: defaultWorkspaceId,
        userId: user.id,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      }
    });
  }

  return user;
}

/**
 * Upsert user from SSO Webhook or Sync payload
 */
export async function upsertUserFromSsoData(data: {
  email: string;
  name?: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  isActive?: boolean;
  disabled?: boolean;
  status?: string;
  ssoUserId?: string;
  userId?: string;
  id?: string;
  linkToken?: string;
  lineNotifyToken?: string;
  lineToken?: string;
  lineUserId?: string;
  hasAccess?: boolean;
  isSuperAdmin?: boolean;
  jobTitle?: string;
}) {
  if (!data.email) return null;
  const email = data.email.toLowerCase().trim();
  const name = data.name || email.split('@')[0];
  const avatarUrl = data.avatarUrl || data.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`;
  
  // If explicitly not granted access to efl-workflow
  const hasAppAccess = data.hasAccess !== false || data.isSuperAdmin === true;
  if (!hasAppAccess) {
    // If user exists locally, deactivate them
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isActive: false }
      });
      console.log(`[SSO Sync] 🔒 Deactivated user without efl-workflow access: ${email}`);
    }
    return null;
  }
  
  let role: any = 'STAFF';
  if (data.role) {
    const upperRole = data.role.toUpperCase();
    if (['ADMIN', 'STAFF', 'VIEWER'].includes(upperRole)) {
      role = upperRole;
    }
  }

  const isExplicitlyDisabled = data.disabled === true || data.isActive === false || data.status === 'INACTIVE' || data.status === 'DISABLED';
  const isActive = !isExplicitlyDisabled;
  const ssoUserId = data.ssoUserId || data.userId || data.id;
  const linkToken = data.linkToken;
  const lineNotifyToken = data.lineNotifyToken || data.lineToken;
  const lineUserId = data.lineUserId;
  const jobTitle = data.jobTitle || 'Staff Member';

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
        jobTitle,
        role,
        isActive,
        ssoUserId,
        linkToken,
        lineNotifyToken,
        lineUserId,
        language: 'th',
        theme: 'dark'
      }
    });
    console.log(`[SSO Sync] Created user from SSO data: ${email} (${role})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        avatarUrl: avatarUrl || user.avatarUrl,
        role: role || user.role,
        isActive,
        ...(jobTitle && { jobTitle }),
        ...(ssoUserId && { ssoUserId }),
        ...(linkToken && { linkToken }),
        ...(lineNotifyToken && { lineNotifyToken }),
        ...(lineUserId && { lineUserId })
      }
    });
    console.log(`[SSO Sync] Updated user from SSO data: ${email} (${role}, active: ${isActive})`);
  }

  // Ensure user is in default workspace
  const defaultWorkspaceId = '00000000-0000-0000-0000-000000000001';
  const defaultWs = await prisma.workspace.findUnique({ where: { id: defaultWorkspaceId } });
  if (defaultWs) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: defaultWorkspaceId, userId: user.id }
      },
      update: {
        role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      },
      create: {
        workspaceId: defaultWorkspaceId,
        userId: user.id,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      }
    });
  }

  return user;
}

/**
 * Pull all users from Central SSO Portal
 */
export async function pullAllUsersFromSSO(): Promise<{ success: boolean; count: number; users: any[] }> {
  try {
    const baseHosts = Array.from(new Set([
      SSO_CONFIG.portalUrl,
      'https://eflworkspace.com',
      'http://host.docker.internal:3050',
      'http://103.91.190.29:3050',
      'http://172.17.0.1:3050',
      'http://localhost:3050'
    ])).filter(Boolean);

    const endpoints = [
      `/api/apps/${SSO_CONFIG.appId}/users`,
      `/api/apps/users`,
      `/api/users`,
      `/api/admin/users`,
      `/api/members`
    ];

    let usersData: any[] = [];
    for (const host of baseHosts) {
      for (const endpoint of endpoints) {
        const url = `${host.replace(/\/$/, '')}${endpoint}`;
        try {
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-sso-secret': SSO_CONFIG.sharedSecret,
              'Authorization': `Bearer ${SSO_CONFIG.sharedSecret}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : data.users || data.data || data.members;
            if (Array.isArray(list) && list.length > 0) {
              console.log(`[SSO Sync] ✅ Successfully fetched ${list.length} users from SSO at ${url}`);
              usersData = list;
              break;
            }
          }
        } catch {
          // continue probe
        }
      }
      if (usersData.length > 0) break;
    }

    if (usersData.length === 0) {
      console.log('[SSO Sync] Central SSO probe fallback to direct employee sync...');
      const { syncAllSsoEmployees } = await import('./syncSsoEmployees');
      const synced = await syncAllSsoEmployees();
      return { success: true, count: synced.length, users: synced };
    }

    const syncedUsers = [];
    for (const u of usersData) {
      const synced = await upsertUserFromSsoData(u);
      if (synced) syncedUsers.push(synced);
    }

    console.log(`[SSO Sync] ✅ Successfully synced ${syncedUsers.length} users from Central SSO!`);
    return { success: true, count: syncedUsers.length, users: syncedUsers };
  } catch (err: any) {
    console.error('[SSO Sync] Failed to pull users from Central SSO:', err.message);
    const { syncAllSsoEmployees } = await import('./syncSsoEmployees');
    const synced = await syncAllSsoEmployees();
    return { success: true, count: synced.length, users: synced };
  }
}

/**
 * Send Auto-Registration Signal to EFL Central SSO Portal on Server Startup
 */
export async function registerWithCentralSSO(retryCount = 0) {
  const registrationPayload = {
    id: SSO_CONFIG.appId,
    name: SSO_CONFIG.appName,
    url: SSO_CONFIG.appUrl,
    availableRoles: SSO_CONFIG.availableRoles,
    secretKey: SSO_CONFIG.sharedSecret
  };

  try {
    const targetUrl = `${SSO_CONFIG.portalUrl}/api/apps/auto-register`;
    console.log(`[EFL Central SSO] Auto-registering with portal at ${targetUrl}...`);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationPayload)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[EFL Central SSO] ✅ Successfully registered "${SSO_CONFIG.appName}" with Central SSO!`, data);
      
      // Auto pull all members on successful handshake
      setTimeout(() => pullAllUsersFromSSO(), 1000);

      // Start periodic background auto-sync every 2 minutes
      setInterval(async () => {
        try {
          await pullAllUsersFromSSO();
        } catch {
          // background sync fallback
        }
      }, 120000);

      return true;
    } else {
      console.warn(`[EFL Central SSO] Registration response status: ${res.status}`);
    }
  } catch (err: any) {
    // If Central SSO is not running yet, retry in background without crashing EFL-Workflow
    if (retryCount < 10) {
      const delay = Math.min(30000, 5000 * Math.pow(1.5, retryCount));
      console.log(`[EFL Central SSO] Central SSO portal at ${SSO_CONFIG.portalUrl} is not yet reachable. Will retry in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => registerWithCentralSSO(retryCount + 1), delay);
    }
  }
  return false;
}

/**
 * Sync user active/disabled status from SSO Webhook
 */
export async function syncUserStatusFromSso(email: string, isActive: boolean) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) return null;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive }
  });

  console.log(`[SSO Service] Synced active status for user ${normalizedEmail} -> ${isActive}`);
  return updated;
}
