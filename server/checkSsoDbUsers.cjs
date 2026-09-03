const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const commands = [
    'docker exec -i efl_central_sso_postgres psql -U postgres -d efl_central_sso -c "\\d users"',
    'docker exec -i efl_central_sso_postgres psql -U postgres -d efl_central_sso -c "SELECT * FROM users;"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
