const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Sending all notification email patterns to adulnp@gmail.com on VPS...');

conn.on('ready', () => {
  const testScript = `
    import { sendCardNotificationEmail } from './server/services/emailService';

    async function runAllPatterns() {
      const recipient = 'adulnp@gmail.com';
      console.log('📬 Starting dispatch of 5 distinct Email Patterns to ' + recipient + '...');

      // Pattern 1: Card Assigned (มอบหมายงาน)
      console.log('1️⃣ Sending Pattern 1: Card Assigned...');
      const p1 = await sendCardNotificationEmail({
        to: recipient,
        title: '📌 คุณได้รับมอบหมายการ์ดงานใหม่ (New Task Assigned)',
        message: 'คุณได้รับเลือกเป็น Assignee (ผู้รับผิดชอบหลัก) ในการ์ดงานนี้ กรุณาตรวจสอบรายละเอียดและดำเนินการ',
        cardTitle: 'พัฒนาระบบ Authentication & Real-time Webhook ซิงก์ข้ามระบบ',
        boardTitle: 'EFL Core Operations',
        workspaceTitle: 'EFL Organization',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 86400000 * 2),
        actorName: 'Dr.Ying (Wilaiwan Wannachotpawet)'
      });
      console.log('   Result 1:', p1.success ? '✅ SENT (MsgId: ' + p1.messageId + ')' : '❌ FAILED');

      // Pattern 2: Mentioned in Comment (@แท็กในคอมเมนต์)
      console.log('2️⃣ Sending Pattern 2: Mentioned in Comment...');
      const p2 = await sendCardNotificationEmail({
        to: recipient,
        title: '💬 มีคนแท็กชื่อคุณในคอมเมนต์ (Mentioned in Comment)',
        message: '@Admin System รบกวนช่วยตรวจสอบไฟล์และอนุมัติ Flow การทำงานส่วนนี้ให้หน่อยครับ แนบข้อมูลเพิ่มเติมในการ์ดแล้วครับ',
        cardTitle: 'เตรียมเอกสารส่งมอบระบบ Trello & Workflow ประจำไตรมาส',
        boardTitle: 'Management & Operations',
        workspaceTitle: 'EFL Organization',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 3),
        actorName: 'Tu (Adul Nupong)'
      });
      console.log('   Result 2:', p2.success ? '✅ SENT (MsgId: ' + p2.messageId + ')' : '❌ FAILED');

      // Pattern 3: Due Date Reminder (แจ้งเตือนใกล้ถึงกำหนดส่ง)
      console.log('3️⃣ Sending Pattern 3: Due Date Reminder...');
      const p3 = await sendCardNotificationEmail({
        to: recipient,
        title: '⏰ แจ้งเตือน: งานใกล้ถึงกำหนดส่งใน 24 ชั่วโมง (Due Date Alert)',
        message: 'การ์ดงานนี้กำลังจะถึงกำหนดส่งในวันพรุ่งนี้ (Due Date: 24 ชม.) กรุณาตรวจสอบความคืบหน้าและอัปเดตสถานะงาน',
        cardTitle: 'สรุปรายงานภาพรวมการใช้งานพนักงาน EFL ทั้งหมด',
        boardTitle: 'Executive Board',
        workspaceTitle: 'EFL Organization',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 86400000),
        actorName: 'EFL Workflow Bot'
      });
      console.log('   Result 3:', p3.success ? '✅ SENT (MsgId: ' + p3.messageId + ')' : '❌ FAILED');

      // Pattern 4: Card Completed / Status Moved (ย้ายสถานะงาน)
      console.log('4️⃣ Sending Pattern 4: Card Status Moved...');
      const p4 = await sendCardNotificationEmail({
        to: recipient,
        title: '✅ การ์ดงานย้ายสถานะเป็น "Done / เสร็จสมบูรณ์"',
        message: 'การ์ดงานได้รับการตรวจสอบและย้ายเข้าสู่คอลัมน์ เสร็จสมบูรณ์ (Done) เรียบร้อยแล้ว',
        cardTitle: 'ติดตั้งและตั้งค่า Google Gmail SMTP บน Production Server',
        boardTitle: 'Dev & Infrastructure',
        workspaceTitle: 'EFL Organization',
        priority: 'MEDIUM',
        dueDate: new Date(),
        actorName: 'Ann (Antika Sinthao)'
      });
      console.log('   Result 4:', p4.success ? '✅ SENT (MsgId: ' + p4.messageId + ')' : '❌ FAILED');

      // Pattern 5: Report To / Stakeholder FYI (รายงานหัวหน้า & FYI)
      console.log('5️⃣ Sending Pattern 5: Report to / FYI Update...');
      const p5 = await sendCardNotificationEmail({
        to: recipient,
        title: '👑 รายงานความคืบหน้างาน (Report to / FYI Update)',
        message: 'คุณได้รับแจ้งเตือนในฐานะ Report to (หัวหน้าผู้ตรวจงาน): ทีมงานได้ทำการอัปเดต Checklist และส่งมอบงานรอบที่ 1',
        cardTitle: 'ออกแบบ UI/UX Kanban Board & Dashboard ใหม่ทั้งหมด',
        boardTitle: 'Design & Product',
        workspaceTitle: 'EFL Organization',
        priority: 'NORMAL',
        dueDate: new Date(Date.now() + 86400000 * 5),
        actorName: 'Bow (Siriphon Watmon)'
      });
      console.log('   Result 5:', p5.success ? '✅ SENT (MsgId: ' + p5.messageId + ')' : '❌ FAILED');

      console.log('🎉 All 5 email patterns have been successfully dispatched!');
    }

    runAllPatterns();
  `;

  const commands = [
    'cd /home/serva/EFL-Workflow',
    `docker compose exec -T efl-workflow-app npx tsx -e "${testScript.replace(/"/g, '\\"')}"`
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Process finished with exit code: ${code}`);
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
