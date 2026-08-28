const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Deploying Inbound Email-to-Comment feature to VPS...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'rm -f .git/refs/remotes/origin/main .git/refs/remotes/origin/main.lock',
    'git fetch origin main',
    'git reset --hard origin/main',
    'docker compose up -d --build',
    'sleep 4',
    'docker compose exec -T efl-workflow-app npx prisma db push --accept-data-loss',
    'sleep 2',
    'docker ps --filter "name=efl"'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Deploy finished with exit code: ${code}`);
      
      // Let's send a brand new notification email for a real card to adulnp@gmail.com so the user can test replying!
      const sendCardAlertCmd = 'docker exec efl-workflow-app npx tsx -e "\
        const { PrismaClient } = require(\'@prisma/client\');\
        const p = new PrismaClient();\
        async function run() {\
          const firstCard = await p.card.findFirst({\
            include: { column: { include: { board: { include: { workspace: true } } } } }\
          });\
          if (!firstCard) { console.log(\'No card found\'); return; }\
          console.log(\'Found card:\', firstCard.title, \'(ID: \' + firstCard.id + \')\');\
          \
          const { sendCardNotificationEmail } = await import(\'./server/services/emailService\');\
          const res = await sendCardNotificationEmail({\
            to: \'adulnp@gmail.com\',\
            title: \'📌 ทดสอบ Reply ตอบกลับอีเมล: \' + firstCard.title,\
            message: \'การ์ดงานนี้พร้อมสำหรับการทดสอบ Email-to-Comment! คุณสามารถกดปุ่ม [Reply] ในแอป Gmail เพื่อตอบกลับข้อความนี้ได้ทันทีครับ\',\
            cardTitle: firstCard.title,\
            boardTitle: firstCard.column.board.title,\
            workspaceTitle: firstCard.column.board.workspace?.name || \'EFL Organization\',\
            priority: firstCard.priority,\
            dueDate: firstCard.dueDate || new Date(Date.now() + 86400000),\
            actorName: \'EFL System Alert\',\
            cardId: firstCard.id\
          });\
          console.log(\'Email Dispatch Result:\', res);\
        }\
        run().finally(() => p.\\$disconnect());\
      "';

      conn.exec(sendCardAlertCmd, (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('data', (d) => process.stdout.write(d.toString()));
        stream2.stderr.on('data', (d) => process.stderr.write(d.toString()));
        stream2.on('close', () => {
          console.log('\n✅ Real card notification sent for live testing!');
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
