const { Client } = require('ssh2');

const conn = new Client();

console.log('🔍 Querying Central SSO DB directly using node on VPS...');

conn.on('ready', () => {
  const nodeScript = `
    const { Client } = require('pg');
    const client = new Client({
      host: '103.91.190.29',
      port: 5434,
      user: 'postgres',
      password: 'efl_password_2026',
      database: 'efl_central_sso'
    });
    async function run() {
      await client.connect();
      const res = await client.query('SELECT * FROM users');
      const accesses = await client.query('SELECT * FROM user_app_accesses WHERE "appId" = \\'efl-workflow\\'');
      console.log('=== TOTAL SSO USERS ===', res.rows.length);
      console.log('=== USERS ===', JSON.stringify(res.rows.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        nickname: u.nickname,
        employeeCode: u.employeeCode,
        isSuperAdmin: u.isSuperAdmin,
        isActive: u.isActive
      })), null, 2));
      console.log('=== EFL-WORKFLOW APP ACCESSES ===', JSON.stringify(accesses.rows, null, 2));
      await client.end();
    }
    run().catch(console.error);
  `;

  conn.exec(`node -e "${nodeScript.replace(/"/g, '\\"')}"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
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
