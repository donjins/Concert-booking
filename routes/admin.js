const express = require('express');
const router = express.Router();

// Admin Dashboard route
router.get('/dashboard', (req, res) => {
  res.send('Welcome to the Admin Dashboard');
});

module.exports = router;
