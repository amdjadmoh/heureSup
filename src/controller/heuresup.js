import { HeureSup,ScheduleSession ,Schedule, Teacher, Seance,Grade, SeanceTypeCoefficient} from "../db/schema.js";   
import { db } from "../db/index.js";
import { sql,inArray ,eq} from "drizzle-orm" 
// export const getScheduleOfTeacher = async function (req, res) {
//     const { teacherId } = req.params;
//     try {
//         // Check if the teacher exists
//         const teacher = await db.select().from(Teacher).where(sql`${Teacher.id} = ${teacherId}`);
//         if (teacher.length === 0) {
//             return res.status(404).json({ message: "Teacher not found" });
//         }

//         // Get all seances for the teacher
//         const seances = await db.select().from(Seance).where(sql`${Seance.teacherId} = ${teacherId}`);
//         if (seances.length === 0) {
//             return res.status(404).json({ message: "No seances found for this teacher" });
//         }
//         // Mark the suplemntary seances
//         const heuresup = await db.select().from(HeureSup).where(sql`${HeureSup.teacherId} = ${teacherId}`);
//         // get scheduleSession ids from heuresup
//         const sessionIds = heuresup.map(heure => heure.scheduleSessionId);
//         // Get all schedule sessions for the teacher
//         const scheduleSessions = await db.select().from(ScheduleSession).where(inArray(ScheduleSession.id, sessionIds));
//         // if there are multiple schedule sessions with the same scheduleId, keep only the latest one
//         const scheduleSessionIds = scheduleSessions.map(session => session.scheduleId);
//         const scheduleSessionsMap = new Map();
//         scheduleSessions.forEach(session => {
//             if (!scheduleSessionsMap.has(session.scheduleId)) {
//                 scheduleSessionsMap.set(session.scheduleId, session);
//             } else {
//                 const existingSession = scheduleSessionsMap.get(session.scheduleId);
//                 if (new Date(session.startDate) > new Date(existingSession.startDate)) {
//                     scheduleSessionsMap.set(session.scheduleId, session);
//                 }
//             }
//         });
//         // keep heuresup that have scheduleSessionId in scheduleSessionsMap
//         const filteredHeuresup = heuresup.filter(heure => scheduleSessionsMap.has(heure.scheduleSessionId));
//         console.log(filteredHeuresup);
//         return res.status(200).json(scheduleSessions);
//     } catch (error) {
//         console.error("Error fetching schedule sessions:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// }

// export const get = async function (req, res) {
//     const { teacherId } = req.params;
//     try {
//         // Check if the teacher exists
//         const teacher = await db.select().from(Teacher).where(sql`${Teacher.id} = ${teacherId}`);
//         if (teacher.length === 0) {
//             return res.status(404).json({ message: "Teacher not found" });
//         }

//         // Check if the teacher has any hours
//         const heuresup = await db.select().from(HeureSup) .innerJoin(Seance, eq(HeureSup.seanceId, Seance.id)).where(sql`${HeureSup.teacherId} = ${teacherId}`);
//         console.log(heuresup);
//         if (heuresup.length === 0) {
//             return res.status(404).json({ message: "No hours found for this teacher" });
//         }
//         // Group by session ID
//         const groupedHeureSup = heuresup.reduce((acc, heure) => {
//             const sessionId = heure.scheduleSessionId;
//             if (!acc[sessionId]) {
//                 acc[sessionId] = [];
//             }
//             acc[sessionId].push(heure);
//             return acc;
//         }, {});

//         // Get all schedule sessions
//         const scheduleSessionIds = Object.keys(groupedHeureSup);
//         const scheduleSessions = await db.select().from(ScheduleSession).where(inArray(ScheduleSession.id, scheduleSessionIds));
        
//         // Group sessions by scheduleId to find duplicates
//         const sessionsByScheduleId = scheduleSessions.reduce((acc, session) => {
//             const scheduleId = session.scheduleId;
//             if (!acc[scheduleId]) {
//                 acc[scheduleId] = [];
//             }
//             acc[scheduleId].push(session);
//             return acc;
//         }, {});

//         // Create a Set to track which session IDs to remove
//         const scheduleSessionIdsToRemove = new Set();

//         // For each group of sessions with the same scheduleId
//         Object.values(sessionsByScheduleId).forEach(sessions => {
//             // If there's more than one session with the same scheduleId
//             if (sessions.length > 1) {
//                 // Sort by startDate descending (latest first)
//                 sessions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
                
//                 // Keep the first one (latest), mark the rest for removal
//                 for (let i = 1; i < sessions.length; i++) {
//                     scheduleSessionIdsToRemove.add(sessions[i].id.toString());
//                 }
//             }
//         });

//         // Filter out sessions that should be removed
//         const filteredGroupedHeureSup = Object.fromEntries(
//             Object.entries(groupedHeureSup).filter(([key]) => !scheduleSessionIdsToRemove.has(key))
//         );

//         // Create the result with relevant information
//         const result = [];
//         for (const [sessionId, hours] of Object.entries(filteredGroupedHeureSup)) {
//             const session = scheduleSessions.find(s => s.id == sessionId);
            
//             // Calculate total hours and amount
//             let totalHours = 0;
//             hours.forEach(hour => {
//                 totalHours += hour.duration || 0;
//             });
            
//             result.push({
//                 sessionId: parseInt(sessionId),
//                 startDate: session.startDate,
//                 endDate: session.finishDate,
//                 totalHours: totalHours,
//                 details: hours
//             });
//         }

//         return res.status(200).json(result);
     
//     } catch (error) {
//         console.error("Error fetching hours:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// }
