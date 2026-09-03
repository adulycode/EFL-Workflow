const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const code = `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const adminUser = await prisma.user.findUnique({ where: { email: "adulnp@gmail.com" } });
  const tuUser = await prisma.user.findUnique({ where: { email: "reyz@gmail.com" } });
  const notifyUser = await prisma.user.findUnique({ where: { email: "efl.notify@gmail.com" } });

  console.log("Admin User (adulnp):", adminUser?.id);
  console.log("Tu User (reyz):", tuUser?.id);
  console.log("Notify User (efl.notify):", notifyUser?.id);

  if (tuUser && adminUser) {
    // Reassign cards created by tuUser to adminUser
    await prisma.card.updateMany({
      where: { createdById: tuUser.id },
      data: { createdById: adminUser.id }
    });
    // Reassign card assignees
    await prisma.cardAssignee.deleteMany({
      where: { userId: tuUser.id }
    });
    // Reassign comments
    await prisma.comment.updateMany({
      where: { userId: tuUser.id },
      data: { userId: adminUser.id }
    });
    // Remove workspace member
    await prisma.workspaceMember.deleteMany({
      where: { userId: tuUser.id }
    });
    // Delete tuUser
    await prisma.user.delete({
      where: { id: tuUser.id }
    });
    console.log("✅ Successfully removed reyz@gmail.com and merged into adulnp@gmail.com!");
  }

  if (notifyUser) {
    await prisma.cardAssignee.deleteMany({ where: { userId: notifyUser.id } });
    await prisma.workspaceMember.deleteMany({ where: { userId: notifyUser.id } });
    await prisma.user.delete({ where: { id: notifyUser.id } });
    console.log("✅ Successfully removed efl.notify@gmail.com!");
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, jobTitle: true, role: true, isAssignable: true }
  });
  console.log("\n=== FINAL CLEAN USERS LIST IN WORKFLOW DB ===");
  console.table(allUsers);
}

run().finally(() => prisma.$disconnect());
`;

  const commands = [
    'cd /home/serva/EFL-Workflow',
    `docker compose exec -T efl-workflow-app node -e '${code.replace(/\n/g, " ")}'`
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`\nDone with code: ${code}`);
      conn.end();
    });
  });
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
