const { db } = require("../db/index.js");
const { Promotion, Speciality } = require("../db/schema.js");
const { sql } = require("drizzle-orm");

exports.createPromotion = async (req, res) => {
    try {
        const { name, specialityId } = req.body;

        const existingPromotion = await db.select().from(Promotion).where(sql`${Promotion.name} = ${name}`);
        if (existingPromotion.length > 0) {
            return res.status(400).json({ error: "Promotion already exists" });
        }

        if (specialityId) {
            const existingSpeciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${specialityId}`);
            if (existingSpeciality.length === 0) {
                return res.status(400).json({ error: "Invalid speciality ID" });
            }
        }

        const newPromotion = await db.insert(Promotion).values({ name, specialityId }).returning();
        return res.status(201).json(newPromotion[0]);
    } catch (error) {
        console.error("Error creating promotion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPromotions = async (req, res) => {
    try {
        const promotions = await db.select().from(Promotion).leftJoin(Speciality, sql`${Promotion.specialityId} = ${Speciality.id}`);
        return res.status(200).json(promotions);
    } catch (error) {
        console.error("Error fetching promotions:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPromotionById = async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await db.select().from(Promotion).leftJoin(Speciality, sql`${Promotion.specialityId} = ${Speciality.id}`).where(sql`${Promotion.id} = ${id}`);
        if (promotion.length === 0) {
            return res.status(404).json({ error: "Promotion not found" });
        }
        return res.status(200).json(promotion[0]);
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, specialityId } = req.body;

        const existingPromotion = await db.select().from(Promotion).where(sql`${Promotion.id} = ${id}`);
        if (existingPromotion.length === 0) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        if (specialityId) {
            const existingSpeciality = await db.select().from(Speciality).where(sql`${Speciality.id} = ${specialityId}`);
            if (existingSpeciality.length === 0) {
                return res.status(400).json({ error: "Invalid speciality ID" });
            }
        }

        await db.update(Promotion).set({ name, specialityId: specialityId || null }).where(sql`${Promotion.id} = ${id}`);
        return res.status(200).json({ message: "Promotion updated successfully" });
    } catch (error) {
        console.error("Error updating promotion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

exports.deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPromotion = await db.select().from(Promotion).where(sql`${Promotion.id} = ${id}`);
        if (existingPromotion.length === 0) {
            return res.status(404).json({ error: "Promotion not found" });
        }

        await db.delete(Promotion).where(sql`${Promotion.id} = ${id}`);
        return res.status(200).json({ message: "Promotion deleted successfully" });
    } catch (error) {
        console.error("Error deleting promotion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};