import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      jobTitle: true,
      role: true,
      isAssignable: true,
      ssoUserId: true,
      createdAt: true
    }
  });

  console.log('Total Users in DB:', users.length);
  console.table(users);
}

run()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
