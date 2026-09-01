const { Client } = require('ssh2');

const conn = new Client();

console.log('Testing SSH connection with debug...');

conn.on('ready', () => {
  console.log('✅ SSH Ready!');
  conn.exec('uptime', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => console.log('Uptime:', d.toString()));
    stream.on('close', () => conn.end());
  });
});

conn.on('error', err => console.error('SSH Error:', err));

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B',
  readyTimeout: 60000,
  debug: msg => console.log('[DEBUG]', msg)
});
