const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  const cmd = `docker exec efl-workflow-app npx tsx -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    async function check() {
      const card = await p.card.findUnique({
        where: { id: 'db2a3c9e-aec4-4167-ba8f-703725bf85e4' },
        include: {
          column: {
            include: {
              board: {
                include: { workspace: true }
              }
            }
          },
          comments: {
            include: { user: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      console.log('=== CARD INFO ===');
      console.log('Card Title:', card.title);
      console.log('Board Title:', card.column.board.title);
      console.log('Board ID:', card.column.board.id);
      console.log('Workspace Name:', card.column.board.workspace?.name);
      console.log('Workspace ID:', card.column.board.workspaceId);
      console.log('Direct URL:', 'https://trello.eflworkspace.com/workspace/' + card.column.board.workspaceId + '/board/' + card.column.board.id);
      console.log('=== LATEST COMMENTS ===');
      console.log(card.comments.map(c => ({
        user: c.user?.name,
        email: c.user?.email,
        content: c.content,
        isEmailReply: c.isEmailReply,
        time: c.createdAt
      })));
    }
    check().finally(() => p.\\$disconnect());
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
