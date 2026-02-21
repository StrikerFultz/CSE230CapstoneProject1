#!/usr/bin/env python3

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Blueprint, request, jsonify
import json
import subprocess
import tempfile
import os


simple_autograder_bp = Blueprint('simple_autograder', __name__, url_prefix='/api/grade')


def calculate_grade(test_cases, source_code):
    #Grade by running source code with different test cases (from db)

    total_points = 0
    earned_points = 0
    passed = 0
    failed = 0
    results = []
    
    for test in test_cases:
        test_name = test.get('name', 'Test')
        points = test.get('points', 10)
        initial_regs = test.get('initial_registers', {})
        expected = test.get('expected_registers', {})
        
        total_points += points
        
        # Run the student's code with initial register values
        run_result = run_mips_code_with_wasm(source_code, initial_regs)
        
        if 'error' in run_result and run_result['error']:
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
        
        for register, expected_value in expected.items():
            student_value = student_registers.get(register)
            
            if student_value != expected_value:
                all_correct = False
                mismatches.append({
                    'register': register,
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

DB_CONFIG = {
    'dbname': 'capstone',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': '5432' #copied form sehema
}
def run_mips_code_with_wasm(source_code, initial_registers, max_instructions=10000):

    try:
        # Create a Node.js script that runs the WASM emulator
        node_script = f"""
const {{ WasmCPU }} = require('./pkg/mips_emu_wasm.js');

async function runCode() {{
    try {{
        const cpu = new WasmCPU();
        
        // Initialize registers
        const initialRegs = {json.dumps(initial_registers)};
        for (const [reg, value] of Object.entries(initialRegs)) {{
            cpu.set_register(reg, value);
        }}
        
        // Load and run the student's code
        const sourceCode = `{source_code.replace('`', '\\`').replace('\\', '\\\\')}`;
        const result = cpu.load_source(sourceCode);
        
        if (result && result.error) {{
            console.log(JSON.stringify({{ error: result.error }}));
            process.exit(1);
        }}
        
        // Run the program
        const runResult = cpu.run();
        
        // Get all register values
        const registers = {{}};
        const regNames = ['$zero', '$at', '$v0', '$v1', 
                         '$a0', '$a1', '$a2', '$a3',
                         '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
                         '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
                         '$t8', '$t9', '$k0', '$k1', 
                         '$gp', '$sp', '$fp', '$ra'];
        
        for (const reg of regNames) {{
            try {{
                const value = cpu.get_register(reg);
                // Convert to signed 32-bit integer
                const unsigned = value >>> 0;
                registers[reg] = unsigned > 0x7FFFFFFF ? unsigned - 0x100000000 : unsigned;
            }} catch (e) {{
                // Register not accessible
            }}
        }}
        
        console.log(JSON.stringify({{ registers }}));
    }} catch (e) {{
        console.log(JSON.stringify({{ error: e.message }}));
        process.exit(1);
    }}
}}

runCode();
"""
        
        # Write Node.js script to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(node_script)
            script_path = f.name
        
        try:
            # Get the absolute path to web directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            web_dir = current_dir
            
            # Run Node.js script
            result = subprocess.run(
                ['node', script_path],
                cwd=web_dir,
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode != 0:
                return {'error': 'Runtime error', 'registers': {}}
            
            output = json.loads(result.stdout)
            return output
            
        finally:
            os.unlink(script_path)
            
    except subprocess.TimeoutExpired:
        return {'error': 'Timeout', 'registers': {}}
    except Exception as e:
        print(f"Error running WASM: {e}")
        return {'error': str(e), 'registers': {}}
    
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
        "source_code": "add $t0, $s0, $s1\n..." 
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
        
        # Get test cases
        test_cases = get_test_cases_for_lab(lab_id)
        
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