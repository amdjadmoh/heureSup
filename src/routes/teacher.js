const teacherController = require('../controller/teacher');
const heureSupController = require ('../controller/heuresup')
const gradeSessionController = require('../controller/gradeSession');
const absence = require('../controller/absence');
const express = require('express');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/get', teacherController.getTeachers);
router.get('/get/:id', teacherController.getTeacherById);
router.put('/update', teacherController.updateTeacher);
router.delete('/delete/:id', authMiddleware.isAdmin, teacherController.deleteTeacher);
router.get('/schedule/:id/:educationalYear', teacherController.getTeacherPlanning);
router.get('/absence/:teacherId', absence.getAbsencesByTeacher);
router.get('/gradeSessions/:teacherId', gradeSessionController.getGradeSessionsOfTeacher);
// Add this route to your existing routes

module.exports = router;