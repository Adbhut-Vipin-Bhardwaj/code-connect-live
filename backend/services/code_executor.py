"""Code execution service for multiple programming languages."""

import subprocess
import tempfile
import os
import re
from typing import Dict
from config import EXECUTION_TIMEOUT


def execute_code(code: str, language: str) -> Dict[str, any]:
    """Execute code in the specified language and return results."""
    executors = {
        "python": execute_python,
        "javascript": execute_javascript,
        "typescript": execute_typescript,
        "java": execute_java,
        "cpp": execute_cpp
    }
    
    executor = executors.get(language)
    if not executor:
        return {
            "success": False,
            "output": "",
            "error": f"Unsupported language: {language}"
        }
    
    return executor(code)


def execute_python(code: str) -> Dict[str, any]:
    """Execute Python code."""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        result = subprocess.run(
            ['python3', temp_file],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT
        )
        
        os.unlink(temp_file)
        
        if result.returncode == 0:
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "output": result.stdout, "error": result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}


def execute_javascript(code: str) -> Dict[str, any]:
    """Execute JavaScript code using Node.js."""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        result = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT
        )
        
        os.unlink(temp_file)
        
        if result.returncode == 0:
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "output": result.stdout, "error": result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except FileNotFoundError:
        return {"success": False, "output": "", "error": "Node.js is not installed"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}


def execute_typescript(code: str) -> Dict[str, any]:
    """Execute TypeScript code."""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.ts', delete=False) as f:
            f.write(code)
            temp_ts_file = f.name
        
        temp_js_file = temp_ts_file.replace('.ts', '.js')
        
        # Compile and run TypeScript
        compile_result = subprocess.run(
            ['npx', 'ts-node', temp_ts_file],
            capture_output=True,
            text=True,
            timeout=EXECUTION_TIMEOUT
        )
        
        os.unlink(temp_ts_file)
        if os.path.exists(temp_js_file):
            os.unlink(temp_js_file)
        
        if compile_result.returncode == 0:
            return {"success": True, "output": compile_result.stdout}
        else:
            return {"success": False, "output": compile_result.stdout, "error": compile_result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except FileNotFoundError:
        return {"success": False, "output": "", "error": "TypeScript/Node.js is not installed"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}


def execute_java(code: str) -> Dict[str, any]:
    """Execute Java code."""
    try:
        # Extract class name from code
        class_match = re.search(r'public\s+class\s+(\w+)', code)
        class_name = class_match.group(1) if class_match else 'Main'
        
        with tempfile.TemporaryDirectory() as temp_dir:
            java_file = os.path.join(temp_dir, f'{class_name}.java')
            with open(java_file, 'w') as f:
                f.write(code)
            
            # Compile
            compile_result = subprocess.run(
                ['javac', java_file],
                capture_output=True,
                text=True,
                timeout=EXECUTION_TIMEOUT
            )
            
            if compile_result.returncode != 0:
                return {"success": False, "output": "", "error": compile_result.stderr}
            
            # Run
            run_result = subprocess.run(
                ['java', '-cp', temp_dir, class_name],
                capture_output=True,
                text=True,
                timeout=EXECUTION_TIMEOUT
            )
            
            if run_result.returncode == 0:
                return {"success": True, "output": run_result.stdout}
            else:
                return {"success": False, "output": run_result.stdout, "error": run_result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except FileNotFoundError:
        return {"success": False, "output": "", "error": "Java is not installed"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}


def execute_cpp(code: str) -> Dict[str, any]:
    """Execute C++ code."""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            cpp_file = os.path.join(temp_dir, 'main.cpp')
            executable = os.path.join(temp_dir, 'main')
            
            with open(cpp_file, 'w') as f:
                f.write(code)
            
            # Compile
            compile_result = subprocess.run(
                ['g++', cpp_file, '-o', executable],
                capture_output=True,
                text=True,
                timeout=EXECUTION_TIMEOUT
            )
            
            if compile_result.returncode != 0:
                return {"success": False, "output": "", "error": compile_result.stderr}
            
            # Run
            run_result = subprocess.run(
                [executable],
                capture_output=True,
                text=True,
                timeout=EXECUTION_TIMEOUT
            )
            
            if run_result.returncode == 0:
                return {"success": True, "output": run_result.stdout}
            else:
                return {"success": False, "output": run_result.stdout, "error": run_result.stderr}
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "", "error": "Execution timed out"}
    except FileNotFoundError:
        return {"success": False, "output": "", "error": "g++ is not installed"}
    except Exception as e:
        return {"success": False, "output": "", "error": str(e)}
