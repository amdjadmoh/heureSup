const express = require('express');
const router = express.Router();
const promotionController = require('../controller/promotion');

router.post('/', promotionController.createPromotion);
router.get('/', promotionController.getPromotions);
router.get('/:id', promotionController.getPromotionById);
router.put('/:id', promotionController.updatePromotion);
router.delete('/:id', promotionController.deletePromotion);
module.exports = router;