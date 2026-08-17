import { PrismaClient, Role, Priority, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EFL-Workflow database with Multi-Workspace & Checklist support...');

  // 1. Seed 20 Users
  const userSeeds = [
    { email: 'aduly@efl.org', name: 'Aduly Admin (Project Lead)', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', lineUserId: 'U1111111111' },
    { email: 'somchai@efl.org', name: 'Somchai Prasert (Lead Dev)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', lineUserId: 'U2222222222' },
    { email: 'kanya@efl.org', name: 'Kanya Rattana (UI/UX Designer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', lineUserId: 'U3333333333' },
    { email: 'natthaphol@efl.org', name: 'Natthaphol Sukjai (Frontend Dev)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { email: 'chanya@efl.org', name: 'Chanya Boonmee (Backend Dev)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    { email: 'ananda@efl.org', name: 'Ananda Wong (Full-Stack Dev)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { email: 'ploy@efl.org', name: 'Ploy Siriwong (QA Lead)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { email: 'thanawat@efl.org', name: 'Thanawat Chai (DevOps Engineer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { email: 'warunee@efl.org', name: 'Warunee Kaew (Product Owner)', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { email: 'kittisak@efl.org', name: 'Kittisak Somboon (Scrum Master)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
    { email: 'siriporn@efl.org', name: 'Siriporn Thong (Security Analyst)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { email: 'prinya@efl.org', name: 'Prinya Chaiyot (Database Admin)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    { email: 'manat@efl.org', name: 'Manat Saelim (Mobile Developer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
    { email: 'benjarong@efl.org', name: 'Benjarong Srisuk (Data Engineer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
    { email: 'duangjai@efl.org', name: 'Duangjai Prom (Marketing Specialist)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
    { email: 'ekkachai@efl.org', name: 'Ekkachai Ruang (Tech Writer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80' },
    { email: 'faprathan@efl.org', name: 'Faprathan Jinda (Support Engineer)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
    { email: 'gamon@efl.org', name: 'Gamonpan Nu (Business Analyst)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80' },
    { email: 'harit@efl.org', name: 'Harit Petch (System Architect)', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
    { email: 'itsara@efl.org', name: 'Itsara Vong (Cloud Specialist)', role: Role.STAFF, avatarUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&auto=format&fit=crop&q=80' }
  ];

  const users = [];
  for (const u of userSeeds) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, avatarUrl: u.avatarUrl, lineUserId: u.lineUserId },
      create: u
    });
    users.push(user);
  }

  // 2. Seed Default Workspaces
  const defaultWorkspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: 'EFL Core Organization', icon: '🏢', color: '#16a34a', ownerId: users[0].id },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'EFL Core Organization',
      description: 'Primary organization workspace for company-wide cross-functional projects.',
      icon: '🏢',
      color: '#16a34a',
      ownerId: users[0].id
    }
  });

  // Add all 20 users as members of the main workspace
  for (const u of users) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: defaultWorkspace.id, userId: u.id }
      },
      update: { role: u.role === Role.ADMIN ? WorkspaceRole.ADMIN : WorkspaceRole.MEMBER },
      create: {
        workspaceId: defaultWorkspace.id,
        userId: u.id,
        role: u.role === Role.ADMIN ? WorkspaceRole.ADMIN : WorkspaceRole.MEMBER
      }
    });
  }

  // Seed a second workspace owned by Kanya (UI/UX)
  const designWorkspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: { name: 'UI/UX & Product Design Lab', icon: '🎨', color: '#9333ea', ownerId: users[2].id },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'UI/UX & Product Design Lab',
      description: 'Creative design hub for design systems, wireframes, prototypes, and user research.',
      icon: '🎨',
      color: '#9333ea',
      ownerId: users[2].id
    }
  });

  const designMembers = [users[2], users[0], users[1], users[3]];
  for (const dm of designMembers) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: designWorkspace.id, userId: dm.id }
      },
      update: {},
      create: {
        workspaceId: designWorkspace.id,
        userId: dm.id,
        role: dm.id === users[2].id ? WorkspaceRole.OWNER : WorkspaceRole.MEMBER
      }
    });
  }

  // 3. Seed Default Board for Main Workspace
  let board = await prisma.board.findFirst({ where: { workspaceId: defaultWorkspace.id } });
  if (!board) {
    board = await prisma.board.create({
      data: {
        workspaceId: defaultWorkspace.id,
        title: 'Main Sprint Board',
        description: 'Primary Kanban board for sprint execution, feature shipping, and issue tracking.',
        createdById: users[0].id
      }
    });
  }

  // Ensure design workspace also has a board
  let designBoard = await prisma.board.findFirst({ where: { workspaceId: designWorkspace.id } });
  if (!designBoard) {
    designBoard = await prisma.board.create({
      data: {
        workspaceId: designWorkspace.id,
        title: 'Design System & UX Board',
        description: 'Design tasks and prototypes board.',
        createdById: users[2].id
      }
    });

    const defaultCols = ['To Do', 'In Progress', 'Review', 'Done'];
    for (let i = 0; i < defaultCols.length; i++) {
      await prisma.column.create({
        data: {
          boardId: designBoard.id,
          title: defaultCols[i],
          position: (i + 1) * 1000
        }
      });
    }
  }

  // 4. Seed Standard Labels
  const labelSeeds = [
    { name: 'Bug', colorBg: '#fee2e2', colorText: '#dc2626' },
    { name: 'Feature', colorBg: '#dcfce7', colorText: '#16a34a' },
    { name: 'Design', colorBg: '#f3e8ff', colorText: '#9333ea' },
    { name: 'Urgent', colorBg: '#ffedd5', colorText: '#ea580c' },
    { name: 'Infrastructure', colorBg: '#e0f2fe', colorText: '#0284c7' }
  ];

  const labels = [];
  for (const l of labelSeeds) {
    const existing = await prisma.label.findFirst({ where: { name: l.name } });
    if (!existing) {
      const created = await prisma.label.create({ data: l });
      labels.push(created);
    } else {
      labels.push(existing);
    }
  }

  // 5. Seed Columns for Main Board
  const columnTitles = ['To Do', 'In Progress', 'Review', 'Done'];
  const columns = [];

  for (let i = 0; i < columnTitles.length; i++) {
    const title = columnTitles[i];
    let col = await prisma.column.findFirst({
      where: { boardId: board.id, title }
    });

    if (!col) {
      col = await prisma.column.create({
        data: {
          boardId: board.id,
          title,
          position: (i + 1) * 1000
        }
      });
    }
    columns.push(col);
  }

  // 6. Seed Cards with Checklists and Image Comments
  const existingCardsCount = await prisma.card.count({ where: { column: { boardId: board.id } } });
  if (existingCardsCount === 0) {
    const card1 = await prisma.card.create({
      data: {
        columnId: columns[0].id,
        title: 'Design Dark Mode System & Tokens',
        description: 'Implement curated dark theme following WCAG AA contrast rules and refined typography.',
        position: 1000,
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() + 86400000 * 3),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[2].id }, { userId: users[3].id }]
        },
        labels: {
          create: [{ labelId: labels[2].id }, { labelId: labels[1].id }]
        },
        checklists: {
          create: {
            title: 'Design Specs Checklist',
            items: {
              create: [
                { content: 'Verify dark background contrast (minimum 4.5:1 ratio)', isCompleted: true, position: 1000 },
                { content: 'Create semantic token palette in Tailwind', isCompleted: true, position: 2000 },
                { content: 'Inspect all modal and dropdown borders', isCompleted: false, position: 3000 }
              ]
            }
          }
        }
      }
    });

    await prisma.comment.create({
      data: {
        cardId: card1.id,
        userId: users[2].id,
        content: 'Here is the preliminary color contrast mockup for the dark palette:',
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
      }
    });

    const card2 = await prisma.card.create({
      data: {
        columnId: columns[1].id,
        title: 'Integrate LINE Messaging API Flex Messages',
        description: 'Build push notification templates for task assignments and Review/Done column triggers.',
        position: 1000,
        priority: Priority.URGENT,
        dueDate: new Date(Date.now() + 86400000 * 1),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[0].id }, { userId: users[1].id }]
        },
        labels: {
          create: [{ labelId: labels[1].id }, { labelId: labels[3].id }]
        },
        checklists: {
          create: {
            title: 'Integration Checklist',
            items: {
              create: [
                { content: 'Set up LINE Developer Console Channel Access Token', isCompleted: true, position: 1000 },
                { content: 'Build JSON Flex Message Bubble Template', isCompleted: true, position: 2000 },
                { content: 'Test live webhook delivery to mobile app', isCompleted: false, position: 3000 }
              ]
            }
          }
        }
      }
    });

    await prisma.comment.create({
      data: {
        cardId: card2.id,
        userId: users[1].id,
        content: 'Flex message layout is approved by team lead. Ready to test push dispatch.',
        imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80'
      }
    });

    await prisma.card.create({
      data: {
        columnId: columns[2].id,
        title: 'Resend Email Notification Integration',
        description: 'Verify HTML transactional emails for task handoffs to QA and Management.',
        position: 1000,
        priority: Priority.MEDIUM,
        dueDate: new Date(Date.now() + 86400000 * 4),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[4].id }]
        },
        labels: {
          create: [{ labelId: labels[1].id }]
        }
      }
    });

    await prisma.card.create({
      data: {
        columnId: columns[3].id,
        title: 'Dockerize Full-Stack Application for Local Host',
        description: 'Set up multi-stage Dockerfile and docker-compose.yml for isolated deployment.',
        position: 1000,
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() - 86400000 * 1),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[0].id }, { userId: users[6].id }]
        },
        labels: {
          create: [{ labelId: labels[4].id }]
        },
        checklists: {
          create: {
            title: 'Release QA Tasks',
            items: {
              create: [
                { content: 'Build node:20-slim multi-stage image', isCompleted: true, position: 1000 },
                { content: 'Verify port 3010 exposure and CORS', isCompleted: true, position: 2000 },
                { content: 'Test database persistence across container restarts', isCompleted: true, position: 3000 }
              ]
            }
          }
        }
      }
    });
  }

  console.log('Seeding completed successfully! Multi-Workspaces, Boards, Checklists & Image comments ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
