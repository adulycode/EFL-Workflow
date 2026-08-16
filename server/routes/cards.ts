import { Router } from 'express';
import { PrismaClient, Priority } from '@prisma/client';
import { sendNotification } from '../services/notificationService';

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
    const { columnId, title, description, priority, dueDate, userId, assigneeIds, labelIds } = req.body;

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
        _count: { select: { comments: true } }
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
    const { title, description, priority, dueDate, userId, assigneeIds, labelIds } = req.body;

    const existingCard = await prisma.card.findUnique({
      where: { id },
      include: { assignees: true }
    });

    if (!existingCard) return res.status(404).json({ error: 'Card not found' });

    if (assigneeIds) {
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

    if (labelIds) {
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
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined
      },
      include: {
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        _count: { select: { comments: true } }
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
        labels: { include: { label: true } }
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
        _count: { select: { comments: true } }
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
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        },
        attachments: true
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

    const comment = await prisma.comment.create({
      data: {
        cardId: id,
        userId,
        content: content || '',
        imageUrl: imageUrl || null
      },
      include: { user: true }
    });

    await prisma.activityLog.create({
      data: {
        cardId: id,
        userId,
        actionType: 'ADDED_COMMENT',
        details: {
          preview: (content || '').slice(0, 50),
          hasImage: Boolean(imageUrl)
        }
      }
    });

    emitRealtime(req, 'comment:added', { cardId: id, comment });
    res.json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
