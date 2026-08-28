const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Rebuilding VPS and cleaning up legacy assignments for hidden system admins...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'git fetch origin main && git reset --hard origin/main',
    'docker compose exec -T efl-workflow-app node -e "\
      const { PrismaClient } = require(\'@prisma/client\');\
      const p = new PrismaClient();\
      async function run() {\
        const hiddenUsers = await p.user.findMany({ where: { isAssignable: false } });\
        const hiddenIds = hiddenUsers.map(u => u.id);\
        if (hiddenIds.length > 0) {\
          const deleted = await p.cardAssignee.deleteMany({ where: { userId: { in: hiddenIds } } });\
          console.log(\'✅ Unassigned hidden admin accounts from cards (\' + deleted.count + \' entries removed)\');\
        }\
      }\
      run().finally(() => p.\\$disconnect());\
    "',
    'docker compose up -d --build',
    'sleep 3',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Process finished with exit code: ${code}`);
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
