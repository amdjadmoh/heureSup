const externalSeanceController = require("../controller/externalSeance");
const express = require("express");
const router = express.Router();

// Create external seance
router.post("/create", externalSeanceController.createExternalSeance);


// Get all external seances with optional filtering
router.get("/", externalSeanceController.getExternalSeances);

// Get external seances by teacher ID
router.get("/teacher/:teacherId", externalSeanceController.getExternalSeancesByTeacher);


module.exports = router;
