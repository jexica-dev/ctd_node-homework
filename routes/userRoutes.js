const express = require('express');
const router = express.Router();
const { register, logon, logoff } = require('../controllers/userController');

// POST /register
router.post('/register', register);

// POST /logon
router.post('/logon', logon);

// POST /logoff
router.post('/logoff', logoff);

module.exports = router;
