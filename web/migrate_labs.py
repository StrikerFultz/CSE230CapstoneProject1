import json
import psycopg2
import os
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'dbname':   os.environ.get('DB_NAME', 'capstone'),
    'user':     os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host':     os.environ.get('DB_HOST', 'localhost'),
    'port':     os.environ.get('DB_PORT', '5432'),
}

def seed_database():
    try:
        with open('labs_curriculum.json', 'r') as f:
            curriculum = json.load(f)
        print(f"Successfully loaded {len(curriculum)} labs from JSON.")
    except FileNotFoundError:
        print("Error: 'labs_curriculum.json' not found in the current directory.")
        return

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    try:
        cur.execute("SELECT course_id FROM courses LIMIT 1")
        course = cur.fetchone()
        if not course:
            cur.execute("""
                INSERT INTO courses (course_code, course_name, semester, year, is_active)
                VALUES ('CSE101', 'Intro to MIPS', 'Spring', 2026, TRUE)
                RETURNING course_id
            """)
            course_id = cur.fetchone()[0]
        else:
            course_id = course[0]

        for lab_id, data in curriculum.items():
            print(f"Processing {lab_id}...")
            
            cur.execute("""
                INSERT INTO labs (lab_id, course_id, title, instructions, starter_code, is_published)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                ON CONFLICT (lab_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    instructions = EXCLUDED.instructions,
                    starter_code = EXCLUDED.starter_code,
                    is_published = TRUE;
            """, (lab_id, course_id, data['title'], data['html'], data.get('starter_code')))

            cur.execute("DELETE FROM lab_test_cases WHERE lab_id = %s", (lab_id,))
            
            if 'testCases' in data:
                for tc in data['testCases']:
                    input_data = json.dumps({
                        "registers": tc.get("initialRegisters", {}),
                        "memory": tc.get("initialMemory", {})
                    })
                    expected_output = json.dumps({
                        "registers": tc.get("expectedRegisters", {}),
                        "memory": tc.get("expectedMemory", {})
                    })

                    cur.execute("""
                        INSERT INTO lab_test_cases (lab_id, test_name, points, input_data, expected_output, test_type)
                        VALUES (%s, %s, %s, %s, %s, 'register')
                    """, (lab_id, tc['name'], tc['points'], input_data, expected_output))

        conn.commit()
        print("\n--- TRANSACTION COMMITTED ---")

        # FINAL VERIFICATION
        cur.execute("SELECT COUNT(*) FROM labs")
        lab_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM lab_test_cases")
        tc_count = cur.fetchone()[0]
        print(f"Verification: {lab_count} labs and {tc_count} test cases are now in the DB.")

    except Exception as e:
        conn.rollback()
        print(f"FATAL ERROR: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_database()