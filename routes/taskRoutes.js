const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// router.use(auth);

// GET / -> index
router.get('/', taskController.index);

// GET /:id -> show
router.get('/:id', taskController.show);

// POST / -> create
router.post('/', taskController.create);

// PATCH /:id -> update
router.patch('/:id', taskController.update);

// DELETE /:id -> deleteTask
router.delete('/:id', taskController.deleteTask);

module.exports = router;
