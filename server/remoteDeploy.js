const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const cmd = `docker exec efl-workflow-app npx tsx -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    function clean(rawText) {
      if (!rawText) return '';
      const markerIndex = rawText.search(/\\r?\\n\\s*On\\s+[\\s\\S]+?wrote:\\s*/i);
      let cleaned = markerIndex !== -1 ? rawText.slice(0, markerIndex) : rawText;

      const thaiIndex = cleaned.search(/\\r?\\n\\s*เมื่อ\\s+[\\s\\S]+?เขียนว่า:\\s*/i);
      if (thaiIndex !== -1) cleaned = cleaned.slice(0, thaiIndex);

      const fromIndex = cleaned.search(/\\r?\\n\\s*From:\\s+/i);
      if (fromIndex !== -1) cleaned = cleaned.slice(0, fromIndex);

      const dashIndex = cleaned.search(/\\r?\\n\\s*--\\s*\\r?\\n/);
      if (dashIndex !== -1) cleaned = cleaned.slice(0, dashIndex);

      cleaned = cleaned.split('\\n').filter(line => !line.trim().startsWith('>')).join('\\n');
      cleaned = cleaned.replace(/(?:Sent from my|ส่งจาก)[\\s\\S]*$/i, '');
      return cleaned.trim();
    }

    async function run() {
      const c = await p.comment.findFirst({ where: { isEmailReply: true } });
      if (c) {
        const cleanedText = clean(c.content);
        await p.comment.update({
          where: { id: c.id },
          data: { content: cleanedText }
        });
        console.log('Resulting cleaned comment:', JSON.stringify(cleanedText));
      }
    }
    run().finally(() => p.\\$disconnect());
  "`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '103.91.190.29',
  port: 22,
  username: 'serva',
  password: 'p1Wm9auHTaysHX5B'
});
