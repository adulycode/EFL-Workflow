import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 14 Company Employees from Central SSO
const SSO_EMPLOYEES = [
  {
    ssoUserId: '45826962-3c13-494a-a9f9-d9e0a1431987',
    email: 'adulnp@gmail.com',
    name: 'Admin System',
    nickname: 'reyz',
    employeeCode: 'EFL011',
    role: 'ADMIN',
    jobTitle: 'System Administrator (ดูแลระบบ)',
    isAssignable: false // System Account (Hidden from Tasks / Assignees)
  },
  {
    ssoUserId: '2d38f855-ce2c-48f4-932d-580d0c573180',
    email: 'info@efl.ac.th',
    name: 'Wilaiwan Wannachotpawet',
    nickname: 'Dr.Ying',
    employeeCode: 'EFL012',
    role: 'ADMIN',
    jobTitle: 'Director / Executive Manager',
    isAssignable: true
  },

  {
    ssoUserId: 'a52d6a10-dba2-414a-b5d6-954948c60748',
    email: 'santoonmoon@gmail.com',
    name: 'Antika Sinthao',
    nickname: 'Ann',
    employeeCode: 'EFL002',
    role: 'STAFF',
    jobTitle: 'Operations & Staff',
    isAssignable: true
  },
  {
    ssoUserId: '4edecaff-b4b7-48b5-8f1d-e5402cef7e52',
    email: 'bow.siriphon@gmail.com',
    name: 'Siriphon Watmon',
    nickname: 'Bow',
    employeeCode: 'EFL004',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '9715b008-c91f-4bbf-b4ec-bc2ced8fcaf5',
    email: 'saikaewf@gmail.com',
    name: 'Saikaew Nualmusid',
    nickname: 'Fah',
    employeeCode: 'EFL005',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '4c841b7c-80ea-43e3-9c4a-01b02bb0e754',
    email: 'imsutida.jin@gmail.com',
    name: 'Sutida Jindapan',
    nickname: 'Im',
    employeeCode: 'EFL006',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '974e990e-5fbc-4cb4-85a7-1fff1795369b',
    email: 'saranpon.ning23@gmail.com',
    name: 'Saranporn Tippratom',
    nickname: 'Ning',
    employeeCode: 'EFL007',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '2cce352a-fc47-464a-9d41-144735f5e8a7',
    email: 'jiratchaysda@gmail.com',
    name: 'Jiratchaya Daravalee',
    nickname: 'Tammy',
    employeeCode: 'EFL008',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: 'b5244c9d-7de8-4848-998a-abc76217b51c',
    email: 'sutitadapundon@gmail.com',
    name: 'Sutitada Pundon',
    nickname: 'Na',
    employeeCode: 'EMP-0008',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: 'dfb738d1-9120-4a65-adec-f77e80acec9a',
    email: 'nattamonchaiyachet27@gmail.com',
    name: 'Nattamon Chaiyachet',
    nickname: 'Natty',
    employeeCode: 'EMP-0009',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: 'f1461b42-e134-4b10-9296-9995d8b557a1',
    email: 'janneantatpicha@gmail.com',
    name: 'Tatpicha Jannean',
    nickname: 'Best',
    employeeCode: 'EFL003',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '4bf3431b-092b-43a5-b719-eeb64b18e766',
    email: 'yingyingyoyo32@gmail.com',
    name: 'Jiraporn Chiangso',
    nickname: 'YingYing',
    employeeCode: 'EFL001',
    role: 'STAFF',
    jobTitle: 'Staff Member',
    isAssignable: true
  },
  {
    ssoUserId: '0e83344b-5e32-4c40-b7de-43e9593778d9',
    email: 'sanhomefl@gmail.com',
    name: 'Nan San Hom',
    nickname: 'Hom',
    employeeCode: 'EMP-0002',
    role: 'STAFF',
    jobTitle: 'Operations & Staff',
    isAssignable: true
  },
  {
    ssoUserId: 'ab5ff0ce-8d9b-4acf-bb1f-ed6a592cb92f',
    email: 'shouvik@seetefl.com',
    name: 'Shouvik',
    nickname: 'Shouvik',
    employeeCode: '',
    role: 'STAFF',
    jobTitle: 'Academic Staff',
    isAssignable: true
  },
  {
    ssoUserId: '7a5bbb0b-6aae-4808-ab33-487698186036',
    email: 'info@seetefl.com',
    name: 'John Quinn',
    nickname: 'John',
    employeeCode: '',
    role: 'STAFF',
    jobTitle: 'Senior Academic Advisor',
    isAssignable: true
  }
];

export async function syncAllSsoEmployees() {
  console.log('🔄 Starting Direct Sync of all Central SSO Employees...');

  // 1. Delete duplicate unlinked notification / redundant accounts if any
  await prisma.user.deleteMany({
    where: {
      email: { in: ['efl.notify@gmail.com', 'reyz@gmail.com'] }
    }
  });

  const defaultWorkspaceId = '00000000-0000-0000-0000-000000000001';
  let defaultWs = await prisma.workspace.findUnique({ where: { id: defaultWorkspaceId } });

  if (!defaultWs) {
    defaultWs = await prisma.workspace.findFirst();
  }

  const syncedList = [];

  for (const emp of SSO_EMPLOYEES) {
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(emp.nickname || emp.name)}`;
    const displayName = emp.nickname ? `${emp.nickname} (${emp.name})` : emp.name;
    const targetEmail = emp.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { avatarUrl: true }
    });

    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: {
        name: displayName,
        role: emp.role as any,
        jobTitle: emp.jobTitle,
        avatarUrl: existing?.avatarUrl || avatarUrl,
        ssoUserId: emp.ssoUserId,
        isActive: true
      },
      create: {
        email: targetEmail,
        name: displayName,
        role: emp.role as any,
        jobTitle: emp.jobTitle,
        avatarUrl,
        ssoUserId: emp.ssoUserId,
        isActive: true,
        language: 'th',
        theme: 'dark'
      }
    });

    if (defaultWs) {
      await prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: defaultWs.id,
            userId: user.id
          }
        },
        update: {
          role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
        },
        create: {
          workspaceId: defaultWs.id,
          userId: user.id,
          role: user.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
        }
      });
    }

    syncedList.push(user);
    console.log(`✅ Synced Employee: ${user.name} (${user.email}) - Role: ${user.role}`);
  }

  console.log(`🎉 Successfully synced all ${syncedList.length} employees into EFL-Workflow!`);
  return syncedList;
}

if (process.argv[1]?.endsWith('syncSsoEmployees.js') || process.argv[1]?.endsWith('syncSsoEmployees.ts')) {
  syncAllSsoEmployees()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
