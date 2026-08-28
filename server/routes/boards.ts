import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const emitRealtime = (req: any, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(event, data);
  }
};

// GET Board details with active cards & columns
router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;

    // Run Auto-Archive sweep for columns with autoArchiveDays > 0
    try {
      const autoArchiveCols = await prisma.column.findMany({
        where: {
          autoArchiveDays: { gt: 0 }
        }
      });

      for (const col of autoArchiveCols) {
        if (col.autoArchiveDays && col.autoArchiveDays > 0) {
          const thresholdDate = new Date(Date.now() - col.autoArchiveDays * 24 * 60 * 60 * 1000);
          await prisma.card.updateMany({
            where: {
              columnId: col.id,
              isArchived: false,
              updatedAt: { lte: thresholdDate }
            },
            data: {
              isArchived: true
            }
          });
        }
      }
    } catch (archiveErr) {
      console.error('[AutoArchive Error]', archiveErr);
    }

    const { boardId } = req.query;

    let whereClause: any = {};
    if (boardId) {
      whereClause.id = String(boardId);
    } else if (workspaceId) {
      whereClause.workspaceId = String(workspaceId);
    }

    let board = await prisma.board.findFirst({
      where: whereClause,
      include: {
        workspace: true,
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { isArchived: false },
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: { user: true }
                },
                labels: {
                  include: { label: true }
                },
                checklists: {
                  include: { items: true }
                },
                attachments: true,
                _count: {
                  select: { comments: true, attachments: true }
                }
              }
            }
          }
        }
      }
    });

    // Fallback if no board found for workspace, create one
    if (!board && workspaceId) {
      board = await prisma.board.create({
        data: {
          workspaceId: String(workspaceId),
          title: 'General Board',
          columns: {
            create: [
              { title: 'To Do', position: 1000 },
              { title: 'In Progress', position: 2000 },
              { title: 'Review', position: 3000 },
              { title: 'Done', position: 4000 }
            ]
          }
        },
        include: {
          workspace: true,
          columns: {
            include: {
              cards: {
                where: { isArchived: false },
                include: {
                  assignees: { include: { user: true } },
                  labels: { include: { label: true } },
                  checklists: { include: { items: true } },
                  attachments: true,
                  _count: { select: { comments: true, attachments: true } }
                }
              }
            }
          }
        }
      });
    }

    const labels = await prisma.label.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ board, labels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Archived Cards for a board
router.get('/:id/archived', async (req, res) => {
  try {
    const { id } = req.params;

    const cards = await prisma.card.findMany({
      where: {
        column: { boardId: id },
        isArchived: true
      },
      include: {
        column: true,
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklists: { include: { items: true } },
        attachments: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Column
router.post('/columns', async (req, res) => {
  try {
    const { boardId, title } = req.body;
    if (!boardId || !title) {
      return res.status(400).json({ error: 'boardId and title are required' });
    }

    const lastCol = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });
    const position = lastCol ? lastCol.position + 1000 : 1000;

    const column = await prisma.column.create({
      data: { boardId, title: title.trim(), position },
      include: { cards: true }
    });

    emitRealtime(req, 'column:created', column);
    res.json(column);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update / Rename Column & Settings
router.patch('/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, position, autoArchiveDays } = req.body;

    const column = await prisma.column.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        position: position !== undefined ? position : undefined,
        autoArchiveDays: autoArchiveDays !== undefined ? parseInt(autoArchiveDays) : undefined
      }
    });

    emitRealtime(req, 'column:updated', column);
    res.json(column);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Column
router.delete('/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.card.deleteMany({ where: { columnId: id } });
    await prisma.column.delete({ where: { id } });

    emitRealtime(req, 'column:deleted', { columnId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CUSTOM LABELS CRUD =================

// Create Label
router.post('/labels', async (req, res) => {
  try {
    const { name, colorBg, colorText } = req.body;
    if (!name || !colorBg || !colorText) {
      return res.status(400).json({ error: 'name, colorBg, and colorText are required' });
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        colorBg: colorBg.trim(),
        colorText: colorText.trim()
      }
    });

    emitRealtime(req, 'label:created', label);
    res.json(label);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Label
router.patch('/labels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, colorBg, colorText } = req.body;

    const label = await prisma.label.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        colorBg: colorBg !== undefined ? colorBg.trim() : undefined,
        colorText: colorText !== undefined ? colorText.trim() : undefined
      }
    });

    emitRealtime(req, 'label:updated', label);
    res.json(label);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Label
router.delete('/labels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cardLabel.deleteMany({ where: { labelId: id } });
    await prisma.label.delete({ where: { id } });

    emitRealtime(req, 'label:deleted', { labelId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Board (Title, Description, Icon, Background Theme)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, background } = req.body;

    const board = await prisma.board.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon: icon?.trim() || '📋' }),
        ...(background !== undefined && { background: background?.trim() || 'default' })
      },
      include: {
        workspace: true,
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              where: { isArchived: false },
              include: {
                assignees: { include: { user: true } },
                labels: { include: { label: true } },
                checklists: { include: { items: true } },
                attachments: true,
                _count: { select: { comments: true, attachments: true } }
              }
            }
          }
        }
      }
    });

    emitRealtime(req, 'board:updated', board);
    res.json(board);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Board
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.delete({ where: { id } });
    emitRealtime(req, 'board:deleted', { id, workspaceId: board.workspaceId });
    res.json({ success: true, workspaceId: board.workspaceId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
