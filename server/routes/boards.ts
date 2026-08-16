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

// Get board data by workspaceId or first available board
router.get('/', async (req, res) => {
  try {
    const { workspaceId, boardId } = req.query;

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
                  _count: { select: { comments: true, attachments: true } }
                }
              }
            }
          }
        }
      });
    }

    const labels = await prisma.label.findMany();

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
        labels: { include: { label: true } }
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

// Update / Rename Column
router.patch('/columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, position } = req.body;

    const column = await prisma.column.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        position: position !== undefined ? position : undefined
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

export default router;
