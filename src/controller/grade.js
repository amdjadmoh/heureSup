import {db} from "../db/index.js";
import { Grade } from "../db/schema.js";
import { sql } from "drizzle-orm";


export const createGrade = async (req, res) => {
    try {
        const { gradeName, pricePerHour } = req.body;
    
        if (!gradeName || !pricePerHour) {
        return res.status(400).json({ error: "All fields are required" });
        }
    
      
    
        // Check if the grade already exists
        const existingGrade = await db.select().from(Grade).where(sql`${Grade.GradeName} = ${gradeName}`);
        if (existingGrade.length > 0) {
        return res.status(409).json({ error: "Grade already exists" });
        }
    
        // Insert the new grade
        await db.insert(Grade).values({
        GradeName: gradeName,
        PricePerHour: pricePerHour,
        });
    
        return res.status(201).json({ message: "Grade created successfully" });
    } catch (error) {
        console.error("Error creating grade:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    }

export const getGrades = async (req, res) => {
    try {
        const grades = await db.select().from(Grade);
        return res.status(200).json(grades);
    } catch (error) {
        console.error("Error fetching grades:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const updateGrade = async (req, res) => {
    try {
        const { id, gradeName, pricePerHour } = req.body;
    
        if (!id || !gradeName || !pricePerHour) {
        return res.status(400).json({ error: "All fields are required" });
        }

     
        
    
        // Check if the grade exists
        const existingGrade = await db.select().from(Grade).where(sql`${Grade.id} = ${id}`);
        if (existingGrade.length === 0) {
        return res.status(404).json({ error: "Grade not found" });
        }
    
        // Update the grade
        await db.update(Grade).set({
        GradeName: gradeName,
        PricePerHour: pricePerHour,
        }).where(sql`${Grade.id} = ${id}`);
    
        return res.status(200).json({ message: "Grade updated successfully" });
    } catch (error) {
        console.error("Error updating grade:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteGrade = async (req, res) => {
    try {
        const { id } = req.body;
    
        if (!id) {
        return res.status(400).json({ error: "ID is required" });
        }
    
        // Check if the grade exists
        const existingGrade = await db.select().from(Grade).where(sql`${Grade.id} = ${id}`);
        if (existingGrade.length === 0) {
        return res.status(404).json({ error: "Grade not found" });
        }
    
        // Delete the grade
        await db.delete(Grade).where(sql`${Grade.id} = ${id}`);
    
        return res.status(200).json({ message: "Grade deleted successfully" });
    } catch (error) {
        console.error("Error deleting grade:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


