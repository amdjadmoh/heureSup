const { db } = require("../db/index.js");
const { Holiday } = require("../db/schema.js");
const { sql } = require("drizzle-orm");

exports.createHoliday = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ error: "Start date cannot be after end date" });
        }

        const newHoliday = await db.insert(Holiday).values({ startDate, endDate }).returning();
        return res.status(201).json(newHoliday[0]);
    } catch (error) {
        console.error("Error creating holiday:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getHolidays = async (req, res) => {
    try {
        const holidays = await db.select().from(Holiday);
        return res.status(200).json(holidays);
    } catch (error) {
        console.error("Error fetching holidays:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getHolidayById = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await db.select().from(Holiday).where(sql`${Holiday.id} = ${id}`);
        if (holiday.length === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }
        return res.status(200).json(holiday[0]);
    } catch (error) {
        console.error("Error fetching holiday:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.body;

        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ error: "Start date cannot be after end date" });
        }

        const existingHoliday = await db.select().from(Holiday).where(sql`${Holiday.id} = ${id}`);
        if (existingHoliday.length === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }

        await db.update(Holiday).set({ startDate, endDate }).where(sql`${Holiday.id} = ${id}`);
        return res.status(200).json({ message: "Holiday updated successfully" });
    } catch (error) {
        console.error("Error updating holiday:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        const existingHoliday = await db.select().from(Holiday).where(sql`${Holiday.id} = ${id}`);
        if (existingHoliday.length === 0) {
            return res.status(404).json({ error: "Holiday not found" });
        }

        await db.delete(Holiday).where(sql`${Holiday.id} = ${id}`);
        return res.status(200).json({ message: "Holiday deleted successfully" });
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};