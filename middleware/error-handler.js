const errorHandler = (err, req, res, next) => {
  if (err.name === 'PrismaClientInitializationError') {
    console.error("Couldn't connect to the database. Is it running?");
  }

  if (err.code === 'ECONNREFUSED' && err.port === 5432) {
    // the postgresql port
    console.log(
      'The database connection was refused.  Is your database service running?',
    );
  }

  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
