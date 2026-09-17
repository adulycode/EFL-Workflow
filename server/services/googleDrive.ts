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
 * Sanitize folder/file names to be safe for Google Drive and filesystem paths
 */
export function sanitizeFolderName(name: string): string {
  return (name || 'Untitled')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim()
    .slice(0, 100);
}

// In-memory folder ID cache: `${parentId}::${cleanName}` -> { folderId, webViewLink }
const folderCache = new Map<string, { folderId: string; webViewLink?: string }>();

/**
 * Find or create a subfolder inside a Google Drive parent folder
 */
export async function getOrCreateDriveFolder(
  folderName: string,
  parentFolderId: string
): Promise<{ folderId: string; webViewLink?: string } | null> {
  const drive = getDriveClient();
  if (!drive) return null;

  const cleanName = sanitizeFolderName(folderName);
  const cacheKey = `${parentFolderId}::${cleanName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  try {
    const escapedName = cleanName.replace(/'/g, "\\'");
    const searchRes = await drive.files.list({
      q: `'${parentFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name, webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      const existing = {
        folderId: searchRes.data.files[0].id!,
        webViewLink: searchRes.data.files[0].webViewLink || `https://drive.google.com/drive/folders/${searchRes.data.files[0].id}`
      };
      folderCache.set(cacheKey, existing);
      return existing;
    }

    const createRes = await drive.files.create({
      requestBody: {
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true
    });

    const newFolderId = createRes.data.id!;
    const newFolderLink = createRes.data.webViewLink || `https://drive.google.com/drive/folders/${newFolderId}`;

    try {
      await drive.permissions.create({
        fileId: newFolderId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true
      });
    } catch (permErr: any) {
      console.warn('[GoogleDrive] Could not set public permission on new folder:', permErr.message);
    }

    const result = { folderId: newFolderId, webViewLink: newFolderLink };
    folderCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error(`[GoogleDrive] Failed to get or create folder "${cleanName}":`, err.message || err);
    return null;
  }
}

/**
 * Ensure the full hierarchy exists in Google Drive:
 * Root (EFL-Trello) -> Workspace Folder -> Card Folder
 */
export async function ensureHierarchicalDriveFolder(
  workspaceName?: string,
  cardTitle?: string
): Promise<{
  targetFolderId: string;
  cardFolderLink?: string;
  cardFolderId?: string;
  workspaceFolderId?: string;
} | null> {
  const { folderId: rootFolderId } = getDriveConfig();
  if (!rootFolderId) return null;

  let currentParentId = rootFolderId;
  let workspaceFolderId: string | undefined;
  let cardFolderId: string | undefined;
  let cardFolderLink: string | undefined;

  // Level 1: Workspace Folder (e.g. "EFL Core Organization")
  if (workspaceName) {
    const wsFolder = await getOrCreateDriveFolder(workspaceName, currentParentId);
    if (wsFolder) {
      currentParentId = wsFolder.folderId;
      workspaceFolderId = wsFolder.folderId;
    }
  }

  // Level 2: Card Folder (e.g. "[ชื่องาน / การ์ด]")
  if (cardTitle) {
    const cardFolder = await getOrCreateDriveFolder(cardTitle, currentParentId);
    if (cardFolder) {
      currentParentId = cardFolder.folderId;
      cardFolderId = cardFolder.folderId;
      cardFolderLink = cardFolder.webViewLink;
    }
  }

  return {
    targetFolderId: currentParentId,
    cardFolderLink,
    cardFolderId,
    workspaceFolderId
  };
}

/**
 * Upload a file directly to Google Drive folder using Service Account
 */
export async function uploadToGoogleDrive(params: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  targetFolderId?: string;
}): Promise<{ fileId: string; webViewLink: string; webContentLink?: string; proxyUrl: string } | null> {
  const drive = getDriveClient();
  if (!drive) {
    console.warn('[GoogleDrive] Skipping Google Drive upload: Drive client unavailable.');
    return null;
  }

  const { folderId: defaultFolderId } = getDriveConfig();
  const parentFolderId = params.targetFolderId || defaultFolderId;

  try {
    const fileStream = new Readable();
    fileStream.push(params.fileBuffer);
    fileStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: params.fileName,
        parents: [parentFolderId]
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
 * Fallback: Save uploaded file to VPS local disk under /uploads folder (in matching hierarchy)
 */
export async function saveUploadedFileLocally(params: {
  fileName: string;
  fileBuffer: Buffer;
  workspaceName?: string;
  cardTitle?: string;
}): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  const baseUploadDir = path.resolve(process.cwd(), 'uploads');
  const safeWs = params.workspaceName ? sanitizeFolderName(params.workspaceName) : 'General';
  const safeCard = params.cardTitle ? sanitizeFolderName(params.cardTitle) : 'Unassigned';

  const targetDir = path.join(baseUploadDir, safeWs, safeCard);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = `${timestamp}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(targetDir, safeName);

  await fs.promises.writeFile(filePath, params.fileBuffer);

  const relativeUrl = `/uploads/${encodeURIComponent(safeWs)}/${encodeURIComponent(safeCard)}/${safeName}`;

  return {
    fileUrl: relativeUrl,
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
 * 1. Tries Google Drive upload first into hierarchical folders (EFL-Trello > Workspace > Card)
 * 2. If Google Drive fails (e.g. quota or offline), safely falls back to local disk storage
 * 3. Never writes Base64 into the database!
 */
export async function handleFileUploadSmart(params: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  workspaceName?: string;
  cardTitle?: string;
}): Promise<{
  fileUrl: string;
  driveWebViewLink?: string;
  driveFileId?: string;
  cardFolderLink?: string;
  cardFolderId?: string;
  fileType: string;
  fileSize: number;
  isDrive: boolean;
}> {
  // 1. Try Google Drive upload inside hierarchical folders
  try {
    let targetFolderId: string | undefined;
    let cardFolderLink: string | undefined;
    let cardFolderId: string | undefined;

    if (params.workspaceName || params.cardTitle) {
      const folderInfo = await ensureHierarchicalDriveFolder(params.workspaceName, params.cardTitle);
      if (folderInfo) {
        targetFolderId = folderInfo.targetFolderId;
        cardFolderLink = folderInfo.cardFolderLink;
        cardFolderId = folderInfo.cardFolderId;
      }
    }

    const driveResult = await uploadToGoogleDrive({
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileBuffer: params.fileBuffer,
      targetFolderId
    });

    if (driveResult && driveResult.fileId) {
      return {
        fileUrl: `/api/drive/files/${driveResult.fileId}`,
        driveWebViewLink: driveResult.webViewLink,
        driveFileId: driveResult.fileId,
        cardFolderLink,
        cardFolderId,
        fileType: params.mimeType,
        fileSize: params.fileBuffer.length,
        isDrive: true
      };
    }
  } catch (err: any) {
    console.warn('[Upload] Google Drive hierarchical upload attempt failed, falling back to local disk:', err.message);
  }

  // 2. Safe Fallback: Store on local VPS disk in matching folder hierarchy
  const local = await saveUploadedFileLocally({
    fileName: params.fileName,
    fileBuffer: params.fileBuffer,
    workspaceName: params.workspaceName,
    cardTitle: params.cardTitle
  });

  return {
    fileUrl: local.fileUrl,
    fileType: params.mimeType,
    fileSize: local.fileSize,
    isDrive: false
  };
}
