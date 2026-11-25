const express = require('express');
const router = express.Router();
const jwtMiddleware = require('../middleware/jwtMiddleware');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(jwtMiddleware);

router.get('/', taskController.index);

router.post('/bulk', taskController.bulkCreate);

router.get('/:id', taskController.show);

router.post('/', taskController.create);

router.patch('/:id', taskController.update);

router.delete('/:id', taskController.deleteTask);

module.exports = router;
