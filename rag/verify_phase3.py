#!/usr/bin/env python3
"""
Standalone verification script for Phase 3: Code Quality Improvements
No dependencies required - just run with python3 verify_phase3.py
"""

import os
import sys
from pathlib import Path

project_root = Path(__file__).parent

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def check_file_exists(filepath, description):
    """Check if a file exists."""
    exists = os.path.isfile(filepath)
    status = f"{GREEN}✅{RESET}" if exists else f"{RED}❌{RESET}"
    print(f"{status} {description}: {filepath.name}")
    return exists


def check_dir_exists(dirpath, description):
    """Check if a directory exists."""
    exists = os.path.exists(dirpath)
    status = f"{GREEN}✅{RESET}" if exists else f"{RED}❌{RESET}"
    print(f"{status} {description}: {dirpath.name}/")
    return exists


def check_file_content(filepath, search_string, description):
    """Check if a file contains a specific string."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        contains = search_string in content
        status = f"{GREEN}✅{RESET}" if contains else f"{RED}❌{RESET}"
        print(f"{status} {description}")
        return contains
    except Exception as e:
        print(f"{RED}❌{RESET} {description} (Error: {e})")
        return False


def count_lines(filepath):
    """Count lines in a file."""
    try:
        with open(filepath, 'r') as f:
            return len(f.readlines())
    except:
        return 0


def main():
    print("\n" + "=" * 70)
    print(f"{BLUE}PHASE 3: CODE QUALITY IMPROVEMENTS - VERIFICATION{RESET}")
    print("=" * 70 + "\n")

    results = {}

    # Section 1: Module Structure
    print(f"\n{YELLOW}[1] MODULE STRUCTURE{RESET}")
    print("-" * 70)
    results['workflows_dir'] = check_dir_exists(
        project_root / "server" / "workflows",
        "Workflows module directory"
    )
    results['workflows_init'] = check_file_exists(
        project_root / "server" / "workflows" / "__init__.py",
        "Workflows __init__.py"
    )
    results['langgraph_workflow'] = check_file_exists(
        project_root / "server" / "workflows" / "langgraph_workflow.py",
        "LangGraph workflow module"
    )
    results['intent_router'] = check_file_exists(
        project_root / "server" / "workflows" / "intent_router.py",
        "Intent router module"
    )

    results['handlers_dir'] = check_dir_exists(
        project_root / "server" / "handlers",
        "Handlers module directory"
    )
    results['handlers_init'] = check_file_exists(
        project_root / "server" / "handlers" / "__init__.py",
        "Handlers __init__.py"
    )
    results['conversation_handler'] = check_file_exists(
        project_root / "server" / "handlers" / "conversation_handler.py",
        "Conversation handler module"
    )
    results['message_handler'] = check_file_exists(
        project_root / "server" / "handlers" / "message_handler.py",
        "Message handler module"
    )
    results['upload_handler'] = check_file_exists(
        project_root / "server" / "handlers" / "upload_handler.py",
        "Upload handler module"
    )

    # Section 2: app.py Size Reduction
    print(f"\n{YELLOW}[2] CODE SIZE REDUCTION{RESET}")
    print("-" * 70)
    app_file = project_root / "server" / "app.py"
    if os.path.isfile(app_file):
        line_count = count_lines(app_file)
        if line_count < 500:
            print(f"{GREEN}✅{RESET} app.py reduced to {line_count} lines (was 1133)")
            results['app_size'] = True
        else:
            print(f"{YELLOW}⚠{RESET}  app.py has {line_count} lines (target: < 500)")
            results['app_size'] = False
    else:
        print(f"{RED}❌{RESET} app.py not found")
        results['app_size'] = False

    # Section 3: Imports and Dependencies
    print(f"\n{YELLOW}[3] MODULE IMPORTS{RESET}")
    print("-" * 70)
    results['app_imports_handlers'] = check_file_content(
        project_root / "server" / "app.py",
        "from rag.server.handlers",
        "app.py imports handlers"
    )
    results['app_imports_workflows'] = check_file_content(
        project_root / "server" / "app.py",
        "from rag.server.workflows",
        "app.py imports workflows"
    )

    # Section 4: Configuration Files
    print(f"\n{YELLOW}[4] CONFIGURATION FILES{RESET}")
    print("-" * 70)
    results['pyproject_toml'] = check_file_exists(
        project_root / "pyproject.toml",
        "pyproject.toml"
    )
    results['black_config'] = check_file_content(
        project_root / "pyproject.toml",
        "[tool.black]",
        "Black configuration"
    )
    results['ruff_config'] = check_file_content(
        project_root / "pyproject.toml",
        "[tool.ruff]",
        "Ruff configuration"
    )
    results['mypy_config'] = check_file_content(
        project_root / "pyproject.toml",
        "[tool.mypy]",
        "MyPy configuration"
    )
    results['precommit_config'] = check_file_exists(
        project_root / ".pre-commit-config.yaml",
        "Pre-commit hooks config"
    )

    # Section 5: Development Dependencies
    print(f"\n{YELLOW}[5] DEVELOPMENT DEPENDENCIES{RESET}")
    print("-" * 70)
    req_dev = project_root / "requirements-dev.txt"
    results['black_dep'] = check_file_content(req_dev, "black", "Black in requirements-dev")
    results['ruff_dep'] = check_file_content(req_dev, "ruff", "Ruff in requirements-dev")
    results['mypy_dep'] = check_file_content(req_dev, "mypy", "MyPy in requirements-dev")
    results['pytest_dep'] = check_file_content(req_dev, "pytest", "Pytest in requirements-dev")
    results['precommit_dep'] = check_file_content(req_dev, "pre-commit", "Pre-commit in requirements-dev")
    results['type_stubs'] = check_file_content(req_dev, "types-flask", "Type stubs in requirements-dev")

    # Section 6: Type Hints
    print(f"\n{YELLOW}[6] TYPE HINTS{RESET}")
    print("-" * 70)
    results['conversation_types'] = check_file_content(
        project_root / "server" / "handlers" / "conversation_handler.py",
        "Tuple[Any, int]",
        "Conversation handler has type hints"
    )
    results['workflow_types'] = check_file_content(
        project_root / "server" / "workflows" / "langgraph_workflow.py",
        "TypedDict",
        "Workflow module has TypedDict"
    )

    # Section 7: Code Organization
    print(f"\n{YELLOW}[7] CODE ORGANIZATION{RESET}")
    print("-" * 70)

    # Check that functions are properly separated
    app_content = ""
    try:
        with open(project_root / "server" / "app.py", 'r') as f:
            app_content = f.read()
    except:
        pass

    # These should NOT be defined in app.py (moved to handlers)
    has_create_conv = 'def create_new_conversation(' in app_content
    has_handle_upload = 'def handle_document_upload(' in app_content

    if not has_create_conv and not has_handle_upload:
        print(f"{GREEN}✅{RESET} Functions properly moved to handlers (not duplicated)")
        results['no_duplication'] = True
    else:
        print(f"{YELLOW}⚠{RESET}  Some functions may still be in app.py")
        results['no_duplication'] = False

    # Summary
    print("\n" + "=" * 70)
    print(f"{BLUE}SUMMARY{RESET}")
    print("=" * 70)

    passed = sum(results.values())
    total = len(results)
    percentage = (passed / total) * 100 if total > 0 else 0

    if percentage == 100:
        print(f"{GREEN}✅ ALL CHECKS PASSED ({passed}/{total}){RESET}")
    elif percentage >= 80:
        print(f"{YELLOW}⚠  MOSTLY COMPLETE ({passed}/{total} - {percentage:.0f}%){RESET}")
    else:
        print(f"{RED}❌ INCOMPLETE ({passed}/{total} - {percentage:.0f}%){RESET}")

    print("\n" + "=" * 70)
    print(f"{BLUE}PHASE 3 COMPLETION STATUS{RESET}")
    print("=" * 70)

    tasks = {
        "3.1 Split Large Files": results.get('langgraph_workflow', False) and results.get('conversation_handler', False),
        "3.2 Type Hints Setup": results.get('mypy_config', False) and results.get('type_stubs', False),
        "3.4 Code Formatting": results.get('black_config', False) and results.get('ruff_config', False),
        "3.4 Pre-commit Hooks": results.get('precommit_config', False),
    }

    for task, completed in tasks.items():
        status = f"{GREEN}✅{RESET}" if completed else f"{RED}❌{RESET}"
        print(f"{status} {task}")

    print("\n" + "=" * 70)
    print(f"{BLUE}NEXT STEPS{RESET}")
    print("=" * 70)
    print(f"""
To complete the setup, run these commands in a virtual environment:

1. Install dev dependencies:
   {YELLOW}pip install -r requirements-dev.txt{RESET}

2. Format code with Black:
   {YELLOW}black . --line-length 100{RESET}

3. Lint with Ruff:
   {YELLOW}ruff check . --fix{RESET}

4. Type check with MyPy:
   {YELLOW}mypy .{RESET}

5. Setup pre-commit hooks:
   {YELLOW}pre-commit install{RESET}

6. Run tests:
   {YELLOW}pytest test/test_phase3_code_quality.py -v{RESET}
""")

    # Exit code
    sys.exit(0 if percentage == 100 else 1)


if __name__ == "__main__":
    main()
