const { Client } = require('ssh2');

const conn = new Client();

console.log('🚀 Testing Gmail SMTP credentials on VPS...');

conn.on('ready', () => {
  const commands = [
    'cd /home/serva/EFL-Workflow',
    'docker compose exec -T efl-workflow-app node -e "\
      const nodemailer = require(\'nodemailer\');\
      const password = \'oxvrgteancrhipia\';\
      const candidates = [\
        \'efl.notify@gmail.com\',\
        \'adulnp@gmail.com\',\
        \'reyz@gmail.com\',\
        \'yingefl@gmail.com\'\
      ];\
      async function run() {\
        for (const user of candidates) {\
          console.log(\'Testing SMTP auth for: \' + user + \'...\');\
          const transporter = nodemailer.createTransport({\
            service: \'gmail\',\
            auth: { user, pass: password }\
          });\
          try {\
            await transporter.verify();\
            console.log(\'🎉 SUCCESS! Gmail SMTP authenticated with: \' + user);\
            return user;\
          } catch (e) {\
            console.log(\'❌ \' + user + \': \' + e.message);\
          }\
        }\
      }\
      run();\
    "'
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log(`\n🎉 Verification finished with exit code: ${code}`);
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
