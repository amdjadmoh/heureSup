const express = require('express');
const router = express.Router();
const specialityController = require('../controller/speciality');

router.post('/', specialityController.createSpeciality);
router.get('/', specialityController.getSpecialities);
router.get('/:id', specialityController.getSpecialityById);
router.put('/:id', specialityController.updateSpeciality);
router.delete('/:id', specialityController.deleteSpeciality);

module.exports = router;