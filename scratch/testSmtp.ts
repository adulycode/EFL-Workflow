import nodemailer from 'nodemailer';

const password = 'oxvrgteancrhipia';
const candidates = [
  'efl.notify@gmail.com',
  'adulnp@gmail.com',
  'reyz@gmail.com',
  'info@efl.ac.th'
];

async function testGmail() {
  for (const user of candidates) {
    console.log(`Testing SMTP authentication for: ${user}...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: password
      }
    });

    try {
      await transporter.verify();
      console.log(`🎉 SUCCESS! Gmail SMTP authenticated successfully with: ${user}`);
      return user;
    } catch (err: any) {
      console.log(`❌ Failed for ${user}: ${err.message}`);
    }
  }
}

testGmail();
