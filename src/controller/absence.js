const { db } = require("../db/index.js");
const { Absence, Seance, Teacher } = require("../db/schema.js");
const { sql } = require("drizzle-orm");

exports.createAbsence = async (req, res) => {
    try {
        const { date, seanceId, teacherId } = req.body;

        const seance = await db.select().from(Seance).where(sql`${Seance.id} = ${seanceId}`);
        if (seance.length === 0) {
            return res.status(400).json({ error: "Invalid seance ID" });
        }

        const teacher = await db.select().from(Teacher).where(sql`${Teacher.id} = ${teacherId}`);
        if (teacher.length === 0) {
            return res.status(400).json({ error: "Invalid teacher ID" });
        }

        const newAbsence = await db.insert(Absence).values({ date, seanceId, teacherId }).returning();
        return res.status(201).json(newAbsence[0]);
    } catch (error) {
        console.error("Error creating absence:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAbsences = async (req, res) => {
    try {
        const absences = await db.select().from(Absence);
        return res.status(200).json(absences);
    } catch (error) {
        console.error("Error fetching absences:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAbsenceById = async (req, res) => {
    try {
        const { id } = req.params;
        const absence = await db.select().from(Absence).where(sql`${Absence.id} = ${id}`);
        if (absence.length === 0) {
            return res.status(404).json({ error: "Absence not found" });
        }
        return res.status(200).json(absence[0]);
    } catch (error) {
        console.error("Error fetching absence:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateAbsence = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, seanceId, teacherId } = req.body;

        const existingAbsence = await db.select().from(Absence).where(sql`${Absence.id} = ${id}`);
        if (existingAbsence.length === 0) {
            return res.status(404).json({ error: "Absence not found" });
        }

        if (seanceId) {
            const seance = await db.select().from(Seance).where(sql`${Seance.id} = ${seanceId}`);
            if (seance.length === 0) {
                return res.status(400).json({ error: "Invalid seance ID" });
            }
        }

        if (teacherId) {
            const teacher = await db.select().from(Teacher).where(sql`${Teacher.id} = ${teacherId}`);
            if (teacher.length === 0) {
                return res.status(400).json({ error: "Invalid teacher ID" });
            }
        }

        await db.update(Absence).set({ date, seanceId, teacherId }).where(sql`${Absence.id} = ${id}`);
        return res.status(200).json({ message: "Absence updated successfully" });
    } catch (error) {
        console.error("Error updating absence:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteAbsence = async (req, res) => {
    try {
        const { id } = req.params;

        const existingAbsence = await db.select().from(Absence).where(sql`${Absence.id} = ${id}`);
        if (existingAbsence.length === 0) {
            return res.status(404).json({ error: "Absence not found" });
        }

        await db.delete(Absence).where(sql`${Absence.id} = ${id}`);
        return res.status(200).json({ message: "Absence deleted successfully" });
    } catch (error) {
        console.error("Error deleting absence:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};