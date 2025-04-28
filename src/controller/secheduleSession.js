import { HeureSup,ScheduleSession ,Schedule, Teacher, Seance,Grade, SeanceTypeCoefficient,User} from "../db/schema.js";    

import { db } from "../db/index.js";
import { sql ,eq} from "drizzle-orm"
const dayOrder = {
    "sunday": 0,
    "monday": 1, 
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6
  };
function calculateTimeDifference(startTimeStr, endTimeStr) {
    // Create date objects using a common date (e.g., Jan 1, 1970)
    const startTime = new Date(`1970-01-01T${startTimeStr}`);
    const endTime = new Date(`1970-01-01T${endTimeStr}`);
    
    // Calculate difference in milliseconds
    const diffMs = endTime - startTime;
    
    // Convert to hours
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours;
  }
export const calculateHeureSup = async function (ScheduleSessionId) {
    try {
        const scheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.id} = ${ScheduleSessionId}`);
        if (scheduleSession.length === 0) {
            return null; // No schedule session found
        }
        const Teachers = await db.select().from(Teacher);
        Teachers.forEach(async (teacher) => {
            // get all seances of a teacher in the selected schedule 
            const seances = await db.select().from(Seance).where(sql`${Seance.scheduleSessionId} = ${ScheduleSessionId} AND ${Seance.teacherId} = ${teacher.id}`);
            // sort the seances by day and start time
            seances.sort((a, b) => {
                // Compare days first
                if (dayOrder[a.day] !== dayOrder[b.day]) {
                  return dayOrder[a.day] - dayOrder[b.day];
                }
                
                // If same day, compare times
                // Convert time strings to Date objects for comparison
                const aTime = new Date(`1970-01-01T${a.startTime}`);
                const bTime = new Date(`1970-01-01T${b.startTime}`);
                return aTime - bTime;
              });
            // get the charge of the teacher
            const grade = await db.select().from(Grade).where(sql`${Grade.id} = ${teacher.gradeId}`);
            const charge = grade[0].charge;
            let calculatedCharge = 0;
            // get coefs 
            const seanceTypeCoefs = await db.select().from(SeanceTypeCoefficient);
            const seanceTypeCoefMap = new Map();
            seanceTypeCoefs.forEach((seanceTypeCoef) => {
                seanceTypeCoefMap.set(seanceTypeCoef.seanceType, seanceTypeCoef.value);
            } )
                

            // get the first courses of the teacher
            seances.forEach(async (seance)=>{
                if (seance.type === "cours") {
                    const startTime = seance.startTime;
                    const endTime = seance.endTime;
                    // convert the duration to hours
                    const durationInHours = calculateTimeDifference(startTime, endTime);
                    const coursDuration = durationInHours * seanceTypeCoefMap.get(seance.type); 
                   // check if the duration + calculatedCharge is less than the charge
                   console.log(coursDuration,durationInHours, charge, calculatedCharge);
                    if (calculatedCharge+coursDuration <= charge) {
                        calculatedCharge += coursDuration;
                    } else if (calculatedCharge!= charge) {
                        const diffrerence = charge - calculatedCharge;
                        calculatedCharge += diffrerence;
                        // add to the heure sup table
                        const heureSup = await db.insert(HeureSup).values({
                            teacherId: teacher.id,
                            scheduleSessionId: ScheduleSessionId,
                            seanceId: seance.id,
                            duration: durationInHours - diffrerence,
                        });
                    }
                    else {
                        // add to the heure sup table
                        const heureSup = await db.insert(HeureSup).values({
                            teacherId: teacher.id,
                            scheduleSessionId: ScheduleSessionId,
                            seanceId: seance.id,
                            duration: durationInHours 
                        });

                    }
                }

            })
            // the rest of the seances
            seances.forEach(async (seance)=>{
                if (seance.type === "td" || seance.type === "tp") {
                    const startTime = seance.startTime;
                    const endTime = seance.endTime;
                    const durationInHours = calculateTimeDifference(startTime, endTime);
                    const tdtpDuration = durationInHours * seanceTypeCoefMap.get(seance.type);
                    // check if the duration + calculatedCharge is less than the charge
                    if (calculatedCharge+tdtpDuration <= charge) {
                        calculatedCharge += tdtpDuration;
                    } else if (calculatedCharge!= charge) {
                        const diffrerence = charge - calculatedCharge;
                        calculatedCharge += diffrerence;
                        // add to the heure sup table
                        const heureSup = await db.insert(HeureSup).values({
                            teacherId: teacher.id,
                            scheduleSessionId: ScheduleSessionId,
                            seanceId: seance.id,
                            duration: durationInHours - diffrerence,
                        });
                    }
                    else {
                        // add to the heure sup table
                        const heureSup = await db.insert(HeureSup).values({
                            teacherId: teacher.id,
                            scheduleSessionId: ScheduleSessionId,
                            seanceId: seance.id,
                            duration: durationInHours 
                        });

                    }
                }

            })


        })
        return true; // Success

        } catch (error) {
        console.error("Error calculating heure sup:", error);
        return null;
    }
}

export const createScheduleSession = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const {startDate, endDate} = req.query;
        if (!startDate  || !scheduleId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Check if the schedule session already exists
        let existingScheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.startDate} = ${startDate} AND ${ScheduleSession.scheduleId} = ${scheduleId}`);
        if (existingScheduleSession.length > 0) {
            return res.status(409).json({ error: "Schedule session already exists" });
        }
        // Insert the new schedule session
        await db.insert(ScheduleSession).values({
            startDate: startDate,
            scheduleId: scheduleId,
            endDate  : endDate| null,
        });
        existingScheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.startDate} = ${startDate} AND ${ScheduleSession.scheduleId} = ${scheduleId}`);
      
        return res.status(201).json({ message: "Schedule session created successfully" });
    } catch (error) {
        console.error("Error creating schedule session:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const closeTheScheduleSession = async (req, res) => {
    try {
        const { scheduleSessionId } = req.params;
        if (!scheduleSessionId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Check if the schedule session exists
        const scheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
        if (scheduleSession.length === 0) {
            return res.status(404).json({ error: "Schedule session not found" });
        }
        // Update the schedule session to closed
        await db.update(ScheduleSession).set({ closed: true }).where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
        // Calculate the heure sup for the schedule session
        const result = await calculateHeureSup(scheduleSessionId);
        if (result) {
            return res.status(200).json({ message: "Schedule session closed successfully and heure sup calculated" });
        } else {
            return res.status(500).json({ error: "Error calculating heure sup" });
        }
    }
    catch (error) {
        console.error("Error closing schedule session:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const getScheduleSession = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        if (!scheduleId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Get all schedule sessions for the given schedule ID
        const scheduleSessions = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.scheduleId} = ${scheduleId}`);
        if (scheduleSessions.length === 0) {
            return res.status(404).json({ message: "No schedule sessions found" });
        }
        return res.status(200).json(scheduleSessions);
    } catch (error) {
        console.error("Error fetching schedule sessions:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const deleteScheduleSession = async (req, res) => {
    try {
        const { scheduleSessionId } = req.params;
        if (!scheduleSessionId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Delete the schedule session
        await db.delete(ScheduleSession).where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
        // Delete the corresponding heuresup
        await db.delete(HeureSup).where(sql`${HeureSup.scheduleSessionId} = ${scheduleSessionId}`);
        // Delete the corresponding seances
        await db.delete(Seance).where(sql`${Seance.scheduleSessionId} = ${scheduleSessionId}`);
        return res.status(200).json({ message: "Schedule session deleted successfully" });
    } catch (error) {
        console.error("Error deleting schedule session:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateScheduleSession = async (req, res) => {
    try {
        const { scheduleSessionId } = req.params;
        const { startDate, endDate } = req.query;
        if (!scheduleSessionId || !startDate || !endDate) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Update the schedule session
        await db.update(ScheduleSession).set({
            startDate: startDate,
            endDate: endDate,
        }).where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
        return res.status(200).json({ message: "Schedule session updated successfully" });
    } catch (error) {
        console.error("Error updating schedule session:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getScheduleSessionById = async (req, res) => {
    try {
        const { scheduleSessionId } = req.params;
        if (!scheduleSessionId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Get the schedule session by ID
        const scheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.id} = ${scheduleSessionId}`);
        if (scheduleSession.length === 0) {
            return res.status(404).json({ message: "No schedule session found" });
        }
        return res.status(200).json(scheduleSession[0]);
    } catch (error) {
        console.error("Error fetching schedule session:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getScheduleSessionByScheduleId = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        if (!scheduleId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Get the schedule session by ID
        const scheduleSession = await db.select().from(ScheduleSession).where(sql`${ScheduleSession.scheduleId} = ${scheduleId}`);
        if (scheduleSession.length === 0) {
            return res.status(404).json({ message: "No schedule session found" });
        }
        return res.status(200).json(scheduleSession[0]);
    } catch (error) {
        console.error("Error fetching schedule session:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getSeancesByScheduleSessionId = async (req, res) => {
    try {
        const { scheduleSessionId } = req.params;
        if (!scheduleSessionId) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Get the seances by schedule session ID
        const seances = await db.select().from(Seance).innerJoin(User,eq(Seance
            .teacherId,User.id)).where(sql`${Seance.scheduleSessionId} = ${scheduleSessionId}`);
        if (seances.length === 0) {
            return res.status(404).json({ message: "No seances found" });
        }
        return res.status(200).json(seances);
    } catch (error) {
        console.error("Error fetching seances:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}



