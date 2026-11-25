const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
const prisma = require('../db/prisma');

// GET /api/tasks (index)
async function index(req, res, next) {
  const userId = req.user.id;
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const whereClause = { userId };
    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    const sortBy = [
      'title',
      'priority',
      'createdAt',
      'id',
      'isCompleted',
    ].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortDirection = req.query.sortDirection === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortDirection };

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: orderBy,
    });

    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found' });
    }

    const totalPages = Math.ceil(totalTasks / limit);
    const pagination = {
      page: page,
      limit: limit,
      total: totalTasks,
      pages: totalPages,
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
  } catch (err) {
    if (next) return next(err);
    throw err;
  }
}

// POST /api/tasks (create)
async function create(req, res, next) {
  const userId = req.user.id;

  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted || false,
        priority: value.priority || 'medium',
        userId,
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });

    return res.status(201).json(task);
  } catch (err) {
    if (next) return next(err);
    throw err;
  }
}

// POST /api/tasks/bulk (bulkCreate)
async function bulkCreate(req, res, next) {
  const { tasks } = req.body;
  const userId = req.user.id;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: 'Invalid request data. Expected an array of tasks.',
    });
  }

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });
    return res.status(201).json({
      message: 'Bulk task creation successful',
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

// GET /api/tasks/:id (show)
async function show(req, res, next) {
  const userId = req.user.id;
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/tasks/:id (update)
async function update(req, res, next) {
  const userId = req.user.id;
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id: taskId,
          userId,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'The task was not found.' });
    }
    return next(err);
  }
}

// DELETE /api/tasks/:id (deleteTask)
async function deleteTask(req, res, next) {
  const userId = req.user.id;
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'The task was not found.' });
    }
    return next(err);
  }
}

module.exports = {
  index,
  create,
  bulkCreate,
  show,
  update,
  deleteTask,
};
