const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Deploying and testing Gmail SMTP Notification engine on VPS...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'rm -f .git/refs/remotes/origin/main .git/refs/remotes/origin/main.lock',
    'git fetch origin main',
    'git reset --hard origin/main',
    // Ensure .env has Gmail credentials
    `grep -q 'GMAIL_USER' .env || echo 'GMAIL_USER="efl.notify@gmail.com"' >> .env`,
    `grep -q 'GMAIL_APP_PASSWORD' .env || echo 'GMAIL_APP_PASSWORD="oxvrgteancrhipia"' >> .env`,
    `grep -q 'SMTP_USER' .env || echo 'SMTP_USER="efl.notify@gmail.com"' >> .env`,
    `grep -q 'SMTP_PASS' .env || echo 'SMTP_PASS="oxvrgteancrhipia"' >> .env`,
    'docker compose up -d --build',
    'sleep 3',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Build finished with exit code: ${code}`);
      
      // Test sending live email to reyz@gmail.com
      const testCmd = 'docker exec efl-workflow-app npx tsx -e "\
        import(\'./server/services/emailService\').then(async m => {\
          console.log(\'📧 Sending test live email to reyz@gmail.com...\');\
          const res = await m.sendCardNotificationEmail({\
            to: \'reyz@gmail.com\',\
            title: \'🎉 เชื่อมต่อระบบ Email สำเร็จแล้ว (EFL Workflow Alert)\',\
            message: \'ยินดีด้วยครับ ระบบแจ้งเตือนทางอีเมลของ EFL Workflow ได้รับการติดตั้งและเชื่อมต่อกับ efl.notify@gmail.com เรียบร้อยแล้ว!\',\
            cardTitle: \'ระบบแจ้งเตือนทางอีเมลแบบอัตโนมัติ (Email Automation)\',\
            boardTitle: \'EFL Core Operations\',\
            workspaceTitle: \'EFL Organization\',\
            priority: \'HIGH\',\
            dueDate: new Date(Date.now() + 86400000),\
            actorName: \'EFL System Alert\'\
          });\
          console.log(\'Result:\', res);\
        });\
      "';

      conn.exec(testCmd, (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('data', (d) => process.stdout.write(d.toString()));
        stream2.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream2.on('close', () => {
          console.log('\n✅ Test email execution complete!');
          conn.end();
        });
      });
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
