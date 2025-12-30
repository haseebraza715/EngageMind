const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/protected', authMiddleware, (req, res) => {
  return res.json({
    message: 'Access granted to protected route!',
    user: req.user  
  });
});


router.get('/admin-data',
  authMiddleware,          
  roleMiddleware(['admin']), 
  (req, res) => {
    return res.json({ secretAdminData: 'This is for admins only!' });
  }
);

module.exports = router;
