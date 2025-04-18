const { db } = require("../db/index.js");
const { SeanceTypeCoefficient, SeanceTypeEnum } = require("../db/schema.js");
const { sql } = require("drizzle-orm");

exports.createCoefficient = async (req, res) => {
  try {
    const { seanceType, value } = req.body;

    if (!seanceType || value == null) {
      return res.status(400).json({ error: "Seance type and value are required" });
    }

    const validTypes = SeanceTypeEnum.enumValues;
    if (!validTypes.includes(seanceType)) {
      return res.status(400).json({ error: "Invalid seance type" });
    }

    if (value <= 0) {
      return res.status(400).json({ error: "Value must be positive" });
    }

    const existing = await db
      .select()
      .from(SeanceTypeCoefficient)
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Coefficient for this seance type already exists" });
    }

    await db.insert(SeanceTypeCoefficient).values({
      seanceType,
      value,
    });

    const newCoefficient = await db
      .select()
      .from(SeanceTypeCoefficient)
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    return res.status(201).json({ coefficient: newCoefficient[0] });
  } catch (error) {
    console.error("Error creating coefficient:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCoefficients = async (req, res) => {
  try {
    const coefficients = await db.select().from(SeanceTypeCoefficient);
    return res.status(200).json({ coefficients });
  } catch (error) {
    console.error("Error fetching coefficients:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCoefficient = async (req, res) => {
  try {
    const { seanceType, value } = req.body;

    if (!seanceType || value == null) {
      return res.status(400).json({ error: "Seance type and value are required" });
    }

    const validTypes = SeanceTypeEnum.enumValues;
    if (!validTypes.includes(seanceType)) {
      return res.status(400).json({ error: "Invalid seance type" });
    }

    if (value <= 0) {
      return res.status(400).json({ error: "Value must be positive" });
    }

    const existing = await db
      .select()
      .from(SeanceTypeCoefficient)
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Coefficient not found" });
    }

    await db
      .update(SeanceTypeCoefficient)
      .set({ value })
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    return res.status(200).json({ message: "Coefficient updated successfully" });
  } catch (error) {
    console.error("Error updating coefficient:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCoefficient = async (req, res) => {
  try {
    const { seanceType } = req.params;

    if (!seanceType) {
      return res.status(400).json({ error: "Seance type is required" });
    }

    const existing = await db
      .select()
      .from(SeanceTypeCoefficient)
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    if (existing.length === 0) {
      return res.status(404).json({ error: "Coefficient not found" });
    }

    await db
      .delete(SeanceTypeCoefficient)
      .where(sql`${SeanceTypeCoefficient.seanceType} = ${seanceType}`);

    return res.status(200).json({ message: `Coefficient for seance type '${seanceType}' deleted successfully` });
  } catch (error) {
    console.error("Error deleting coefficient:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};