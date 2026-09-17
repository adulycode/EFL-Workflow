import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

function getDriveConfig() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1N1tclaApps6k8gmz-1SIbBWacOAW-T1D';
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  return { folderId, clientEmail, privateKey };
}

let driveClient: any = null;

export function getDriveClient() {
  if (driveClient) return driveClient;

  const { clientEmail, privateKey } = getDriveConfig();
  if (!clientEmail || !privateKey) {
    console.warn('[GoogleDrive] Service Account not fully configured in environment.');
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (err: any) {
    console.error('[GoogleDrive] Failed to initialize Google Drive client:', err.message);
    return null;
  }
}

/**
 * Upload a file directly to Google Drive folder using Service Account
 */
export async function uploadToGoogleDrive(params: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<{ fileId: string; webViewLink: string; webContentLink?: string; proxyUrl: string } | null> {
  const drive = getDriveClient();
  if (!drive) {
    console.warn('[GoogleDrive] Skipping Google Drive upload: Drive client unavailable.');
    return null;
  }

  const { folderId } = getDriveConfig();

  try {
    const fileStream = new Readable();
    fileStream.push(params.fileBuffer);
    fileStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: params.fileName,
        parents: [folderId]
      },
      media: {
        mimeType: params.mimeType,
        body: fileStream
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const webContentLink = response.data.webContentLink;

    // Set permission to anyone with link can view
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        },
        supportsAllDrives: true
      });
    } catch (permErr: any) {
      console.warn('[GoogleDrive] Could not set public permission on Google Drive file:', permErr.message);
    }

    return {
      fileId,
      webViewLink,
      webContentLink,
      proxyUrl: `/api/drive/files/${fileId}`
    };
  } catch (err: any) {
    console.error('[GoogleDrive] Error uploading file to Google Drive:', err.message || err);
    return null;
  }
}

/**
 * Extract Google Drive File ID from various Google Drive URLs or ID strings
 */
export function extractDriveFileId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const trimmed = urlOrId.trim();
  
  // Format: /api/drive/files/:fileId
  const proxyMatch = trimmed.match(/\/api\/drive\/files\/([a-zA-Z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  // Format: https://drive.google.com/file/d/:fileId/...
  const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return driveMatch[1];

  // Format: https://drive.google.com/open?id=:fileId or ?id=:fileId
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // If it's already a raw Drive File ID (alphanumeric string ~20-50 chars without slashes)
  if (!trimmed.includes('/') && trimmed.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Stream a file directly from Google Drive using Service Account credentials
 */
export async function getDriveFileStream(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  mimeType: string;
  name: string;
  size?: number;
} | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  try {
    const [metaRes, fileRes] = await Promise.all([
      drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size',
        supportsAllDrives: true
      }),
      drive.files.get(
        { fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' }
      )
    ]);

    return {
      stream: fileRes.data as NodeJS.ReadableStream,
      mimeType: metaRes.data.mimeType || 'application/octet-stream',
      name: metaRes.data.name || 'file',
      size: metaRes.data.size ? parseInt(metaRes.data.size, 10) : undefined
    };
  } catch (err: any) {
    console.error(`[GoogleDrive] Failed to stream file ${fileId}:`, err.message || err);
    return null;
  }
}

/**
 * Fallback: Save uploaded file to VPS local disk under /uploads folder
 */
export async function saveUploadedFileLocally(params: {
  fileName: string;
  fileBuffer: Buffer;
}): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = `${timestamp}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeName);

  await fs.promises.writeFile(filePath, params.fileBuffer);

  return {
    fileUrl: `/uploads/${safeName}`,
    fileName: params.fileName,
    fileSize: params.fileBuffer.length
  };
}

/**
 * Parse Base64 data URL into mimeType and Buffer
 */
export function parseBase64DataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null;
  }

  const matches = dataUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }

  try {
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

/**
 * Smart file uploader:
 * 1. Tries Google Drive upload first (uses Service Account or Shared Drive)
 * 2. If Google Drive fails (e.g. quota or offline), safely falls back to local disk storage
 * 3. Never writes Base64 into the database!
 */
export async function handleFileUploadSmart(params: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<{
  fileUrl: string;
  driveWebViewLink?: string;
  driveFileId?: string;
  fileType: string;
  fileSize: number;
  isDrive: boolean;
}> {
  // 1. Try Google Drive upload
  try {
    const driveResult = await uploadToGoogleDrive(params);
    if (driveResult && driveResult.fileId) {
      return {
        fileUrl: `/api/drive/files/${driveResult.fileId}`,
        driveWebViewLink: driveResult.webViewLink,
        driveFileId: driveResult.fileId,
        fileType: params.mimeType,
        fileSize: params.fileBuffer.length,
        isDrive: true
      };
    }
  } catch (err: any) {
    console.warn('[Upload] Google Drive upload attempt failed, falling back to local disk:', err.message);
  }

  // 2. Safe Fallback: Store on local VPS disk
  const local = await saveUploadedFileLocally({
    fileName: params.fileName,
    fileBuffer: params.fileBuffer
  });

  return {
    fileUrl: local.fileUrl,
    fileType: params.mimeType,
    fileSize: local.fileSize,
    isDrive: false
  };
}
