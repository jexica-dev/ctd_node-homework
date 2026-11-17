const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);

const { userSchema } = require('../validation/userSchema');
const prisma = require('../db/prisma');

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

    const user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email.toLowerCase(),
        hashedPassword,
      },
      select: { name: true, email: true, id: true },
    });

    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
      return res.status(400).json({ message: 'User already exists' });
    }
    return next(err);
  }
};

const logon = async (req, res, next) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const goodCredentials =
      user && (await comparePassword(password, user.hashedPassword));

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
