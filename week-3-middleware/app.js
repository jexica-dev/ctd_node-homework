const express = require('express');
const dogsRouter = require('./routes/dogs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.url} (${req.requestId})`);
  next();
});

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/adopt', (req, res) => {
  const { email } = req.body || {};
  res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
  });
});

app.get('/error', (req, res, next) => {
  next(new Error('Simulated Server Error'));
});

app.use('/', dogsRouter); // Do not remove this line

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Dog rescue app is listening on port 3000...');
  });
}

module.exports = app;
