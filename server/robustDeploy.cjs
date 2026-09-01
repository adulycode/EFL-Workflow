const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS...');

conn.on('ready', () => {
  console.log('SSH Connection ready. Running commands...');
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose up -d',
    'sleep 3',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\nCommands finished with exit code ${code}`);
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err);
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B',
  readyTimeout: 40000,
  algorithms: {
    serverHostKey: ['ssh-rsa', 'ecdsa-sha2-nistp256', 'ssh-ed25519', 'rsa-sha2-512', 'rsa-sha2-256']
  }
});
