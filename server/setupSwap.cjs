const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Creating 4GB Swap File on VPS...');

conn.on('ready', () => {
  const password = 'p1Wm9auHTaysHX5B';

  const script = `
echo "${password}" | sudo -S fallocate -l 4G /swapfile 2>/dev/null || echo "${password}" | sudo -S dd if=/dev/zero of=/swapfile bs=1M count=4096 status=none
echo "${password}" | sudo -S chmod 600 /swapfile
echo "${password}" | sudo -S mkswap /swapfile
echo "${password}" | sudo -S swapon /swapfile

# Add to fstab if not present
if ! grep -q '/swapfile' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' | echo "${password}" | sudo -S tee -a /etc/fstab
fi

# Set optimal swappiness
echo "${password}" | sudo -S sysctl vm.swappiness=10
echo "${password}" | sudo -S sysctl vm.vfs_cache_pressure=50

if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
  echo 'vm.swappiness=10' | echo "${password}" | sudo -S tee -a /etc/sysctl.conf
fi
if ! grep -q 'vm.vfs_cache_pressure' /etc/sysctl.conf; then
  echo 'vm.vfs_cache_pressure=50' | echo "${password}" | sudo -S tee -a /etc/sysctl.conf
fi

echo ""
echo "=== UPDATED MEMORY & SWAP STATUS ==="
free -h
swapon --show
`;

  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\n🎉 Swap setup completed with exit code: ${code}`);
      conn.end();
    });
  });
});

conn.connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
