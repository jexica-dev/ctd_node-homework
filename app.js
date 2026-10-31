const express = require('express');
const app = express();

global.user_id = null;
global.users = [];
global.tasks = [];

const timeRouter = require('./routes/timeRoutes');
const userRouter = require('./routes/userRoutes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

app.use(express.json());

app.use('/api', timeRouter);
app.use('/api/users', userRouter);

app.use(notFound);

app.use(errorHandler);

// Server listener setup
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

// Export { app, server }
module.exports = { app, server };
