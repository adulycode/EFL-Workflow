const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS to start containers cleanly...');

conn.on('ready', () => {
  console.log('✅ SSH Ready!');
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose up -d',
    'sleep 3',
    'docker ps --filter "name=efl"',
    'docker logs --tail 30 efl-workflow-app'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`Finished with code ${code}`);
      conn.end();
    });
  });
});

conn.on('error', err => {
  console.error('SSH error:', err);
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B',
  readyTimeout: 30000
});
