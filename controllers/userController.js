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

// POST /api/users/register
async function register(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);
    const { email, name } = value;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      const welcomeTaskData = [
        {
          title: 'Complete your profile',
          userId: newUser.id,
          priority: 'medium',
        },
        { title: 'Add your first task', userId: newUser.id, priority: 'high' },
        { title: 'Explore the app', userId: newUser.id, priority: 'low' },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    global.user_id = result.user.id;

    return res.status(201).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: 'success',
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    return next(err);
  }
}

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
  register,
  logon,
  logoff,
  comparePassword,
};
