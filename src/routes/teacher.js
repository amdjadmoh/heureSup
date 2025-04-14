const teacherController = require('../controller/teacher');
const express = require('express');
const router = express.Router();

router.get('/get', teacherController.getTeachers);
router.get('/get/:id', teacherController.getTeacherById);
router.put('/update', teacherController.updateTeacher);
router.delete('/delete/:id', teacherController.deleteTeacher);

module.exports = router;