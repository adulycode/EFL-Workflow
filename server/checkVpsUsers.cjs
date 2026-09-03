const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose exec -T efl-workflow-app node -e \'console.log("Querying..."); const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); prisma.user.findMany().then(u => console.table(u.map(x => ({ id: x.id, email: x.email, name: x.name, jobTitle: x.jobTitle, role: x.role, isAssignable: x.isAssignable, ssoUserId: x.ssoUserId })))).then(() => prisma.$disconnect());\''
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
