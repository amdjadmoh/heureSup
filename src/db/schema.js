import { integer, pgTable, varchar, pgEnum, serial, time, boolean, date } from "drizzle-orm/pg-core";

// Define the enum
export const RoleEnums = pgEnum("role", ["admin", "teacher"]);

export const DayEnum = pgEnum("day", [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

export const SeanceTypeEnum = pgEnum("seance_type", ["cours", "td", "tp"]);

export const SemesterEnum = pgEnum("semester", ["S1", "S2"]);

// Define the tables
export const User = pgTable("User", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  role: RoleEnums("role").notNull(),
});

export const Grade = pgTable("Grade", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  pricePerHour: integer("price_per_hour").notNull(),
});

export const Teacher = pgTable("Teacher", {
  id: integer("id")
    .primaryKey()
    .references(() => User.id, { onUpdate: "cascade", onDelete: "cascade" }),
  gradeId: integer("grade_id")
    .references(() => Grade.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const Promotion = pgTable("Promotion", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 10 }).notNull(),
});

export const Speciality = pgTable("Speciality", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 10 }).notNull(),
});

export const Schedule = pgTable("Schedule", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id")
    .references(() => Promotion.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  semester: SemesterEnum("semester").notNull(),
  specialityId: integer("speciality_id")
    .references(() => Speciality.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const Seance = pgTable("Seance", {
  id: serial("id").primaryKey(),
  isHeurSupp: boolean("is_heur_supp").default(true).notNull(),
  day: DayEnum("day").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: varchar("location", { length: 50 }).notNull(),
  type: SeanceTypeEnum("seance_type").notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  group: integer("group").notNull(),
  teacherId: integer("teacher_id")
    .references(() => Teacher.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  scheduleId: integer("schedule_id")
    .references(() => Schedule.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
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