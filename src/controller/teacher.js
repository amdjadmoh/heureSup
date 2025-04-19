import {db} from "../db/index.js";
import { Teacher } from "../db/schema.js";
import { Grade } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { User } from "../db/schema.js";
import { RoleEnums } from "../db/schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { eq, ne, gt, gte } from "drizzle-orm";
config();


export const getTeachers = async (req, res) => {
    try {
        const teachers = await db.select().from(Teacher).innerJoin(User, eq(User.id,Teacher.id)).innerJoin(Grade, eq(Grade.id,Teacher.gradeId));
        return res.status(200).json(teachers);
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await db.select().from(Teacher).innerJoin(User, eq(User.id,Teacher.id)).innerJoin(Grade, eq(Grade.id,Teacher.gradeId)).where(sql`${Teacher.id} = ${id}`);
        if (teacher.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }
        return res.status(200).json(teacher[0]);
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await db.delete(Teacher).where(sql`${Teacher.id} = ${id}`);
        // Delete the user associated with the teacher
        await db.delete(User).where(sql`${User.id} = ${id}`);
        return res.status(200).json({ message: "Teacher deleted successfully" });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const updateTeacher = async (req, res) => {
    try {
        const { id, firstName, lastName, email, role, gradeId } = req.body;

        // Check if the user exists
        const existingUser = await db.select().from(User).where(sql`${User.id} = ${id}`);
        if (existingUser.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if the grade ID is valid
        const validGradeIds = await db.select().from(Grade).where(sql`${Grade.id} = ${gradeId}`);
        if (validGradeIds.length === 0) {
            return res.status(400).json({ error: "Invalid grade ID" });
        }
        // Check if the role is valid
        const validRoles = Object.values(RoleEnums.enumValues);
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        // Update the user
        await db.update(User).set({
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
        }).where(sql`${User.id} = ${id}`);
        // Update the teacher
        await db.update(Teacher).set({
            gradeId: gradeId,
        }).where(sql`${Teacher.id} = ${id}`);
        return res.status(200).json({ message: "Teacher updated successfully" });
    } catch (error) {
        console.error("Error updating teacher:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}