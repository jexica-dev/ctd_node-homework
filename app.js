const express = require('express');
const app = express();
const prisma = require('./db/prisma');
const cookieParser = require('cookie-parser');

app.set('trust proxy', 1);
const helmet = require('helmet');
const { xss, sanitize } = require('express-xss-sanitizer');
const rateLimiter = require('express-rate-limit');

const analyticsRoutes = require('./routes/analyticsRoutes');
const timeRouter = require('./routes/timeRoutes');
const userRouter = require('./routes/userRoutes');
const taskRouter = require('./routes/taskRoutes');

const jwtMiddleware = require('./middleware/jwtMiddleware');

const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  }),
);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);
  next();
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res
      .status(500)
      .json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.use('/api', timeRouter);
app.use('/api/users', userRouter);
app.use('/api/tasks', jwtMiddleware, taskRouter);
app.use('/api/analytics', jwtMiddleware, analyticsRoutes);

app.use(notFound);

app.use(errorHandler);

// Server listener setup
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down gracefully...');

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('HTTP server closed.');

    // Close all PostgreSQL connections after the HTTP server has stopped.

    await prisma.$disconnect();
    console.log('Prisma disconnected');
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Export { app, server }
module.exports = { app, server };
