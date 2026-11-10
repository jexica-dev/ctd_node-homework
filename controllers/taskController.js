const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');
const prisma = require('../db/prisma');

// GET /api/tasks (index)
async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found' });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    return next(err);
  }
}

// POST /api/tasks (create)
async function create(req, res, next) {
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
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

// GET /api/tasks/:id (show)
async function show(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
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
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return next(err);
  }
}

// DELETE /api/tasks/:id (deleteTask)
async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return next(err);
  }
}

module.exports = {
  index,
  create,
  show,
  update,
  deleteTask,
};
