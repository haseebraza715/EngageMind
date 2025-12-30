"""Simple verification of Phase 1 security fixes."""
import os
import sys


def test_hardcoded_secrets():
    """Test that hardcoded secrets are removed."""
    print("Testing hardcoded secrets removal...")

    # Test 1: config.py
    with open('config.py', 'r') as f:
        content = f.read()
        if '7WFnZWTWuU88E3NFD0I6wuYbpQtK9Qzw' in content:
            print("❌ FAILED: config.py still contains hardcoded Mistral API key")
            return False
        if 'please-change-me-in-production' in content:
            print("❌ FAILED: config.py still contains default JWT secret")
            return False
        if 'os.getenv("MISTRAL_API_KEY"' in content and 'RuntimeError' in content:
            print("✅ PASSED: config.py requires MISTRAL_API_KEY from env")
        else:
            print("❌ FAILED: config.py doesn't properly validate MISTRAL_API_KEY")
            return False

    # Test 2: server/security.py
    with open('server/security.py', 'r') as f:
        content = f.read()
        if 'a37877e87fd73f58bc26ed2e26b53857b1b16bb64dfde43872c4cb1c1b944942' in content:
            print("❌ FAILED: server/security.py still contains hardcoded JWT secret")
            return False
        if 'os.getenv(\'JWT_SECRET\')' in content and 'RuntimeError' in content:
            print("✅ PASSED: server/security.py requires JWT_SECRET from env")
        else:
            print("❌ FAILED: server/security.py doesn't properly validate JWT_SECRET")
            return False

    # Test 3: static/script.js
    with open('static/script.js', 'r') as f:
        content = f.read()
        if 'const TOKEN = "secret123"' in content:
            print("❌ FAILED: static/script.js still contains hardcoded token")
            return False
        if 'localStorage.getItem' in content:
            print("✅ PASSED: static/script.js uses localStorage for token")
        else:
            print("❌ FAILED: static/script.js doesn't use localStorage")
            return False

    print("\n✅ All hardcoded secrets removed!")
    return True


def test_faiss_validation():
    """Test that FAISS validation is implemented."""
    print("\nTesting FAISS validation...")

    with open('retrieval/retrieval_pipeline.py', 'r') as f:
        content = f.read()
        if 'def _validate_faiss_index' in content:
            print("✅ PASSED: _validate_faiss_index function exists")
        else:
            print("❌ FAILED: _validate_faiss_index function not found")
            return False

        if 'def safe_load_faiss' in content:
            print("✅ PASSED: safe_load_faiss function exists")
        else:
            print("❌ FAILED: safe_load_faiss function not found")
            return False

        if 'safe_load_faiss(user_index_dir, embeddings, user_id)' in content:
            print("✅ PASSED: retrieval_pipeline.py uses safe_load_faiss")
        else:
            print("❌ FAILED: retrieval_pipeline.py doesn't use safe_load_faiss")
            return False

    # Check ingestion pipeline uses safe loading
    with open('ingestion/ingestion_pipeline.py', 'r') as f:
        content = f.read()
        if 'from rag.retrieval.retrieval_pipeline import invalidate_user_cache, safe_load_faiss' in content:
            print("✅ PASSED: ingestion_pipeline.py imports safe_load_faiss")
        else:
            print("❌ FAILED: ingestion_pipeline.py doesn't import safe_load_faiss")
            return False

        if 'safe_load_faiss(user_index_dir, embeddings, user_id)' in content:
            print("✅ PASSED: ingestion_pipeline.py uses safe_load_faiss")
        else:
            print("❌ FAILED: ingestion_pipeline.py doesn't use safe_load_faiss")
            return False

    # Check upload optimizer uses safe loading
    with open('utils/upload_optimizer.py', 'r') as f:
        content = f.read()
        if 'from rag.retrieval.retrieval_pipeline import invalidate_user_cache, safe_load_faiss' in content:
            print("✅ PASSED: upload_optimizer.py imports safe_load_faiss")
        else:
            print("❌ FAILED: upload_optimizer.py doesn't import safe_load_faiss")
            return False

        count = content.count('safe_load_faiss(user_index_dir, embeddings, user_id)')
        if count == 2:
            print(f"✅ PASSED: upload_optimizer.py uses safe_load_faiss (2 occurrences)")
        else:
            print(f"❌ FAILED: upload_optimizer.py uses safe_load_faiss only {count} times (expected 2)")
            return False

    print("\n✅ All FAISS validation tests passed!")
    return True


def test_no_openmp_hack():
    """Test that OpenMP hack is removed."""
    print("\nTesting OpenMP hack removal...")

    files_to_check = [
        ('ingestion/ingestion_pipeline.py', 0),
        ('retrieval/retrieval_pipeline.py', 0),
        ('server/app.py', 0)
    ]

    all_passed = True
    for file_path, expected_count in files_to_check:
        with open(file_path, 'r') as f:
            content = f.read()
            count = content.count('KMP_DUPLICATE_LIB_OK')

            if count == expected_count:
                print(f"✅ PASSED: {file_path} has {count} KMP_DUPLICATE_LIB_OK (expected {expected_count})")
            else:
                print(f"❌ FAILED: {file_path} has {count} KMP_DUPLICATE_LIB_OK (expected {expected_count})")
                all_passed = False

    if all_passed:
        print("\n✅ All OpenMP hack removal tests passed!")
    return all_passed


if __name__ == '__main__':
    print("=" * 60)
    print("Phase 1 Security Fixes - Verification")
    print("=" * 60)

    results = []
    results.append(test_hardcoded_secrets())
    results.append(test_faiss_validation())
    results.append(test_no_openmp_hack())

    print("\n" + "=" * 60)
    if all(results):
        print("🎉 ALL PHASE 1 FIXES VERIFIED!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("❌ SOME FIXES FAILED VERIFICATION")
        print("=" * 60)
        sys.exit(1)
