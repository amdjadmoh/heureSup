const express = require('express');
const router = express.Router();
const absenceController = require('../controller/absence');

router.post('/', absenceController.createAbsence);
router.get('/', absenceController.getAbsences);
router.get('/:id', absenceController.getAbsenceById);
router.put('/:id', absenceController.updateAbsence);
router.delete('/:id', absenceController.deleteAbsence);

module.exports = router;