const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Deploying FYI filter fix to VPS...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'git fetch origin main && git reset --hard origin/main',
    'docker compose up -d --build',
    'sleep 3',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Deploy finished with exit code: ${code}`);
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
