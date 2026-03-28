#!/usr/bin/env python3

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Blueprint, request, jsonify
from flask import session, current_app

import json
import subprocess
import tempfile
import os
import logging
import platform
from datetime import datetime, timezone

log = logging.getLogger(__name__)

simple_autograder_bp = Blueprint('simple_autograder', __name__, url_prefix='/api/grade')

_binary_name = 'mips-emu-wasm.exe' if platform.system() == 'Windows' else 'mips-emu-wasm'
GRADER_BINARY = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    'mips-emu-wasm'  # sits next to server.py after Docker copies it
)

DB_CONFIG = {
    'dbname':   os.environ.get('DB_NAME', 'capstone'),
    'user':     os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host':     os.environ.get('DB_HOST', 'localhost'),
    'port':     os.environ.get('DB_PORT', '5432'),
}

MAX_SUBMISSIONS = 5


def _strip_expected_for_student(results_list):
    """Remove expected values from mismatches so students only see their own output.
    Returns a new list (does not mutate the original)."""
    sanitized = []
    for test in results_list:
        t = dict(test)  # shallow copy
        if 'mismatches' in t and t['mismatches']:
            t['mismatches'] = [
                {'register': m['register'], 'actual': m['actual']}
                for m in t['mismatches']
            ]
        sanitized.append(t)
    return sanitized


def run_mips_native(source_code, initial_registers=None, initial_memory=None, check_memory=None):
    """
    Run student code using the compiled emulator binary.
    """

    if initial_registers is None:
        initial_registers = {}
    if initial_memory is None:
        initial_memory = {}
    if check_memory is None:
        check_memory = []

    payload = json.dumps({
        'source_code': source_code,
        'initial_registers': initial_registers,
        'initial_memory': initial_memory,
        'check_memory': check_memory,
    })

    try:
        result = subprocess.run(
            [GRADER_BINARY],
            input=payload,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            stderr_msg = result.stderr.strip() if result.stderr else 'Unknown error'
            if result.stdout.strip():
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError:
                    pass
            return {'error': f'Binary exited with code {result.returncode}: {stderr_msg}', 'registers': {}, 'memory': {}}

        output = json.loads(result.stdout)
        return output

    except Exception as e:
        log.error("Emulator execution failed: %s", e, exc_info=True)
        return {'error': 'Emulator execution failed', 'registers': {}, 'memory': {}}

def calculate_grade(test_cases, source_code):
    """Grade by running source code against each test case via the Rust binary."""

    total_points = 0
    earned_points = 0
    passed = 0
    failed = 0

    results = []
    
    for test in test_cases:
        test_name = test.get('name', 'Test')
        points = test.get('points', 10)

        initial_regs = test.get('initial_registers', {})
        initial_mem = test.get('initial_memory', {})

        expected_regs = test.get('expected_registers', {})
        expected_mem = test.get('expected_memory', {})
        
        total_points += points

        # Build list of memory addresses we need to check
        check_memory = [int(addr) for addr in expected_mem.keys()] if expected_mem else []

        # Run the student's code with initial values using the emulator binary
        run_result = run_mips_native(
            source_code,
            initial_registers=initial_regs,
            initial_memory=initial_mem,
            check_memory=check_memory
        )

        if run_result.get('error'):
            failed += 1
            results.append({
                'name': test_name,
                'status': 'ERROR',
                'points': points,
                'earned': 0,
                'message': f'Runtime error: {run_result["error"]}'
            })
            continue
        
        student_registers = run_result.get('registers', {})
        
        # Check if results match expected
        all_correct = True
        mismatches = []
        
        for register, expected_value in expected_regs.items():
            student_value = student_registers.get(register)
            
            if student_value != expected_value:
                all_correct = False
                mismatches.append({
                    'register': register,
                    'expected': expected_value,
                    'actual': student_value
                })

        
        student_memory = run_result.get('memory', {})

        for addr_str, expected_value in expected_mem.items():
            student_value = student_memory.get(str(addr_str))

            if student_value != expected_value:
                all_correct = False
                mismatches.append({
                    'register': f'mem[{addr_str}]',
                    'expected': expected_value,
                    'actual': student_value
                })

        
        if all_correct:
            earned_points += points
            passed += 1
            results.append({
                'name': test_name,
                'status': 'PASS',
                'points': points,
                'earned': points,
                'message': 'All checks passed!'
            })
        else:
            failed += 1
            results.append({
                'name': test_name,
                'status': 'FAIL',
                'points': points,
                'earned': 0,
                'message': 'Some values incorrect',
                'mismatches': mismatches
            })
    
    percentage = (earned_points / total_points * 100) if total_points > 0 else 0
    
    return {
        'earned_points': earned_points,
        'total_points': total_points,
        'percentage': round(percentage, 1),
        'passed': passed,
        'failed': failed,
        'results': results
    }

def get_test_cases_for_lab(lab_id):
    """
    Get test cases from database and convert to the flat format
    that calculate_grade() expects.
    """
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT test_name, description, input_data, expected_output, points, is_hidden
            FROM lab_test_cases
            WHERE lab_id = %s
            ORDER BY test_name
        """, (lab_id,))
        
        test_cases = cursor.fetchall()
        cursor.close()
        conn.close()

        if not test_cases:
            return None
        
        # Convert DB JSONB → flat format for the grader
        result = []
        for tc in test_cases:
            # Parse JSONB (psycopg2 usually returns dicts, but guard against strings)
            inp = tc.get('input_data') or {}
            exp = tc.get('expected_output') or {}
            if isinstance(inp, str):
                inp = json.loads(inp)
            if isinstance(exp, str):
                exp = json.loads(exp)

            result.append({
                'name':               tc['test_name'],
                'description':        tc.get('description'),
                'points':             tc.get('points', 10),
                'initial_registers':  inp.get('registers', {}),
                'initial_memory':     inp.get('memory', {}),
                'expected_registers': exp.get('registers', {}),
                'expected_memory':    exp.get('memory', {}),
                'is_hidden':          tc.get('is_hidden', False),
            })
        
        return result
        
    except Exception as e:
        log.error("Database error fetching test cases for %s: %s", lab_id, e, exc_info=True)
        return None


def get_submission_count(user_id, lab_id):
    """Returns the number of submissions a user has made for a given lab."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) FROM submissions
            WHERE user_id = %s AND lab_id = %s
        """, (user_id, lab_id))
        count = cur.fetchone()[0]
        cur.close()
        conn.close()
        return int(count)
    except Exception as e:
        log.error("Error fetching submission count: %s", e, exc_info=True)
        return 0


@simple_autograder_bp.route('/submit', methods=['POST'])
def grade_submission():
    """
    POST /api/grade/submit

    Body:
    {
        "lab_id": "lab-12-2",
        "source_code": "add $t0, $s0, $s1\\n..."
    }
    """

    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json()
        lab_id = data.get('lab_id')
        source_code = data.get('source_code', '')

        # Session tracking sent by the client — validate before trusting
        duration_seconds = data.get('duration_seconds')
        run_count = data.get('run_count', 0)
        started_at = data.get('started_at')
        timing_flagged = False

        # 1. Type-check and clamp to sane ranges
        if duration_seconds is not None:
            try:
                duration_seconds = int(duration_seconds)
                duration_seconds = max(0, min(duration_seconds, 86400))  # 0s – 24h
            except (ValueError, TypeError):
                duration_seconds = None
                timing_flagged = True

        if run_count is not None:
            try:
                run_count = int(run_count)
                run_count = max(0, min(run_count, 10000))
            except (ValueError, TypeError):
                run_count = 0
                timing_flagged = True

        # 2. Cross-check client timestamp against server clock
        if started_at:
            try:
                client_start = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                now = datetime.now(timezone.utc)
                server_elapsed = (now - client_start).total_seconds()

                # Flag if client start is in the future
                if server_elapsed < -30:
                    timing_flagged = True
                    started_at = None
                    duration_seconds = None

                # If client duration diverges >60s from server-computed elapsed,
                # override with the server's value and flag the mismatch
                elif duration_seconds is not None and abs(server_elapsed - duration_seconds) > 60:
                    log.warning('Timing mismatch for user %s: client=%ss, server=%ss',
                                session["user_id"], duration_seconds, int(server_elapsed))
                    duration_seconds = int(server_elapsed)
                    timing_flagged = True

            except (ValueError, TypeError):
                started_at = None
                timing_flagged = True

        if timing_flagged:
            log.warning('Timing data flagged for user %s on lab %s', session["user_id"], lab_id)

        # Check submission count before doing anything else
        # Instructors and TAs are exempt from the limit
        role = session.get('role', 'student')
        is_teacher = role in ('instructor', 'ta')

        submission_count = get_submission_count(session['user_id'], lab_id)
        if not is_teacher and submission_count >= MAX_SUBMISSIONS:
            return jsonify({
                'error': f'Submission limit reached. You have used all {MAX_SUBMISSIONS} attempts for this lab.',
                'attempts_used': submission_count,
                'attempts_allowed': MAX_SUBMISSIONS,
                'limit_reached': True
            }), 403

        test_cases = get_test_cases_for_lab(lab_id)
        grade_report = calculate_grade(test_cases, source_code)

        # Save to DB
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        normalized_source = source_code.strip().replace('\n', '\\n')

        cur.execute("""
            INSERT INTO submissions (user_id, asurite_id, lab_id, score, total_possible,
                                     source_code, test_results, duration_seconds, run_count,
                                     started_at, timing_flagged)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            session['user_id'],
            session.get('username'),
            lab_id,
            grade_report['earned_points'],
            grade_report['total_points'],
            normalized_source,
            json.dumps(grade_report['results']),
            duration_seconds,
            run_count,
            started_at,
            timing_flagged
        ))

        conn.commit()
        cur.close()
        conn.close()

        # Return updated attempt info alongside the grade report
        new_count = submission_count + 1

        # Strip expected values so students only see their own output
        if not is_teacher:
            grade_report['results'] = _strip_expected_for_student(grade_report['results'])

        return jsonify({
            'success': True,
            'lab_id': lab_id,
            'grade_report': grade_report,
            'attempts_used': new_count,
            'attempts_remaining': None if is_teacher else max(0, MAX_SUBMISSIONS - new_count),
            'attempts_allowed': None if is_teacher else MAX_SUBMISSIONS,
            'limit_reached': False if is_teacher else new_count >= MAX_SUBMISSIONS,
            'unlimited': is_teacher
        })

    except Exception as e:
        log.error('Submit error: %s', e, exc_info=True)
        return jsonify({'error': 'Grading failed — please try again'}), 500


@simple_autograder_bp.route('/attempts/<lab_id>', methods=['GET'])
def get_attempts(lab_id):
    """Returns how many submissions the student has made for a lab."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    role = session.get('role', 'student')
    is_teacher = role in ('instructor', 'ta')
    count = get_submission_count(session['user_id'], lab_id)

    if is_teacher:
        return jsonify({
            'lab_id': lab_id,
            'attempts_used': count,
            'attempts_remaining': None,
            'attempts_allowed': None,
            'limit_reached': False,
            'unlimited': True
        })

    return jsonify({
        'lab_id': lab_id,
        'attempts_used': count,
        'attempts_remaining': max(0, MAX_SUBMISSIONS - count),
        'attempts_allowed': MAX_SUBMISSIONS,
        'limit_reached': count >= MAX_SUBMISSIONS
    })


@simple_autograder_bp.route('/attempts/<lab_id>/<user_id>', methods=['DELETE'])
def reset_attempts(lab_id, user_id):
    """Teacher-only: delete all submissions for a student on a given lab,
    effectively resetting their attempt counter."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    role = session.get('role', 'student')
    if role not in ('instructor', 'ta'):
        return jsonify({'error': 'Unauthorized — instructors only'}), 403

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        cur.execute("""
            DELETE FROM submissions
            WHERE user_id = %s AND lab_id = %s
        """, (user_id, lab_id))

        deleted = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'success': True,
            'lab_id': lab_id,
            'user_id': user_id,
            'deleted_count': deleted
        })
    except Exception as e:
        log.error('Reset error: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to reset attempts'}), 500


@simple_autograder_bp.route('/test-cases/<lab_id>', methods=['GET'])
def get_test_cases_endpoint(lab_id):
    """Returns test cases WITHOUT expected answers (safe for students)."""
    test_cases = get_test_cases_for_lab(lab_id)

    if not test_cases:
        return jsonify({'error': f'No test cases found for {lab_id}'}), 404
    
    # Remove expected answers before sending to student
    sanitized = []
    for test in test_cases:
        sanitized.append({
            'name': test.get('name'),
            'description': test.get('description'),
            'points': test.get('points')
        })
    
    return jsonify({
        'lab_id': lab_id,
        'test_cases': sanitized
    })


@simple_autograder_bp.route('/latest/<lab_id>', methods=['GET'])
def get_latest_submission(lab_id):
    """Fetches the most recent attempt for the logged-in student."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT score, total_possible, test_results, submitted_at, source_code
        FROM submissions
        WHERE user_id = %s AND lab_id = %s
        ORDER BY submitted_at DESC LIMIT 1
    """, (session['user_id'], lab_id))
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return jsonify({'error': 'No submissions found'}), 404

    # Strip expected values for students
    test_results = row['test_results']
    role = session.get('role', 'student')
    if role not in ('instructor', 'ta'):
        if isinstance(test_results, str):
            test_results = json.loads(test_results)
        if isinstance(test_results, list):
            test_results = _strip_expected_for_student(test_results)

    return jsonify({
        'score': row['score'],
        'total_possible': row['total_possible'],
        'test_results': test_results,
        'submitted_at': row['submitted_at'].isoformat(),
        'source_code': row['source_code']
    })