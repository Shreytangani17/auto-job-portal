var express = require('express');
var router = express.Router();

// POST /api/notify - trigger a notification
router.post('/api/notify', (req, res) => {
  // Here you could trigger a real notification (email, push, etc.)
  console.log('Notification triggered from frontend:', req.body);
  res.json({ success: true, message: 'Notification triggered!' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
