const heureSupController = require('../controller/heureSup');
const express = require('express');
const router = express.Router();

router.get('/teacherHS/:teacherId', heureSupController.getTeacherHeureSupByWeeks);

module.exports = router;