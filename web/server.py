from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import uuid
import secrets
from simple_autograder import simple_autograder_bp


app = Flask(__name__, static_folder='.')
app.register_blueprint(simple_autograder_bp)

app.secret_key = secrets.token_hex(32)

app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True, origins=['http://localhost:5000', 'http://127.0.0.1:5000'])

DB_CONFIG = {
    'dbname': 'capstone',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None


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
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM labs ORDER BY lab_id")
        labs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        result = {}
        for lab in labs:
            result[lab['lab_id']] = {
                'title': lab['title'],
                'html': lab['instructions'] or '',
                'description': lab.get('description'),
                'starter_code': lab.get('starter_code'),
                'difficulty': lab.get('difficulty'),
                'points': lab.get('total_points'),
                'due_date': lab['due_date'].isoformat() if lab.get('due_date') else None,
                'register_mapping': lab.get('register_mapping'),
                'initial_values': lab.get('initial_values'),
                'test_cases': lab.get('test_cases') or []
            }
        
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
    print("\nAPI Endpoints (AUTH DISABLED FOR TESTING):")
    print("  GET  /api/labs")
    print("  POST /api/labs")
    print("  PUT  /api/labs/<lab_id>")
    print("  DELETE /api/labs/<lab_id>")
    print("\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)