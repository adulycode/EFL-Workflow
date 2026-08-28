const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Running Full Rebuild and Syncing 14 Employees on VPS...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'echo "=== Pulling Latest Code from main ==="',
    'git fetch origin main && git reset --hard origin/main',
    'echo "=== Rebuilding Container ==="',
    'docker compose up -d --build --force-recreate',
    'echo "=== Pushing Database Schema ==="',
    'sleep 4',
    'docker compose exec -T efl-workflow-app npx prisma db push',
    'echo "=== Executing Direct Sync of 14 SSO Employees ==="',
    'docker compose exec -T efl-workflow-app npx tsx server/services/syncSsoEmployees.ts',
    'echo "=== Check Running Containers ==="',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 VPS Deployment & Sync finished with exit code: ${code}`);
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
