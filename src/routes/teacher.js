const teacherController = require('../controller/teacher');
const express = require('express');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/get', authMiddleware.isAdmin, teacherController.getTeachers);
router.get('/get/:id', teacherController.getTeacherById);
router.put('/update', teacherController.updateTeacher);
router.delete('/delete/:id', authMiddleware.isAdmin, teacherController.deleteTeacher);

module.exports = router;