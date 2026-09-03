const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'git pull origin main',
    'docker compose exec -T efl-workflow-app npx tsx /app/server/services/syncSsoEmployees.ts',
    'docker compose exec -T efl-workflow-app node -e \'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, isAssignable: true } }).then(u => { console.log("\n=== FINAL USERS IN VPS DB ==="); console.table(u); }).finally(() => prisma.$disconnect());\''
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`\n🎉 VPS Final Sync completed with code: ${code}`);
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
