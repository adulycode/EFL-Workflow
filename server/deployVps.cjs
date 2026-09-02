const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Connecting to VPS from container...');

conn.on('ready', () => {
  console.log('✅ SSH Connected! Deploying and checking containers on VPS...');
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'git fetch origin main && git reset --hard origin/main',
    'docker compose up -d --build',
    'sleep 3',
    'docker compose exec -T efl-workflow-app npx prisma db push --accept-data-loss || true',
    'docker image prune -f',
    'docker builder prune -f --keep-storage 2GB',
    'docker ps --filter "name=efl"',
    'curl -I http://localhost:3010 || true'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`\n🎉 VPS Deploy finished with code: ${code}`);
      conn.end();
    });
  });
});

conn.on('error', err => {
  console.error('SSH Error:', err);
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
