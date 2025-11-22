from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
import uuid
import secrets

app = Flask(__name__, static_folder='.')
app.secret_key = secrets.token_hex(32)  # Generate a secure secret key
CORS(app, supports_credentials=True)

DB_CONFIG = {
    'dbname': 'capstone',
    'user': 'postgres',
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
    """Test database connection"""
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


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT user_id, username, email, role, first_name, last_name
            FROM users 
            WHERE username = %s AND password_hash = %s AND is_active = TRUE
        """, (username, password))
        
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid credentials'}), 401
        
        session_token = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '24 hours')
            RETURNING session_id
        """, (user['user_id'], session_token))
        
        conn.commit()
        
        session['user_id'] = str(user['user_id'])
        session['session_token'] = session_token
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'message': 'Login successful',
            'user': dict(user),
            'session_token': session_token
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session_token = session.get('session_token')
    
    if session_token:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE user_sessions 
                    SET logged_out_at = NOW()
                    WHERE session_token = %s
                """, (session_token,))
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Logout error: {e}")
    
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT user_id, username, email, role, first_name, last_name
            FROM users 
            WHERE user_id = %s AND is_active = TRUE
        """, (user_id,))
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify(dict(user))
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/labs', methods=['GET'])
def get_labs():
    user_id = session.get('user_id')
    course_id = request.args.get('course_id')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        is_instructor = False
        if user_id:
            cursor.execute("""
                SELECT role FROM users WHERE user_id = %s
            """, (user_id,))
            user = cursor.fetchone()
            is_instructor = user and user['role'] in ('instructor', 'admin')
        
        if is_instructor:
            query = "SELECT * FROM labs"
            params = []
        else:
            query = "SELECT * FROM labs WHERE is_published = TRUE"
            params = []
        
        if course_id:
            query += " AND course_id = %s" if is_instructor else " AND course_id = %s"
            params.append(course_id)
        
        query += " ORDER BY lab_id"
        
        cursor.execute(query, params)
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
                'points': lab.get('points'),
                'due_date': lab['due_date'].isoformat() if lab.get('due_date') else None,
                'register_mapping': lab.get('register_mapping'),
                'initial_values': lab.get('initial_values')
            }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs/<lab_id>', methods=['GET'])
def get_lab(lab_id):
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        is_instructor = False
        if user_id:
            cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            is_instructor = user and user['role'] in ('instructor', 'admin')
        
        if is_instructor:
            cursor.execute("SELECT * FROM labs WHERE lab_id = %s", (lab_id,))
        else:
            cursor.execute("""
                SELECT * FROM labs 
                WHERE lab_id = %s AND is_published = TRUE
            """, (lab_id,))
        
        lab = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if lab:
            return jsonify({
                'title': lab['title'],
                'html': lab['instructions'] or '',
                'description': lab.get('description'),
                'starter_code': lab.get('starter_code'),
                'solution_code': lab.get('solution_code') if is_instructor else None,
                'difficulty': lab.get('difficulty'),
                'points': lab.get('points'),
                'due_date': lab['due_date'].isoformat() if lab.get('due_date') else None,
                'register_mapping': lab.get('register_mapping'),
                'initial_values': lab.get('initial_values'),
                'max_instructions': lab.get('max_instructions'),
                'time_limit_seconds': lab.get('time_limit_seconds')
            })
        return jsonify({'error': 'Lab not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs', methods=['POST'])
def create_lab():
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    
    if not data or 'lab_id' not in data or 'title' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or user['role'] not in ('instructor', 'admin'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        cursor.execute("""
            INSERT INTO labs (
                lab_id, title, description, instructions, starter_code,
                solution_code, register_mapping, initial_values,
                difficulty, points, max_instructions, time_limit_seconds,
                memory_limit_kb, release_date, due_date, is_published,
                course_id, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING lab_id
        """, (
            data['lab_id'],
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
            data.get('time_limit_seconds', 30),
            data.get('memory_limit_kb', 1024),
            data.get('release_date'),
            data.get('due_date'),
            data.get('is_published', False),
            data.get('course_id'),
            user_id
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab created successfully', 'lab_id': data['lab_id']}), 201
    except psycopg2.IntegrityError as e:
        conn.rollback()
        return jsonify({'error': 'Lab ID already exists'}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs/<lab_id>', methods=['PUT'])
def update_lab(lab_id):
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or user['role'] not in ('instructor', 'admin'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Insufficient permissions'}), 403
        
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
                points = COALESCE(%s, points),
                due_date = COALESCE(%s, due_date),
                is_published = COALESCE(%s, is_published),
                updated_at = NOW()
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
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/labs/<lab_id>', methods=['DELETE'])
def delete_lab(lab_id):
    """Delete a lab (instructor only)"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user or user[0] not in ('instructor', 'admin'):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        cursor.execute("DELETE FROM labs WHERE lab_id = %s RETURNING lab_id", (lab_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Lab not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Lab deleted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all active courses"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT * FROM courses 
            WHERE is_active = TRUE 
            ORDER BY year DESC, semester DESC
        """)
        courses = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify([dict(course) for course in courses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/courses/<course_id>/enrollments', methods=['GET'])
def get_course_enrollments(course_id):
    """Get enrollments for a course"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT e.*, u.username, u.email, u.first_name, u.last_name
            FROM enrollments e
            JOIN users u ON e.user_id = u.user_id
            WHERE e.course_id = %s AND e.dropped_at IS NULL
            ORDER BY e.role, u.last_name, u.first_name
        """, (course_id,))
        enrollments = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify([dict(enr) for enr in enrollments])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/preferences', methods=['GET'])
def get_preferences():
    """Get user preferences"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT * FROM user_preferences WHERE user_id = %s
        """, (user_id,))
        prefs = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if prefs:
            return jsonify(dict(prefs))
        return jsonify({
            'theme': 'light',
            'editor_font_size': 13,
            'auto_save_enabled': True
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/preferences', methods=['PUT'])
def update_preferences():
    """Update user preferences"""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_preferences (user_id, theme, editor_font_size, auto_save_enabled, additional_settings)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                theme = COALESCE(%s, user_preferences.theme),
                editor_font_size = COALESCE(%s, user_preferences.editor_font_size),
                auto_save_enabled = COALESCE(%s, user_preferences.auto_save_enabled),
                additional_settings = COALESCE(%s, user_preferences.additional_settings),
                updated_at = NOW()
        """, (
            user_id,
            data.get('theme'),
            data.get('editor_font_size'),
            data.get('auto_save_enabled'),
            json.dumps(data.get('additional_settings')) if data.get('additional_settings') else None,
            data.get('theme'),
            data.get('editor_font_size'),
            data.get('auto_save_enabled'),
            json.dumps(data.get('additional_settings')) if data.get('additional_settings') else None
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Preferences updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("MIPS Emulator - Flask Server")
    print("\nTesting database connection...")
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f" Connected to PostgreSQL")
            print(f"  Version: {version[0][:50]}...")
            
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            print(f"\nFound {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Database error: {e}")
    else:
        print("Could not connect to database")
        print("  Make sure PostgreSQL is running and the 'capstone' database exists")
    
    print("Starting Flask server on http://localhost:5000")
    print("\nAPI Endpoints:")
    print("  GET  /api/test-connection")
    print("  POST /api/auth/login")
    print("  POST /api/auth/logout")
    print("  GET  /api/auth/me")
    print("  GET  /api/labs")
    print("  GET  /api/labs/<lab_id>")
    print("  POST /api/labs")
    print("  PUT  /api/labs/<lab_id>")
    print("  DELETE /api/labs/<lab_id>")
    print("  GET  /api/courses")
    print("  GET  /api/preferences")
    print("  PUT  /api/preferences")
    print("\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)