import express from "express";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import * as schema from '../db/schema.js';
import {User} from '../db/schema.js';
import {db} from "../db/index.js";
import { RoleEnums } from "../db/schema.js";
import { eq, ne, gt, gte } from "drizzle-orm";
import { Teacher } from "../db/schema.js";
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password,role } = req.body;
    if (role=="teacher"){
      const { gradeID } = req.body;
      if (!firstName || !lastName || !email || !password  || !role || !gradeID) {
        return res.status(400).json({ error: "All fields are required" });
      }
      // Check if the user already exists
      const existingUser = await db.select().from(User).where(sql`${User.email} = ${email}`);
      if (existingUser.length > 0) {
        return res.status(409).json({ error: "Email already exists" });
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user
      await db.insert(User).values({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashedPassword,
        role: role,
      });
      
      // Retrieve the inserted user by email
      const [newUser] = await db
        .select()
        .from(User)
        .where(eq(User.email,(email)))
        .limit(1);
      
      // Insert the new teacher
      await db.insert(Teacher).values({
        id: newUser.id, // Use the retrieved ID
        gradeId: gradeID,
      });
      
    } else {
    if (!firstName || !lastName || !email || !password  || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user already exists
    const existingUser = await db.select().from(User).where(sql`${User.email} = ${email}`);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }
 
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await db.insert(User).values({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
      role: role,
    });
  }
    return res.status(201).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Error signing up user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login= async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
// Check if the user exists
    const user = await db.select().from(User).where(sql`${User.email} = ${email}`);
    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: user[0].id,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        email: user[0].email,
        role: user[0].role,
            },
      process.env.JWT_SECRET,
      {
        expiresIn: "3000h",
      }
    );

    return res.status(200).cookie("access_token", token, { maxAge: 30 * 24 * 60 * 60 * 1000, })
      .json({ message: "Login successful" });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
