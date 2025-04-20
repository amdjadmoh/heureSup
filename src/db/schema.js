import { integer, pgTable, varchar, pgEnum, serial, time, boolean, date, doublePrecision, check,} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Define the enum types
export const RoleEnums = pgEnum("role", ["admin","teacher"]);


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
export const SemesterEnum = pgEnum("semester", ["S1", "S2"]);


// Define the tables
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
    .notNull()
})

export const Grade = pgTable("Grade", {
  id: serial().primaryKey(),
  GradeName: varchar().notNull(), 
  PricePerHour: integer().notNull(),
  charge: doublePrecision().notNull(),  
});

export const SeanceTypeCoefficient = pgTable("SeanceTypeCoefficient", {
  seanceType: varchar("seance_type", { length: 10 }).primaryKey(),
  value: doublePrecision().notNull().default(1.0),
}, (table) => ({
  seanceTypeCheck: check(
    "seance_type_check",
    sql`${table.seanceType} IN ('cours', 'td', 'tp')`
  ),
}));

export const Seance = pgTable("Seance", {
  id: serial().primaryKey(),
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
scheduleSessionId   : integer()
    .references(() => ScheduleSession.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});
export const Speciality = pgTable("Speciality", {
  id: serial().primaryKey(),
  name: varchar("name", { length: 50 }).notNull()
});


export const Promotion = pgTable("Promotion", {
  id: serial().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  specialityId : integer()
    .references(() => Speciality.id, { onUpdate: "cascade", onDelete: "cascade" })
});


export const Schedule = pgTable("Schedule", {
  id: serial().primaryKey(),
  semester: SemesterEnum().notNull(),
  promotionId: integer()
    .references(() => Promotion.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  educationalYear: varchar().notNull()
});

export const Absence = pgTable("Absence", {
  id: serial().primaryKey(),
  date: date().notNull(),
  seanceId: integer()
    .references(() => Seance.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  teacherId: integer()
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const Holiday = pgTable("Holiday", {
  id: serial().primaryKey(),
  startDate: date().notNull(),
  endDate: date().notNull(),
});


export const GradeSession = pgTable("Sessions", {
  id: serial().primaryKey(),
  startDate: date().notNull(),
  finishDate: date(),
  teacherId: integer()
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});
export const ScheduleSession = pgTable("ScheduleSession", {
  id: serial().primaryKey(),
  scheduleId: integer()
    .references(() => Schedule.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  startDate: date().notNull(),
  finishDate: date(),
  closed: boolean().notNull().default(false),
});

export const HeureSup = pgTable("HeureSup", {
  id: serial().primaryKey(),
  scheduleSessionId: integer()
    .references(() => ScheduleSession.id, { onUpdate: "cascade", onDelete: "cascade" }  )
    .notNull(),
  duration: doublePrecision().notNull(),
  seanceId: integer()
    .references(() => Seance.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  teacherId: integer()
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});


