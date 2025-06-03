import { db } from "../db/index.js";
import { externalSeances, Teacher, User, Grade } from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";

export const createExternalSeance = async (req, res) => {
    const { module, group, startTime, endTime, teacherId ,day,type} = req.body;
    try {
        // Validate required fields
        if (!module || !group || !startTime || !endTime || !teacherId || !day || !type) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if teacher exists
        const teacher = await db.select().from(Teacher).where(eq(Teacher.id, teacherId));
        if (teacher.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }
        await db.insert(externalSeances).values({
            module,
            group,
            startTime,
            endTime,
            teacherId,
            day,
            type
        });


       
        return res.status(201).json({ message: "External seance created successfully" });
    } catch (error) {
        console.error('Error creating external seance:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

export const getExternalSeances = async (req, res) => {
    try {
        const seances = await db.select({
            id: externalSeances.id,
            module: externalSeances.module,
            group: externalSeances.group,
            startTime: externalSeances.startTime,
            endTime: externalSeances.endTime,
            teacherId: externalSeances.teacherId,
            teacherName: sql`${User.firstName} || ' ' || ${User.lastName}`.as('teacherName')
        })
        .from(externalSeances)
        .innerJoin(Teacher, eq(externalSeances.teacherId, Teacher.id))
        .innerJoin(User, eq(Teacher.id, User.id));

        return res.status(200).json(seances);
    } catch (error) {
        console.error('Error fetching external seances:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

export const getExternalSeancesByTeacher = async (req, res) => {
    const { teacherId } = req.params;
    try {
        if (!teacherId) {
            return res.status(400).json({ error: "Teacher ID is required" });
        }

        const query = await db.select()
        .from(externalSeances)
        .where(eq(externalSeances.teacherId, teacherId));

     


        return res.status(200).json( query);
    } catch (error) {
        console.error('Error fetching external seances by teacher:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}

  