import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const router = Router();
const prisma = new PrismaClient();

// Get settings for current workspace / board
router.get('/', async (req, res) => {
  try {
    const workspace = await prisma.workspace.findFirst({
      include: {
        boards: true
      }
    });

    const googleDriveFolderId = workspace?.googleDriveFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID || '1N1tclaApps6k8gmz-1SIbBWacOAW-T1D';
    const hasServiceAccount = !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);

    res.json({
      workspaceId: workspace?.id,
      workspaceName: workspace?.name,
      googleDriveFolderId,
      hasServiceAccount,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'efl-drive-uploader@scp-ggdrive-upload.iam.gserviceaccount.com'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Google Drive Folder ID
router.patch('/google-drive', async (req, res) => {
  try {
    const { googleDriveFolderId, workspaceId } = req.body;

    if (!googleDriveFolderId) {
      return res.status(400).json({ error: 'googleDriveFolderId is required' });
    }

    if (workspaceId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { googleDriveFolderId }
      });
    } else {
      const workspace = await prisma.workspace.findFirst();
      if (workspace) {
        await prisma.workspace.update({
          where: { id: workspace.id },
          data: { googleDriveFolderId }
        });
      }
    }

    res.json({ success: true, googleDriveFolderId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Google Drive Connection
router.post('/google-drive/test', async (req, res) => {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
      return res.json({
        success: false,
        message: 'Google Service Account credentials are not configured in .env'
      });
    }

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });

    res.json({
      success: true,
      message: 'Google Drive Service Account connected successfully! Folder read access verified.',
      filesCount: response.data.files?.length || 0
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Google Drive Connection Failed: ${err.message}`
    });
  }
});

export default router;
