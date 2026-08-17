import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SSO_CONFIG = {
  portalUrl: process.env.SSO_PORTAL_URL || 'http://localhost:3050',
  sharedSecret: process.env.SSO_SHARED_SECRET || 'super-secret-jwt-key-for-efl-sso-change-in-production-123456789',
  appId: process.env.SSO_APP_ID || 'efl-workflow',
  appName: process.env.SSO_APP_NAME || 'EFL Workflow System',
  appUrl: process.env.APP_URL || 'http://localhost:3010',
  availableRoles: ['ADMIN', 'STAFF', 'VIEWER']
};

export interface SsoUserPayload {
  userId?: string;
  id?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  appId?: string;
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

  // Upsert user into database
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
        role,
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
        role: role || user.role
      }
    });
    console.log(`[SSO Service] Updated local user from SSO: ${email} (${role})`);
  }

  return user;
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
