import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get board data with columns, cards, assignees, and labels
router.get('/', async (req, res) => {
  try {
    let board = await prisma.board.findFirst({
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
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

    const labels = await prisma.label.findMany();

    res.json({ board, labels });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Column
router.post('/columns', async (req, res) => {
  try {
    const { boardId, title } = req.body;
    const lastCol = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });
    const position = lastCol ? lastCol.position + 1000 : 1000;

    const column = await prisma.column.create({
      data: { boardId, title, position }
    });

    res.json(column);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
