import { integer, pgTable, varchar, pgEnum, serial } from "drizzle-orm/pg-core";

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

export const User = pgTable("User", {
  id: serial().primaryKey(),
  firstName: varchar( { length: 256 }).notNull(),
  lastName: varchar( { length: 256 }).notNull(),
  email: varchar( { length: 256 }).notNull(),
  password: varchar( { length: 256 }).notNull(),
  role: RoleEnums().notNull(), 
});


export const Teacher= pgTable("Teacher",{
  id: integer()
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