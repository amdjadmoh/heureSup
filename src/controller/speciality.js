const { db } = require("../db/index.js");
const { Speciality } = require("../db/schema.js");
const { sql } = require("drizzle-orm");

exports.createSpeciality = async (req, res) => {
    try {
        const { name } = req.body;

        const existingSpeciality = await db.select().from(Speciality).where(sql`${Speciality.name} = ${name}`);
        if (existingSpeciality.length > 0) {
            return res.status(400).json({ error: "Speciality already exists" });
        }

        const newSpeciality = await db.insert(Speciality).values({ name }).returning();
        return res.status(201).json(newSpeciality[0]);
    } catch (error) {
        console.error("Error creating speciality:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getSpecialities = async (req, res) => {
    try {
        const specialities = await db.select().from(Speciality);
        return res.status(200).json(specialities);
    } catch (error) {
        console.error("Error fetching specialities:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getSpecialityById = async (req, res) => {
    try {
        const { id } = req.params;
        const speciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${id}`);
        if (speciality.length === 0) {
            return res.status(404).json({ error: "Speciality not found" });
        }
        return res.status(200).json(speciality[0]);
    } catch (error) {
        console.error("Error fetching speciality:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateSpeciality = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const existingSpeciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${id}`);
        if (existingSpeciality.length === 0) {
            return res.status(404).json({ error: "Speciality not found" });
        }

        await db.update(Speciality).set({ name }).where(sql`${Speciality.id} = ${id}`);
        return res.status(200).json({ message: "Speciality updated successfully" });
    } catch (error) {
        console.error("Error updating speciality:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteSpeciality = async (req, res) => {
    try {
        const { id } = req.params;

        const existingSpeciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${id}`);
        if (existingSpeciality.length === 0) {
            return res.status(404).json({ error: "Speciality not found" });
        }

        await db.delete(Speciality).where(sql`${Speciality.id} = ${id}`);
        return res.status(200).json({ message: "Speciality deleted successfully" });
    } catch (error) {
        console.error("Error deleting speciality:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};