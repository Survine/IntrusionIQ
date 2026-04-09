# Testing

## Current State

### Effectively No Tests
- `backend/tests/test_predict.py` exists but is **completely empty** (0 bytes)
- `backend/tests/__init__.py` exists (empty, for package recognition)
- No test framework is configured or listed in `requirements.txt`

## Test Framework

### Not Configured
- **pytest** is not in `requirements.txt`
- No `pytest.ini`, `pyproject.toml`, or `conftest.py` present
- No `coverage` or `pytest-cov` dependency

## Test Structure

### Placeholder Layout
```
backend/tests/
├── __init__.py          # Empty package marker
└── test_predict.py      # Empty file
```

### No Test Categories
- No unit tests
- No integration tests
- No API endpoint tests
- No model inference tests

## Frontend Testing

### Not Configured
- No test framework (Jest, Vitest, etc.)
- No test files in `frontend/`
- No test scripts in `package.json` (file is empty)

## CI/CD

### None
- No GitHub Actions, GitLab CI, or other CI pipeline
- No pre-commit hooks
- No linting configuration (flake8, ruff, black, etc.)

## Recommended Test Targets

Based on the codebase, high-value test targets would be:

1. **`predict_binary_ensemble()`** — Verify soft voting math and threshold logic
2. **`predict_two_stage()`** — Verify BENIGN override logic when multi-class says BENIGN
3. **`POST /api/v1/predict`** — Integration test with sample CSV
4. **Feature validation** — Missing columns, inf/NaN handling
5. **Model loading failure** — Verify proper 503 responses
6. **Health endpoint** — Verify binary/multiclass loaded status reporting

## Validation Scripts

### `check_structure.py` (Root)
- Not a test file per se, but validates project file/directory structure
- Checks 25+ required files/dirs exist
- Checks 7 files/dirs that should NOT exist
- Uses ANSI colors for terminal output
- Run: `python check_structure.py` from project root
