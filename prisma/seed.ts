import { PrismaClient, Role, Priority, WorkspaceRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EFL-Workflow database with clean Admin user & Starter Workspace...');

  // 1. Seed Clean Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'adulnp@gmail.com' },
    update: {
      name: 'Admin System (reyz)',
      role: Role.ADMIN,
      jobTitle: 'System Administrator (ดูแลระบบ)',
      isAssignable: false
    },
    create: {
      email: 'adulnp@gmail.com',
      name: 'Admin System (reyz)',
      role: Role.ADMIN,
      jobTitle: 'System Administrator (ดูแลระบบ)',
      isAssignable: false,
      language: 'th',
      theme: 'dark'
    }
  });

  // Clean up any legacy dummy mockup users
  const mockEmails = [
    'aduly@efl.org',
    'sanhomefl@gmail.com',
    'somchai@efl.org', 'kanya@efl.org', 'natthaphol@efl.org', 'chanya@efl.org',
    'ananda@efl.org', 'ploy@efl.org', 'thanawat@efl.org', 'warunee@efl.org',
    'kittisak@efl.org', 'siriporn@efl.org', 'prinya@efl.org', 'manat@efl.org',
    'benjarong@efl.org', 'duangjai@efl.org', 'ekkachai@efl.org', 'faprathan@efl.org',
    'gamon@efl.org', 'harit@efl.org', 'itsara@efl.org'
  ];

  await prisma.user.deleteMany({
    where: {
      email: { in: mockEmails }
    }
  });

  // 2. Seed Default Core Workspace
  const defaultWorkspace = await prisma.workspace.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: { name: 'EFL Core Organization', icon: '🏢', color: '#16a34a', ownerId: adminUser.id },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'EFL Core Organization',
      description: 'Primary organization workspace for staff task management and workflows.',
      icon: '🏢',
      color: '#16a34a',
      ownerId: adminUser.id
    }
  });

  // Add Admin as OWNER/ADMIN of workspace
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId: defaultWorkspace.id, userId: adminUser.id }
    },
    update: { role: WorkspaceRole.OWNER },
    create: {
      workspaceId: defaultWorkspace.id,
      userId: adminUser.id,
      role: WorkspaceRole.OWNER
    }
  });

  // 3. Seed Default Board
  let board = await prisma.board.findFirst({ where: { workspaceId: defaultWorkspace.id } });
  if (!board) {
    board = await prisma.board.create({
      data: {
        workspaceId: defaultWorkspace.id,
        title: 'Staff Task Board',
        description: 'Primary Kanban board for staff work logging and progress tracking.',
        createdById: adminUser.id
      }
    });
  }

  // 4. Seed Standard Columns
  const columnDefs = [
    { title: 'Backlog & Requests', position: 1000 },
    { title: 'In Progress (กำลังทำ)', position: 2000 },
    { title: 'Under Review (รอตรวจ)', position: 3000 },
    { title: 'Completed (เสร็จสิ้น)', position: 4000 }
  ];

  const columns = [];
  for (const c of columnDefs) {
    let col = await prisma.column.findFirst({
      where: { boardId: board.id, title: c.title }
    });
    if (!col) {
      col = await prisma.column.create({
        data: {
          boardId: board.id,
          title: c.title,
          position: c.position
        }
      });
    }
    columns.push(col);
  }

  // 5. Seed Standard Labels ONLY on initial empty database
  const existingLabelsCount = await prisma.label.count();
  if (existingLabelsCount === 0) {
    const labelDefs = [
      { name: 'Feature', colorBg: '#dcfce7', colorText: '#15803d' },
      { name: 'Urgent Bug', colorBg: '#fee2e2', colorText: '#b91c1c' },
      { name: 'Design / UX', colorBg: '#f3e8ff', colorText: '#7e22ce' },
      { name: 'Operations', colorBg: '#fef3c7', colorText: '#b45309' },
      { name: 'DevOps / Infra', colorBg: '#e0e7ff', colorText: '#4338ca' }
    ];

    for (const l of labelDefs) {
      await prisma.label.create({
        data: {
          name: l.name,
          colorBg: l.colorBg,
          colorText: l.colorText
        }
      });
    }
  }

  // 6. Clean Starter Cards
  const existingCardsCount = await prisma.card.count({ where: { columnId: { in: columns.map(c => c.id) } } });
  if (existingCardsCount === 0) {
    const card1 = await prisma.card.create({
      data: {
        columnId: columns[0].id,
        title: 'ยินดีต้อนรับสู่ EFL Workflow',
        description: 'ระบบบันทึกและจัดการงานสำหรับทีมพนักงาน เชื่อมต่อระบบ SSO เรียบร้อยแล้ว',
        position: 1000,
        priority: Priority.MEDIUM,
        createdById: adminUser.id,
        assignees: {
          create: [{ userId: adminUser.id }]
        },
        labels: {
          create: [{ labelId: labels[0].id }]
        },
        checklists: {
          create: {
            title: 'เริ่มต้นการใช้งาน',
            items: {
              create: [
                { content: 'เข้าสู่ระบบด้วย EFL Central SSO', isCompleted: true, position: 1000 },
                { content: 'สร้างการ์ดงานและกำหนด Due Date', isCompleted: false, position: 2000 },
                { content: 'ลากย้ายสเตตัสการ์ดงานในคอลัมน์', isCompleted: false, position: 3000 }
              ]
            }
          }
        }
      }
    });
  }

  console.log('✅ Clean database seeding completed! All mock members removed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
