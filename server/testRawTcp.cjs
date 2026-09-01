const net = require('net');

const socket = net.createConnection(22, '103.91.190.29', () => {
  console.log('TCP Connected to port 22');
});

socket.on('data', (d) => {
  console.log('Received from server:', d.toString());
  socket.end();
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

socket.setTimeout(10000, () => {
  console.log('Socket timeout');
  socket.destroy();
});
