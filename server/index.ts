import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import workspacesRouter from './routes/workspaces';
import boardsRouter from './routes/boards';
import cardsRouter from './routes/cards';
import notificationsRouter from './routes/notifications';
import usersRouter from './routes/users';
import settingsRouter from './routes/settings';
import inboundEmailRouter from './routes/inboundEmail';
import utilsRouter from './routes/utils';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Attach socket.io instance to express app
app.set('io', io);

app.use(cors());
// Increased body limit to 15MB for image attachments
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/cards', inboundEmailRouter);
app.use('/api/webhooks', inboundEmailRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/utils', utilsRouter);
app.use('/api/attachments', (req, res, next) => {
  req.url = '/attachments' + req.url;
  cardsRouter(req, res, next);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'EFL-Workflow' });
});

// Real-time socket handlers
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Serve frontend static build in production
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3010;

server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 EFL-Workflow Server Running on Port ${PORT}`);
  console.log(`📊 Local Web UI: http://localhost:${PORT}`);
  console.log(`⚡ Multi-Workspace & Image Engine Active`);
  console.log(`🔑 Central SSO Handshake Active`);
  console.log(`=========================================`);

  // Auto-register with EFL Central SSO
  import('./services/ssoService').then(({ registerWithCentralSSO }) => {
    registerWithCentralSSO();
  }).catch((err) => {
    console.error('[SSO Auto-Register Init Error]', err);
  });

  // Start Gmail IMAP Inbound Email Listener (Email-to-Comment Automation)
  import('./services/inboundEmailListener').then(({ startInboundEmailListener }) => {
    startInboundEmailListener(io);
  }).catch((err) => {
    console.error('[Inbound Email Listener Init Error]', err);
  });
});
