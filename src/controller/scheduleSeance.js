const { db } = require("../db/index.js");
const { Schedule, Seance, User, SemesterEnum, DayEnum, SeanceTypeEnum, Promotion, Speciality, Teacher } = require("../db/schema.js");
const { sql, eq } = require("drizzle-orm");

exports.createSchedule = async (req, res) => {
  try {
    const { promotionId, semester, specialityId, educationalYear, startDate, endDate } = req.body;

    if (!promotionId || !semester || !educationalYear || !startDate || !endDate) {
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

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (startDateObj > endDateObj) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    // Check promotionId and speciality are valid
    const promotion = await db
      .select()
      .from(Promotion)
      .where(sql`${Promotion.id} = ${promotionId}`);
    if (promotion.length === 0) {
      return res.status(400).json({ error: "Invalid promotion value" });
    }

    if (specialityId) {
      const specialityCheck = await db
        .select()
        .from(Speciality)
        .where(sql`${Speciality.id} = ${specialityId}`);
      
      if (specialityCheck.length === 0) {
        return res.status(400).json({ error: "Invalid speciality value" });
      }

      // Check if the schedule already exists
      const existingSchedule = await db
        .select()
        .from(Schedule)
        .where(
          sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.specialityId} = ${specialityId} AND ${Schedule.educationalYear} = ${educationalYear}`
        );

      if (existingSchedule.length > 0) {
        return res.status(400).json({ error: "Schedule already exists" });
      }

      // Create the schedule with dates
      await db.insert(Schedule).values({
        promotionId,
        semester,
        specialityId,
        educationalYear,
        startDate,
        endDate
      });

      const newSchedule = await db.select().from(Schedule).where(
        sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.specialityId} = ${specialityId} AND ${Schedule.educationalYear} = ${educationalYear}`
      );

      return res.status(201).json({ schedule: newSchedule[0] });
    }

    // Check if the schedule already exists (without speciality)
    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.educationalYear} = ${educationalYear}`
      );

    if (existingSchedule.length > 0) {
      return res.status(400).json({ error: "Schedule already exists" });
    }

    // Create the schedule with dates
    await db.insert(Schedule).values({
      promotionId,
      semester,
      educationalYear,
      startDate,
      endDate
    });

    const newSchedule = await db.select().from(Schedule).where(
      sql`${Schedule.promotionId} = ${promotionId} AND ${Schedule.semester} = ${semester} AND ${Schedule.educationalYear} = ${educationalYear}`
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
    const { id, promotionId, semester, specialityId, educationalYear, startDate, endDate } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID is required" });
    }
    if (!promotionId || !semester || !educationalYear || !startDate || !endDate) {
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

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (startDateObj > endDateObj) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    // check promotionId are valid
    const promotion = await db
      .select()
      .from(Promotion)
      .where(sql`${Promotion.id} = ${promotionId}`);

    if (promotion.length === 0) {
      return res.status(400).json({ error: "Invalid promotion " });
    }
    
    if (specialityId) {
      const specialityCheck = await db.select().from(Speciality).where(sql`${Speciality.id} = ${specialityId}`);
      if (specialityCheck.length === 0) {
        return res.status(400).json({ error: "Invalid speciality " });
      }

      // Check if another schedule exists with the same criteria (excluding the current one)
      const existingSchedule = await db
        .select()     
        .from(Schedule)
        .where(
          sql`${Schedule.promotionId} = ${promotionId} AND 
              ${Schedule.semester} = ${semester} AND 
              ${Schedule.specialityId} = ${specialityId} AND 
              ${Schedule.educationalYear} = ${educationalYear} AND
              ${Schedule.id} != ${id}`
        );
      
      if (existingSchedule.length > 0) {
        return res.status(400).json({ error: "Schedule with these details already exists" });
      }

      // Update the schedule
      await db
        .update(Schedule)
        .set({
          promotionId,
          semester,
          specialityId,
          educationalYear,
          startDate,
          endDate
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
      // Check if another schedule exists with the same criteria (excluding the current one)
      const existingSchedule = await db
        .select()
        .from(Schedule)
        .where(
          sql`${Schedule.promotionId} = ${promotionId} AND 
              ${Schedule.semester} = ${semester} AND 
              ${Schedule.educationalYear} = ${educationalYear} AND
              ${Schedule.id} != ${id}`
        );

      if (existingSchedule.length > 0) {
        return res.status(400).json({ error: "Schedule with these details already exists" });
      }

      // Update the schedule
      await db
        .update(Schedule)
        .set({
          promotionId,
          semester,
          educationalYear,
          startDate,
          endDate
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
    const scheduleID = req.params.id;

    if (!day || !startTime || !endTime || !location || !type || !module || !group || !teacherId || !scheduleID) {
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

    // Check if the schedule exists
    const schedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${scheduleID}`);
      
    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Check if the teacher exists
    const teacher = await db
      .select()
      .from(Teacher)
      .where(sql`${Teacher.id} = ${teacherId}`);

    if (teacher.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: "Invalid time format (use HH:MM:SS)" });
    }

    // Validate field lengths
    if (location.length > 50) {
      return res.status(400).json({ error: "Location must be 50 characters or less" });
    }
    if (module.length > 100) {
      return res.status(400).json({ error: "Module must be 100 characters or less" });
    }

    // Validate group is an integer
    if (!Number.isInteger(Number(group))) {
      return res.status(400).json({ error: "Group must be an integer" });
    }

    // Calculate the supplementary hours (heureSupDuration)
    // Assuming you have some calculation logic for this
    const heureSupDuration = 0.0; // Default value or calculate based on your business logic

    // Insert the new seance
    await db.insert(Seance).values({
      day,
      startTime,
      endTime,
      location,
      type,
      module,
      group,
      teacherId,
      scheduleID: scheduleID,
      heureSupDuration
    });

    // Confirm the seance was created
    const newSeance = await db
      .select()
      .from(Seance)
      .where(
        sql`${Seance.day} = ${day} AND ${Seance.startTime} = ${startTime} AND ${Seance.scheduleID} = ${scheduleID} AND ${Seance.teacherId} = ${teacherId}`
      );

    return res.status(201).json({ message: "Seance added successfully" });
  } catch (error) {
    console.error("Error creating seance:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSeances = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }

    // Check if the schedule exists
    const schedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${scheduleId}`);

    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Get seances for this schedule
    const seances = await db
      .select()
      .from(Seance)
      .innerJoin(User, sql`${Seance.teacherId} = ${User.id}`)
      .where(sql`${Seance.scheduleID} = ${scheduleId}`);

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