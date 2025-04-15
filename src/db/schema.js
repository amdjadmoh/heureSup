import { integer, pgTable, varchar, pgEnum, serial, time, boolean, date } from "drizzle-orm/pg-core";

// Define the enum types
export const RoleEnums = pgEnum("role", ["admin","teacher"]);

export const GradeNameEnum = pgEnum("grade_name", [
  "Professeur",
  "Enseignant",
  "Assistant Master A",
  "Assistant Master B",
  "Lecturer A",
  "Lecturer B",
]);

export const DayEnum = pgEnum("day", [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]);

export const SeanceTypeEnum = pgEnum("seance_type", ["cours", "td", "tp"]);

export const PromotionEnum = pgEnum("promotion", ["1CPI", "2CPI", "1CS", "2CS", "3CS"]);

export const SemesterEnum = pgEnum("semester", ["S1", "S2"]);

export const SpecialityEnum = pgEnum("speciality", [
  "SIW",
  "ISI",
  "AIDS",
  "MI",
  "INFO"
]);

//Tables
export const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  email: varchar( { length: 256 }).notNull(),
  password: varchar( { length: 256 }).notNull(),
  role: RoleEnums().notNull(), 
});


export const Teacher= pgTable("Teacher",{
  id: integer().primaryKey()
      .references(()=>User.id,{onUpdate:"cascade",onDelete:"cascade"}),
  gradeId: integer()
    .references(() => Grade.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
})

export const Grade = pgTable("Grade", {
  id: serial().primaryKey(),
  GradeName: GradeNameEnum().notNull(), // Use the enum type here
  PricePerHour: integer().notNull(),
});

export const Seance = pgTable("Seance", {
  id: serial().primaryKey(),
  isHeurSupp: boolean().default(true).notNull(),
  day: DayEnum().notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: varchar("location", { length: 50 }).notNull(),
  type: SeanceTypeEnum().notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  group: integer().notNull(),

  teacherId: integer()
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),

  scheduleId: integer()
    .references(() => Schedule.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const Schedule = pgTable("Schedule", {
  id: serial().primaryKey(),
  promotion: PromotionEnum().notNull(),
  semester: SemesterEnum().notNull(),
  speciality: SpecialityEnum().notNull(),
});

export const Absence = pgTable("Absence", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  seanceId: integer("seance_id")
    .references(() => Seance.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  teacherId: integer("teacher_id")
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const Sessions = pgTable("Sessions", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  finishDate: date("finish_date").notNull(),
  scheduleId: integer("schedule_id")
    .references(() => Schedule.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});