const https = require('https');

https.get('https://trello.eflworkspace.com', (res) => {
  console.log('✅ Website is LIVE! Status:', res.statusCode);
  res.on('data', () => {});
}).on('error', (e) => {
  console.error('Error connecting to website:', e.message);
});
