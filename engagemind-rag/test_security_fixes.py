"""Quick test for Phase 1 security fixes."""
import os
import sys
import tempfile

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set required env vars for testing
os.environ['MISTRAL_API_KEY'] = 'test-key'
os.environ['JWT_SECRET'] = 'test-secret'
os.environ['MONGO_URL'] = 'mongodb://localhost:27017/test_db'

from rag.retrieval.retrieval_pipeline import _validate_faiss_index


def test_faiss_validation():
    """Test FAISS index validation."""
    print("Testing FAISS validation...")

    # Test 1: Non-existent directory
    try:
        _validate_faiss_index("/nonexistent/path", "test_user")
        print("❌ FAILED: Should reject non-existent directory")
        return False
    except ValueError as e:
        print(f"✅ PASSED: Rejected non-existent directory ({str(e)[:50]}...)")

    # Test 2: Directory ownership mismatch
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            _validate_faiss_index(tmpdir, "test_user")
            print("❌ FAILED: Should reject ownership mismatch")
            return False
        except ValueError as e:
            print(f"✅ PASSED: Rejected ownership mismatch ({str(e)[:50]}...)")

    # Test 3: Missing index files
    from rag.config import FAISS_INDEX_ROOT
    test_dir = os.path.join(FAISS_INDEX_ROOT, "test_user")
    os.makedirs(test_dir, exist_ok=True)

    try:
        _validate_faiss_index(test_dir, "test_user")
        print("❌ FAILED: Should reject missing index files")
        os.rmdir(test_dir)
        return False
    except ValueError as e:
        print(f"✅ PASSED: Rejected missing index files ({str(e)[:50]}...)")
        os.rmdir(test_dir)

    print("\n✅ All FAISS validation tests passed!")
    return True


def test_config_validation():
    """Test config requires env vars."""
    print("\nTesting config validation...")

    # Test that config loaded with env vars
    from rag.config import MISTRAL_API_KEY, JWT_SECRET

    if MISTRAL_API_KEY == 'test-key':
        print("✅ PASSED: MISTRAL_API_KEY loaded from env")
    else:
        print("❌ FAILED: MISTRAL_API_KEY not loaded correctly")
        return False

    if JWT_SECRET == 'test-secret':
        print("✅ PASSED: JWT_SECRET loaded from env")
    else:
        print("❌ FAILED: JWT_SECRET not loaded correctly")
        return False

    print("\n✅ All config tests passed!")
    return True


def test_no_openmp_hack():
    """Test that KMP_DUPLICATE_LIB_OK is not set in code."""
    print("\nTesting OpenMP hack removal...")

    files_to_check = [
        'ingestion/ingestion_pipeline.py',
        'retrieval/retrieval_pipeline.py',
        'server/app.py'
    ]

    for file_path in files_to_check:
        with open(file_path, 'r') as f:
            content = f.read()
            if 'KMP_DUPLICATE_LIB_OK' in content:
                print(f"❌ FAILED: {file_path} still contains KMP_DUPLICATE_LIB_OK")
                return False

    print("✅ PASSED: No OpenMP hack found in code")
    print("\n✅ All OpenMP tests passed!")
    return True


if __name__ == '__main__':
    print("=" * 60)
    print("Phase 1 Security Fixes - Test Suite")
    print("=" * 60)

    results = []
    results.append(test_config_validation())
    results.append(test_faiss_validation())
    results.append(test_no_openmp_hack())

    print("\n" + "=" * 60)
    if all(results):
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 60)
        sys.exit(1)
