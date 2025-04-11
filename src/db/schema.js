import { integer, pgTable, varchar, pgEnum, serial } from "drizzle-orm/pg-core";

// Define the enum types
export const RoleEnum = pgEnum("role", ["admin", "enseignant"]);
export const GradeNameEnum = pgEnum("grade_name", [
  "Professeur",
  "Enseignant",
  "Assistant Master A",
  "Assistant Master B",
  "Lecturer A",
  "Lecturer B",
]);

// Define the tables
export const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  email: varchar( { length: 256 }).notNull(),
  password: varchar( { length: 256 }).notNull(),
  gradeId: integer()
    .references(() => Grade.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  role: RoleEnum().notNull(), // Use the enum type here
});

export const Grade = pgTable("Grade", {
  id: serial().primaryKey(),
  GradeName: GradeNameEnum().notNull(), // Use the enum type here
  PricePerHour: integer().notNull(),
});