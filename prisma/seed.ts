import { PrismaClient, Role, Priority, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

const TEAM_MEMBERS = [
  { name: 'Aduly Admin (Project Lead)', email: 'aduly@efl.org', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', lineUserId: 'U1234567890abcdef' },
  { name: 'Somchai Prasert (Dev Lead)', email: 'somchai@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', lineUserId: 'U2234567890abcdef' },
  { name: 'Kanya Thongbai (UI/UX Designer)', email: 'kanya@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', lineUserId: 'U3234567890abcdef' },
  { name: 'Anan Suksamran (Frontend Dev)', email: 'anan@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Ploy Siriwong (QA Engineer)', email: 'ploy@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Nat Phromma (Backend Dev)', email: 'nat@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Chatchai V (DevOps)', email: 'chatchai@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Boonmee Wong (Product Owner)', email: 'boonmee@efl.org', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Pitchaya S (Content Writer)', email: 'pitchaya@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Teerapat R (Data Analyst)', email: 'teerapat@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Warunee M (HR / People Ops)', email: 'warunee@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Sarawut K (Full Stack Dev)', email: 'sarawut@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Pimchanok L (Customer Success)', email: 'pimchanok@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Worawat C (Security Engineer)', email: 'worawat@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Sudarat T (Marketing Specialist)', email: 'sudarat@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Kornkamol P (Technical Writer)', email: 'kornkamol@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171edd26a0d?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Danai J (Operations Manager)', email: 'danai@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Sunisa N (Frontend Dev)', email: 'sunisa@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Prasert B (System Architect)', email: 'prasert@efl.org', role: Role.ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80', lineUserId: '' },
  { name: 'Nutthawut D (Mobile Developer)', email: 'nutthawut@efl.org', role: Role.MEMBER, avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80', lineUserId: '' }
];

const LABELS = [
  { name: 'Bug Fix', colorBg: '#FEE2E2', colorText: '#991B1B' },
  { name: 'Feature', colorBg: '#DCFCE7', colorText: '#166534' },
  { name: 'Design', colorBg: '#F3E8FF', colorText: '#6B21A8' },
  { name: 'Urgent', colorBg: '#FFEDD5', colorText: '#9A3412' },
  { name: 'Infrastructure', colorBg: '#E0F2FE', colorText: '#075985' }
];

async function main() {
  console.log('Seeding EFL-Workflow database with Multi-Workspace support...');

  // 1. Create 20 Team Users
  const users = [];
  for (const u of TEAM_MEMBERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, avatarUrl: u.avatarUrl, lineUserId: u.lineUserId },
      create: u
    });
    users.push(user);
  }

  // 2. Create Labels
  const labels = [];
  for (const l of LABELS) {
    const existing = await prisma.label.findFirst({ where: { name: l.name } });
    if (existing) {
      labels.push(existing);
    } else {
      const created = await prisma.label.create({ data: l });
      labels.push(created);
    }
  }

  // 3. Create Default Workspace: "EFL Core Organization" (Owned by Aduly Admin)
  let mainWorkspace = await prisma.workspace.findFirst({ where: { name: 'EFL Core Organization' } });
  if (!mainWorkspace) {
    mainWorkspace = await prisma.workspace.create({
      data: {
        name: 'EFL Core Organization',
        description: 'Primary organization workspace for company-wide cross-functional projects.',
        icon: '🏢',
        color: '#16a34a',
        ownerId: users[0].id,
        members: {
          create: users.map((u, index) => ({
            userId: u.id,
            role: index === 0 ? WorkspaceRole.OWNER : (u.role === Role.ADMIN ? WorkspaceRole.ADMIN : WorkspaceRole.MEMBER)
          }))
        }
      }
    });
  }

  // Create Secondary Workspace: "UI/UX & Product Design Lab" (Owned by Kanya)
  let designWorkspace = await prisma.workspace.findFirst({ where: { name: 'UI/UX & Product Design Lab' } });
  if (!designWorkspace) {
    designWorkspace = await prisma.workspace.create({
      data: {
        name: 'UI/UX & Product Design Lab',
        description: 'Creative design hub for design systems, wireframes, prototypes, and user research.',
        icon: '🎨',
        color: '#9333ea',
        ownerId: users[2].id, // Kanya
        members: {
          create: [
            { userId: users[2].id, role: WorkspaceRole.OWNER },
            { userId: users[0].id, role: WorkspaceRole.ADMIN },
            { userId: users[3].id, role: WorkspaceRole.MEMBER },
            { userId: users[1].id, role: WorkspaceRole.MEMBER }
          ]
        }
      }
    });
  }

  // 4. Create Main Board inside Workspace
  let board = await prisma.board.findFirst({ where: { workspaceId: mainWorkspace.id } });
  if (!board) {
    board = await prisma.board.create({
      data: {
        workspaceId: mainWorkspace.id,
        title: 'EFL Sprint & Delivery Board',
        description: 'Main project tracking board for the EFL organization team.',
        createdById: users[0].id
      }
    });
  }

  // Create Design Board in Design Workspace
  let designBoard = await prisma.board.findFirst({ where: { workspaceId: designWorkspace.id } });
  if (!designBoard) {
    designBoard = await prisma.board.create({
      data: {
        workspaceId: designWorkspace.id,
        title: 'Design System & Component Library',
        description: 'Design tokens and component prototypes.',
        createdById: users[2].id
      }
    });

    // Create Columns for Design Board
    const cols = ['Ideas & Inspo', 'In Figma', 'Review with Eng', 'Shipped'];
    for (let i = 0; i < cols.length; i++) {
      await prisma.column.create({
        data: {
          boardId: designBoard.id,
          title: cols[i],
          position: (i + 1) * 1000
        }
      });
    }
  }

  // 5. Create Columns for Main Board
  const defaultColumns = ['To Do', 'In Progress', 'Review', 'Done'];
  const columns = [];
  for (let i = 0; i < defaultColumns.length; i++) {
    const title = defaultColumns[i];
    let col = await prisma.column.findFirst({ where: { boardId: board.id, title } });
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

  // 6. Seed Cards with sample comments and attached image
  const existingCardsCount = await prisma.card.count({ where: { column: { boardId: board.id } } });
  if (existingCardsCount === 0) {
    const card1 = await prisma.card.create({
      data: {
        columnId: columns[0].id,
        title: 'Design Dark Mode System & Tokens',
        description: 'Implement curated dark theme following WCAG AA contrast rules and refined typography.',
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() + 86400000 * 3),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[2].id }, { userId: users[3].id }]
        },
        labels: {
          create: [{ labelId: labels[2].id }, { labelId: labels[1].id }]
        }
      }
    });

    // Add Comment with sample Image Attachment
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
        priority: Priority.URGENT,
        dueDate: new Date(Date.now() + 86400000 * 1),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[0].id }, { userId: users[1].id }]
        },
        labels: {
          create: [{ labelId: labels[1].id }, { labelId: labels[3].id }]
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
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() - 86400000 * 1),
        createdById: users[0].id,
        assignees: {
          create: [{ userId: users[0].id }, { userId: users[6].id }]
        },
        labels: {
          create: [{ labelId: labels[4].id }]
        }
      }
    });
  }

  console.log('Seeding completed successfully! Multi-Workspaces, Boards & Image comments ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
