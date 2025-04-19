const scheduleController = require("../controller/scheduleSeance");
const secheduleSessionController = require("../controller/secheduleSession");
const scheduleSessionController = require("../controller/secheduleSession");
const express = require("express");
const router = express.Router();

router.post("/", scheduleController.createSchedule);
router.get("/", scheduleController.getSchedules);
router.get("/:id", scheduleController.getScheduleById);
router.put("/", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);
// New Schedule Session routes
router.get("/:scheduleId/sessions", secheduleSessionController.getScheduleSession);
router.get("/sessions/:scheduleSessionId", secheduleSessionController.getScheduleSessionById);
router.put("/sessions/:scheduleSessionId", secheduleSessionController.updateScheduleSession);
router.delete("/sessions/:scheduleSessionId", secheduleSessionController.deleteScheduleSession);
router.get("/sessions/:scheduleSessionId/seances", secheduleSessionController.getSeancesByScheduleSessionId);


router.post("/:id/seances", scheduleController.createSeance);
router.get("/:scheduleId/seances", scheduleController.getSeances);
router.delete("/:id/seances/:seanceId", scheduleController.deleteSeance);
router.post("/:scheduleId/createSession", secheduleSessionController.createScheduleSession);

module.exports = router;