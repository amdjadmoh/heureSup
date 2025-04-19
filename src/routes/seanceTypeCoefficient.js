const express = require('express');
const router = express.Router();
const seanceTypeCoefficientController = require('../controller/seanceTypeCoefficient');

router.post('/', seanceTypeCoefficientController.createCoefficient);
router.get('/', seanceTypeCoefficientController.getCoefficients);
router.put('/', seanceTypeCoefficientController.updateCoefficient);
router.delete('/:seanceType', seanceTypeCoefficientController.deleteCoefficient);

module.exports = router;