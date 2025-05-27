const express = require('express');
const salaryController = require('../controller/salary');

const router = express.Router();

// Route to generate teacher payment Excel report
router.get('/payment-form', salaryController.generateTeacherPaymentExcel);
router.get('/engagment', salaryController.generateEngagmentExcel);

module.exports = router;
