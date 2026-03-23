from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import uuid
import secrets
import os

from simple_autograder import simple_autograder_bp
from auth import auth_bp


app = Flask(__name__, static_folder='.')

app.register_blueprint(simple_autograder_bp)
app.register_blueprint(auth_bp)

app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-fallback-only')

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True

allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5000').split(',')
CORS(app, supports_credentials=True, origins=allowed_origins)

DB_CONFIG = {
    'dbname':   os.environ.get('DB_NAME', 'capstone'),
    'user':     os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host':     os.environ.get('DB_HOST', 'localhost'),
    'port':     os.environ.get('DB_PORT', '5432'),
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None


# fetch test cases for a single lab
def _fetch_test_cases(cursor, lab_id):
    """Query lab_test_cases for a given lab_id and return a list of dicts
    in the shape the front-end expects (DB JSONB preserved as-is)."""
    cursor.execute("""
        SELECT test_case_id, test_name, test_type, description,
               input_data, expected_output, points, is_hidden, timeout_seconds
        FROM lab_test_cases
        WHERE lab_id = %s
        ORDER BY test_name
    """, (lab_id,))
    rows = cursor.fetchall()

    test_cases = []
    for row in rows:
        inp = row.get('input_data') or {}
        exp = row.get('expected_output') or {}
        if isinstance(inp, str):
            inp = json.loads(inp)
        if isinstance(exp, str):
            exp = json.loads(exp)

        test_cases.append({
            'test_case_id':   str(row['test_case_id']),
            'test_name':      row['test_name'],
            'test_type':      row.get('test_type', 'register'),
            'description':    row.get('description'),
            'input_data':     inp,
            'expected_output': exp,
            'points':         row.get('points', 10),
            'is_hidden':      row.get('is_hidden', False),
            'timeout_seconds': row.get('timeout_seconds', 5),
        })
    return test_cases


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            conn.close()
            return jsonify({
                'status': 'success',
                'message': 'Database connected successfully',
                'version': version[0]
            })
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
    return jsonify({'status': 'error', 'message': 'Could not connect to database'}), 500


@app.route('/api/labs', methods=['GET'])
def get_labs():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    # Identify the user's role from the session
    role = session.get('role', 'student')
    is_teacher = role in ('instructor', 'ta')

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM labs ORDER BY lab_id")
        labs = cursor.fetchall()
        
        result = {}
        for lab in labs:
            lab_id = lab['lab_id']

            # If the user is a teacher, fetch full test cases with answers
            if is_teacher:
                test_cases = _fetch_test_cases(cursor, lab_id)
            else:
                # For students, we provide NO test cases in the lab list
                test_cases = [] 

            # Parse JSONB fields correctly
            reg_map = lab.get('register_mapping') or {}
            init_vals = lab.get('initial_values') or {}

            result[lab_id] = {
                'title':            lab['title'],
                'html':             lab.get('instructions') or '',
                'description':      lab.get('description'),
                'starter_code':     lab.get('starter_code'),
                'difficulty':       lab.get('difficulty'),
                'points':           lab.get('total_points'),
                'register_mapping': reg_map,
                'initial_values':   init_vals,
                'test_cases':       test_cases, 
            }
        
        cursor.close()
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs', methods=['POST'])
def create_lab():
    print(f"[CREATE LAB] Request received")
    
    data = request.get_json()
    
    if not data or 'lab_id' not in data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get or create default course
        default_course_id = data.get('course_id')
        if not default_course_id:
            cursor.execute("SELECT course_id FROM courses LIMIT 1")
            course = cursor.fetchone()
            if course:
                default_course_id = course['course_id']
            else:
                cursor.execute("""
                    INSERT INTO courses (course_code, course_name, semester, year, is_active)
                    VALUES ('DEFAULT', 'Default Course', 'Fall', 2024, TRUE)
                    RETURNING course_id
                """)
                default_course_id = cursor.fetchone()['course_id']
        
        cursor.execute("""
            INSERT INTO labs (
                lab_id, course_id, title, description, instructions, 
                starter_code, solution_code, register_mapping, initial_values,
                difficulty, total_points, max_instructions, time_limit_seconds,
                max_memory_kb, release_date, due_date, is_published
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING lab_id
        """, (
            data['lab_id'],
            default_course_id,
            data['title'],
            data.get('description'),
            data.get('instructions', ''),
            data.get('starter_code'),
            data.get('solution_code'),
            json.dumps(data.get('register_mapping')) if data.get('register_mapping') else None,
            json.dumps(data.get('initial_values')) if data.get('initial_values') else None,
            data.get('difficulty', 'beginner'),
            data.get('points', 100),
            data.get('max_instructions', 10000),
            data.get('time_limit_seconds', 10),
            data.get('max_memory_kb', 1024),
            data.get('release_date'),
            data.get('due_date'),
            data.get('is_published', True)
        ))
        
        conn.commit()
        print(f"[CREATE LAB] Success: {data['lab_id']}")
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab created successfully', 'lab_id': data['lab_id']}), 201
    except psycopg2.IntegrityError as e:
        conn.rollback()
        print(f"[CREATE LAB] Error: {e}")
        return jsonify({'error': 'Lab ID already exists'}), 409
    except Exception as e:
        conn.rollback()
        print(f"[CREATE LAB] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>', methods=['PUT'])
def update_lab(lab_id):
    print(f"[UPDATE LAB] lab_id={lab_id}")
    
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            UPDATE labs SET
                title = COALESCE(%s, title),
                description = COALESCE(%s, description),
                instructions = COALESCE(%s, instructions),
                starter_code = COALESCE(%s, starter_code),
                solution_code = COALESCE(%s, solution_code),
                register_mapping = COALESCE(%s, register_mapping),
                initial_values = COALESCE(%s, initial_values),
                difficulty = COALESCE(%s, difficulty),
                total_points = COALESCE(%s, total_points),
                due_date = COALESCE(%s, due_date),
                is_published = COALESCE(%s, is_published)
            WHERE lab_id = %s
            RETURNING lab_id
        """, (
            data.get('title'),
            data.get('description'),
            data.get('instructions'),
            data.get('starter_code'),
            data.get('solution_code'),
            json.dumps(data.get('register_mapping')) if 'register_mapping' in data else None,
            json.dumps(data.get('initial_values')) if 'initial_values' in data else None,
            data.get('difficulty'),
            data.get('points'),
            data.get('due_date'),
            data.get('is_published'),
            lab_id
        ))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lab not found'}), 404
        
        conn.commit()
        print(f"[UPDATE LAB] Success: {lab_id}")
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab updated successfully'})
    except Exception as e:
        conn.rollback()
        print(f"[UPDATE LAB] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>', methods=['DELETE'])
def delete_lab(lab_id):
    print(f"[DELETE LAB] lab_id={lab_id}")
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        # Delete child rows that reference this lab
        cursor.execute("DELETE FROM submissions WHERE lab_id = %s", (lab_id,))
        cursor.execute("DELETE FROM lab_test_cases WHERE lab_id = %s", (lab_id,))
        cursor.execute("DELETE FROM labs WHERE lab_id = %s RETURNING lab_id", (lab_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lab not found'}), 404
        
        conn.commit()
        print(f"[DELETE LAB] Success: {lab_id}")
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab deleted successfully'})
    except Exception as e:
        conn.rollback()
        print(f"[DELETE LAB] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>/test-cases', methods=['GET'])
def get_lab_test_cases(lab_id):
    """Teacher-only: GET all test cases for a lab WITH full expected_output.
    Used by teacher.html so professors can review answers."""
    # Only allow instructor / ta
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        test_cases = _fetch_test_cases(cursor, lab_id)
        cursor.close()
        conn.close()

        return jsonify({
            'lab_id': lab_id,
            'test_cases': test_cases
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>/test-cases', methods=['POST'])
def create_test_case(lab_id):
    """Teacher-only: create a new test case for a lab."""
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    data = request.get_json()
    if not data or 'test_name' not in data:
        return jsonify({'error': 'Missing required field: test_name'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Verify the lab exists
        cursor.execute("SELECT lab_id FROM labs WHERE lab_id = %s", (lab_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lab not found'}), 404

        input_data = data.get('input_data', {})
        expected_output = data.get('expected_output', {})

        cursor.execute("""
            INSERT INTO lab_test_cases (
                lab_id, test_name, test_type, description,
                input_data, expected_output, points, is_hidden, timeout_seconds
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING test_case_id
        """, (
            lab_id,
            data['test_name'],
            data.get('test_type', 'register'),
            data.get('description'),
            json.dumps(input_data),
            json.dumps(expected_output),
            data.get('points', 10),
            data.get('is_hidden', False),
            data.get('timeout_seconds', 5),
        ))

        new_id = str(cursor.fetchone()['test_case_id'])
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Test case created', 'test_case_id': new_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>/test-cases/<test_case_id>', methods=['PUT'])
def update_test_case(lab_id, test_case_id):
    """Teacher-only: update an existing test case."""
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            UPDATE lab_test_cases SET
                test_name        = COALESCE(%s, test_name),
                test_type        = COALESCE(%s, test_type),
                description      = COALESCE(%s, description),
                input_data       = COALESCE(%s, input_data),
                expected_output  = COALESCE(%s, expected_output),
                points           = COALESCE(%s, points),
                is_hidden        = COALESCE(%s, is_hidden),
                timeout_seconds  = COALESCE(%s, timeout_seconds)
            WHERE test_case_id = %s AND lab_id = %s
            RETURNING test_case_id
        """, (
            data.get('test_name'),
            data.get('test_type'),
            data.get('description'),
            json.dumps(data['input_data']) if 'input_data' in data else None,
            json.dumps(data['expected_output']) if 'expected_output' in data else None,
            data.get('points'),
            data.get('is_hidden'),
            data.get('timeout_seconds'),
            test_case_id,
            lab_id,
        ))

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Test case not found'}), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Test case updated', 'test_case_id': test_case_id})

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs/<lab_id>/test-cases/<test_case_id>', methods=['DELETE'])
def delete_test_case(lab_id, test_case_id):
    """Teacher-only: delete a test case."""
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM lab_test_cases WHERE test_case_id = %s AND lab_id = %s RETURNING test_case_id",
            (test_case_id, lab_id)
        )

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Test case not found'}), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Test case deleted'})

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500


# ─── Student browsing (teacher-only) ───

@app.route('/api/students', methods=['GET'])
def list_students():
    """Teacher-only: list all students with aggregate submission stats."""
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT
                u.user_id,
                u.username,
                u.full_name,
                u.email,
                u.asu_id,
                u.created_at,
                u.last_login,
                COUNT(DISTINCT s.lab_id)        AS labs_attempted,
                COUNT(s.submission_id)           AS total_submissions,
                COALESCE(
                  ROUND(AVG(
                    CASE WHEN s.total_possible > 0
                         THEN s.score * 100.0 / s.total_possible
                         ELSE NULL END
                  ), 1), 0
                )                                AS avg_score_pct,
                MAX(s.submitted_at)              AS last_submission
            FROM users u
            LEFT JOIN submissions s ON s.user_id = u.user_id
            WHERE u.role = 'student' AND u.is_active = true
            GROUP BY u.user_id
            ORDER BY u.full_name, u.username
        """)

        students = cursor.fetchall()

        # Get total published labs for the completion denominator
        cursor.execute("SELECT COUNT(*) AS cnt FROM labs WHERE is_published = true")
        total_labs = cursor.fetchone()['cnt']

        result = []
        for s in students:
            result.append({
                'user_id':           str(s['user_id']),
                'username':          s['username'],
                'full_name':         s['full_name'],
                'email':             s['email'],
                'asu_id':            s['asu_id'],
                'created_at':        s['created_at'].isoformat() if s['created_at'] else None,
                'last_login':        s['last_login'].isoformat() if s['last_login'] else None,
                'labs_attempted':    s['labs_attempted'],
                'total_labs':        total_labs,
                'total_submissions': s['total_submissions'],
                'avg_score_pct':     float(s['avg_score_pct']),
                'last_submission':   s['last_submission'].isoformat() if s['last_submission'] else None,
            })

        cursor.close()
        conn.close()
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/students/<user_id>', methods=['GET'])
def get_student_detail(user_id):
    """Teacher-only: get a single student's profile + per-lab submission breakdown."""
    role = session.get('role', '')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Student info
        cursor.execute("""
            SELECT user_id, username, full_name, email, asu_id,
                   created_at, last_login
            FROM users WHERE user_id = %s
        """, (user_id,))
        student = cursor.fetchone()
        if not student:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Student not found'}), 404

        # All published labs
        cursor.execute("""
            SELECT lab_id, title, total_points, difficulty
            FROM labs WHERE is_published = true
            ORDER BY lab_id
        """)
        all_labs = cursor.fetchall()

        # All submissions for this student
        cursor.execute("""
            SELECT submission_id, lab_id, score, total_possible,
                   test_results, submitted_at, source_code
            FROM submissions
            WHERE user_id = %s
            ORDER BY submitted_at DESC
        """, (user_id,))
        submissions = cursor.fetchall()

        cursor.close()
        conn.close()

        # Group submissions by lab_id
        subs_by_lab = {}
        for sub in submissions:
            lid = sub['lab_id']
            if lid not in subs_by_lab:
                subs_by_lab[lid] = []
            subs_by_lab[lid].append({
                'submission_id': str(sub['submission_id']),
                'score':         sub['score'],
                'total_possible': sub['total_possible'],
                'test_results':  sub['test_results'],
                'submitted_at':  sub['submitted_at'].isoformat() if sub['submitted_at'] else None,
                'source_code':   sub['source_code'],
            })

        # Build per-lab summary
        lab_details = []
        for lab in all_labs:
            lid = lab['lab_id']
            lab_subs = subs_by_lab.get(lid, [])
            best_score = max((s['score'] for s in lab_subs), default=None)
            best_possible = lab_subs[0]['total_possible'] if lab_subs else lab['total_points']

            lab_details.append({
                'lab_id':           lid,
                'title':            lab['title'],
                'difficulty':       lab['difficulty'],
                'total_points':     lab['total_points'],
                'attempt_count':    len(lab_subs),
                'best_score':       best_score,
                'best_possible':    best_possible,
                'latest_submission': lab_subs[0] if lab_subs else None,
                'submissions':      lab_subs,
            })

        return jsonify({
            'student': {
                'user_id':    str(student['user_id']),
                'username':   student['username'],
                'full_name':  student['full_name'],
                'email':      student['email'],
                'asu_id':     student['asu_id'],
                'created_at': student['created_at'].isoformat() if student['created_at'] else None,
                'last_login': student['last_login'].isoformat() if student['last_login'] else None,
            },
            'labs': lab_details,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 50)
    print("MIPS Emulator - Flask Server")
    print("=" * 50)
    print("\nTesting database connection...")
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✓ Connected to PostgreSQL")
            print(f"  Version: {version[0][:50]}...")
            
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            print(f"\n✓ Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"✗ Database error: {e}")
    else:
        print("✗ Could not connect to database")
    
    print("\n" + "=" * 50)
    print("Starting Flask server on http://localhost:5000")
    print("=" * 50)
    print("\nAPI Endpoints:")
    print("  GET  /api/labs")
    print("  POST /api/labs")
    print("  PUT  /api/labs/<lab_id>")
    print("  DELETE /api/labs/<lab_id>")
    print("  GET  /api/labs/<lab_id>/test-cases")
    print("  POST /api/labs/<lab_id>/test-cases")
    print("  PUT  /api/labs/<lab_id>/test-cases/<test_case_id>")
    print("  DELETE /api/labs/<lab_id>/test-cases/<test_case_id>")
    print("  GET  /api/students")
    print("  GET  /api/students/<user_id>")
    print("  POST /api/grade/submit")
    print("  GET  /api/grade/test-cases/<lab_id>")
    print("  POST /api/auth/signup")
    print("  POST /api/auth/login")
    print("  POST /api/auth/logout")
    print("  GET  /api/auth/me")
    print("\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)