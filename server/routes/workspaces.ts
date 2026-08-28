import { Router } from 'express';
import { PrismaClient, WorkspaceRole } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const emitRealtime = (req: any, event: string, data: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit(event, data);
  }
};

// List all workspaces with detailed stats for the Overview Dashboard
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: String(userId) } });
    }

    // Admins have company-wide access to all workspaces
    const isGlobalAdmin = user?.role === 'ADMIN';

    let whereClause: any = {};
    if (userId && !isGlobalAdmin) {
      whereClause = {
        OR: [
          { ownerId: String(userId) },
          { members: { some: { userId: String(userId) } } }
        ]
      };
    }

    let workspaces = await prisma.workspace.findMany({
      where: whereClause,
      include: {
        owner: true,
        members: {
          include: { user: true }
        },
        boards: {
          include: {
            columns: {
              orderBy: { position: 'asc' },
              include: {
                cards: {
                  include: {
                    assignees: { include: { user: true } },
                    labels: { include: { label: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // If 0 workspaces found for a valid user, auto-join them to the default company workspace
    if (workspaces.length === 0 && userId && user) {
      const defaultWorkspace = await prisma.workspace.findFirst({
        include: {
          owner: true,
          members: { include: { user: true } },
          boards: {
            include: {
              columns: {
                orderBy: { position: 'asc' },
                include: {
                  cards: {
                    include: {
                      assignees: { include: { user: true } },
                      labels: { include: { label: true } }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (defaultWorkspace) {
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: defaultWorkspace.id,
              userId: user.id
            }
          },
          update: {},
          create: {
            workspaceId: defaultWorkspace.id,
            userId: user.id,
            role: user.role === 'ADMIN' ? WorkspaceRole.ADMIN : WorkspaceRole.MEMBER
          }
        });

        workspaces = [defaultWorkspace];
      }
    }

    res.json(workspaces);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new Workspace
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, color, ownerId } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Workspace name and ownerId are required' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        icon: icon || '📁',
        color: color || '#16a34a',
        ownerId,
        members: {
          create: [{ userId: ownerId, role: WorkspaceRole.OWNER }]
        },
        boards: {
          create: {
            title: `${name} Main Board`,
            description: `Primary project management board for ${name}.`,
            createdById: ownerId,
            columns: {
              create: [
                { title: 'To Do', position: 1000 },
                { title: 'In Progress', position: 2000 },
                { title: 'Review', position: 3000 },
                { title: 'Done', position: 4000 }
              ]
            }
          }
        }
      },
      include: {
        owner: true,
        members: { include: { user: true } },
        boards: {
          include: {
            columns: {
              include: {
                cards: {
                  include: {
                    assignees: { include: { user: true } },
                    labels: { include: { label: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    emitRealtime(req, 'workspace:created', workspace);
    res.json(workspace);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite member
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: id, userId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId,
        role: role || WorkspaceRole.MEMBER
      },
      include: { user: true }
    });

    emitRealtime(req, 'workspace:member_added', { workspaceId: id, member });
    res.json(member);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite multiple members at once (Batch Invite)
router.post('/:id/invite-batch', async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, role } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    const createdMembers = [];
    for (const userId of userIds) {
      const existing = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: id, userId }
        }
      });

      if (!existing) {
        const member = await prisma.workspaceMember.create({
          data: {
            workspaceId: id,
            userId,
            role: role || WorkspaceRole.MEMBER
          },
          include: { user: true }
        });
        createdMembers.push(member);
        emitRealtime(req, 'workspace:member_added', { workspaceId: id, member });
      }
    }

    res.json({ success: true, count: createdMembers.length, members: createdMembers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (workspace?.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId: id, userId }
      }
    });

    emitRealtime(req, 'workspace:member_removed', { workspaceId: id, userId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Workspace (Cascades to all boards, columns, and cards)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.workspace.delete({ where: { id } });
    emitRealtime(req, 'workspace:deleted', { workspaceId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
