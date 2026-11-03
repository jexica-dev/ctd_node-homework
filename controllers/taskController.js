const { taskSchema, patchTaskSchema } = require('../validation/taskSchema');

global.tasks = global.tasks || [];

let currentTaskId = 0;

function taskCounter() {
  currentTaskId += 1;
  return currentTaskId;
}

function sanitizeTask(task) {
  if (!task) return null;
  const { userId, ...sanitizedTask } = task;
  return sanitizedTask;
}

// GET /api/tasks (index)
function index(req, res) {
  const userEmail = global.user_id ? global.user_id.email : null;

  const userTasks = global.tasks.filter((task) => task.userId === userEmail);

  if (!userTasks || userTasks.length === 0) {
    return res.status(404).json({ message: 'No tasks found' });
  }

  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });

  return res.status(200).json(sanitizedTasks);
}

// POST /api/tasks (create)
function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  const userEmail = global.user_id ? global.user_id.email : null;

  const newTask = {
    id: taskCounter(),
    title: value.title,
    isCompleted: value.isCompleted,
    userId: userEmail,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;
  return res.status(201).json(sanitizedTask);
}

// GET /api/tasks/:id (show)
function show(req, res) {
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const userEmail = global.user_id ? global.user_id.email : null;

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === userEmail,
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const { userId, ...sanitizedTask } = task;
  return res.status(200).json(sanitizedTask);
}

// PATCH /api/tasks/:id (update)
function update(req, res) {
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

  const userEmail = global.user_id ? global.user_id.email : null;

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === userEmail,
  );

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  Object.assign(task, value);

  const { userId, ...sanitizedTask } = task;
  return res.status(200).json(sanitizedTask);
}

// DELETE /api/tasks/:id (deleteTask)
function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id, 10);

  if (isNaN(taskId) || taskId <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const userEmail = global.user_id ? global.user_id.email : null;

  const taskIndex = global.tasks.findIndex(
    (t) => t.id === taskId && t.userId === userEmail,
  );

  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const taskToDelete = global.tasks[taskIndex];

  const { userId, ...sanitizedTask } = taskToDelete;

  global.tasks.splice(taskIndex, 1);

  return res.status(200).json(sanitizedTask);
}

module.exports = {
  taskCounter,
  index,
  create,
  show,
  update,
  deleteTask,
};
