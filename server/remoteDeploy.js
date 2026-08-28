const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Removing old placeholder "aduly@efl.org" from VPS DB...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose exec -T efl-workflow-app node -e "\
      const { PrismaClient } = require(\'@prisma/client\');\
      const p = new PrismaClient();\
      async function run() {\
        const realAdmin = await p.user.findFirst({ where: { email: \'adulnp@gmail.com\' } });\
        const mockAdmin = await p.user.findFirst({ where: { email: \'aduly@efl.org\' } });\
        if (realAdmin && mockAdmin) {\
          await p.workspace.updateMany({ where: { ownerId: mockAdmin.id }, data: { ownerId: realAdmin.id } });\
          await p.board.updateMany({ where: { createdById: mockAdmin.id }, data: { createdById: realAdmin.id } });\
          await p.card.updateMany({ where: { createdById: mockAdmin.id }, data: { createdById: realAdmin.id } });\
          await p.cardAssignee.deleteMany({ where: { userId: mockAdmin.id } });\
          await p.workspaceMember.deleteMany({ where: { userId: mockAdmin.id } });\
          await p.user.delete({ where: { id: mockAdmin.id } });\
          console.log(\'✅ Successfully deleted placeholder user aduly@efl.org!\');\
        } else if (mockAdmin) {\
          await p.user.delete({ where: { id: mockAdmin.id } });\
          console.log(\'✅ Deleted placeholder user aduly@efl.org!\');\
        }\
        const users = await p.user.findMany({ select: { name: true, email: true, role: true } });\
        console.log(\'=== FINAL CLEAN USER DIRECTORY (\' + users.length + \' users) ===\');\
        console.table(users);\
      }\
      run().finally(() => p.\\$disconnect());\
    "'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Cleanup finished with exit code: ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
