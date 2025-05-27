import { Teacher, Grade, Seance, Schedule, User, Holiday, Absence, GradeSession } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq, sql, and, between, or, isNull,gte ,lte} from "drizzle-orm";
import ExcelJS from 'exceljs';
import path from 'path';
import { CalculatetHeureSup } from './heuresup.js';
import { Console } from "console";

// Helper function to calculate time difference in hours
function calculateTimeDifference(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return (end - start) / (1000 * 60 * 60); // Return hours
}

// Helper function to format date as YYYY-MM-DD
function formatDateForDB(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Helper function to check if a date is unavailable due to holiday or absence
async function isDateUnavailable(formattedDate, teacherId, seanceId) {
  // Check holidays first (applies to all teachers)
  const holidays = await db
    .select()
    .from(Holiday)
    .where(sql`${Holiday.startDate} <= ${formattedDate} AND ${Holiday.endDate} >= ${formattedDate}`);
  
  if (holidays.length > 0) {
    return true; // It's a holiday
  }
  
  // Check teacher-specific absences
  const absences = await db
    .select()
    .from(Absence)
    .where(
      and(
        eq(Absence.teacherId, teacherId),
        eq(Absence.date, formattedDate),
        eq(Absence.seanceId, seanceId)
      )
    );
  
  return absences.length > 0; // Return true if teacher is absent
}

// Generate the salary payment Excel file for teachers
export const generateTeacherPaymentExcel = async (req, res) => {
  try {
    const { startDate, endDate, semester,paimentType, teacherType } = req.query;
  if (!paimentType || (paimentType !== "ccp" && paimentType !== "bank")) {
  return res.status(400).json({
    error: "Invalid paimentType. Only 'ccp' and 'bank' are supported for this report."
  });
}

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "startDate and endDate are required (format: YYYY-MM-DD)" 
      });
    }
    
    // Default semester to 1 if not provided
    const semesterValue = semester || "1";

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Format report period dates for display (used consistently across the report)
    const reportPeriod = `du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: "Invalid date format. Use YYYY-MM-DD" 
      });
    }
    
    if (start > end) {
      return res.status(400).json({ 
        error: "Start date must be before or equal to end date" 
      });
    }


    const teachersData = [];

    // Get all  teachers
    const teachers = await db.select({
      id: Teacher.id,
      firstName: User.firstName,
      lastName: User.lastName,
      accountNumber: Teacher.accountNumber,
      teacherType: Teacher.teacherType,
      paymentType: Teacher.paymentType,
      gradeId: Teacher.gradeId
    })
    .from(Teacher)
    .innerJoin(User, eq(Teacher.id, User.id))
    .where(and(eq(Teacher.teacherType, teacherType) , eq(Teacher.paymentType, paimentType)));

    if (teachers.length === 0) {
      return res.status(404).json({ error: "No teachers found" });
    }
    
    // Get all grades for pricing
    const gradesData = await db.select().from(Grade);
    const gradeMap = {};
    gradesData.forEach(grade => {
      gradeMap[grade.id] = {
        name: grade.GradeName, 
        price: grade.PricePerHour
      };
    });
   

    for (const teacher of teachers) { 
     // Get any grade sessions for this teacher during the reporting period
      const gradeSessions = await db.select()
        .from(GradeSession)
        .where(
          and(
            eq(GradeSession.teacherId, teacher.id),
            // Find sessions that overlap with the reporting period
            or(
              // Current active session (no end date)
              isNull(GradeSession.finishDate),
              // Session ends during or after the reporting period
              gte(GradeSession.finishDate, formatDateForDB(start))
            ),
            // Session starts before or during the reporting period
            lte(GradeSession.startDate, formatDateForDB(end))
          )
        )
        .orderBy(GradeSession.startDate);      // If no grade sessions found, simply use the teacher's current grade
        // Store teacher entries for merging by grade
        for (const session of gradeSessions) {
          // Calculate the effective period for this grade (for calculation purposes)
          // This is used for accurate hour calculation but the display will show the full period
          const effectiveStart = new Date(session.startDate) < start ? start : new Date(session.startDate);
          const effectiveEnd = !session.finishDate || new Date(session.finishDate) > end ? 
                              end : new Date(session.finishDate);
            // Process this grade period if it falls within our reporting range
          if (effectiveStart <= effectiveEnd) {
            // We always pass the original report period start date for correct display
            await processTeacherWithGrade(
              teacher,
              session.gradeId,
              effectiveStart, // For calculations
              effectiveEnd,   // For calculations
              gradesData,
              teachersData,
              reportPeriod   // Pass the consistent report period for display
            );
          }
        }
      
      
    }
    
    // Sort teachersData by teacher name for consistent output
    teachersData.sort((a, b) => a.name.localeCompare(b.name));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Create a worksheet
    const worksheet = workbook.addWorksheet('Paiement Enseignants');

    // Set page orientation and margins
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.margins = {
      top: 0.5, bottom: 0.5,
      left: 0.5, right: 0.5,
      header: 0.3, footer: 0.3
    };

    const totalColumns = 11; // A à K

    const safeMergeCells = (range) => {
      try {
        worksheet.mergeCells(range);
      } catch (err) {
      }
    };    // Helper function for header cells
    function addHeaderRow(rowNumber, text, fontSize = 12) {
      safeMergeCells(`A${rowNumber}:K${rowNumber}`);
      const cell = worksheet.getCell(`A${rowNumber}`);
      cell.value = text;
      cell.font = { bold: true, size: fontSize };
      cell.alignment = { horizontal: 'center' };
      return cell;
    }
    
    // Add title rows with consistent styling
    addHeaderRow(1, 'République Algérienne Démocratique et Populaire', 14);
    addHeaderRow(2, 'Ministère de l\'Enseignement Supérieure et de la Recherche Scientifique');
    addHeaderRow(3, 'Supérieure en Informatique -08 MAI 1945- Sidi bel Abbes');
    addHeaderRow(4, 'Secrétariat générale');
    addHeaderRow(5, 'Service budget, Comptabilité et financement des activités de recherche');// Ligne de titre paiement
    safeMergeCells(`A7:J7`);
    const paymentTitleCell = worksheet.getCell('A7');
    const year = new Date().getFullYear();
    const displayYear = new Date().getMonth() > 7 ? 
      `${year}-${year + 1}` : 
      `${year - 1}-${year}`;
    
    paymentTitleCell.value = `Etat de paiement des enseignants ${teacherType} compte ${paimentType} ${semesterValue}er Semestre ${displayYear}`;
    paymentTitleCell.font = { bold: true, size: 14 };
    paymentTitleCell.alignment = { horizontal: 'center' };
    paymentTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0F0F8' }
    };
    paymentTitleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Date
    worksheet.getCell('K7').value = new Date().toLocaleDateString('fr-FR');
    worksheet.getCell('K7').font = { bold: true, size: 12 };
    worksheet.getCell('K7').alignment = { horizontal: 'right' };

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Désignation du bénéficiaire', key: 'name', width: 25 },
      { header: 'N° de Compte', key: 'accountNumber', width: 20 },
      { header: 'Grade', key: 'grade', width: 12 },
      { header: 'Prix unitaire', key: 'hourlyRate', width: 12 },
      { header: 'Nombre des heures', key: 'hours', width: 15 },
      { header: 'Montant Total', key: 'totalAmount', width: 15 },
      { header: 'Sécurité Sociale', key: 'socialSecurity', width: 15 },
      { header: 'IRG', key: 'irg', width: 15 },
      { header: 'Montant débité', key: 'debitedAmount', width: 15 },
      { header: 'Montant NET', key: 'netAmount', width: 15 },
      { header: 'Période', key: 'period', width: 25 }
    ];    // Helper function for styling cells
    function applyCellBorders(cell) {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Add and style headers in row 9
    const headers = worksheet.columns.map(col => col.header);
    worksheet.insertRow(9, headers);

    // Style header row
    const headerRow = worksheet.getRow(9);
    headerRow.font = { bold: true, color: { argb: '000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEDA69B' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell(applyCellBorders);

    // ✅ Geler la ligne d'en-tête
    worksheet.views = [
      { state: 'frozen', ySplit: 9 }
    ];    // Ajouter les lignes de données
    teachersData.forEach((teacher, index) => {
      const row = worksheet.addRow({
        name: teacher.name,
        accountNumber: teacher.accountNumber,
        grade: teacher.grade,
        hourlyRate: teacher.hourlyRate,
        hours: parseFloat(teacher.hours.toFixed(2)),
        totalAmount: parseFloat(teacher.totalAmount.toFixed(2)),
        socialSecurity: parseFloat(teacher.socialSecurity.toFixed(2)),
        irg: parseFloat(teacher.irg.toFixed(2)),
        debitedAmount: parseFloat(teacher.debitedAmount.toFixed(2)),
        netAmount: parseFloat(teacher.netAmount.toFixed(2)),
        period: teacher.period
      });

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Apply alternating row colors for better readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }
        row.eachCell((cell, colNumber) => {
        // Apply common borders
        applyCellBorders(cell);
        
        // Define column types once
        const MONEY_COLUMNS = [4, 6, 7, 8, 9, 10]; // hourlyRate, totalAmount, etc.
        const TEXT_LEFT_ALIGN_COLUMNS = [1, 2, 11]; // name, accountNumber, period
        
        // Format number cells with currency and decimal precision
        if (typeof cell.value === 'number') {
          if (MONEY_COLUMNS.includes(colNumber)) {
            cell.numFmt = '### ##0.00 "DA"'; // Format with Algerian Dinar
          } else {
            cell.numFmt = '#,##0.00'; // Regular number formatting
          }
        }
        
        // Left align text fields
        if (TEXT_LEFT_ALIGN_COLUMNS.includes(colNumber)) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // Ligne des totaux
    const totalRow = worksheet.addRow({
      name: 'TOTAL',
      accountNumber: '',
      grade: '',
      hourlyRate: '',
      hours: parseFloat(teachersData.reduce((sum, t) => sum + t.hours, 0).toFixed(2)),
      totalAmount: parseFloat(teachersData.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)),
      socialSecurity: parseFloat(teachersData.reduce((sum, t) => sum + t.socialSecurity, 0).toFixed(2)),
      irg: parseFloat(teachersData.reduce((sum, t) => sum + t.irg, 0).toFixed(2)),
      debitedAmount: parseFloat(teachersData.reduce((sum, t) => sum + t.debitedAmount, 0).toFixed(2)),
      netAmount: parseFloat(teachersData.reduce((sum, t) => sum + t.netAmount, 0).toFixed(2)),
      period: ''
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' }
    };    totalRow.eachCell((cell) => {
      applyCellBorders(cell);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });// Générer le nom de fichier
    const filename = `Etat_paiement_enseignants_S${semesterValue}_${displayYear}.xlsx`;

    // En-têtes de la réponse HTTP
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();  
  } catch (error) {
    console.error('Error generating payment report:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Helper function to process a teacher with a specific grade for a specific time period
async function processTeacherWithGrade(teacher, gradeId, startDate, endDate, gradesData, teachersData) {
  try {
    // Get the hour sup results for this teacher in the specified date range
    const heureSupResult = await CalculatetHeureSup(
      teacher.id, 
      formatDateForDB(startDate), 
      formatDateForDB(endDate)
    );
    console.log(`Heure sup result for teacher ${teacher.id}:`, heureSupResult);
    
    // If there are no heure sup seances, skip this teacher
    if (!heureSupResult || !heureSupResult.heureSupSeances || heureSupResult.heureSupSeances.length === 0) return;

    // Create a grade map for easy lookup 
    const gradeMap = {};
    gradesData.forEach(grade => {
      gradeMap[grade.id] = {
        name: grade.GradeName,
        price: grade.PricePerHour
      };
    });

    // Find the specific grade info
    const gradeInfo = gradeMap[gradeId];
    if (!gradeInfo) {
      console.error(`Grade ID ${gradeId} not found for teacher ${teacher.id}`);
      return; // Skip this entry if grade not found
    }

    // Now account for holidays and absences
    let actualHeureSupHours = 0;
    
    // Process each seance and check for holidays and absences
    for (const seance of heureSupResult.heureSupSeances) {
      // For each seance, check if it falls during the date range and is not on a holiday or absence
      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {        // Check if day of week matches the seance day
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ...
        // Map day names to day numbers for cleaner comparison
        const dayMap = {
          sunday: 0,
          monday: 1,
          tuesday: 2, 
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        };
        const seanceDayNumber = dayMap[seance.day.toLowerCase()] || 0;
        
        // If day of week matches the seance day
        if (dayOfWeek === seanceDayNumber) {          // Format current date for DB comparison
          const formattedDate = formatDateForDB(currentDate);
          
          // Check if this date is unavailable (holiday or absence)
          const isUnavailableDay = await isDateUnavailable(formattedDate, teacher.id, seance.id);
          if (isUnavailableDay) {
            continue; // Skip this day
          }
          
          // This day is valid for heure sup calculation
          actualHeureSupHours += seance.heureSupDuration || 0;
        }
      }
    }
    
    // If after filtering there are no hours, skip this teacher/grade combination
    if (actualHeureSupHours === 0) return;
    
    // Get grade and hourly rate
    const gradeName = gradeInfo.name || "N/A";
    const hourlyRate = gradeInfo.price || 0;
      // Calculate amounts based on actual heure sup hours
    const totalAmount = actualHeureSupHours * hourlyRate;
      // Apply taxes according to the updated formula
    const SOCIAL_SECURITY_RATE = 0.09; // 9% social security
    const IRG_RATE = 0.10; // 10% income tax
    
    // Step 1: Calculate social security
    const socialSecurity = totalAmount * SOCIAL_SECURITY_RATE;
    
    // Step 2: Calculate IRG (now based on total amount minus social security)
    const irg = (totalAmount - socialSecurity) * IRG_RATE;
    
    // Step 3: Calculate total deductions and net amount
    const debitedAmount = socialSecurity + irg;
    const netAmount = totalAmount - debitedAmount;
      // Format date ranges for display
    const formattedStartDate = startDate.toLocaleDateString('fr-FR');
    const formattedEndDate = endDate.toLocaleDateString('fr-FR');
    
    // Add this entry to the teachersData array
    teachersData.push({
      name: `${teacher.lastName} ${teacher.firstName}`,
      accountNumber: teacher.accountNumber,
      grade: gradeName,
      hourlyRate,
      hours: actualHeureSupHours,
      totalAmount,
      socialSecurity,
      irg,
      debitedAmount,
      netAmount,
      period: `du ${formattedStartDate} au ${formattedEndDate}`
    });
  } catch (error) {
    console.error(`Error processing teacher ${teacher.id} with grade ${gradeId}:`, error);
    // Continue processing other teachers instead of stopping the whole process
  }
}

// Generate the salary payment Excel file for teachers
export const generateEngagmentExcel = async (req, res) => {
  try {
    const { startDate, endDate, semesterValue } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: "startDate and endDate are required (format: YYYY-MM-DD)" 
      });
    }

 
    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Format report period dates for display (used consistently across the report)
    const reportPeriod = `du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: "Invalid date format. Use YYYY-MM-DD" 
      });
    }
    
    if (start > end) {
      return res.status(400).json({ 
        error: "Start date must be before or equal to end date" 
      });
    }


    const teachersData = [];

    // Get all  teachers
    const Permteachers = await db.select({
      id: Teacher.id,
      firstName: User.firstName,
      lastName: User.lastName,
      accountNumber: Teacher.accountNumber,
      teacherType: Teacher.teacherType,
      paymentType: Teacher.paymentType,
      gradeId: Teacher.gradeId
    })
    .from(Teacher)
    .innerJoin(User, eq(Teacher.id, User.id))
    .where(eq(Teacher.teacherType, "permanent"));
    const Vacataires = await db.select().from
(Teacher)
    .innerJoin(User, eq(Teacher.id, User.id))
    .where(eq(Teacher.teacherType, "vacataire"));
    console.log("vacataires", Vacataires);
    const Outsiders = await db.select().from
(Teacher)
    .innerJoin(User, eq(Teacher.id, User.id))
    .where(eq(Teacher.teacherType, "outsider"));


    
    // Get all grades for pricing
    const gradesData = await db.select().from(Grade);
    const gradeMap = {};
    gradesData.forEach(grade => {
      gradeMap[grade.id] = {
        name: grade.GradeName, 
        price: grade.PricePerHour
      };
    });
    // Process each teacher's data and handle grade changes
    for (const teacher of Permteachers) {
      // Get any grade sessions for this teacher during the reporting period
      const gradeSessions = await db.select()
        .from(GradeSession)
        .where(
          and(
            eq(GradeSession.teacherId, teacher.id),
            // Find sessions that overlap with the reporting period
            or(
              // Current active session (no end date)
              isNull(GradeSession.finishDate),
              // Session ends during or after the reporting period
              gte(GradeSession.finishDate, formatDateForDB(start))
            ),
            // Session starts before or during the reporting period
            lte(GradeSession.startDate, formatDateForDB(end))
          )
        )
        .orderBy(GradeSession.startDate);      // If no grade sessions found, simply use the teacher's current grade
        // Store teacher entries for merging by grade
        for (const session of gradeSessions) {
          // Calculate the effective period for this grade (for calculation purposes)
          // This is used for accurate hour calculation but the display will show the full period
          const effectiveStart = new Date(session.startDate) < start ? start : new Date(session.startDate);
          const effectiveEnd = !session.finishDate || new Date(session.finishDate) > end ? 
                              end : new Date(session.finishDate);
            // Process this grade period if it falls within our reporting range
          if (effectiveStart <= effectiveEnd) {
            // We always pass the original report period start date for correct display
            await processTeacherWithGrade(
              teacher,
              session.gradeId,
              effectiveStart, // For calculations
              effectiveEnd,   // For calculations
              gradesData,
              teachersData,
              reportPeriod   // Pass the consistent report period for display
            );
          }
        }
    }
    // Process each teacher's data and handle grade changes for Vacataires
    for (const teacher of Vacataires) {
     
      // Get any grade sessions for this teacher during the reporting period[]
      const gradeSessions = await db.select()
        .from(GradeSession)
        .where(
          and(
            eq(GradeSession.teacherId, teacher.id),
            // Find sessions that overlap with the reporting period
            or(
              // Current active session (no end date)
              isNull(GradeSession.finishDate),
              // Session ends during or after the reporting period
              gte(GradeSession.finishDate, formatDateForDB(start))
            ),
            // Session starts before or during the reporting period
            lte(GradeSession.startDate, formatDateForDB(end))
          )
        )
        .orderBy(GradeSession.startDate);      // If no grade sessions found, simply use the teacher's current grade
        // Store teacher entries for merging by grade
        console.log("gradeSessions", gradeSessions);  
        for (const session of gradeSessions) {
          // Calculate the effective period for this grade (for calculation purposes)
          // This is used for accurate hour calculation but the display will show the full period
          const effectiveStart = new Date(session.startDate) < start ? start : new Date(session.startDate);
          const effectiveEnd = !session.finishDate || new Date(session.finishDate) > end ? 
                              end : new Date(session.finishDate);
            // Process this grade period if it falls within our reporting range
          if (effectiveStart <= effectiveEnd) {
            // We always pass the original report period start date for correct display
            await processTeacherWithGrade(
              teacher,
              session.gradeId,
              effectiveStart, // For calculations
              effectiveEnd,   // For calculations
              gradesData,
              teachersData,
              reportPeriod   // Pass the consistent report period for display
            );
          }
        }
    }
    // Process each teacher's data and handle grade changes for Outsiders
    for (const teacher of Outsiders) {
      // Get any grade sessions for this teacher during the reporting period
      const gradeSessions = await db.select()
        .from(GradeSession)
        .where(
          and(
            eq(GradeSession.teacherId, teacher.id),
            // Find sessions that overlap with the reporting period
            or(
              // Current active session (no end date)
              isNull(GradeSession.finishDate),
              // Session ends during or after the reporting period
              gte(GradeSession.finishDate, formatDateForDB(start))
            ),
            // Session starts before or during the reporting period
            lte(GradeSession.startDate, formatDateForDB(end))
          )
        )
        .orderBy(GradeSession.startDate);      // If no grade sessions found, simply use the teacher's current grade
        // Store teacher entries for merging by grade
        for (const session of gradeSessions) {
          // Calculate the effective period for this grade (for calculation purposes)
          // This is used for accurate hour calculation but the display will show the full period
          const effectiveStart = new Date(session.startDate) < start ? start : new Date(session.startDate);
          const effectiveEnd = !session.finishDate || new Date(session.finishDate) > end ? 
                              end : new Date(session.finishDate);
            // Process this grade period if it falls within our reporting range
          if (effectiveStart <= effectiveEnd) {
            // We always pass the original report period start date for correct display
            await processTeacherWithGrade(
              teacher,
              session.gradeId,
              effectiveStart, // For calculations
              effectiveEnd,   // For calculations
              gradesData,
              teachersData,
              reportPeriod   // Pass the consistent report period for display
            );
          }
        }
    }

    
    // Sort teachersData by teacher name for consistent output
    teachersData.sort((a, b) => a.name.localeCompare(b.name));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    // Create a worksheet
    const worksheet = workbook.addWorksheet('Engagement Enseignants');

    // Set page orientation and margins
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.margins = {
      top: 0.5, bottom: 0.5,
      left: 0.5, right: 0.5,
      header: 0.3, footer: 0.3
    };

    const totalColumns = 11; // A à K

    const safeMergeCells = (range) => {
      try {
        worksheet.mergeCells(range);
      } catch (err) {
      }
    };    // Helper function for header cells
    function addHeaderRow(rowNumber, text, fontSize = 12) {
      safeMergeCells(`A${rowNumber}:K${rowNumber}`);
      const cell = worksheet.getCell(`A${rowNumber}`);
      cell.value = text;
      cell.font = { bold: true, size: fontSize };
      cell.alignment = { horizontal: 'center' };
      return cell;
    }
    
    // Add title rows with consistent styling
    addHeaderRow(1, 'République Algérienne Démocratique et Populaire', 14);
    addHeaderRow(2, 'Ministère de l\'Enseignement Supérieure et de la Recherche Scientifique');
    addHeaderRow(3, 'Supérieure en Informatique -08 MAI 1945- Sidi bel Abbes');
    addHeaderRow(4, 'Secrétariat générale');
    addHeaderRow(5, 'Service budget, Comptabilité et financement des activités de recherche');// Ligne de titre paiement
    safeMergeCells(`A7:J7`);
    const paymentTitleCell = worksheet.getCell('A7');
    const year = new Date().getFullYear();
    const displayYear = new Date().getMonth() > 7 ? 
      `${year}-${year + 1}` : 
      `${year - 1}-${year}`;
    
    paymentTitleCell.value = `Déclaration d'engagement pour les enseignants ${semesterValue}er Semestre ${displayYear}`;
    paymentTitleCell.font = { bold: true, size: 14 };
    paymentTitleCell.alignment = { horizontal: 'center' };
    paymentTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0F0F8' }
    };
    paymentTitleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Date
    worksheet.getCell('K7').value = new Date().toLocaleDateString('fr-FR');
    worksheet.getCell('K7').font = { bold: true, size: 12 };
    worksheet.getCell('K7').alignment = { horizontal: 'right' };

    // Définir les colonnes
    worksheet.columns = [
      { header: 'Désignation du bénéficiaire', key: 'name', width: 25 },
      { header: 'N° de Compte', key: 'accountNumber', width: 20 },
      { header: 'Grade', key: 'grade', width: 12 },
      { header: 'Prix unitaire', key: 'hourlyRate', width: 12 },
      { header: 'Nombre des heures', key: 'hours', width: 15 },
      { header: 'Montant Total', key: 'totalAmount', width: 15 },
      { header: 'Période', key: 'period', width: 25 }
    ];    // Helper function for styling cells
    function applyCellBorders(cell) {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Add and style headers in row 9
    const headers = worksheet.columns.map(col => col.header);
    worksheet.insertRow(9, headers);

    // Style header row
    const headerRow = worksheet.getRow(9);
    headerRow.font = { bold: true, color: { argb: '000000' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEDA69B' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell(applyCellBorders);

    // ✅ Geler la ligne d'en-tête
    worksheet.views = [
      { state: 'frozen', ySplit: 9 }
    ];    // Ajouter les lignes de données
    teachersData.forEach((teacher, index) => {
      const row = worksheet.addRow({
        name: teacher.name,
        accountNumber: teacher.accountNumber,
        grade: teacher.grade,
        hourlyRate: teacher.hourlyRate,
        hours: parseFloat(teacher.hours.toFixed(2)),
        totalAmount: parseFloat(teacher.totalAmount.toFixed(2)),
        period: teacher.period
      });

      row.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Apply alternating row colors for better readability
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F2F2F2' }
        };
      }
        row.eachCell((cell, colNumber) => {
        // Apply common borders
        applyCellBorders(cell);
        
        // Define column types once
        const MONEY_COLUMNS = [4, 6, 7, 8, 9, 10]; // hourlyRate, totalAmount, etc.
        const TEXT_LEFT_ALIGN_COLUMNS = [1, 2, 11]; // name, accountNumber, period
        
        // Format number cells with currency and decimal precision
        if (typeof cell.value === 'number') {
          if (MONEY_COLUMNS.includes(colNumber)) {
            cell.numFmt = '### ##0.00 "DA"'; // Format with Algerian Dinar
          } else {
            cell.numFmt = '#,##0.00'; // Regular number formatting
          }
        }
        
        // Left align text fields
        if (TEXT_LEFT_ALIGN_COLUMNS.includes(colNumber)) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
    });

    // Ligne des totaux
    const totalRow = worksheet.addRow({
      name: 'TOTAL',
      accountNumber: '',
      grade: '',
      hourlyRate: '',
      hours: parseFloat(teachersData.reduce((sum, t) => sum + t.hours, 0).toFixed(2)),
      totalAmount: parseFloat(teachersData.reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)),
      period: ''
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' }
    };    totalRow.eachCell((cell) => {
      applyCellBorders(cell);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });// Générer le nom de fichier
    const filename = `Engagment_S${semesterValue}_${displayYear}.xlsx`;

    // En-têtes de la réponse HTTP
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();  
  } catch (error) {
    console.error('Error generating payment report:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
