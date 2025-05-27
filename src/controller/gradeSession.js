import { Teacher, Grade, GradeSession } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq, and, between, isNull } from "drizzle-orm";

// Get all grade sessions for a teacher
export const getGradeSessions = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }
    
    const gradeSessions = await db.select({
      id: GradeSession.id,
      startDate: GradeSession.startDate,
      finishDate: GradeSession.finishDate,
      teacherId: GradeSession.teacherId,
      gradeId: GradeSession.gradeId,
      gradeName: Grade.GradeName,
      hourlyRate: Grade.PricePerHour
    })
    .from(GradeSession)
    .innerJoin(Grade, eq(GradeSession.gradeId, Grade.id))
    .where(eq(GradeSession.teacherId, teacherId))
    .orderBy(GradeSession.startDate);
    
    return res.status(200).json(gradeSessions);
  } catch (error) {
    console.error('Error getting grade sessions:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Create a new grade session
export const createGradeSession = async (req, res) => {
  try {
    const { teacherId, gradeId, startDate } = req.body;
    
    if (!teacherId || !gradeId || !startDate) {
      return res.status(400).json({ error: "teacherId, gradeId, and startDate are required" });
    }
    
    // Check if teacher exists
    const teacher = await db.select().from(Teacher).where(eq(Teacher.id, teacherId));
    if (teacher.length === 0) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    
    // Check if grade exists
    const grade = await db.select().from(Grade).where(eq(Grade.id, gradeId));
    if (grade.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }
    
    // Parse date to ensure correct format
    const parsedStartDate = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
  ));  
       if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ error: "Invalid start date format. Use YYYY-MM-DD" });
    }
    
    // Find any existing open session for this teacher (with null finishDate)
    const existingOpenSessions = await db
      .select()
      .from(GradeSession)
      .where(
        and(
          eq(GradeSession.teacherId, teacherId),
          isNull(GradeSession.finishDate)
        )
      );
    
    // Close any open sessions as of the day before the new session starts
    if (existingOpenSessions.length > 0) {
      const previousDay = new Date(parsedStartDate);
      previousDay.setDate(previousDay.getDate() - 1);
      
      for (const session of existingOpenSessions) {
        await db
          .update(GradeSession)
          .set({ finishDate: previousDay.toISOString().split('T')[0] })
          .where(eq(GradeSession.id, session.id));
      }
    }
    // next day

    
    // Create new session
    const newSession = await db
      .insert(GradeSession)
      .values({
        teacherId: teacherId,
        gradeId: gradeId,
        startDate: parsedStartDate.toISOString().split('T')[0],
        finishDate: null  // Open-ended session
      })
      .returning();
    
    // Update teacher's current grade
    await db
      .update(Teacher)
      .set({ gradeId: gradeId })
      .where(eq(Teacher.id, teacherId));
      
    return res.status(201).json(newSession[0]);
  } catch (error) {
    console.error('Error creating grade session:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update a grade session
export const updateGradeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { finishDate } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: "Session ID is required" });
    }
    
    // Check if session exists
    const session = await db.select().from(GradeSession).where(eq(GradeSession.id, id));
    if (session.length === 0) {
      return res.status(404).json({ error: "Grade session not found" });
    }
    
    // Only allow updating the finishDate
    if (finishDate) {
      const parsedFinishDate = new Date(finishDate);
      if (isNaN(parsedFinishDate.getTime())) {
        return res.status(400).json({ error: "Invalid finish date format. Use YYYY-MM-DD" });
      }
      
      // Ensure finishDate is not before startDate
      const startDate = new Date(session[0].startDate);
      if (parsedFinishDate < startDate) {
        return res.status(400).json({ error: "Finish date cannot be before start date" });
      }
      
      const updatedSession = await db
        .update(GradeSession)
        .set({ finishDate: parsedFinishDate.toISOString().split('T')[0] })
        .where(eq(GradeSession.id, id))
        .returning();
        
      return res.status(200).json(updatedSession[0]);
    } else {
      return res.status(400).json({ error: "No valid fields to update" });
    }
  } catch (error) {
    console.error('Error updating grade session:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Delete a grade session
export const deleteGradeSession = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Session ID is required" });
    }
    
    // Check if session exists
    const session = await db.select().from(GradeSession).where(eq(GradeSession.id, id));
    if (session.length === 0) {
      return res.status(404).json({ error: "Grade session not found" });
    }
    
    await db.delete(GradeSession).where(eq(GradeSession.id, id));
    
    return res.status(200).json({ message: "Grade session deleted successfully" });
  } catch (error) {
    console.error('Error deleting grade session:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const getGradeSessionsOfTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }
    
    const gradeSessions = await db.select({
      id: GradeSession.id,
      startDate: GradeSession.startDate,
      finishDate: GradeSession.finishDate,
      teacherId: GradeSession.teacherId,
      gradeId: GradeSession.gradeId,
      gradeName: Grade.GradeName,
      hourlyRate: Grade.PricePerHour
    })
    .from(GradeSession)
    .innerJoin(Grade, eq(GradeSession.gradeId, Grade.id))
    .where(eq(GradeSession.teacherId, teacherId))
    .orderBy(GradeSession.startDate);
    
    return res.status(200).json(gradeSessions);
  } catch (error) {
    console.error('Error getting grade sessions of teacher:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
