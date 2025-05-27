import { Schedule, Teacher, Seance, Grade, SeanceTypeCoefficient, Holiday, Absence, User } from "../db/schema.js";   
import { db } from "../db/index.js";
import { sql, inArray, eq } from "drizzle-orm";
    import pdf from 'html-pdf';


// Define day order for sorting
const dayOrder = {
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6,
  "sunday": 0
};

// Helper function to calculate time difference (you'll need to implement this)
function calculateTimeDifference(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return (end - start) / (1000 * 60 * 60); // Return hours
}

async function getTeacherSeances(teacherID, startDate, endDate) {
  // get schedules in the date range
  const schedules = await db.select()
    .from(Schedule)
    .where(
      sql`${Schedule.startDate} <= ${endDate} AND ${Schedule.endDate} >= ${startDate}`
    );
  
  if (schedules.length === 0) {
    return [];
  }
  // Get all seances for the teacher in the schedules
  const seances = await db.select() 
    .from(Seance)
    .innerJoin(Teacher, eq(Seance.teacherId, Teacher.id))
    .where(
      sql`${Teacher.id} = ${teacherID} AND ${Seance.scheduleID} IN (${schedules.map(s => s.id)})`
    );
  
  if (seances.length === 0) {
    return [];
  }

  // Sort seances by day and start time
  return seances.map(row => row.Seance).sort((a, b) => {
    // Compare days first
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    
    // If same day, compare times
    const aTime = new Date(`1970-01-01T${a.startTime}`);
    const bTime = new Date(`1970-01-01T${b.startTime}`);
    return aTime - bTime;
  });
}

async function getTeacherCharge(teacherId) {
  const teacher = await db.select().from(Teacher).where(eq(Teacher.id, teacherId));
  if (teacher.length === 0) return 0;
  
  const grade = await db.select().from(Grade).where(eq(Grade.id, teacher[0].gradeId));
  return grade.length > 0 ? grade[0].charge : 0;
}

async function getSeanceTypeCoefficients() {
  const seanceTypeCoefs = await db.select().from(SeanceTypeCoefficient);
  const seanceTypeCoefMap = new Map();
  
  seanceTypeCoefs.forEach((seanceTypeCoef) => {
    seanceTypeCoefMap.set(seanceTypeCoef.seanceType, seanceTypeCoef.value);
  });
  
  return seanceTypeCoefMap;
}

async function processSeance(seance, calculatedCharge, charge, seanceTypeCoefMap) {
  const startTime = seance.startTime;
  const endTime = seance.endTime;
  const durationInHours = calculateTimeDifference(startTime, endTime);
  const weightedDuration = durationInHours * seanceTypeCoefMap.get(seance.type);
  
  // Check if the duration + calculatedCharge is less than the charge
  if (calculatedCharge + weightedDuration <= charge) {
    // This seance is fully covered by the teacher's charge
    return { 
      calculatedCharge: calculatedCharge + weightedDuration, 
      heureSupSeances: [] 
    };
  } else if (calculatedCharge !== charge) {
    // This seance is partially covered by the teacher's charge
    const difference = charge - calculatedCharge;
    const heureSupDuration = durationInHours - difference;
    
    // Update seance heureSupDuration
    await db.update(Seance)
      .set({ heureSupDuration })
      .where(eq(Seance.id, seance.id));
    
    // Store the seance info with heure sup duration
    const heureSupSeance = {
      ...seance,
      heureSupDuration,
    };
    
    return { 
      calculatedCharge: charge, 
      heureSupSeances: [heureSupSeance] 
    };
  } else {
    // This seance is entirely heure sup (charge already filled)
    await db.update(Seance)
      .set({ heureSupDuration: durationInHours })
      .where(eq(Seance.id, seance.id));
    
    const heureSupSeance = {
      ...seance,
      heureSupDuration: durationInHours,

    };
    
    return { 
      calculatedCharge: charge, 
      heureSupSeances: [heureSupSeance] 
    };
  }
}

async function calculateHeureSupForSeances(seances, calculatedCharge, charge, seanceTypeCoefMap) {
  let allHeureSupSeances = [];

  // Process "cours" type seances first
  for (const seance of seances.filter(seance => seance.type === "cours")) {
    const result = await processSeance(seance, calculatedCharge, charge, seanceTypeCoefMap);
    calculatedCharge = result.calculatedCharge;
    allHeureSupSeances = allHeureSupSeances.concat(result.heureSupSeances);
  }

  // Process "td" and "tp" type seances
  for (const seance of seances.filter(seance => seance.type === "td" || seance.type === "tp")) {
    const result = await processSeance(seance, calculatedCharge, charge, seanceTypeCoefMap);
    calculatedCharge = result.calculatedCharge;
    allHeureSupSeances = allHeureSupSeances.concat(result.heureSupSeances);
  }

  return { calculatedCharge, allHeureSupSeances };
}

const CalculatetHeureSup = async (teacherId, startDate, endDate) => {
  const seances = await getTeacherSeances(teacherId, startDate, endDate);
  const teacher = await db.select().from(Teacher).where(eq(Teacher.id, teacherId));

  const charge = await getTeacherCharge(teacherId);
  const seanceTypeCoefMap = await getSeanceTypeCoefficients();

  switch (teacher[0].teacherType) {
    case "permanent": {
      const { calculatedCharge, allHeureSupSeances } = await calculateHeureSupForSeances(
        seances,
        0,
        charge,
        seanceTypeCoefMap
      );

      const totalHeureSupHours = allHeureSupSeances.reduce(
        (total, seance) => total + (seance.heureSupDuration || 0),
        0
      );

      return {
        teacherId,
        totalHeureSupHours,
        totalChargeUsed: calculatedCharge,
        maxCharge: charge,
        heureSupSeances: allHeureSupSeances,
        dateRange: { startDate, endDate }
      };
    }

    case "vacataire": {
      const allHeureSupSeances = seances.map(seance => ({
        ...seance,
        heureSupDuration: calculateTimeDifference(seance.startTime, seance.endTime)
      }));

      const totalHeureSupHours = allHeureSupSeances.reduce(
        (total, seance) => total + (seance.heureSupDuration || 0),
        0
      );

      return {
        teacherId,
        totalHeureSupHours,
        totalChargeUsed: 0,
        maxCharge: 0,
        heureSupSeances: allHeureSupSeances,
        dateRange: { startDate, endDate }
      };
    }

    case "outsider": {
      const outsiderSeances = teacher[0].externalSeances || [];
      const { calculatedCharge: outsiderCharge, allHeureSupSeances: outsiderHeureSupSeances } =
        await calculateHeureSupForSeances(outsiderSeances, 0, charge, seanceTypeCoefMap);

      if (outsiderCharge >= charge) {
        const allHeureSupSeances = seances.map(seance => ({
          ...seance,
          heureSupDuration: calculateTimeDifference(seance.startTime, seance.endTime)
        }));
        const totalHeureSupHours = seances.reduce(
          (total, seance) => total + calculateTimeDifference(seance.startTime, seance.endTime),
          0
        );

        return {
          teacherId,
          totalHeureSupHours,
          totalChargeUsed: charge,
          maxCharge: charge,
          heureSupSeances: allHeureSupSeances,
          dateRange: { startDate, endDate }
        };
      } else {
        const { calculatedCharge, allHeureSupSeances } = await calculateHeureSupForSeances(
          seances,
          outsiderCharge,
          charge,
          seanceTypeCoefMap
        );

        const totalHeureSupHours = allHeureSupSeances.reduce(
          (total, seance) => total + (seance.heureSupDuration || 0),
          0
        );

        return {
          teacherId,
          totalHeureSupHours,
          totalChargeUsed: calculatedCharge,
          maxCharge: charge,
          heureSupSeances: allHeureSupSeances,
          dateRange: { startDate, endDate }
        };
      }
    }

    default:
      throw new Error("Unknown teacher type");
  }
};

export const getTeacherHeureSupByWeeks = async function (req, res) {
  const { startDate: startDateParam, endDate: endDateParam } = req.query;
  const { teacherId } = req.params;
  
  if (!teacherId) {
    return res.status(400).json({ message: "Teacher ID is required" });
  }

  if (!startDateParam || !endDateParam) {
    return res.status(400).json({ message: "startDate and endDate are required (format: YYYY-MM-DD)" });
  }

  try {
    // Parse and validate dates
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ message: "Start date must be before or equal to end date" });
    }

    // Check if the teacher exists
    const teacher = await db.select().from(Teacher).where(eq(Teacher.id, teacherId));
    if (teacher.length === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }
      // Calculate heure sup for the date range
    const heureSupData = await CalculatetHeureSup(teacherId, startDate, endDate);
    
    // Build date structure for weeks within the date range
    const dateRangeData = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Start from beginning of the start month
    
    const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); // Last day of end month
    
    while (currentDate <= lastMonth) {
      const monthObject = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        weeks: []
      };
        const monthDaysNumber = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      // Initialize all weeks for the month
      const weeklyData = new Map();
        // First, initialize all possible weeks for the month
      const totalWeeks = Math.ceil(monthDaysNumber / 7);
      for (let week = 1; week <= totalWeeks; week++) {
        weeklyData.set(week, 0);
      }
      
      // Process each day of the month
      for (let day = 1; day <= monthDaysNumber; day++) {
        const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        
        // Calculate week number (1-based)
        const weekNumber = Math.ceil(day / 7);
        
        // Only process dates within our actual range
        if (dateToCheck >= startDate && dateToCheck <= endDate) {
          const dayIndex = dateToCheck.getDay();
          let heuresupHours = 0;          // Format date for comparison
          const datetoCheckString = `${dateToCheck.getFullYear()}-${String(dateToCheck.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Get absences of that day
          const absences = await db.select().from(Absence).where(
            sql`${Absence.teacherId} = ${teacherId} AND ${Absence.date} = ${datetoCheckString}`
          );
          
          // Check if day is holiday date range
          const holidays = await db.select().from(Holiday).where(
            sql`${Holiday.startDate} <= ${datetoCheckString} AND ${Holiday.endDate} >= ${datetoCheckString}`
          );
          if (holidays.length === 0) { // Only count if not a holiday
            // Get heure sup hours of that day from the calculated data
            const heuresupOfDay = heureSupData.heureSupSeances.filter(seance => {
              const seanceDayNumber = seance.day === "monday" ? 1 : 
                                      seance.day === "tuesday" ? 2 : 
                                      seance.day === "wednesday" ? 3 : 
                                      seance.day === "thursday" ? 4 : 
                                      seance.day === "friday" ? 5 : 
                                      seance.day === "saturday" ? 6 : 0;
              
              // Check if seance is on absences
              const seanceId = seance.id;
              const isSeanceOnAbsences = absences.some(absence => absence.seanceId === seanceId);
              
              if (isSeanceOnAbsences) {
                return false; // Exclude this seance if it's on an absence
              }
              
              return dayIndex === seanceDayNumber;
            });
            
            if (heuresupOfDay.length > 0) {
              heuresupOfDay.forEach(seance => {
                heuresupHours += seance.heureSupDuration || 0;
              });
            }
          }
          
          // Add hours to the week
          weeklyData.set(weekNumber, weeklyData.get(weekNumber) + heuresupHours);
        }
      }
      
      // Convert weekly data to the expected format
      weeklyData.forEach((hours, weekNumber) => {
        monthObject.weeks.push({
          week: weekNumber,
          heuresupHours: hours
        });
      });
      
      // Sort weeks by week number
      monthObject.weeks.sort((a, b) => a.week - b.week);
        // Always add month (even if all weeks have 0 hours, they should still be shown)
      dateRangeData.push(monthObject);
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    // Return the date range data with weeks and heuresup hours, plus summary
    return res.status(200).json({
      dateRange: {
        startDate: startDateParam,
        endDate: endDateParam
      },
      months: dateRangeData,
    });

  } catch (error) {
    console.error("Error fetching teacher hours:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { CalculatetHeureSup };