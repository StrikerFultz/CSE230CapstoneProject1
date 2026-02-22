#!/usr/bin/env python3

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DB_CONFIG = {
    'dbname': 'capstone',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}


def get_db():
    try:
        return psycopg2.connect(**DB_CONFIG)
    except psycopg2.Error as e:
        print(f"[AUTH] DB error: {e}")
        return None


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    POST /api/auth/signup
    {
        "asurite": "jdoe42",
        "email": "jdoe42@asu.edu",
        "full_name": "Jane Doe",
        "asu_id": "...",
        "password": "..."
    }
    """
    data = request.get_json()

    asurite = (data.get('asurite') or '').strip().lower()
    email = (data.get('email') or '').strip().lower()
    full_name = (data.get('full_name') or '').strip()
    asu_id = (data.get('asu_id') or '').strip()
    password = data.get('password', '')
    role = data.get('role', 'student')  # default to student

    if not asurite or not email or not full_name or not password:
        return jsonify({'error': 'All fields are required'}), 400

    if not email.endswith('@asu.edu'):
        return jsonify({'error': 'Must use an @asu.edu email address'}), 400

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    if role not in ('student', 'instructor', 'ta'):
        return jsonify({'error': 'Invalid role'}), 400

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            INSERT INTO users (username, email, full_name, asu_id, password_hash, role)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING user_id, username, email, full_name, asu_id, role
        """, (
            asurite,
            email,
            full_name,
            asu_id,
            generate_password_hash(password),
            role
        ))

        user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        # auth login
        session['user_id'] = str(user['user_id'])
        session['username'] = user['username']
        session['role'] = user['role']

        return jsonify({
            'message': 'Account created successfully',
            'user': {
                'user_id': str(user['user_id']),
                'username': user['username'],
                'email': user['email'],
                'full_name': user['full_name'],
                'asu_id': user['asu_id'],
                'role': user['role']
            }
        }), 201

    except psycopg2.IntegrityError as e:
        conn.rollback()

        err = str(e)
        if 'username' in err:
            msg = 'ASURITE already registered'
        elif 'email' in err:
            msg = 'Email already registered'
        else:
            msg = 'Account already exists'
        return jsonify({'error': msg}), 409
    
    except Exception as e:
        conn.rollback()
        print(f"[AUTH] Signup error: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    {
        "username": "jdoe42",
        "password": "..."
    }
    """
    data = request.get_json()

    username = (data.get('username') or '').strip().lower()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT user_id, username, email, full_name, asu_id, password_hash, role, is_active
            FROM users
            WHERE username = %s
        """, (username,))

        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid username or password'}), 401

        if not user.get('is_active', True):
            cursor.close()
            conn.close()
            return jsonify({'error': 'Account is deactivated'}), 403

        # update last_login
        cursor.execute("""
            UPDATE users SET last_login = %s WHERE user_id = %s
        """, (datetime.utcnow(), user['user_id']))
        conn.commit()

        cursor.close()
        conn.close()

        # set session
        session['user_id'] = str(user['user_id'])
        session['username'] = user['username']
        session['role'] = user['role']

        print(f"[AUTH] Login: {username} ({user['role']})")

        return jsonify({
            'message': 'Login successful',
            'user': {
                'user_id': str(user['user_id']),
                'username': user['username'],
                'email': user['email'],
                'full_name': user.get('full_name', ''),
                'asu_id': user.get('asu_id', ''),
                'role': user['role']
            }
        })

    except Exception as e:
        print(f"[AUTH] Login error: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    username = session.get('username', 'unknown')
    session.clear()
    print(f"[AUTH] Logout: {username}")
    return jsonify({'message': 'Logged out'})


@auth_bp.route('/me', methods=['GET'])
def me():
    """Returns the currently logged-in user, or 401."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    conn = get_db()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT user_id, username, email, full_name, asu_id, role, is_active
            FROM users WHERE user_id = %s
        """, (session['user_id'],))

        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not user:
            session.clear()
            return jsonify({'error': 'User not found'}), 401

        return jsonify({
            'user': {
                'user_id': str(user['user_id']),
                'username': user['username'],
                'email': user['email'],
                'full_name': user.get('full_name', ''),
                'asu_id': user.get('asu_id', ''),
                'role': user['role']
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500