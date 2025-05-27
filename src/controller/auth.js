import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { User, Teacher, RoleEnums } from "../db/schema.js";

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user data in request
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, gradeID, paymentType, teacherType, accountNumber } = req.body;
    // Validate role
    
    // Validate input based on role
    if (role === "teacher") {
      if (!firstName || !lastName || !email || !password || !gradeID || !paymentType || !teacherType || !accountNumber) {
        return res.status(400).json({ error: "All fields are required for teachers" });
      }
    } else {
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
    }

    // Check if the user already exists
    const existingUser = await db.select().from(User).where(eq(User.email, email));
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await db.insert(User).values({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    // Retrieve the inserted user
    const [newUser] = await db.select().from(User).where(eq(User.email, email)).limit(1);

    // If teacher, insert into Teacher table
    if (role === "teacher") {
      await db.insert(Teacher).values({
        id: newUser.id,
        gradeId: gradeID,
        paymentType,
        teacherType,
        accountNumber,
      });
    }

    return res.status(201).json({ message: "User signed up successfully" });
  } catch (error) {
    console.error("Error signing up user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const [user] = await db.select().from(User).where(eq(User.email, email));
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set JWT in httpOnly cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/auth/me
export const getCurrentUser = [
  authenticateToken,
  (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
      },
    });
  },
];

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logged out successfully" });
};

// PUT /api/auth/update-profile
export const updateProfile = [
  authenticateToken,
  async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Validate input
      if (!firstName && !lastName && !email && !password) {
        return res.status(400).json({ error: "At least one field must be provided" });
      }

      // Check if email is already in use (excluding current user)
      if (email && email !== req.user.email) {
        const existingUser = await db.select().from(User).where(eq(User.email, email));
        if (existingUser.length > 0) {
          return res.status(409).json({ error: "Email already exists" });
        }
      }

      // Prepare update data
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      // Update user
      await db.update(User).set(updateData).where(eq(User.id, req.user.id));

      // Generate new JWT with updated data
      const updatedUser = {
        id: req.user.id,
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        email: email || req.user.email,
        role: req.user.role,
      };
      const newToken = jwt.sign(updatedUser, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      // Update cookie
      res.cookie("access_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];