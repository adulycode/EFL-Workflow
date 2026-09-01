const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Deploying Mutually Exclusive Stakeholders to VPS directly...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'rm -f .git/refs/remotes/origin/main .git/refs/remotes/origin/main.lock',
    'git fetch origin main && git reset --hard origin/main',
    'docker compose up -d --build',
    'sleep 4',
    'docker compose exec -T efl-workflow-app npx prisma db push --accept-data-loss',
    'sleep 2',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\n🎉 Deploy finished with exit code: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
