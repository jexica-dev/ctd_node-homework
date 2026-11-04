const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);

const pool = require('../db/pg-pool');
const { userSchema } = require('../validation/userSchema');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function comparePassword(inputPassword, storedHash) {
  if (!storedHash) return false;
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// Controller Actions
const register = async (req, res, next) => {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);

    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashedPassword],
    );

    const user = result.rows[0];
    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({ message: 'User already exists' });
    }
    return next(e);
  }
};

const logon = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    const user = result.rows[0];

    const goodCredentials =
      user && (await comparePassword(password, user.hashed_password));

    if (goodCredentials) {
      global.user_id = user.id;
      return res.status(200).json({
        name: user.name,
        email: user.email,
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    return next(err);
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: 'Successfully logged off' });
};

module.exports = {
  hashPassword,
  comparePassword,
  register,
  logon,
  logoff,
};
