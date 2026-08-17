import { Router } from 'express';
import { PrismaClient, Priority } from '@prisma/client';
import { sendNotification } from '../services/notificationService';
import { uploadToGoogleDrive } from '../services/googleDrive';

const router = Router();
const prisma = new PrismaClient();

const emitRealtime = (req: any, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(event, data);
  }
};

// Create Card
router.post('/', async (req, res) => {
  try {
    const { columnId, title, description, priority, dueDate, coverColor, coverImage, userId, assigneeIds, labelIds } = req.body;

    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    const position = lastCard ? lastCard.position + 1000 : 1000;

    const card = await prisma.card.create({
      data: {
        columnId,
        title,
        description,
        priority: priority || Priority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        coverColor: coverColor || null,
        coverImage: coverImage || null,
        createdById: userId,
        position,
        assignees: assigneeIds && assigneeIds.length > 0 ? {
          create: assigneeIds.map((uid: string) => ({ userId: uid }))
        } : undefined,
        labels: labelIds && labelIds.length > 0 ? {
          create: labelIds.map((lid: string) => ({ labelId: lid }))
        } : undefined
      },
      include: {
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        attachments: true,
        _count: { select: { comments: true, attachments: true } }
      }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: card.id,
          userId,
          actionType: 'CREATED_CARD',
          details: { title: card.title }
        }
      });
    }

    if (card.assignees && card.assignees.length > 0) {
      for (const a of card.assignees) {
        if (a.user.id !== userId) {
          sendNotification({
            userId: a.user.id,
            email: a.user.email,
            lineUserId: a.user.lineUserId || undefined,
            title: `New Task Assigned: "${card.title}"`,
            message: `You were assigned to "${card.title}". Priority: ${card.priority}`,
            cardId: card.id,
            actionType: 'ASSIGNED_USER'
          });
        }
      }
    }

    emitRealtime(req, 'card:created', card);
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Card
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, coverColor, coverImage, userId, assigneeIds, labelIds } = req.body;

    const existingCard = await prisma.card.findUnique({
      where: { id },
      include: { assignees: true }
    });

    if (!existingCard) return res.status(404).json({ error: 'Card not found' });

    if (assigneeIds !== undefined) {
      await prisma.cardAssignee.deleteMany({ where: { cardId: id } });
      if (assigneeIds.length > 0) {
        await prisma.cardAssignee.createMany({
          data: assigneeIds.map((uid: string) => ({ cardId: id, userId: uid }))
        });

        const newlyAssigned = assigneeIds.filter(
          (uid: string) => !existingCard.assignees.some((a) => a.userId === uid)
        );

        for (const newUid of newlyAssigned) {
          const user = await prisma.user.findUnique({ where: { id: newUid } });
          if (user) {
            sendNotification({
              userId: user.id,
              email: user.email,
              lineUserId: user.lineUserId || undefined,
              title: `Task Assigned: "${title || existingCard.title}"`,
              message: `You have been assigned to task "${title || existingCard.title}".`,
              cardId: id,
              actionType: 'ASSIGNED_USER'
            });
          }
        }
      }
    }

    if (labelIds !== undefined) {
      await prisma.cardLabel.deleteMany({ where: { cardId: id } });
      if (labelIds.length > 0) {
        await prisma.cardLabel.createMany({
          data: labelIds.map((lid: string) => ({ cardId: id, labelId: lid }))
        });
      }
    }

    const updated = await prisma.card.update({
      where: { id },
      data: {
        title,
        description,
        priority: priority ? (priority as Priority) : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        coverColor: coverColor !== undefined ? coverColor : undefined,
        coverImage: coverImage !== undefined ? coverImage : undefined
      },
      include: {
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        attachments: true,
        _count: { select: { comments: true, attachments: true } }
      }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: 'UPDATED_CARD',
          details: { title: updated.title }
        }
      });
    }

    emitRealtime(req, 'card:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Archive / Restore Card
router.post('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchived, userId } = req.body;

    const targetStatus = isArchived !== undefined ? Boolean(isArchived) : true;

    const updated = await prisma.card.update({
      where: { id },
      data: { isArchived: targetStatus },
      include: {
        column: true,
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        attachments: true
      }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: targetStatus ? 'ARCHIVED_CARD' : 'RESTORED_CARD',
          details: { title: updated.title }
        }
      });
    }

    emitRealtime(req, 'card:archived', { cardId: id, isArchived: targetStatus, updated });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Move Card
router.post('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, position, userId } = req.body;

    const oldCard = await prisma.card.findUnique({
      where: { id },
      include: {
        column: true,
        assignees: { include: { user: true } }
      }
    });

    if (!oldCard) return res.status(404).json({ error: 'Card not found' });

    const targetColumn = await prisma.column.findUnique({ where: { id: columnId } });
    const isColumnChanged = oldCard.columnId !== columnId;

    const updated = await prisma.card.update({
      where: { id },
      data: { columnId, position },
      include: {
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        attachments: true,
        _count: { select: { comments: true, attachments: true } }
      }
    });

    if (isColumnChanged && targetColumn) {
      if (userId) {
        await prisma.activityLog.create({
          data: {
            cardId: id,
            userId,
            actionType: 'MOVED_COLUMN',
            details: {
              fromColumn: oldCard.column.title,
              toColumn: targetColumn.title
            }
          }
        });
      }

      if (['Review', 'Done'].includes(targetColumn.title)) {
        for (const a of oldCard.assignees) {
          sendNotification({
            userId: a.user.id,
            email: a.user.email,
            lineUserId: a.user.lineUserId || undefined,
            title: `Task Moved to [${targetColumn.title}]`,
            message: `Task "${updated.title}" has been moved from "${oldCard.column.title}" to "${targetColumn.title}".`,
            cardId: id,
            actionType: 'MOVED_COLUMN'
          });
        }
      }
    }

    emitRealtime(req, 'card:moved', { cardId: id, columnId, position, updated });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Card
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.card.delete({ where: { id } });
    emitRealtime(req, 'card:deleted', { cardId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Card Details
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        column: true,
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: {
          include: {
            items: { orderBy: { position: 'asc' } }
          },
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content, imageUrl } = req.body;

    let finalUserId = userId;
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst();
      finalUserId = firstUser?.id;
    }

    if (!finalUserId) {
      return res.status(400).json({ error: 'Valid user is required to post comment' });
    }

    const comment = await prisma.comment.create({
      data: {
        cardId: id,
        userId: finalUserId,
        content: content || '',
        imageUrl: imageUrl || null
      },
      include: { user: true }
    });

    if (finalUserId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId: finalUserId,
          actionType: 'ADDED_COMMENT',
          details: {
            preview: (content || '').slice(0, 50),
            hasImage: Boolean(imageUrl)
          }
        }
      });
    }

    emitRealtime(req, 'comment:added', { cardId: id, comment });
    res.json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ATTACHMENTS CRUD =================

// Add Attachment (Files, PDFs, Images, Documents, Google Drive)
router.post('/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileUrl, fileType, fileSize, userId } = req.body;

    if (!fileName || !fileUrl) {
      return res.status(400).json({ error: 'fileName and fileUrl are required' });
    }

    let finalFileUrl = fileUrl;
    let finalFileType = fileType || 'application/octet-stream';

    // If file is uploaded as Base64 data URL, upload directly to central Google Drive folder
    if (fileUrl.startsWith('data:')) {
      try {
        const matches = fileUrl.match(/^data:([A-Za-z-+\/0-9.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mime = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          
          const driveResult = await uploadToGoogleDrive({
            fileName: fileName,
            mimeType: mime,
            fileBuffer: buffer
          });

          if (driveResult && driveResult.webViewLink) {
            finalFileUrl = driveResult.webViewLink;
            finalFileType = 'googledrive/file';
          }
        }
      } catch (driveErr) {
        console.error('Failed to upload to Google Drive, saving original link:', driveErr);
      }
    }

    const attachment = await prisma.attachment.create({
      data: {
        cardId: id,
        fileName,
        fileUrl: finalFileUrl,
        fileType: finalFileType,
        fileSize: fileSize || 0
      }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: 'ADDED_ATTACHMENT',
          details: { fileName: attachment.fileName, isGoogleDrive: finalFileUrl.includes('drive.google.com') }
        }
      });
    }

    emitRealtime(req, 'attachment:created', { cardId: id, attachment });
    res.json(attachment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Attachment
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    await prisma.attachment.delete({ where: { id: attachmentId } });

    emitRealtime(req, 'attachment:deleted', { cardId: id, attachmentId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CHECKLISTS CRUD =================

// Create Checklist
router.post('/:id/checklists', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, userId } = req.body;

    const checklist = await prisma.checklist.create({
      data: {
        cardId: id,
        title: (title || 'Checklist').trim()
      },
      include: { items: true }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: 'ADDED_CHECKLIST',
          details: { title: checklist.title }
        }
      });
    }

    emitRealtime(req, 'checklist:created', { cardId: id, checklist });
    res.json(checklist);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Checklist
router.delete('/:id/checklists/:checklistId', async (req, res) => {
  try {
    const { id, checklistId } = req.params;

    await prisma.checklistItem.deleteMany({ where: { checklistId } });
    await prisma.checklist.delete({ where: { id: checklistId } });

    emitRealtime(req, 'checklist:deleted', { cardId: id, checklistId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Item to Checklist
router.post('/:id/checklists/:checklistId/items', async (req, res) => {
  try {
    const { id, checklistId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'content is required' });

    const lastItem = await prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { position: 'desc' }
    });
    const position = lastItem ? lastItem.position + 1000 : 1000;

    const item = await prisma.checklistItem.create({
      data: {
        checklistId,
        content: content.trim(),
        position
      }
    });

    emitRealtime(req, 'checklist_item:created', { cardId: id, checklistId, item });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Checklist Item (toggle checkbox or rename content)
router.patch('/:id/checklists/:checklistId/items/:itemId', async (req, res) => {
  try {
    const { id, checklistId, itemId } = req.params;
    const { isCompleted, content } = req.body;

    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();
    if (isCompleted !== undefined) {
      updateData.isCompleted = Boolean(isCompleted);
      updateData.completedAt = Boolean(isCompleted) ? new Date() : null;
    }

    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData
    });

    emitRealtime(req, 'checklist_item:updated', { cardId: id, checklistId, item });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Checklist Item
router.delete('/:id/checklists/:checklistId/items/:itemId', async (req, res) => {
  try {
    const { id, checklistId, itemId } = req.params;

    await prisma.checklistItem.delete({ where: { id: itemId } });

    emitRealtime(req, 'checklist_item:deleted', { cardId: id, checklistId, itemId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
