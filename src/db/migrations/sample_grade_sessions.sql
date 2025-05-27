-- Add sample grade sessions for testing grade changes
-- This script assumes we have at least one teacher with ID 1 and grades with IDs 1 and 2

-- Check if grade sessions exist already
DO $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count FROM "Sessions";
    
    -- Only insert if no sessions exist
    IF session_count = 0 THEN
        -- Insert session with grade 1 starting Jan 1, 2025 and ending Feb 28, 2025
        INSERT INTO "Sessions" ("startDate", "finishDate", "teacherId", "gradeId")
        VALUES ('2025-01-01', '2025-02-28', 1, 1);
        
        -- Insert session with grade 2 starting Mar 1, 2025 with no end date
        INSERT INTO "Sessions" ("startDate", "finishDate", "teacherId", "gradeId")
        VALUES ('2025-03-01', NULL, 1, 2);
        
        RAISE NOTICE 'Sample grade sessions added successfully';
    ELSE
        RAISE NOTICE 'Grade sessions already exist, no samples added';
    END IF;
END $$;
