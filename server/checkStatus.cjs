const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('cd /home/serva/EFL-Workflow && docker ps && git log -n 1 --oneline', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('data', (d) => {
      output += d.toString();
      process.stdout.write(d.toString());
    });
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B',
  readyTimeout: 15000
});
