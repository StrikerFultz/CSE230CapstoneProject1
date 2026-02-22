#!/usr/bin/env python3

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Blueprint, request, jsonify

import json
import subprocess
import tempfile
import os
import platform

simple_autograder_bp = Blueprint('simple_autograder', __name__, url_prefix='/api/grade')

_binary_name = 'mips-emu-wasm.exe' if platform.system() == 'Windows' else 'mips-emu-wasm'
GRADER_BINARY = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '..', 'target', 'release',
    _binary_name
)

DB_CONFIG = {
    'dbname': 'capstone',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432'
}

# TEMPORARY UNTIL the test cases are added to the PostgreSQL database
HARDCODED_TEST_CASES = {
    'lab-1-0': [
        {
            'name': 'Tutorial Check: Register Values',
            'points': 5,
            'initial_registers': {},
            'expected_registers': {
                '$t0': 10,
                '$t1': 20,
                '$t2': 30,
                '$s0': 268435456,
            },
        },
        {
            'name': 'Tutorial Check: Memory Storage',
            'points': 5,
            'initial_registers': {},
            'expected_registers': {},
            'expected_memory': {
                '268435456': 30,
            },
        },
    ],
    'lab-12-2': [
        {
            'name': 'Test 1: Compare storage (4 points)',
            'points': 4,
            'initial_registers': {
                '$s0': 2,
                '$s1': 4,
                '$s2': 6,
                '$s3': 5,
            },
            'expected_registers': {
                '$t0': 12,
                '$s0': 2,
                '$s1': 4,
                '$s2': 6,
                '$s3': 5,
                '$s4': 7,
            },
        },
        {
            'name': 'Test 2: Compare storage (3 points)',
            'points': 3,
            'initial_registers': {
                '$s0': 1,
                '$s1': 2,
                '$s2': 3,
                '$s3': 10,
            },
            'expected_registers': {
                '$t0': 6,
                '$s0': 1,
                '$s1': 2,
                '$s2': 3,
                '$s3': 10,
                '$s4': -4,
            },
        },
        {
            'name': 'Test 3: Compare storage (3 points)',
            'points': 3,
            'initial_registers': {
                '$s0': 1,
                '$s1': 1,
                '$s2': 1,
                '$s3': 3,
            },
            'expected_registers': {
                '$t0': 3,
                '$s0': 1,
                '$s1': 1,
                '$s2': 1,
                '$s3': 3,
                '$s4': 0,
            },
        },
    ],
}

def run_mips_native(source_code, initial_registers=None, initial_memory=None, check_memory=None):
    """
    run student code using the compiled emulator binary
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
        print(f"[GRADER] Error: {e}")
        return {'error': str(e), 'registers': {}, 'memory': {}}

def calculate_grade(test_cases, source_code):
    # Grade by running source code with different test cases (from db)

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
                'message': f'✗ Runtime error: {run_result["error"]}'
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
                'message': '✓ All checks passed!'
            })
        else:
            failed += 1
            results.append({
                'name': test_name,
                'status': 'FAIL',
                'points': points,
                'earned': 0,
                'message': '✗ Some values incorrect',
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
    
    #Get test cases from database
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT test_name, description, input_data, expected_output, points, is_hidden
            FROM lab_test_cases
            WHERE lab_id = %s
            ORDER BY test_case_id
        """, (lab_id,)) # may need to change due to names/changes/ MAY be security issue (maybe, not 100%) 
        
        test_cases = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to format expected by grader
        result = []
        for tc in test_cases:
            result.append({
                'name': tc['test_name'],
                'description': tc.get('description'),
                'points': tc.get('points', 10),
                'initial_registers': tc.get('input_data', {}),  # hidden in DB
                'expected_registers': tc.get('expected_output', {}),
                'is_hidden': tc.get('is_hidden', False)
            })
        
        return result
        
    except Exception as e:
        print(f"Database error: {e}")
        return None

@simple_autograder_bp.route('/submit', methods=['POST'])
def grade_submission():
    #below is example of what it would send to backend to store; 
    """
    POST /api/grade/submit
    
    Body: #how setup woroks
    {
        "lab_id": "lab-12-2", # get lab type (named in db)
        "student_id": "student123", # takes student name (somehow depedning on pwd form canvas -> our db)
        "source_code": "add $t0, $s0, $s1\\n..." 
    }
    """
    try:
        data = request.get_json()
        
        lab_id = data.get('lab_id')
        source_code = data.get('source_code', '')
        
        if not lab_id:
            return jsonify({'error': 'Missing lab_id'}), 400
        
        if not source_code:
            return jsonify({'error': 'Missing source_code'}), 400
        
        # Get test cases from DB
        test_cases = get_test_cases_for_lab(lab_id)
        
        if not test_cases:
            test_cases = HARDCODED_TEST_CASES.get(lab_id)
        
        if not test_cases:
            return jsonify({'error': f'No test cases found for lab {lab_id}'}), 404
        
        # Grade by running code with each test case
        grade_report = calculate_grade(test_cases, source_code)
        
        return jsonify({
            'success': True,
            'lab_id': lab_id,
            'grade_report': grade_report
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@simple_autograder_bp.route('/test-cases/<lab_id>', methods=['GET'])
def get_test_cases_endpoint(lab_id):
    #returns test cases WO anseers 
    test_cases = get_test_cases_for_lab(lab_id)

    if not test_cases:
        test_cases = HARDCODED_TEST_CASES.get(lab_id)
    
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


# Save sumissions to database  and then change the file formt for it to be downlaoded/moved from db to canvas if no canvas API approval
def save_submission(student_id, lab_id, answers, grade_report): # ned to change/add table in db for sponsor request of saving
    #add save to db here; 
    # TODO: Connect to PostgreSQL database and insert
    pass #error handler since no code currently