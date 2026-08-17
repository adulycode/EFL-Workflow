import { google } from 'googleapis';
import { Readable } from 'stream';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1N1tclaApps6k8gmz-1SIbBWacOAW-T1D';
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

let driveClient: any = null;

function getDriveClient() {
  if (driveClient) return driveClient;

  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    console.warn('Google Drive Service Account not fully configured in environment.');
    return null;
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export async function uploadToGoogleDrive(params: {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
}): Promise<{ fileId: string; webViewLink: string; webContentLink?: string } | null> {
  const drive = getDriveClient();
  if (!drive) {
    console.warn('Skipping Google Drive upload: Drive client unavailable.');
    return null;
  }

  try {
    const fileStream = new Readable();
    fileStream.push(params.fileBuffer);
    fileStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: params.fileName,
        parents: [FOLDER_ID]
      },
      media: {
        mimeType: params.mimeType,
        body: fileStream
      },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;
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
    } catch (permErr) {
      console.warn('Could not set public permission on Google Drive file:', permErr);
    }

    return {
      fileId,
      webViewLink: webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink
    };
  } catch (err: any) {
    console.error('Error uploading file to Google Drive:', err);
    return null;
  }
}
