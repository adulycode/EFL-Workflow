const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const code = `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function clean() {
  console.log("Cleaning up duplicate efl.notify@gmail.com...");
  await prisma.user.deleteMany({
    where: { email: { in: ["efl.notify@gmail.com"] } }
  });
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, jobTitle: true, role: true, isAssignable: true, ssoUserId: true }
  });
  console.log("Updated Users in VPS DB:", users.length);
  console.table(users);
}
clean().finally(() => prisma.$disconnect());
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
      console.log(`\n🎉 VPS Cleanup finished with code: ${code}`);
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
