import { Router } from 'express';
import { PrismaClient, Priority } from '@prisma/client';
import { sendNotification } from '../services/notificationService';
import { uploadToGoogleDrive } from '../services/googleDrive';
import { notifyAgentOffice } from '../services/agentOfficeSync';

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
    const { columnId, title, description, priority, dueDate, coverColor, coverImage, icon, coverBanner, userId, assigneeIds, labelIds } = req.body;

    const lastCard = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    });
    const position = lastCard ? lastCard.position + 1000 : 1000;

    // Auto-assign the creator by default if no assignees specified
    const effectiveAssigneeIds = (assigneeIds && assigneeIds.length > 0)
      ? assigneeIds
      : (userId ? [userId] : []);

    const card = await prisma.card.create({
      data: {
        columnId,
        title,
        description,
        priority: priority || Priority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        coverColor: coverColor || null,
        coverImage: coverImage || null,
        icon: icon || '📝',
        coverBanner: coverBanner || null,
        createdById: userId,
        position,
        assignees: effectiveAssigneeIds.length > 0 ? {
          create: effectiveAssigneeIds.map((uid: string) => ({ userId: uid, type: 'ASSIGNEE' }))
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

    notifyAgentOffice({
      agentId: 'cloud',
      status: 'CODING',
      task: `Created Card: ${card.title}`
    });

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
    const { title, description, priority, dueDate, coverColor, coverImage, icon, coverBanner, userId, assigneeIds, assigneesData, labelIds } = req.body;

    const existingCard = await prisma.card.findUnique({
      where: { id },
      include: { assignees: true }
    });

    if (!existingCard) return res.status(404).json({ error: 'Card not found' });

    // Handle Stakeholders (Assignees, Report To, FYI)
    if (assigneesData !== undefined || assigneeIds !== undefined) {
      await prisma.cardAssignee.deleteMany({ where: { cardId: id } });

      let recordsToCreate: Array<{ cardId: string; userId: string; type: string }> = [];

      if (Array.isArray(assigneesData)) {
        recordsToCreate = assigneesData.map((item: any) => ({
          cardId: id,
          userId: typeof item === 'string' ? item : item.userId,
          type: typeof item === 'object' && item.type ? item.type : 'ASSIGNEE'
        }));
      } else if (Array.isArray(assigneeIds)) {
        recordsToCreate = assigneeIds.map((uid: string) => ({
          cardId: id,
          userId: uid,
          type: 'ASSIGNEE'
        }));
      }

      if (recordsToCreate.length > 0) {
        await prisma.cardAssignee.createMany({
          data: recordsToCreate
        });

        // Trigger notifications for new stakeholders
        const { sendStakeholderNotifications } = await import('../services/notificationService');
        for (const item of recordsToCreate) {
          const wasAlreadyAssigned = existingCard.assignees.some(
            (a) => a.userId === item.userId && a.type === item.type
          );
          if (!wasAlreadyAssigned && item.userId !== userId) {
            sendStakeholderNotifications({
              cardId: id,
              actorUserId: userId,
              type: item.type === 'REPORT_TO' ? 'REPORT_TO_ASSIGNED' : item.type === 'FYI' ? 'FYI_ASSIGNED' : 'COLUMN_MOVED',
              actionSummary: `คุณได้รับมอบหมายในงาน "${title || existingCard.title}"`
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
        coverImage: coverImage !== undefined ? coverImage : undefined,
        icon: icon !== undefined ? icon : undefined,
        coverBanner: coverBanner !== undefined ? coverBanner : undefined
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
        column: {
          include: {
            board: {
              include: { workspace: true }
            }
          }
        },
        assignees: { include: { user: true } }
      }
    });

    if (!oldCard) return res.status(404).json({ error: 'Card not found' });

    // Option 1 Security: Staff can only move cards they created or are assigned to; Admins/Owners can move any card
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isAdmin = user?.role === 'ADMIN';
      const isOwner = oldCard.column.board.workspace.ownerId === userId;
      const isCreator = oldCard.createdById === userId;
      const isAssigned = oldCard.assignees.some((a) => a.userId === userId);

      if (!isAdmin && !isOwner && !isCreator && !isAssigned) {
        return res.status(403).json({
          error: 'คุณไม่มีสิทธิ์ย้ายการ์ดนี้ (สามารถย้ายได้เฉพาะการ์ดที่ตนเองสร้างหรือได้รับมอบหมายเท่านั้น)'
        });
      }
    }

    const targetColumn = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { workspace: true }
        }
      }
    });

    const isColumnChanged = oldCard.columnId !== columnId;
    const isCrossBoard = targetColumn && oldCard.column.boardId !== targetColumn.boardId;

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
      const { sendStakeholderNotifications } = await import('../services/notificationService');

      if (isCrossBoard) {
        // Cross-board or cross-workspace move
        if (userId) {
          await prisma.activityLog.create({
            data: {
              cardId: id,
              userId,
              actionType: 'MOVED_BOARD',
              details: {
                fromBoard: oldCard.column.board.title,
                toBoard: targetColumn.board.title,
                fromColumn: oldCard.column.title,
                toColumn: targetColumn.title,
                fromWorkspace: oldCard.column.board.workspace.name,
                toWorkspace: targetColumn.board.workspace.name
              }
            }
          });
        }

        const actionSummary = `📦 ย้ายการ์ดงานจากบอร์ด [${oldCard.column.board.title}] ไปยังบอร์ด [${targetColumn.board.title}] (คอลัมน์ [${targetColumn.title}])`;
        sendStakeholderNotifications({
          cardId: id,
          actorUserId: userId,
          type: 'BOARD_MOVED',
          actionSummary
        });
      } else {
        // Normal column move within the same board
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

        const isDone = /done|เสร็จ|complete|finish|success/i.test(targetColumn.title);
        const isReview = /review|ตรวจ|อนุมัติ|approve/i.test(targetColumn.title);

        const actionSummary = isDone
          ? `🎉 การ์ดงานนี้ดำเนินการเสร็จสิ้นแล้ว (ย้ายไปยัง [${targetColumn.title}])`
          : isReview
          ? `🚀 ส่งตรวจงาน (ย้ายไปยัง [${targetColumn.title}])`
          : `ย้ายการ์ดงานจาก [${oldCard.column.title}] ไปยัง [${targetColumn.title}]`;

        sendStakeholderNotifications({
          cardId: id,
          actorUserId: userId,
          type: 'COLUMN_MOVED',
          actionSummary
        });
      }
    }

    emitRealtime(req, 'card:moved', { cardId: id, columnId, position, updated });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Move Cards
router.post('/batch-move', async (req, res) => {
  try {
    const { cardIds, columnId, position, userId } = req.body;

    if (!Array.isArray(cardIds) || cardIds.length === 0 || !columnId) {
      return res.status(400).json({ error: 'cardIds and columnId are required' });
    }

    const targetColumn = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { workspace: true }
        }
      }
    });

    if (!targetColumn) {
      return res.status(404).json({ error: 'Target column not found' });
    }

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    const isAdmin = user?.role === 'ADMIN';

    const cards = await prisma.card.findMany({
      where: { id: { in: cardIds } },
      include: {
        column: {
          include: {
            board: {
              include: { workspace: true }
            }
          }
        },
        assignees: true
      }
    });

    let movedCount = 0;
    const { sendStakeholderNotifications } = await import('../services/notificationService');

    for (const card of cards) {
      const isOwner = card.column.board.workspace.ownerId === userId;
      const isCreator = card.createdById === userId;
      const isAssigned = card.assignees.some((a) => a.userId === userId);

      if (!isAdmin && !isOwner && !isCreator && !isAssigned) {
        continue;
      }

      const isCrossBoard = card.column.boardId !== targetColumn.boardId;
      const cardPosition = position === 'top' ? 100 : 999999 + movedCount * 10;

      await prisma.card.update({
        where: { id: card.id },
        data: { columnId, position: cardPosition }
      });

      movedCount++;

      if (isCrossBoard) {
        if (userId) {
          await prisma.activityLog.create({
            data: {
              cardId: card.id,
              userId,
              actionType: 'MOVED_BOARD',
              details: {
                fromBoard: card.column.board.title,
                toBoard: targetColumn.board.title,
                fromColumn: card.column.title,
                toColumn: targetColumn.title,
                fromWorkspace: card.column.board.workspace.name,
                toWorkspace: targetColumn.board.workspace.name
              }
            }
          });
        }
        sendStakeholderNotifications({
          cardId: card.id,
          actorUserId: userId,
          type: 'BOARD_MOVED',
          actionSummary: `📦 ย้ายการ์ดงานเป็นชุดจากบอร์ด [${card.column.board.title}] ไปยังบอร์ด [${targetColumn.board.title}] (คอลัมน์ [${targetColumn.title}])`
        });
      } else if (card.columnId !== columnId) {
        if (userId) {
          await prisma.activityLog.create({
            data: {
              cardId: card.id,
              userId,
              actionType: 'MOVED_COLUMN',
              details: {
                fromColumn: card.column.title,
                toColumn: targetColumn.title
              }
            }
          });
        }
      }
    }

    emitRealtime(req, 'cards:batch-moved', { cardIds, columnId });
    res.json({ success: true, count: movedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Archive Cards
router.post('/batch-archive', async (req, res) => {
  try {
    const { cardIds, userId } = req.body;
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'cardIds are required' });
    }

    await prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { isArchived: true }
    });

    emitRealtime(req, 'cards:batch-archived', { cardIds });
    res.json({ success: true, count: cardIds.length });
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
        column: {
          include: {
            board: {
              include: { workspace: true }
            }
          }
        },
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

    // Trigger Smart Stakeholder Notifications (Assignees, Report To, FYI)
    const { sendStakeholderNotifications } = await import('../services/notificationService');
    sendStakeholderNotifications({
      cardId: id,
      actorUserId: finalUserId,
      type: 'COMMENT',
      comment: { content, imageUrl }
    });

    emitRealtime(req, 'comment:added', { cardId: id, comment });
    res.json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update/Edit Comment
router.patch('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { content, userId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (userId) {
      const requester = await prisma.user.findUnique({ where: { id: userId } });
      const isOwner = existingComment.userId === userId;
      const isAdmin = requester?.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'You do not have permission to edit this comment' });
      }
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { user: true }
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: 'EDITED_COMMENT',
          details: { preview: (content || '').slice(0, 50) }
        }
      });
    }

    emitRealtime(req, 'comment:updated', { cardId: id, comment: updated });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Comment
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = (req.query as { userId?: string }) || (req.body as { userId?: string }) || {};

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (userId) {
      const requester = await prisma.user.findUnique({ where: { id: userId } });
      const isOwner = existingComment.userId === userId;
      const isAdmin = requester?.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'You do not have permission to delete this comment' });
      }
    }

    await prisma.comment.delete({ where: { id: commentId } });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          cardId: id,
          userId,
          actionType: 'DELETED_COMMENT',
          details: { preview: (existingComment.content || '').slice(0, 50) }
        }
      });
    }

    emitRealtime(req, 'comment:deleted', { cardId: id, commentId });
    res.json({ success: true, commentId });
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
