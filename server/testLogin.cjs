const { Client } = require('ssh2');

const conn = new Client();

console.log('Testing SSH login now...');

conn.on('ready', () => {
  console.log('🎉 SSH Connected successfully!');
  conn.exec('uptime && docker ps --filter "name=efl"', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('Done with code', code);
      conn.end();
    });
  });
});

conn.on('error', err => {
  console.error('SSH error:', err.message);
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
