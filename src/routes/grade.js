const gradeController = require("../controller/grade");
const express = require("express");
const router = express.Router();

router.post("/create", gradeController.createGrade);
router.get("/get", gradeController.getGrades);
router.put("/update", gradeController.updateGrade);
router.delete("/delete", gradeController.deleteGrade);

module.exports = router;