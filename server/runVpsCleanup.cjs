const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose cp server/services/syncSsoEmployees.ts efl-workflow-app:/app/server/services/syncSsoEmployees.ts',
    'docker compose cp scratch/removeRedundant.ts efl-workflow-app:/app/scratch/removeRedundant.ts',
    'docker compose exec -T efl-workflow-app npx tsx /app/scratch/removeRedundant.ts',
    'docker compose exec -T efl-workflow-app npx tsx /app/server/services/syncSsoEmployees.ts'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`\n🎉 VPS Final Cleanup completed with code: ${code}`);
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
