const { db } = require("../db/index.js");
const { Schedule, Seance, User, SemesterEnum, DayEnum, SeanceTypeEnum,Promotion,Speciality , Teacher,ScheduleSession} = require("../db/schema.js");
const { sql ,eq} = require("drizzle-orm");

exports.createSchedule = async (req, res) => {
  try {
    const { promotionId, semester, specialityId,educationalYear} = req.body;

    if (!promotionId || !semester  || !educationalYear) {
      return res.status(400).json({ error: "All fields are required" });
    }

  // check educationalYear format 2025/2024
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(educationalYear)) {
      return res.status(400).json({ error: "Invalid educational year format (use YYYY/YYYY)" });
    }
   
    const validSemesters = SemesterEnum.enumValues;

    if (!validSemesters.includes(semester)) {
      return res.status(400).json({ error: "Invalid semester value" });
    }
    // check promotionId and specaility are valid
    const promotion = await db
      .select()
      .from(Promotion)
      .where(sql`${Promotion.id} = ${promotionId}`);
    if (promotion.length === 0) {
      return res.status(400).json({ error: "Invalid promotion value" });
    }
    if (specialityId) {
    const Speciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${specialityId}`);
    if (Speciality.length === 0) {
      return res.status(400).json({ error: "Invalid speciality value" });
    }
    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.specialityId} = ${specialityId} AND ${Schedule.educationalYear} = ${educationalYear}`
      );

    if (existingSchedule.length > 0) {
      return res.status(400).json({ error: "Schedule already exists" });
    }
    await db.insert(Schedule).values({
      promotionId,
      semester,
      specialityId,
      educationalYear,
    });

    const newSchedule = await db.select().from(Schedule).where(
      sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.specialityId} = ${specialityId} AND ${Schedule.educationalYear} = ${educationalYear}`
    );

    return res.status(201).json({ schedule: newSchedule[0] });
    }

    // check if the schedule already exists

    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester}  AND ${Schedule.educationalYear} = ${educationalYear}`
      );

    if (existingSchedule.length > 0) {
      return res.status(400).json({ error: "Schedule already exists" });
    }

    await db.insert(Schedule).values({
      promotionId,
      semester,
      educationalYear,
    });

    const newSchedule = await db.select().from(Schedule).where(
      sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester}  AND ${Schedule.educationalYear} = ${educationalYear}`
    );

    return res.status(201).json({ schedule: newSchedule[0] });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const schedules = await db.select().from(Schedule).innerJoin(Promotion,eq(Schedule.promotionId,Promotion.id));
    return res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const schedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${id}`);

    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    return res.status(200).json({ schedule: schedule[0] });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id, promotionId, semester, specialityId ,educationalYear } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }
    if (!promotionId || !semester || !educationalYear) {
      return res.status(400).json({ error: "All fields are required" });

    }

    // check educationalYear format 2025/2024
    const yearRegex = /^\d{4}\/\d{4}$/;
    if (!yearRegex.test(educationalYear)) {
      return res.status(400).json({ error: "Invalid educational year format (use YYYY/YYYY)" });

    }
    const validSemesters = SemesterEnum.enumValues;


    if (!validSemesters.includes(semester)) {

      return res.status(400).json({ error: "Invalid semester value" });
    }
  // check promotionId  are valid
    const promotion = await db
      .select()
      .from(Promotion)
      .where(sql`${Promotion.id} = ${promotionId}`);

    if (promotion.length === 0) {
      return res.status(400).json({ error: "Invalid promotion " });
    }
    if (specialityId) {
    const Speciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${specialityId}`);
    if (Speciality.length === 0) {
      return res.status(400).json({ error: "Invalid speciality " });
    }

    // check if the schedule already exists
    const existingSchedule = await db
      .select()     
      .from(Schedule)
      .where(
        sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.specialityId} = ${specialityId} AND ${Schedule.educationalYear} = ${educationalYear}`
      );
    
    if (existingSchedule.length > 0) {
      return res.status(400).json({ error: "Schedule already exists" });
    }

    // create the schedule
    const updateSchedule = await db
      .update(Schedule)
      .set({
        promotionId,
        semester,
        specialityId,
        educationalYear,
      })
      .where(sql`${Schedule.id} = ${id}`);
      const updatedSchedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${id}`);   
    return res.status(200).json({
      message: `Schedule with id: '${id}' updated successfully`,
      schedule: updatedSchedule[0],
    });
    } else {
      // check if the schedule already exists
      const existingSchedule = await db
        .select()
        .from(Schedule)
        .where(
          sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.educationalYear} = ${educationalYear}`
        );

      if (existingSchedule.length > 0) {
        return res.status(400).json({ error: "Schedule already exists" });
      }

      // create the schedule
      const updateSchedule = await db
        .update(Schedule)
        .set({
          promotionId,
          semester,
          educationalYear,
        })
        .where(sql`${Schedule.id} = ${id}`);
      const updatedSchedule = await db
        .select()
        .from(Schedule)
        .where(sql`${Schedule.id} = ${id}`);   
      return res.status(200).json({
        message: `Schedule with id: '${id}' updated successfully`,
        schedule: updatedSchedule[0],
      });
    }
  } catch (error) {
    console.error("Error updating schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }

    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${id}`);

    if (existingSchedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    await db.delete(Schedule).where(sql`${Schedule.id} = ${id}`);

    return res.status(200).json({
      message: `Schedule with id: '${id}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createSeance = async (req, res) => {
  try {
    const { day, startTime, endTime, location, type, module, group, teacherId } = req.body;
    const  scheduleSessionId = req.params.id;

    if (!day || !startTime || !endTime || !location || !type || !module || !group || !teacherId  || ! scheduleSessionId) {

      return res.status(400).json({ error: "All fields are required" });
    }

    const validDays = DayEnum.enumValues;
    const validTypes = SeanceTypeEnum.enumValues;

    if (!validDays.includes(day)) {
      return res.status(400).json({ error: "Invalid day value" });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type value" });
    }

    const scheduleSession = await db
      .select()
      .from(ScheduleSession)
      .where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
    if (scheduleSession.length === 0) {
      return res.status(404).json({ error: "ScheduleSession not found" });
    }

    const teacher = await db
      .select()
      .from(Teacher)
      .where(sql`${Teacher.id} = ${teacherId}`);

    if (teacher.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: "Invalid time format (use HH:MM:SS)" });
    }

    if (location.length > 50) {
      return res.status(400).json({ error: "Location must be 50 characters or less" });
    }
    if (module.length > 100) {
      return res.status(400).json({ error: "Module must be 100 characters or less" });
    }

    if (!Number.isInteger(Number(group))) {
      return res.status(400).json({ error: "Group must be an integer" });
    }

    await db.insert(Seance).values({
      day,
      startTime,
      endTime,
      location,
      type,
      module,
      group,
      teacherId,
      scheduleSessionId,
      isHeurSupp: true,
    });

    const newSeance = await db
      .select()
      .from(Seance)
      .where(
        sql`${Seance.day} = ${day} AND ${Seance.startTime} = ${startTime} AND ${Seance. scheduleSessionId} = ${ scheduleSessionId} AND ${Seance.teacherId} = ${teacherId}`
      );

    return res.status(201).json({ message: "Seance added successfully" });
  } catch (error) {
    console.error("Error creating seance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSeances = async (req, res) => {
  try {
    const {  scheduleSessionId } = req.params;

    if (! scheduleSessionId) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }

    const scheduleSession = await db
      .select()
      .from(ScheduleSession)
      .where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);

    if (scheduleSession.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }



    const seances = await db
      .select()
      .from(Seance)
      .innerJoin(User, sql`${Seance.teacherId} = ${User.id}`)
      .where(sql`${Seance.scheduleSessionId} = ${scheduleSessionId}`);

    return res.status(200).json({ seances });
  } catch (error) {
    console.error("Error fetching seances:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteSeance = async (req, res) => {
  try {
    const { seanceId } = req.params;

    if (!seanceId) {
      return res.status(400).json({ error: "Seance ID is required" });
    }

    const seance = await db
      .select()
      .from(Seance)
      .where(sql`${Seance.id} = ${seanceId}`);

    if (seance.length === 0) {
      return res.status(404).json({ error: "Seance not found" });
    }

    await db.delete(Seance).where(sql`${Seance.id} = ${seanceId}`);

    return res.status(200).json({
      message: `Seance with id: '${seanceId}' deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting seance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};