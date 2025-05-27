import { db } from '../index.js';
import { sql } from 'drizzle-orm';
import pg from 'pg';

// Create a standalone PostgreSQL client for migration (to avoid issues with Drizzle modules)
async function runMigration() {
  try {
    console.log('Starting migration: Add gradeId to Sessions table');
    
    // Check if column exists
    const columnQuery = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Sessions'
      AND column_name = 'gradeId'
    `);
    
    if (columnQuery.rows.length === 0) {
      console.log('Column does not exist, adding it...');
      
      // Add the gradeId column
      await db.execute(sql`
        ALTER TABLE "Sessions"
        ADD COLUMN "gradeId" integer NOT NULL DEFAULT 1
        REFERENCES "Grade"(id) ON UPDATE CASCADE ON DELETE CASCADE
      `);
      
      // Update existing records to use current gradeId from Teacher
      await db.execute(sql`
        UPDATE "Sessions" s
        SET "gradeId" = t."gradeId"
        FROM "Teacher" t
        WHERE s."teacherId" = t.id
      `);
      
      // Remove the default after migration
      await db.execute(sql`
        ALTER TABLE "Sessions" 
        ALTER COLUMN "gradeId" DROP DEFAULT
      `);
      
      console.log('Migration successful: Added gradeId to Sessions table');
    } else {
      console.log('Column gradeId already exists on Sessions table. Skipping migration.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Execute the migration
runMigration()
  .then(() => console.log('Migration completed successfully'))
  .catch(err => console.error('Migration failed:', err))
  .finally(() => process.exit());
