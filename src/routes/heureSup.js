const heureSupController = require('../controller/heuresup');
const express = require('express');
const router = express.Router();

router.get('/teacherHS/:teacherId', heureSupController.getTeacherHeureSupByWeeks);

module.exports = router;