const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const commands = [
    'echo "=== MEMORY (free -m) ==="',
    'free -h',
    'echo ""',
    'echo "=== DOCKER CONTAINERS MEMORY (docker stats) ==="',
    'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}"',
    'echo ""',
    'echo "=== TOP PROCESSES BY MEMORY ==="',
    'ps aux --sort=-%mem | head -n 12'
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
