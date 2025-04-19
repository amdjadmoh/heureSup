const express = require('express');
const router = express.Router();
const holidayController = require('../controller/holiday');

router.post('/', holidayController.createHoliday);
router.get('/', holidayController.getHolidays);
router.get('/:id', holidayController.getHolidayById);
router.put('/:id', holidayController.updateHoliday);
router.delete('/:id', holidayController.deleteHoliday);

module.exports = router;