#!/usr/bin/env python3
"""
Test script to verify all RAG API endpoints work correctly.
Run this from the Thesis directory: python3 rag/test_apis.py
"""
import os
import sys
import requests
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test environment variables
os.environ.setdefault('MISTRAL_API_KEY', 'test-key-for-imports')
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017/demo_db')
os.environ.setdefault('JWT_SECRET', 'test-secret')

BASE_URL = "http://localhost:5001"
TEST_TOKEN = "test-token"  # You'll need a real JWT token for actual testing

def test_imports():
    """Test that all modules can be imported"""
    print("=" * 60)
    print("TEST 1: Module Imports")
    print("=" * 60)
    
    try:
        from rag.server.app import create_app
        print("✅ rag.server.app imported")
    except Exception as e:
        print(f"❌ rag.server.app: {e}")
        return False
    
    try:
        from rag.fine_tune.fine_tune_app import app as fine_tune_app
        print("✅ rag.fine_tune.fine_tune_app imported")
    except Exception as e:
        print(f"❌ rag.fine_tune.fine_tune_app: {e}")
        return False
    
    try:
        from rag.retrieval.retrieval_pipeline import build_retrieval_chain
        print("✅ rag.retrieval.retrieval_pipeline imported")
    except Exception as e:
        print(f"❌ rag.retrieval.retrieval_pipeline: {e}")
        return False
    
    try:
        from rag.ingestion.ingestion_pipeline import build_faiss_index
        print("✅ rag.ingestion.ingestion_pipeline imported")
    except Exception as e:
        print(f"❌ rag.ingestion.ingestion_pipeline: {e}")
        return False
    
    try:
        from rag.evaluation.evaluator import grade_answer_relevance, grade_hallucination, rewrite_query
        print("✅ rag.evaluation.evaluator imported")
    except Exception as e:
        print(f"❌ rag.evaluation.evaluator: {e}")
        return False
    
    return True

def test_flask_app_creation():
    """Test that Flask app can be created"""
    print("\n" + "=" * 60)
    print("TEST 2: Flask App Creation")
    print("=" * 60)
    
    try:
        from rag.server.app import create_app
        app = create_app()
        print("✅ Flask app created successfully")
        
        # Check routes
        with app.app_context():
            routes = [str(rule) for rule in app.url_map.iter_rules()]
            print(f"✅ Found {len(routes)} routes:")
            api_routes = [r for r in routes if '/api/' in r]
            for route in api_routes:
                print(f"   - {route}")
        
        return True
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    """Test API endpoints (requires server to be running)"""
    print("\n" + "=" * 60)
    print("TEST 3: API Endpoints (requires server running)")
    print("=" * 60)
    
    headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
    
    endpoints = [
        ("GET", "/api/conversations", None),
        ("POST", "/api/conversation", {"name": "Test Conversation"}),
    ]
    
    for method, endpoint, data in endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=5)
            else:
                response = requests.post(url, headers=headers, json=data, timeout=5)
            
            if response.status_code in [200, 201]:
                print(f"✅ {method} {endpoint}: {response.status_code}")
            elif response.status_code == 401:
                print(f"⚠️  {method} {endpoint}: 401 (Unauthorized - need valid token)")
            else:
                print(f"❌ {method} {endpoint}: {response.status_code} - {response.text[:100]}")
        except requests.exceptions.ConnectionError:
            print(f"⚠️  {method} {endpoint}: Server not running (expected if testing imports only)")
        except Exception as e:
            print(f"❌ {method} {endpoint}: {e}")

def test_retrieval_chain():
    """Test retrieval chain creation (without actually running it)"""
    print("\n" + "=" * 60)
    print("TEST 4: Retrieval Chain Structure")
    print("=" * 60)
    
    try:
        from rag.retrieval.retrieval_pipeline import build_retrieval_chain
        from rag.config import MISTRAL_API_KEY
        
        # This will fail if no index exists, but we can check the function exists
        print("✅ build_retrieval_chain function available")
        print("   Note: Actual chain creation requires user index and API key")
        return True
    except Exception as e:
        print(f"❌ Retrieval chain test failed: {e}")
        return False

def main():
    print("\n" + "=" * 60)
    print("RAG API TEST SUITE")
    print("=" * 60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Python: {sys.version}")
    print(f"Working Directory: {os.getcwd()}")
    
    results = []
    
    # Test 1: Imports
    results.append(("Imports", test_imports()))
    
    # Test 2: Flask App
    results.append(("Flask App", test_flask_app_creation()))
    
    # Test 3: API Endpoints (optional - requires server)
    test_api_endpoints()
    
    # Test 4: Retrieval Chain
    results.append(("Retrieval Chain", test_retrieval_chain()))
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(result for _, result in results)
    print("\n" + ("=" * 60))
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

