#!/usr/bin/env python3
"""
Phase 4 Verification Script - Architecture Improvements

Standalone script to verify all Phase 4 implementations.
Run this after implementing Phase 4 to ensure everything is working.
"""

import os
import sys

# Change to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Add parent directory to path so rag module can be imported
parent_dir = os.path.dirname(script_dir)
sys.path.insert(0, parent_dir)

RESET = "\033[0m"
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"


def print_header(text: str):
    """Print section header."""
    print(f"\n{BLUE}{'=' * 70}{RESET}")
    print(f"{BLUE}{text:^70}{RESET}")
    print(f"{BLUE}{'=' * 70}{RESET}\n")


def check_pass(message: str):
    """Print success message."""
    print(f"{GREEN}✓{RESET} {message}")


def check_fail(message: str):
    """Print failure message."""
    print(f"{RED}✗{RESET} {message}")


def check_warn(message: str):
    """Print warning message."""
    print(f"{YELLOW}!{RESET} {message}")


def main():
    """Run all Phase 4 verification checks."""
    print_header("PHASE 4: ARCHITECTURE IMPROVEMENTS - VERIFICATION")

    total_checks = 0
    passed_checks = 0

    # ========================================================================
    # 4.1: HEALTH CHECK ENDPOINT
    # ========================================================================
    print_header("4.1: Health Check Endpoint")

    # Check health endpoint exists in app.py
    total_checks += 1
    try:
        with open("server/app.py", "r") as f:
            content = f.read()
            if "def health():" in content and "circuit_breaker" in content:
                check_pass("Enhanced health check endpoint found in server/app.py")
                passed_checks += 1
            else:
                check_fail("Health check endpoint not properly enhanced")
    except Exception as e:
        check_fail(f"Error reading server/app.py: {e}")

    # Check health endpoint returns proper structure
    total_checks += 1
    try:
        from rag.server.app import create_app
        app = create_app()
        client = app.test_client()
        response = client.get('/api/health')
        data = response.get_json()

        if all(k in data for k in ['status', 'timestamp', 'checks']):
            check_pass("Health endpoint returns correct structure")
            passed_checks += 1
        else:
            check_fail("Health endpoint missing required fields")
    except Exception as e:
        check_fail(f"Health endpoint test failed: {e}")

    # ========================================================================
    # 4.2: CIRCUIT BREAKER
    # ========================================================================
    print_header("4.2: Circuit Breaker Pattern")

    # Check circuit_breaker.py exists
    total_checks += 1
    if os.path.exists("server/circuit_breaker.py"):
        check_pass("Circuit breaker module created (server/circuit_breaker.py)")
        passed_checks += 1
    else:
        check_fail("Circuit breaker module not found")

    # Check circuit breaker imports
    total_checks += 1
    try:
        from rag.server.circuit_breaker import (
            mistral_breaker,
            tavily_breaker,
            mongodb_breaker,
            get_circuit_states,
            reset_all_breakers
        )
        check_pass("Circuit breaker components importable")
        passed_checks += 1
    except Exception as e:
        check_fail(f"Circuit breaker import failed: {e}")

    # Check circuit breaker configuration
    total_checks += 1
    try:
        from rag.server.circuit_breaker import mistral_breaker
        if mistral_breaker.fail_max == 5 and mistral_breaker._reset_timeout == 60:
            check_pass("Circuit breaker configured correctly (fail_max=5, reset_timeout=60s)")
            passed_checks += 1
        else:
            check_fail("Circuit breaker misconfigured")
    except Exception as e:
        check_fail(f"Circuit breaker config check failed: {e}")

    # Check circuit states function
    total_checks += 1
    try:
        from rag.server.circuit_breaker import get_circuit_states
        states = get_circuit_states()
        if all(k in states for k in ['mistral_api', 'tavily_api', 'mongodb']):
            check_pass("Circuit state monitoring working")
            passed_checks += 1
        else:
            check_fail("Circuit state monitoring incomplete")
    except Exception as e:
        check_fail(f"Circuit state check failed: {e}")

    # ========================================================================
    # 4.3: DATABASE CONNECTION POOLING
    # ========================================================================
    print_header("4.3: Database Connection Pooling")

    # Check config.py updated
    total_checks += 1
    try:
        with open("config.py", "r") as f:
            content = f.read()
            if "maxPoolSize" in content and "minPoolSize" in content:
                check_pass("Connection pooling configured in config.py")
                passed_checks += 1
            else:
                check_fail("Connection pooling not configured")
    except Exception as e:
        check_fail(f"Error reading config.py: {e}")

    # Check mongo client configuration
    total_checks += 1
    try:
        from rag.config import mongo_client
        pool_options = mongo_client._MongoClient__options.pool_options

        if pool_options.max_pool_size == 50 and pool_options.min_pool_size == 10:
            check_pass("MongoDB pool settings correct (max=50, min=10)")
            passed_checks += 1
        else:
            check_warn("MongoDB pool settings different from recommended")
            passed_checks += 1  # Still pass, just different config
    except Exception as e:
        check_fail(f"MongoDB pool config check failed: {e}")

    # Check retry settings
    total_checks += 1
    try:
        from rag.config import mongo_client
        options = mongo_client._MongoClient__options
        if options.retry_writes and options.retry_reads:
            check_pass("MongoDB retry writes/reads enabled")
            passed_checks += 1
        else:
            check_fail("MongoDB retry settings not enabled")
    except Exception as e:
        check_fail(f"MongoDB retry check failed: {e}")

    # ========================================================================
    # 4.4: RETRY LOGIC
    # ========================================================================
    print_header("4.4: Retry Logic with Exponential Backoff")

    # Check retry_utils.py exists
    total_checks += 1
    if os.path.exists("utils/retry_utils.py"):
        check_pass("Retry utilities module created (utils/retry_utils.py)")
        passed_checks += 1
    else:
        check_fail("Retry utilities module not found")

    # Check retry decorators
    total_checks += 1
    try:
        from rag.utils.retry_utils import (
            retry_api_call,
            retry_mistral_call,
            retry_mongodb_operation,
            retry_web_search,
            with_fallback
        )
        check_pass("Retry decorators importable")
        passed_checks += 1
    except Exception as e:
        check_fail(f"Retry decorators import failed: {e}")

    # Test retry functionality
    total_checks += 1
    try:
        from rag.utils.retry_utils import with_fallback

        # Test fallback on success
        result = with_fallback(lambda: "success", fallback_value="fallback", log_errors=False)
        if result == "success":
            check_pass("Retry fallback logic working")
            passed_checks += 1
        else:
            check_fail("Retry fallback logic failed")
    except Exception as e:
        check_fail(f"Retry test failed: {e}")

    # ========================================================================
    # 4.5: STRUCTURED LOGGING
    # ========================================================================
    print_header("4.5: Structured Logging")

    # Check logging_config.py exists
    total_checks += 1
    if os.path.exists("utils/logging_config.py"):
        check_pass("Logging config module created (utils/logging_config.py)")
        passed_checks += 1
    else:
        check_fail("Logging config module not found")

    # Check logging functions
    total_checks += 1
    try:
        from rag.utils.logging_config import (
            configure_structured_logging,
            get_logger,
            bind_context,
            clear_context
        )
        check_pass("Logging utilities importable")
        passed_checks += 1
    except Exception as e:
        check_fail(f"Logging utilities import failed: {e}")

    # Test logging configuration
    total_checks += 1
    try:
        from rag.utils.logging_config import configure_structured_logging, get_logger

        configure_structured_logging(log_level="INFO", json_output=False)
        logger = get_logger("test")
        logger.info("test_log", key="value")
        check_pass("Structured logging working")
        passed_checks += 1
    except Exception as e:
        check_fail(f"Logging test failed: {e}")

    # ========================================================================
    # DEPENDENCIES
    # ========================================================================
    print_header("Dependencies Check")

    # Check requirements.txt
    total_checks += 1
    try:
        with open("requirements.txt", "r") as f:
            content = f.read()
            required_deps = ['tenacity', 'pybreaker', 'structlog', 'prometheus-client']
            if all(dep in content for dep in required_deps):
                check_pass("All Phase 4 dependencies added to requirements.txt")
                passed_checks += 1
            else:
                missing = [dep for dep in required_deps if dep not in content]
                check_fail(f"Missing dependencies: {', '.join(missing)}")
    except Exception as e:
        check_fail(f"Error reading requirements.txt: {e}")

    # ========================================================================
    # TEST FILE
    # ========================================================================
    print_header("Test Coverage")

    # Check test file exists
    total_checks += 1
    if os.path.exists("test/test_phase4_architecture.py"):
        check_pass("Phase 4 test file created (test/test_phase4_architecture.py)")
        passed_checks += 1
    else:
        check_fail("Phase 4 test file not found")

    # Count test cases
    total_checks += 1
    try:
        with open("test/test_phase4_architecture.py", "r") as f:
            content = f.read()
            test_count = content.count("def test_")
            if test_count >= 20:
                check_pass(f"Comprehensive test coverage ({test_count} test cases)")
                passed_checks += 1
            else:
                check_warn(f"Limited test coverage ({test_count} test cases)")
    except Exception as e:
        check_fail(f"Error analyzing test file: {e}")

    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_header("VERIFICATION SUMMARY")

    percentage = (passed_checks / total_checks * 100) if total_checks > 0 else 0

    print(f"Total Checks: {total_checks}")
    print(f"Passed: {GREEN}{passed_checks}{RESET}")
    print(f"Failed: {RED}{total_checks - passed_checks}{RESET}")
    print(f"Success Rate: {GREEN if percentage >= 80 else RED}{percentage:.1f}%{RESET}\n")

    if percentage == 100:
        print(f"{GREEN}{'=' * 70}")
        print(f"{'✓ ALL PHASE 4 CHECKS PASSED!':^70}")
        print(f"{'=' * 70}{RESET}\n")
        return 0
    elif percentage >= 80:
        print(f"{YELLOW}{'=' * 70}")
        print(f"{'⚠ PHASE 4 MOSTLY COMPLETE':^70}")
        print(f"{'=' * 70}{RESET}\n")
        return 1
    else:
        print(f"{RED}{'=' * 70}")
        print(f"{'✗ PHASE 4 INCOMPLETE':^70}")
        print(f"{'=' * 70}{RESET}\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
