const scheduleController = require("../controller/scheduleSeance");
const secheduleSessionController = require("../controller/secheduleSession");
const express = require("express");
const router = express.Router();

router.post("/", scheduleController.createSchedule);
router.get("/", scheduleController.getSchedules);
router.get("/:id", scheduleController.getScheduleById);
router.put("/", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);

router.post("/:id/seances", scheduleController.createSeance);
router.get("/:scheduleId/seances", scheduleController.getSeances);
router.delete("/:id/seances/:seanceId", scheduleController.deleteSeance);
router.post("/:scheduleId/createSession", secheduleSessionController.createScheduleSession);

module.exports = router;