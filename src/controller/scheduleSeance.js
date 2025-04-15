const { db } = require("../db/index.js");
const { Schedule, Seance, User, PromotionEnum, SemesterEnum, SpecialityEnum, DayEnum, SeanceTypeEnum } = require("../db/schema.js");
const { sql } = require("drizzle-orm");
const { DateTime } = require("luxon");

exports.createSchedule = async (req, res) => {
  try {
    const { promotion, semester, speciality } = req.body;

    if (!promotion || !semester || !speciality) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const validPromotions = Object.values(PromotionEnum.enumValues);
    const validSemesters = Object.values(SemesterEnum.enumValues);
    const validSpecialities = Object.values(SpecialityEnum.enumValues);

    if (!validPromotions.includes(promotion)) {
      return res.status(400).json({ error: "Invalid promotion value" });
    }
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({ error: "Invalid semester value" });
    }
    if (!validSpecialities.includes(speciality)) {
      return res.status(400).json({ error: "Invalid speciality value" });
    }

    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotion} = ${promotion} AND ${Schedule.semester} = ${semester} AND ${Schedule.speciality} = ${speciality}`
      );

    if (existingSchedule.length > 0) {
      return res.status(400).json({ error: "Schedule already exists" });
    }

    await db.insert(Schedule).values({
      promotion,
      semester,
      speciality,
    });

    const newSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotion} = ${promotion} AND ${Schedule.semester} = ${semester} AND ${Schedule.speciality} = ${speciality}`
      );

    return res.status(201).json({ schedule: newSchedule[0] });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getSchedules = async (req, res) => {
  try {
    const schedules = await db.select().from(Schedule);
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
    const { id, promotion, semester, speciality } = req.body;

    if (!id || !promotion || !semester || !speciality) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const validPromotions = Object.values(PromotionEnum.enumValues);
    const validSemesters = Object.values(SemesterEnum.enumValues);
    const validSpecialities = Object.values(SpecialityEnum.enumValues);

    if (!validPromotions.includes(promotion)) {
      return res.status(400).json({ error: "Invalid promotion value" });
    }
    if (!validSemesters.includes(semester)) {
      return res.status(400).json({ error: "Invalid semester value" });
    }
    if (!validSpecialities.includes(speciality)) {
      return res.status(400).json({ error: "Invalid speciality value" });
    }

    const existingSchedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${id}`);

    if (existingSchedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const duplicateSchedule = await db
      .select()
      .from(Schedule)
      .where(
        sql`${Schedule.promotion} = ${promotion} AND ${Schedule.semester} = ${semester} AND ${Schedule.speciality} = ${speciality} AND ${Schedule.id} != ${id}`
      );

    if (duplicateSchedule.length > 0) {
      return res.status(400).json({ error: "Another schedule with these values already exists" });
    }

    await db
      .update(Schedule)
      .set({
        promotion,
        semester,
        speciality,
      })
      .where(sql`${Schedule.id} = ${id}`);

    return res.status(200).json({ message: "Schedule updated successfully" });
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
    const { day, startTime, endTime, location, type, module, group, profId } = req.body;
    const { scheduleId } = req.params;

    if (!day || !startTime || !endTime || !location || !type || !module || !group || !profId || !scheduleId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const validDays = Object.values(DayEnum.enumValues);
    const validTypes = Object.values(SeanceypeEnum.enumValues);

    if (!validDays.includes(day)) {
      return res.status(400).json({ error: "Invalid day value" });
    }
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type value" });
    }

    const schedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${scheduleId}`);

    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const prof = await db
      .select()
      .from(User)
      .where(sql`${User.id} = ${profId}`);

    if (prof.length === 0) {
      return res.status(404).json({ error: "Professor not found" });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: "Invalid time format (use HH:MM:SS)" });
    }

    if (location.length > 10) {
      return res.status(400).json({ error: "Location must be 10 characters or less" });
    }
    if (module.length > 50) {
      return res.status(400).json({ error: "Module must be 50 characters or less" });
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
      profId,
      scheduleId,
      isHeurSupp: true, 
    });

    const newSeance = await db
      .select()
      .from(Seance)
      .where(
        sql`${Seance.day} = ${day} AND ${Seance.startTime} = ${startTime} AND ${Seance.scheduleId} = ${scheduleId} AND ${Seance.profId} = ${profId}`
      );

    await supplementary(newSeance[0]);

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

    const schedule = await db
      .select()
      .from(Schedule)
      .where(sql`${Schedule.id} = ${scheduleId}`);

    if (schedule.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const seances = await db
      .select()
      .from(Seance)
      .where(sql`${Seance.scheduleId} = ${scheduleId}`);

    for (let seance of seances) {
      const prof = await db
        .select()
        .from(User)
        .where(sql`${User.id} = ${seance.profId}`);
      if (prof.length > 0) {
        seance.firstName = prof[0].firstName;
        seance.lastName = prof[0].lastName;
      }
    }

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

async function supplementary(seance) {
  const userId = seance.profId;
  const barrier = 18;
  const coef = 1.5;
  const unit = 2;
  let total = 0;
  try {
    let seances = await db
      .select()
      .from(Seance)
      .where(sql`${Seance.profId} = ${userId}`);

    if (seances.length > 0) {
      let i = 0;
      while (
        i < seances.length &&
        seances[i].type === "Cours" &&
        total < barrier
      ) {
        const startTime = DateTime.fromSQL(seances[i].startTime, { zone: "utc" });
        const endTime = DateTime.fromSQL(seances[i].endTime, { zone: "utc" });
        const durationInHours = calculateDuration(startTime, endTime);

        total += durationInHours * coef * unit;
        await db
          .update(Seance)
          .set({ isHeurSupp: false })
          .where(sql`${Seance.id} = ${seances[i].id}`);
        i++;
      }
      i = 0;
      while (i < seances.length && seances[i].type !== "Cours" && total < barrier) {
        const startTime = DateTime.fromSQL(seances[i].startTime, { zone: "utc" });
        const endTime = DateTime.fromSQL(seances[i].endTime, { zone: "utc" });
        const durationInHours = calculateDuration(startTime, endTime);

        total += durationInHours * unit;

        await db
          .update(Seance)
          .set({ isHeurSupp: false })
          .where(sql`${Seance.id} = ${seances[i].id}`);
        i++;
      }
    }
  } catch (error) {
    console.error("Error in supplementary:", error);
  }
}

function calculateDuration(startTime, endTime) {
  const diffInMilliseconds = endTime.diff(startTime).milliseconds;
  const durationInHours = diffInMilliseconds / (1000 * 60 * 60);
  return parseFloat(durationInHours.toFixed(2));
}